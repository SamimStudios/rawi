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
      .select("id, name, kind, active, price_in_credits, production_webhook")
      .eq("id", functionId)
      .eq("active", true)
      .single();

    if (!n8nFunction) {
      const { data: byName, error: byNameErr } = await app
        .from("n8n_functions")
        .select("id, name, kind, active, price_in_credits, production_webhook")
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

    console.log(`[${requestId}] Calling webhook:`, n8nFunction.production_webhook);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);

    let webhookResult: any;
    try {
      const webhookResponse = await fetch(n8nFunction.production_webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!webhookResponse.ok) {
        return new Response(
          JSON.stringify({
            status: "error",
            code: "N8N_WEBHOOK_ERROR",
            message: `Webhook returned ${webhookResponse.status}: ${webhookResponse.statusText}`,
          }),
          { status: 400, headers: corsHeaders },
        );
      }
      webhookResult = await webhookResponse.json().catch(() => ({}));
      if (!(webhookResult && (webhookResult.status === "ok" || webhookResult.success === true))) {
        return new Response(
          JSON.stringify({
            status: "error",
            code: "N8N_WEBHOOK_FAILED",
            message: "Webhook reported failure",
            result: webhookResult,
          }),
          { status: 400, headers: corsHeaders },
        );
      }
    } catch (err: any) {
      clearTimeout(timer);
      if (err?.name === "AbortError") {
        return new Response(
          JSON.stringify({ status: "error", code: "N8N_WEBHOOK_TIMEOUT", message: "Webhook timeout" }),
          { status: 504, headers: corsHeaders },
        );
      }
      throw err;
    }

    // ---------- No writes here (generation will write in n8n; save writes later)

    // ---------- Optional: deduct credits via existing RPC (kept from your file)
    // If you prefer moving to public.transactions later, we’ll change this in the next step.
    if (required > 0) {
      const { error: consumeError } = await supabase.rpc("consume_credits", {
        p_user_id: user.id,
        p_amount: required,
        p_description: `${n8nFunction.kind} - ${n8nFunction.name}`,
        p_job_id: jobId,
        p_function_id: n8nFunction.id,
      });
      if (consumeError) {
        console.error(`[${requestId}] Failed to consume credits`, consumeError);
        // Do not fail the request since webhook was successful
      }
    }

    const ms = Date.now() - startedAt;
    console.log(`[${requestId}] OK in ${ms}ms`);

    return new Response(
      JSON.stringify({
        status: "ok",
        result: webhookResult,
        credits_consumed: required,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
