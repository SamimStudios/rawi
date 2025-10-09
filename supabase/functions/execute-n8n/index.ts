import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExecuteRequest {
  jobId: string;
  nodeId: string;
  functionId: string;
  payload?: {
    fields?: Array<{ address: string; value: any }>;
    context?: Record<string, any>;
  };
  idempotencyKey?: string;
  mode?: "generate" | "validate";
  context?: Record<string, any>;
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

// Bilingual message helper
const bi = (msg: unknown, enDefault: string, arDefault?: string) => {
  if (msg && typeof msg === 'object' && 'en' in (msg as any) && 'ar' in (msg as any)) return msg as any;
  const s = typeof msg === 'string' ? msg : enDefault;
  return { en: s, ar: arDefault ?? s };
};

// Envelope pass-through detection
const isEnvelope = (response: any): boolean => {
  return response && 
         typeof response === 'object' && 
         'status' in response && 
         ('http_status' in response || 'data' in response || 'error' in response);
};

// Check if status should trigger retry
const shouldRetry = (status: number): boolean => [429, 502, 503, 504].includes(status);

// N8N Response Envelope Interface
interface N8NResponseEnvelope<TParsed = unknown> {
  request_id: string;
  execution_id?: string;
  workflow_name?: string;
  workflow_version?: string;
  timestamp: string;
  http_status?: number;
  status: 'success' | 'error' | 'partial_success';
  error?: {
    type: 'validation' | 'authentication' | 'authorization' | 'credits' | 'webhook_connectivity' | 'workflow_execution' | 'upstream_http' | 'rate_limited' | 'parsing' | 'internal';
    code: string;
    message: { en: string; ar: string } | string;
    details?: unknown;
    retry_possible: boolean;
  };
  data?: {
    raw_response?: unknown;
    parsed?: TParsed;
  };
  warnings?: Array<{
    type: string;
    message: string;
    field?: string;
  }>;
  meta: {
    env: 'prod' | 'staging' | 'dev';
    started_at: string;
    finished_at: string;
    duration_ms: number;
    credits_consumed?: number;
  };
}

// Helper function to create envelope
const createEnvelope = (
  requestId: string,
  startTime: Date,
  status: 'success' | 'error' | 'partial_success',
  options: {
    data?: any;
    error?: {
      type: 'validation' | 'authentication' | 'authorization' | 'credits' | 'webhook_connectivity' | 'workflow_execution' | 'upstream_http' | 'rate_limited' | 'parsing' | 'internal';
      code: string;
      message: { en: string; ar: string } | string;
      details?: unknown;
      retryPossible: boolean;
    };
    httpStatus?: number;
    creditsConsumed?: number;
    warnings?: Array<{ type: string; message: string; field?: string }>;
  } = {}
): N8NResponseEnvelope => {
  const finishTime = new Date();
  const env = Deno.env.get('ENVIRONMENT') as 'prod' | 'staging' | 'dev' || 'dev';
  
  let defaultStatus = 200;
  if (status === 'error') defaultStatus = 500;
  if (status === 'partial_success') defaultStatus = 207;
  
  return {
    request_id: requestId,
    timestamp: finishTime.toISOString(),
    http_status: options.httpStatus || defaultStatus,
    status,
    error: options.error ? {
      type: options.error.type,
      code: options.error.code,
      message: options.error.message,
      details: options.error.details,
      retry_possible: options.error.retryPossible
    } : undefined,
    data: options.data ? {
      raw_response: options.data,
      parsed: options.data
    } : undefined,
    warnings: options.warnings,
    meta: {
      env,
      started_at: startTime.toISOString(),
      finished_at: finishTime.toISOString(),
      duration_ms: finishTime.getTime() - startTime.getTime(),
      credits_consumed: options.creditsConsumed
    }
  };
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  console.log(`[${requestId}] Execute N8N request started`);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const app = (supabase as any).schema("app" as any);

    // ---------- Body normalize (accept snake_case & camelCase)
    const raw: ExecuteRequest & Record<string, any> = await request.json();
    const jobId = raw.jobId ?? raw.job_id;
    const nodeId = raw.nodeId ?? raw.node_id;
    const functionId = raw.functionId ?? raw.function_id;
    const idempotencyKey = raw.idempotencyKey ?? raw.idempotency_key ?? undefined;
    const mode = (raw.mode as "generate" | "validate") ?? "generate";
    const context = raw.context ?? {};
    const payload = raw.payload ?? { fields: [], context: {} };
    const fields = Array.isArray(payload?.fields) ? payload.fields! : [];

    // Debug surface
    console.log("[execute-n8n] input", {
      keys: Object.keys(raw || {}),
      jobId,
      nodeId,
      functionId,
      mode,
      hasPayload: !!raw?.payload,
      fieldsCount: fields.length,
    });

    // ---------- Auth (header-based)
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          status: "error",
          code: "UNAUTHENTICATED",
          message: "Missing authorization header",
        }),
        { status: 401, headers: corsHeaders },
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: authUser, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authUser?.user) {
      return new Response(
        JSON.stringify({
          status: "error",
          code: "UNAUTHENTICATED",
          message: "Invalid or expired authorization token",
        }),
        { status: 401, headers: corsHeaders },
      );
    }
    const user = authUser.user;

    // ---------- Required params guard
    if (!jobId || !nodeId || !functionId) {
      return new Response(
        JSON.stringify({
          status: "error",
          code: "MISSING_PARAMS",
          message: "jobId, nodeId, and functionId are required",
          received: { jobId, nodeId, functionId },
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Optional: idempotency signal
    if (idempotencyKey) {
      console.log(`[${requestId}] Idempotency key: ${idempotencyKey}`);
      // TODO: implement idempotency store if needed
    }

    // ---------- Job (app.jobs)
    const { data: job, error: jobError } = await app
      .from("jobs")
      .select("id, user_id")
      .eq("id", jobId)
      .single();
    if (jobError || !job) {
      return new Response(
        JSON.stringify({ status: "error", code: "JOB_NOT_FOUND" }),
        { status: 404, headers: corsHeaders },
      );
    }
    if (job.user_id !== user.id) {
      return new Response(
        JSON.stringify({ status: "error", code: "JOB_NOT_OWNED" }),
        { status: 403, headers: corsHeaders },
      );
    }

    // ---------- Node (app.nodes) — select addr, not path
    const { data: node, error: nodeError } = await app
      .from("nodes")
      .select("id, job_id, addr, node_type, generate_n8n_id, validate_n8n_id")
      .eq("id", nodeId)
      .single();
    if (nodeError || !node) {
      return new Response(
        JSON.stringify({ status: "error", code: "NODE_NOT_FOUND" }),
        { status: 404, headers: corsHeaders },
      );
    }
    if (node.job_id !== jobId) {
      return new Response(
        JSON.stringify({ status: "error", code: "NODE_JOB_MISMATCH" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // ---------- n8n function (app.n8n_functions) — lookup by id OR name (id is text)
    let { data: n8nFunction, error: fnError } = await app
      .from("n8n_functions")
      .select("id, name, kind, active, price_in_credits, webhook_url")
      .eq("id", functionId)
      .eq("active", true)
      .single();

    if (!n8nFunction) {
      const { data: byName, error: byNameErr } = await app
        .from("n8n_functions")
        .select("id, name, kind, active, price_in_credits, webhook_url")
        .eq("name", functionId)
        .eq("active", true)
        .single();
      n8nFunction = byName ?? null;
      fnError = byNameErr ?? fnError;
    }

    if (fnError || !n8nFunction) {
      console.error("[execute-n8n] N8N function not found", { functionId, fnError });
      return new Response(
        JSON.stringify({
          status: "error",
          code: "N8N_FUNCTION_NOT_FOUND",
          message: "Could not find an active n8n function by id or name",
          function_id: String(functionId),
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // ---------- Function kind & node binding check
    const isGenerate = n8nFunction.kind === "generate";
    const isValidate = n8nFunction.kind === "validate";
    if (!isGenerate && !isValidate) {
      return new Response(
        JSON.stringify({ status: "error", code: "INVALID_FUNCTION_KIND" }),
        { status: 400, headers: corsHeaders },
      );
    }
    if (isGenerate) {
      const ok = node.generate_n8n_id === functionId || node.generate_n8n_id === n8nFunction.id;
      if (!ok) {
        return new Response(
          JSON.stringify({ status: "error", code: "FUNCTION_NOT_CONFIGURED_FOR_GENERATE" }),
          { status: 400, headers: corsHeaders },
        );
      }
    }
    if (isValidate) {
      const ok = node.validate_n8n_id === functionId || node.validate_n8n_id === n8nFunction.id;
      if (!ok) {
        return new Response(
          JSON.stringify({ status: "error", code: "FUNCTION_NOT_CONFIGURED_FOR_VALIDATE" }),
          { status: 400, headers: corsHeaders },
        );
      }
    }

    // ---------- Credits (public.user_credits read-only)
    const { data: userCredits, error: creditsError } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", user.id)
      .single();
    if (creditsError || !userCredits) {
      return new Response(
        JSON.stringify({ status: "error", code: "USER_CREDITS_NOT_FOUND" }),
        { status: 404, headers: corsHeaders },
      );
    }
    const required = Number(n8nFunction?.price_in_credits ?? 0) || 0;
    const available = Number(userCredits?.credits ?? 0) || 0;
    if (available < required) {
      return new Response(
        JSON.stringify({
          status: "insufficient_credits",
          code: "INSUFFICIENT_CREDITS",
          message: "Not enough credits to run this action.",
          function_id: n8nFunction.id,
          job_id: jobId,
          node_id: nodeId,
          required,
          available,
          shortfall: Math.max(required - available, 0),
          currency: "credits",
        }),
        { status: 402, headers: corsHeaders }, // Payment Required
      );
    }

    // ---------- Validate payload addresses under node.addr (if any)
    const nodeAddr = String(node.addr);
    const rootOf = (a: string) => String(a || "").split("#", 1)[0];
    const under = (child: string, parent: string) =>
      child === parent || child.startsWith(parent + ".");
    for (const f of fields) {
      const addrRoot = rootOf(f.address);
      if (addrRoot && !under(addrRoot, nodeAddr)) {
        return new Response(
          JSON.stringify({
            status: "error",
            code: "ADDRESS_OUT_OF_SCOPE",
            message: `Address ${addrRoot} is not under ${nodeAddr}`,
          }),
          { status: 400, headers: corsHeaders },
        );
      }
    }

    // ---------- Webhook call
    const effectiveContext = { ...(payload.context ?? {}), ...(context ?? {}) };
    const webhookPayload: WebhookPayload = {
      request_id: requestId,
      job: { id: jobId },
      node: { id: nodeId, addr: nodeAddr, type: node.node_type },
      function: { id: n8nFunction.id, kind: n8nFunction.kind },
      fields,
      context: effectiveContext,
    };
    if (idempotencyKey) webhookPayload.idempotency_key = idempotencyKey;

    console.log(`[${requestId}] Calling webhook:`, n8nFunction.webhook_url);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);

    let webhookResult: any;
    let webhookResponse: any;
    try {
      webhookResponse = await fetch(n8nFunction.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const responseText = await webhookResponse.text();
      console.log(`[${requestId}] Webhook response status: ${webhookResponse.status}`);
      
      // Try to parse response
      try {
        webhookResult = JSON.parse(responseText);
      } catch (parseErr) {
        console.error(`[${requestId}] Failed to parse webhook response:`, parseErr);
        webhookResult = { raw: responseText };
      }

      // Check if response is already an envelope
      if (isEnvelope(webhookResult)) {
        console.log(`[${requestId}] Webhook returned envelope format`);
        
        // Fix type issues (http_status might be string)
        if (webhookResult.http_status && typeof webhookResult.http_status === 'string') {
          const parsed = parseInt(webhookResult.http_status, 10);
          if (!isNaN(parsed)) {
            webhookResult.http_status = parsed;
          }
        }
        
        // Ensure bilingual error messages
        if (webhookResult.error?.message && typeof webhookResult.error.message === 'string') {
          webhookResult.error.message = bi(webhookResult.error.message, webhookResult.error.message);
        }
        
        // Update request_id to match ours
        webhookResult.request_id = requestId;
        
      } else {
        // Non-envelope response - wrap it
        console.log(`[${requestId}] Wrapping non-envelope response`);
        
        const isSuccess = webhookResponse.ok && 
                         (webhookResult?.status === 'ok' || 
                          webhookResult?.status === 'success' ||
                          webhookResult?.success === true);
        
        if (!isSuccess) {
          // Webhook failed - create error envelope
          webhookResult = createEnvelope(requestId, new Date(startedAt), 'error', {
            error: {
              type: 'workflow_execution',
              code: 'N8N_WEBHOOK_FAILED',
              message: bi(null, 'Webhook execution failed', 'فشل تنفيذ webhook'),
              details: { 
                status: webhookResponse.status,
                response: webhookResult 
              },
              retryPossible: false
            },
            httpStatus: webhookResponse.status
          });
        } else {
          // Success - wrap data
          webhookResult = createEnvelope(requestId, new Date(startedAt), 'success', {
            data: webhookResult
          });
        }
      }

    } catch (err: any) {
      clearTimeout(timer);
      console.error(`[${requestId}] Webhook error:`, err);
      
      if (err?.name === "AbortError") {
        return new Response(
          JSON.stringify(createEnvelope(requestId, new Date(startedAt), 'error', {
            error: {
              type: 'webhook_connectivity',
              code: 'N8N_WEBHOOK_TIMEOUT',
              message: bi(null, 'Webhook request timed out', 'انتهت مهلة طلب webhook'),
              details: { timeout_ms: 60000 },
              retryPossible: true
            },
            httpStatus: 504
          })),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw err;
    }

    // ---------- Consume credits ONLY on success/partial_success
    let creditsConsumed = 0;
    const webhookStatus = webhookResult?.status;

    if (required > 0 && (webhookStatus === 'success' || webhookStatus === 'partial_success')) {
      console.log(`[${requestId}] Consuming ${required} credits for user ${user.id}`);
      
      const { data: consumeResult, error: consumeError } = await supabase.rpc("consume_credits", {
        p_user_id: user.id,
        p_credits: required,
        p_description: `${n8nFunction.kind} - ${n8nFunction.name}`,
        p_job_id: jobId,
        p_function_id: n8nFunction.id,
      });
      
      if (consumeError) {
        console.error(`[${requestId}] Failed to consume credits:`, consumeError);
        // Log but don't fail - webhook already succeeded
      } else if (consumeResult === true) {
        creditsConsumed = required;
        console.log(`[${requestId}] Successfully consumed ${creditsConsumed} credits`);
      } else {
        console.warn(`[${requestId}] consume_credits returned false - insufficient credits?`);
      }
    } else if (webhookStatus === 'error') {
      console.log(`[${requestId}] Not consuming credits - webhook failed with error status`);
    } else {
      console.log(`[${requestId}] No credits to consume (required: ${required})`);
    }

    // Add credits_consumed to envelope metadata if present
    if (webhookResult?.meta && creditsConsumed > 0) {
      webhookResult.meta.credits_consumed = creditsConsumed;
    }

    const ms = Date.now() - startedAt;
    console.log(`[${requestId}] Completed in ${ms}ms`);

    return new Response(
      JSON.stringify(webhookResult),
      { 
        status: 200, // Always 200 for envelope pattern
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      },
    );
  } catch (error: any) {
    const ms = Date.now() - startedAt;
    console.error(`[${crypto.randomUUID()}] FAIL in ${ms}ms`, error);
    return new Response(
      JSON.stringify({ status: "error", message: error?.message ?? "Unexpected error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
