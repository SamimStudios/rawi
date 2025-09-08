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

    // Handle successful payment events
    if (['checkout.session.completed', 'invoice.payment_succeeded', 'payment_intent.succeeded'].includes(event.type)) {
      console.log(`Processing successful payment event: ${event.type}`);
      
      let metadata, paymentId, amount, stripeInvoiceId;
      
      if (event.type === 'checkout.session.completed') {
        metadata = event.data.object.metadata;
        paymentId = event.data.object.id;
        amount = event.data.object.amount_total;
        stripeInvoiceId = event.data.object.invoice; // Stripe invoice ID
      } else if (event.type === 'invoice.payment_succeeded') {
        metadata = event.data.object.metadata;
        paymentId = event.data.object.id;
        amount = event.data.object.amount_paid;
        stripeInvoiceId = event.data.object.id;
      } else if (event.type === 'payment_intent.succeeded') {
        metadata = event.data.object.metadata;
        paymentId = event.data.object.id;
        amount = event.data.object.amount;
      }
      
      if (metadata && metadata.user_id) {
        await processCreditsAddition(metadata, paymentId, amount, stripeInvoiceId);
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

    // ============ FAILURE EVENT HANDLERS ============

    // Handle checkout session async payment failures
    else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.error("Checkout session async payment failed:", {
        id: session.id,
        customer: session.customer,
        metadata: session.metadata,
        payment_status: session.payment_status
      });

      // Log failed payment attempt
      if (session.metadata?.user_id) {
        await logFailedPayment(session.metadata.user_id, "checkout_async_failed", session.id, {
          session_id: session.id,
          amount: session.amount_total,
          currency: session.currency
        });
      }
    }

    // Handle invoice payment failures
    else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      
      console.error("Invoice payment failed:", {
        id: invoice.id,
        subscription: invoice.subscription,
        customer: invoice.customer,
        amount_due: invoice.amount_due,
        attempt_count: invoice.attempt_count
      });

      // For subscription failures, log but don't immediately suspend
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        if (subscription.metadata?.user_id) {
          await logFailedPayment(subscription.metadata.user_id, "subscription_payment_failed", invoice.id, {
            invoice_id: invoice.id,
            subscription_id: invoice.subscription,
            amount_due: invoice.amount_due,
            attempt_count: invoice.attempt_count
          });
        }
      }
    }

    // Handle payment intent failures
    else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.error("Payment intent failed:", {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        last_payment_error: paymentIntent.last_payment_error,
        metadata: paymentIntent.metadata
      });

      if (paymentIntent.metadata?.user_id) {
        await logFailedPayment(paymentIntent.metadata.user_id, "payment_intent_failed", paymentIntent.id, {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          error: paymentIntent.last_payment_error
        });
      }
    }

    // Handle chargebacks/disputes
    else if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      
      console.error("Chargeback/dispute created:", {
        id: dispute.id,
        charge: dispute.charge,
        amount: dispute.amount,
        reason: dispute.reason,
        status: dispute.status
      });

      // Get charge details to find user
      const charge = await stripe.charges.retrieve(dispute.charge);
      if (charge.metadata?.user_id) {
        await logFailedPayment(charge.metadata.user_id, "chargeback_created", dispute.id, {
          dispute_id: dispute.id,
          charge_id: dispute.charge,
          amount: dispute.amount,
          reason: dispute.reason,
          status: dispute.status
        });

        // Optionally: Suspend account or deduct credits for disputed amount
        console.log(`CHARGEBACK ALERT: User ${charge.metadata.user_id} has a dispute for ${dispute.amount/100} ${dispute.currency}`);
      }
    }

    // Handle subscription deletions/cancellations
    else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log("Subscription cancelled:", {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        canceled_at: subscription.canceled_at,
        metadata: subscription.metadata
      });

      if (subscription.metadata?.user_id) {
        await logFailedPayment(subscription.metadata.user_id, "subscription_cancelled", subscription.id, {
          subscription_id: subscription.id,
          canceled_at: subscription.canceled_at,
          cancel_at_period_end: subscription.cancel_at_period_end
        });

        console.log(`Subscription cancelled for user ${subscription.metadata.user_id}`);
      }
    }

    // Helper function to process credits addition
    async function processCreditsAddition(
      metadata: any, 
      paymentId: string, 
      amount: number | null, 
      stripeInvoiceId?: string,
      type: string = "purchase"
    ) {
      try {
        console.log('Processing credits addition:', { metadata, paymentId, amount, stripeInvoiceId, type });
        
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        const credits = parseInt(metadata.credits) || 0;
        const currency = metadata.currency || 'AED';
        const userId = metadata.user_id;
        
        if (!userId || credits <= 0) {
          console.error('Invalid user ID or credits amount');
          return;
        }

        // Add credits using the RPC function
        const { error: addCreditsError } = await supabaseAdmin.rpc("add_credits", {
          p_user_id: userId,
          p_credits: credits,
          p_type: type,
          p_description: `Credit ${type} - ${credits} credits`,
          p_stripe_session_id: paymentId,
          p_amount_paid: amount ? (amount / 100) : null, // Convert from cents
          p_currency: currency
        });

        if (addCreditsError) {
          console.error('Error adding credits:', addCreditsError);
          throw addCreditsError;
        }

        console.log(`Successfully added ${credits} credits to user ${userId}`);

        // Store Stripe invoice reference if available (no need to generate our own)
        if (stripeInvoiceId && type === "purchase") {
          try {
            // Update transaction with Stripe invoice ID
            const { error: updateError } = await supabaseAdmin
              .from('transactions')
              .update({ 
                metadata: { stripe_invoice_id: stripeInvoiceId }
              })
              .eq('stripe_session_id', paymentId);

            if (updateError) {
              console.error('Error updating transaction with invoice ID:', updateError);
            } else {
              console.log(`Linked Stripe invoice ${stripeInvoiceId} to transaction`);
            }
          } catch (err) {
            console.error('Failed to link Stripe invoice:', err);
          }
        }

      } catch (error) {
        console.error('Error in processCreditsAddition:', error);
        throw error;
      }
    }

    // Helper function to log failed payments
    async function logFailedPayment(
      userId: string,
      failureType: string,
      paymentId: string,
      details: any
    ) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      try {
        // Log failed payment in transactions table with negative amount
        const { error } = await supabase.from("transactions").insert({
          user_id: userId,
          type: failureType,
          credits_amount: 0, // No credits added for failures
          description: `Payment failure: ${failureType}`,
          stripe_session_id: paymentId,
          metadata: details,
          currency: details.currency || "AED"
        });

        if (error) {
          console.error("Error logging failed payment:", error);
        } else {
          console.log(`Failed payment logged for user ${userId}: ${failureType}`);
        }
      } catch (error) {
        console.error("Error in logFailedPayment:", error);
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