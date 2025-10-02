import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExecuteRequest {
  jobId: string;
  nodeId: string;
  functionId: string;
  payload: {
    fields: Array<{ address: string; value: any }>;
    context?: Record<string, any>;
  };
  idempotencyKey?: string;
}

interface WebhookPayload {
  request_id: string;
  job: { id: string };
  node: { id: string; addr: string; type: string };
  function: { id: string; kind: string };
  fields: Array<{ address: string; value: any }>;
  context: Record<string, any>;
  idempotency_key?: string;
}

interface ValidateResponse {
  status: 'ok';
  valid: boolean;
  suggestions?: Array<{ address: string; value: any; note?: string }>;
}

interface GenerateResponse {
  status: 'ok';
  writes?: Array<{ address: string; value: any }>;
}

serve(async (request) => {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  console.log(`[${requestId}] Execute N8N request started`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const app = (supabase as any).schema('app' as any);

    const raw = await request.json();
    
    // accept both snake_case and camelCase
    const jobId          = raw.jobId          ?? raw.job_id;
    const nodeId         = raw.nodeId         ?? raw.node_id;
    const functionId     = raw.functionId     ?? raw.function_id;
    const idempotencyKey = raw.idempotencyKey ?? raw.idempotency_key ?? undefined;
    
    // payload is optional for generate; normalize to { fields: [], context: {} }
    const payload = raw.payload ?? { fields: [], context: {} };

    // --- EARLY PARAM/AUTH GUARD (debug-friendly) ---
    // Log basic input surface (will show up in Logs > Edge Functions)
    console.log('[execute-n8n] input', {
      keys: Object.keys(raw || {}),
      jobId, nodeId, functionId,
      hasPayload: !!raw?.payload,
    });
    
    // Ensure IDs are present
    if (!jobId || !nodeId || !functionId) {
      return new Response(JSON.stringify({
        status: 'error',
        code: 'MISSING_PARAMS',
        message: 'jobId, nodeId, and functionId are required',
        received: { jobId, nodeId, functionId }
      }), { status: 400, headers: corsHeaders });
    }
    
    // Ensure the caller is authenticated
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({
        status: 'error',
        code: 'UNAUTHENTICATED',
        message: 'Missing or invalid Authorization token'
      }), { status: 401, headers: corsHeaders });
    }
    const user = authData.user;

    console.log(`[${requestId}] Request params:`, { jobId, nodeId, functionId, idempotencyKey });

    // Check idempotency
    if (idempotencyKey) {
      // TODO: Implement idempotency check
      console.log(`[${requestId}] Idempotency key provided: ${idempotencyKey}`);
    }

    // Fetch job and verify ownership
    const { data: job, error: jobError } = await app
      .from('jobs')
      .select('id, user_id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({
        status: 'error',
        code: 'JOB_NOT_FOUND',
        message: 'Job not found'
      }), { status: 404, headers: corsHeaders });
    }

    if (job.user_id !== user.id) {
      return new Response(JSON.stringify({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Job not owned by user'
      }), { status: 403, headers: corsHeaders });
    }

    // Fetch node and verify it belongs to job
    const { data: node, error: nodeError } = await app
      .from('nodes')
      .select('id, job_id, addr, node_type, generate_n8n_id, validate_n8n_id')
      .eq('id', nodeId)
      .single();

    if (nodeError || !node) {
      return new Response(JSON.stringify({
        status: 'error',
        code: 'NODE_NOT_FOUND',
        message: 'Node not found'
      }), { status: 404, headers: corsHeaders });
    }

    if (node.job_id !== jobId) {
      return new Response(JSON.stringify({
        status: 'error',
        code: 'NODE_JOB_MISMATCH',
        message: 'Node does not belong to job'
      }), { status: 400, headers: corsHeaders });
    }

    // Fetch n8n function and verify compatibility
    let { data: n8nFunction, error: fnError } = await app
      .from('n8n_functions')
      .select('id, name, kind, active, price_in_credits, production_webhook')
      .eq('id', functionId)
      .eq('active', true)
      .single();
    
    if (!n8nFunction) {
      const { data: byName, error: fnByNameErr } = await app
        .from('n8n_functions')
        .select('id, name, kind, active, price_in_credits, production_webhook')
        .eq('name', functionId)
        .eq('active', true)
        .single();
    
      n8nFunction = byName ?? null;
      fnError = fnByNameErr ?? fnError;
    }
    
    if (fnError || !n8nFunction) {
      console.error('[execute-n8n] N8N function not found', { functionId, fnError });
      return new Response(JSON.stringify({
        status: 'error',
        code: 'N8N_FUNCTION_NOT_FOUND',
        message: 'Could not find an active n8n function by id or name',
        function_id: String(functionId),
      }), { status: 400, headers: corsHeaders });
    }

    // Verify function is configured on node
    const isGenerate = n8nFunction.kind === 'generate';
    const isValidate = n8nFunction.kind === 'validate';

    if (!isGenerate && !isValidate) {
      return new Response(JSON.stringify({
        status: 'error',
        code: 'INVALID_FUNCTION_KIND',
        message: 'Invalid function kind'
      }), { status: 400, headers: corsHeaders });
    }

    if (isGenerate && node.generate_n8n_id !== functionId) {
      return new Response(JSON.stringify({
        status: 'error',
        code: 'FUNCTION_NOT_CONFIGURED',
        message: 'Function not configured for generate on this node'
      }), { status: 400, headers: corsHeaders });
    }

    if (isValidate && node.validate_n8n_id !== functionId) {
      return new Response(JSON.stringify({
        status: 'error',
        code: 'FUNCTION_NOT_CONFIGURED',
        message: 'Function not configured for validate on this node'
      }), { status: 400, headers: corsHeaders });
    }

    // Check user credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !userCredits) {
      return new Response(JSON.stringify({
        status: 'error',
        code: 'CREDITS_NOT_FOUND',
        message: 'User credits not found'
      }), { status: 400, headers: corsHeaders });
    }

    const price = Number(n8nFunction.price_in_credits) || 0;
    const available = Number(userCredits?.credits ?? 0) || 0;

    if (available < price) {
      return new Response(
        JSON.stringify({
          status: 'insufficient_credits',
          code: 'INSUFFICIENT_CREDITS',
          message: 'Not enough credits to run this action.',
          function_id: n8nFunction?.id ?? null,
          job_id: jobId ?? null,
          node_id: nodeId ?? null,
          required: price,
          available,
          shortfall: Math.max(price - available, 0),
          currency: 'credits'
        }),
        { status: 402, headers: corsHeaders } // 402: Payment Required
      );
    }

    // Validate addresses are rooted at node address
    const nodeAddr = String(node.addr);
    for (const field of payload.fields) {
      const addressRoot = String(field.address || '').split('#')[0];
      const inScope = addressRoot === nodeAddr || addressRoot.startsWith(nodeAddr + '.');
      if (!inScope) {
        return new Response(JSON.stringify({
          status: 'error',
          code: 'INVALID_ADDRESS',
          message: `Invalid address root: ${field.address} (expected ${nodeAddr})`
        }), { status: 400, headers: corsHeaders });
      }
    }

    // Prepare webhook payload
    const webhookPayload: WebhookPayload = {
      request_id: requestId,
      job: { id: jobId },
      node: { 
        id: nodeId, 
        addr: nodeAddr, 
        type: node.node_type 
      },
      function: { 
        id: functionId, 
        kind: n8nFunction.kind 
      },
      fields: payload.fields,
      context: payload.context || {},
    };

    if (idempotencyKey) {
      webhookPayload.idempotency_key = idempotencyKey;
    }

    console.log(`[${requestId}] Calling webhook:`, n8nFunction.production_webhook);

    // Call webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const webhookResponse = await fetch(n8nFunction.production_webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!webhookResponse.ok) {
        throw new Error(`Webhook returned ${webhookResponse.status}: ${webhookResponse.statusText}`);
      }

      const webhookResult = await webhookResponse.json();
      
      if (webhookResult.status !== 'ok') {
        throw new Error(`Webhook failed: ${JSON.stringify(webhookResult)}`);
      }

      console.log(`[${requestId}] Webhook successful`, { kind: n8nFunction.kind });

      // Handle generate responses - write to database if needed
      if (isGenerate && webhookResult.writes && webhookResult.writes.length > 0) {
        console.log(`[${requestId}] Processing ${webhookResult.writes.length} writes`);
        
        // Validate all write addresses are rooted at node address
        for (const write of webhookResult.writes) {
          const writeRoot = write.address.split('#')[0];
          if (writeRoot !== nodeAddr) {
            throw new Error(`Invalid write address root: ${write.address} (expected ${nodeAddr})`);
          }
        }

        // TODO: Implement addr_write_many RPC or direct database writes
        console.log(`[${requestId}] Would write:`, webhookResult.writes);
      }

      // Deduct credits after successful operation
      console.log(`[${requestId}] Deducting ${price} credits from user ${user.id}`);
      
      const { error: consumeError } = await supabase.rpc('consume_credits', {
        p_user_id: user.id,
        p_amount: price,
        p_description: `${n8nFunction.kind} - ${n8nFunction.name}`,
        p_job_id: jobId,
        p_function_id: functionId,
      });

      if (consumeError) {
        console.error(`[${requestId}] Failed to consume credits:`, consumeError);
        // Log but don't fail the request since webhook was successful
      }

      const duration = Date.now() - startTime;
      console.log(`[${requestId}] Request completed successfully in ${duration}ms`);

      return new Response(JSON.stringify({
        success: true,
        result: webhookResult,
        credits_consumed: price,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return new Response(JSON.stringify({
          status: 'error',
          code: 'WEBHOOK_TIMEOUT',
          message: 'Webhook request timed out'
        }), { status: 504, headers: corsHeaders });
      }
      
      throw fetchError;
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Request failed in ${duration}ms:`, error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});