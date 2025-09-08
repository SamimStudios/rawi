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
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log("Webhook signature verified successfully");
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("Processing webhook event:", event.type);

    // Handle checkout.session.completed (one-time payments)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Checkout session completed:", {
        id: session.id,
        payment_status: session.payment_status,
        metadata: session.metadata
      });

      if (session.payment_status === "paid" && session.metadata?.user_id) {
        await processCreditsAddition(session.metadata, session.id, session.amount_total);
      }
    }

    // Handle invoice.payment_succeeded (subscription renewals, invoice payments)
    else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      
      console.log("Invoice payment succeeded:", {
        id: invoice.id,
        subscription: invoice.subscription,
        amount_paid: invoice.amount_paid,
        customer: invoice.customer
      });

      // For subscription renewals or invoice payments
      if (invoice.subscription) {
        // Handle subscription renewal - add weekly credits
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        if (subscription.metadata?.user_id) {
          // Add credits based on subscription plan
          const weeklyCredits = parseInt(subscription.metadata.weekly_credits || "0");
          if (weeklyCredits > 0) {
            await processCreditsAddition(
              {
                user_id: subscription.metadata.user_id,
                credits: weeklyCredits.toString(),
                currency: invoice.currency?.toUpperCase() || "AED"
              },
              invoice.id,
              invoice.amount_paid,
              "subscription_renewal"
            );
          }
        }
      } else if (invoice.metadata?.user_id) {
        // Handle direct invoice payment
        await processCreditsAddition(invoice.metadata, invoice.id, invoice.amount_paid);
      }
    }

    // Handle payment_intent.succeeded (direct payment intents)
    else if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("Payment intent succeeded:", {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        metadata: paymentIntent.metadata
      });

      if (paymentIntent.metadata?.user_id) {
        await processCreditsAddition(paymentIntent.metadata, paymentIntent.id, paymentIntent.amount);
      }
    }

    // Helper function to process credits addition
    async function processCreditsAddition(
      metadata: any, 
      paymentId: string, 
      amount: number | null, 
      type: string = "purchase"
    ) {
      const userId = metadata.user_id;
      const credits = parseInt(metadata.credits || "0");
      const currency = metadata.currency || "AED";
      const amountPaid = amount ? amount / 100 : null;

      console.log("Adding credits:", { userId, credits, currency, amountPaid, type });

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
        p_type: type,
        p_description: `${type === "subscription_renewal" ? "Weekly credits" : "Credit purchase"} - ${credits} credits`,
        p_stripe_session_id: paymentId,
        p_amount_paid: amountPaid,
        p_currency: currency,
      });

      if (error) {
        console.error("Error adding credits:", error);
        throw new Error("Database error");
      }

      console.log(`Credits added successfully via webhook (${type})`);

      // Generate invoice for purchases (not renewals)
      if (type !== "subscription_renewal") {
        try {
          await supabase.functions.invoke("generate-invoice", {
            body: {
              userId: userId,
              sessionId: paymentId,
              type: type,
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