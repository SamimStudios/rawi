import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { userId, sessionId, type, transactionId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

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

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Create simple HTML invoice
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${invoiceNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .company { text-align: left; }
        .invoice-info { text-align: right; }
        .details { margin: 30px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .total { font-weight: bold; font-size: 18px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company">
            <h1>Rawi</h1>
            <p>Cinematic AI Generator</p>
            <p>United Arab Emirates</p>
        </div>
        <div class="invoice-info">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Status:</strong> Paid</p>
        </div>
    </div>

    <div class="details">
        <h3>Transaction Details</h3>
        <p><strong>Transaction ID:</strong> ${transaction.id}</p>
        <p><strong>Payment Method:</strong> Stripe</p>
        <p><strong>Currency:</strong> ${transaction.currency}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>${transaction.description}</td>
                <td>${Math.abs(transaction.credits_amount)} credits</td>
                <td>${(transaction.amount_paid / Math.abs(transaction.credits_amount)).toFixed(2)} ${transaction.currency}</td>
                <td class="total">${transaction.amount_paid} ${transaction.currency}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <p>Thank you for using Rawi!</p>
        <p>This is a computer-generated invoice.</p>
    </div>
</body>
</html>
    `;

    // Save invoice to database
    const { data: invoice } = await supabase
      .from("invoices")
      .insert({
        user_id: userId,
        invoice_number: invoiceNumber,
        transaction_id: transaction.id,
        amount: transaction.amount_paid,
        currency: transaction.currency,
        status: "paid",
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({ 
        success: true,
        invoiceNumber,
        invoiceId: invoice.id,
        html: invoiceHTML
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Invoice generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});