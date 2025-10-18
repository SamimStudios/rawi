import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Authentication failed");

    const stripe = new Stripe(Deno.env.get("STRIPE_TEST_SECRET") || "", {
      apiVersion: "2023-10-16",
    });

    // Find Stripe customer
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found");
    }

    const customerId = customers.data[0].id;

    // Create portal session (ensure configuration exists)
    let portalSession;
    try {
      portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.get("origin")}/user/billing`,
      });
    } catch (e) {
      const msg = e && typeof e === "object" && "message" in e ? (e as any).message as string : "";
      const needsConfig = msg?.includes("No configuration provided") || msg?.includes("default configuration has not been created");
      if (!needsConfig) throw e;

      // Create a default configuration then retry
      const config = await stripe.billingPortal.configurations.create({
        features: {
          invoice_history: { enabled: true },
          payment_method_update: { enabled: true },
          subscription_cancel: { enabled: true, mode: "at_period_end", cancellation_reason: { enabled: true } },
          subscription_update: { enabled: true, proration_behavior: "none", default_allowed_updates: ["price", "quantity"] },
          customer_update: { enabled: true, allowed_updates: ["email", "address", "shipping", "phone", "tax_id"] }
        },
      });

      portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.get("origin")}/user/billing`,
        configuration: config.id,
      });
    }

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Customer portal error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});