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
    const { sessionId } = await req.json();
    console.log("Processing payment status check for session:", sessionId);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
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

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("Session retrieved:", { 
      payment_status: session.payment_status, 
      mode: session.mode,
      metadata: session.metadata 
    });
    
    if (session.payment_status === "paid" && session.metadata?.user_id === user.id) {
      const credits = parseInt(session.metadata.credits || "0");
      const currency = session.metadata.currency || "AED";
      
      if (session.mode === "payment") {
        // One-time purchase - add credits
        console.log("Adding credits:", { user_id: user.id, credits, currency });
        
        const { data: addResult, error: addError } = await supabase.rpc("add_credits", {
          p_user_id: user.id,
          p_credits: credits,
          p_type: "purchase",
          p_description: `Credit purchase - ${credits} credits`,
          p_stripe_session_id: sessionId,
          p_amount_paid: session.amount_total ? session.amount_total / 100 : null,
          p_currency: currency,
        });
        
        if (addError) {
          console.error("Error adding credits:", addError);
          throw addError;
        }
        
        console.log("Credits added successfully:", addResult);

        // Generate invoice
        await supabase.functions.invoke("generate-invoice", {
          body: {
            userId: user.id,
            sessionId: sessionId,
            type: "purchase",
          }
        });

      } else if (session.mode === "subscription") {
        // Subscription - credits will be added by webhook or periodic job
        console.log("Subscription created:", session.subscription);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          status: session.payment_status,
          mode: session.mode,
          credits: credits
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        status: session.payment_status 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment status check error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});