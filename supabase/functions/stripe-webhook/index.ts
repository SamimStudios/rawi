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
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      console.log("No signature provided");
      return new Response("No signature", { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_TEST_SECRET") || "", {
      apiVersion: "2023-10-16",
    });

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not set");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("Webhook signature verified successfully");
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("Processing webhook event:", event.type);

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Checkout session completed:", {
        id: session.id,
        payment_status: session.payment_status,
        metadata: session.metadata
      });

      if (session.payment_status === "paid" && session.metadata?.user_id) {
        const userId = session.metadata.user_id;
        const credits = parseInt(session.metadata.credits || "0");
        const currency = session.metadata.currency || "AED";
        const amountPaid = session.amount_total ? session.amount_total / 100 : null;

        console.log("Adding credits:", { userId, credits, currency, amountPaid });

        // Use service role key to bypass RLS
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        // Add credits using the existing database function
        const { data, error } = await supabase.rpc("add_credits", {
          p_user_id: userId,
          p_credits: credits,
          p_type: "purchase",
          p_description: `Credit purchase - ${credits} credits`,
          p_stripe_session_id: session.id,
          p_amount_paid: amountPaid,
          p_currency: currency,
        });

        if (error) {
          console.error("Error adding credits:", error);
          return new Response("Database error", { status: 500 });
        }

        console.log("Credits added successfully via webhook");

        // Generate invoice
        try {
          await supabase.functions.invoke("generate-invoice", {
            body: {
              userId: userId,
              sessionId: session.id,
              type: "purchase",
            }
          });
          console.log("Invoice generated successfully");
        } catch (invoiceError) {
          console.error("Invoice generation failed:", invoiceError);
          // Don't fail the webhook for invoice errors
        }
      }
    }

    return new Response("Success", { 
      status: 200,
      headers: corsHeaders 
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook error", { 
      status: 500,
      headers: corsHeaders 
    });
  }
});