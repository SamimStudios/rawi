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

    const body: ExecuteRequest = await request.json();
    const { jobId, nodeId, functionId, payload, idempotencyKey } = body;

    console.log(`[${requestId}] Request params:`, { jobId, nodeId, functionId, idempotencyKey });

    // Get user from auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check idempotency
    if (idempotencyKey) {
      // TODO: Implement idempotency check
      console.log(`[${requestId}] Idempotency key provided: ${idempotencyKey}`);
    }

    // Fetch job and verify ownership
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, user_id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error('Job not found');
    }

    if (job.user_id !== user.id) {
      throw new Error('Job not owned by user');
    }

    // Fetch node and verify it belongs to job
    const { data: node, error: nodeError } = await supabase
      .from('nodes')
      .select('id, job_id, path, node_type, generate_n8n_id, validate_n8n_id')
      .eq('id', nodeId)
      .single();

    if (nodeError || !node) {
      throw new Error('Node not found');
    }

    if (node.job_id !== jobId) {
      throw new Error('Node does not belong to job');
    }

    // Fetch n8n function and verify compatibility
    const { data: n8nFunction, error: functionError } = await supabase
      .from('n8n_functions')
      .select('id, name, kind, active, price_in_credits, production_webhook')
      .eq('id', functionId)
      .single();

    if (functionError || !n8nFunction) {
      throw new Error('N8N function not found');
    }

    if (!n8nFunction.active) {
      throw new Error('N8N function is not active');
    }

    if (!n8nFunction.production_webhook) {
      throw new Error('N8N function has no webhook URL');
    }

    // Verify function is configured on node
    const isGenerate = n8nFunction.kind === 'generate';
    const isValidate = n8nFunction.kind === 'validate';

    if (!isGenerate && !isValidate) {
      throw new Error('Invalid function kind');
    }

    if (isGenerate && node.generate_n8n_id !== functionId) {
      throw new Error('Function not configured for generate on this node');
    }

    if (isValidate && node.validate_n8n_id !== functionId) {
      throw new Error('Function not configured for validate on this node');
    }

    // Check user credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !userCredits) {
      throw new Error('User credits not found');
    }

    const price = n8nFunction.price_in_credits || 0;
    if (userCredits.credits < price) {
      throw new Error('Insufficient credits');
    }

    // Validate addresses are rooted at node address
    const nodeAddr = node.path;
    for (const field of payload.fields) {
      const addressRoot = field.address.split('#')[0];
      if (addressRoot !== nodeAddr) {
        throw new Error(`Invalid address root: ${field.address} (expected ${nodeAddr})`);
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
        throw new Error('Webhook request timed out');
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