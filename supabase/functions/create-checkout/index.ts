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
    const { credits, currency = "AED", customAmount, packageId } = await req.json();
    
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

    let priceId: string;
    let amount: number;
    let creditsAmount: number;

    if (packageId) {
      // Use predefined package
      const { data: pkg } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("id", packageId)
        .single();
      
      if (!pkg) throw new Error("Package not found");
      
      const currencyField = `stripe_price_id_${currency.toLowerCase()}`;
      priceId = pkg[currencyField];
      creditsAmount = pkg.credits;
      amount = pkg[`price_${currency.toLowerCase()}`] * 100;
    } else {
      // Custom credits (minimum 10)
      if (!credits || credits < 10) throw new Error("Minimum 10 credits required");
      
      creditsAmount = credits;
      // 1 credit = 1 AED, with currency conversion
      const rates = { AED: 1, SAR: 1, USD: 0.27 };
      amount = Math.round(credits * rates[currency as keyof typeof rates] * 100);
      
      // Create on-demand price for custom amount
      const product = await stripe.products.create({
        name: `${credits} Rawi Credits`,
      });
      
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: amount,
        currency: currency.toLowerCase(),
        metadata: {
          credits: credits.toString(),
          custom: "true",
        },
      });
      
      priceId = price.id;
    }

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/wallet?success=true&credits=${creditsAmount}`,
      cancel_url: `${req.headers.get("origin")}/wallet?canceled=true`,
      metadata: {
        user_id: user.id,
        credits: creditsAmount.toString(),
        currency: currency,
      },
    });

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});