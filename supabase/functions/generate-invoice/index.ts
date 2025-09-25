import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, sessionId, type, transactionId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_TEST_SECRET") || Deno.env.get("STRIPE_LIVE_SECRET") || "", {
      apiVersion: "2023-10-16"
    });

    // Get transaction details
    let transaction;
    if (transactionId) {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .single();
      transaction = data;
    } else if (sessionId) {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .single();
      transaction = data;
    }

    if (!transaction) throw new Error("Transaction not found");

    let stripeInvoiceData;
    let invoiceUrl;
    let invoiceNumber;

    // Handle different transaction types
    if (transaction.stripe_subscription_id) {
      // For subscriptions, fetch the invoice from Stripe
      const subscription = await stripe.subscriptions.retrieve(transaction.stripe_subscription_id);
      const latestInvoiceId = subscription.latest_invoice as string;
      
      if (latestInvoiceId) {
        const invoice = await stripe.invoices.retrieve(latestInvoiceId);
        stripeInvoiceData = invoice;
        invoiceUrl = invoice.invoice_pdf;
        invoiceNumber = invoice.number;
        console.log(`Found subscription invoice PDF: ${invoiceUrl}`);
      }
    } else if (transaction.stripe_session_id) {
      // For one-time payments, get the payment receipt from the session
      const session = await stripe.checkout.sessions.retrieve(transaction.stripe_session_id);
      
      if (session.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
        
        // Get the charge to access the receipt
        if (paymentIntent.charges?.data?.[0]) {
          const charge = paymentIntent.charges.data[0];
          invoiceUrl = charge.receipt_url;
          invoiceNumber = `RECEIPT-${charge.id}`;
          console.log(`Found payment receipt URL: ${invoiceUrl}`);
          stripeInvoiceData = {
            id: charge.id,
            number: invoiceNumber,
            amount_paid: charge.amount,
            currency: charge.currency.toUpperCase(),
            created: charge.created,
            receipt_url: charge.receipt_url,
            description: session.metadata?.description || transaction.description
          };
        }
      }
    } else if (transaction.stripe_payment_intent_id) {
      // Direct payment intent case
      const paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripe_payment_intent_id);
      
      if (paymentIntent.charges?.data?.[0]) {
        const charge = paymentIntent.charges.data[0];
        invoiceUrl = charge.receipt_url;
        invoiceNumber = `RECEIPT-${charge.id}`;
        console.log(`Found direct payment receipt URL: ${invoiceUrl}`);
        stripeInvoiceData = {
          id: charge.id,
          number: invoiceNumber,
          amount_paid: charge.amount,
          currency: charge.currency.toUpperCase(),
          created: charge.created,
          receipt_url: charge.receipt_url,
          description: transaction.description
        };
      }
    }

    if (!stripeInvoiceData || !invoiceUrl) {
      throw new Error("Unable to fetch Stripe invoice/receipt");
    }

    // Save or update invoice record in database
    const invoiceData = {
      user_id: userId || transaction.user_id,
      invoice_number: invoiceNumber,
      transaction_id: transaction.id,
      amount: transaction.amount_paid,
      currency: transaction.currency,
      status: "paid",
      stripe_invoice_id: stripeInvoiceData.id,
      pdf_url: invoiceUrl
    };

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("transaction_id", transaction.id)
      .single();

    let invoice;
    if (existingInvoice) {
      // Update existing invoice
      const { data } = await supabase
        .from("invoices")
        .update(invoiceData)
        .eq("id", existingInvoice.id)
        .select()
        .single();
      invoice = data;
    } else {
      // Create new invoice
      const { data } = await supabase
        .from("invoices")
        .insert(invoiceData)
        .select()
        .single();
      invoice = data;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        invoiceNumber,
        invoiceId: invoice.id,
        invoiceUrl,
        stripeData: stripeInvoiceData
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Invoice generation error:", error);
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