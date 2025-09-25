import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Dynamic pricing calculation with discount tiers
const calculateDynamicPrice = (credits: number, currency: string) => {
  let baseRate;
  
  // Base rates per credit
  switch (currency.toLowerCase()) {
    case "aed":
    case "sar":
      baseRate = 1.00;
      break;
    case "usd":
      baseRate = 0.27;
      break;
    default:
      throw new Error("Unsupported currency");
  }

  // Apply discount tiers
  let discountRate = 0;
  if (credits >= 250) {
    discountRate = 0.30; // 30% off
  } else if (credits >= 100) {
    discountRate = 0.20; // 20% off
  } else if (credits >= 50) {
    discountRate = 0.10; // 10% off
  }
  // 0-49 credits = 0% off

  const discountedRate = baseRate * (1 - discountRate);
  const totalPrice = credits * discountedRate;
  
  return {
    totalPrice: Math.round(totalPrice * 100), // Convert to cents
    perCreditRate: discountedRate,
    discountPercent: Math.round(discountRate * 100)
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { credits, currency = "AED", customAmount, packageId } = await req.json();

    // Get user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_TEST_SECRET") || "", {
      apiVersion: "2023-10-16",
    });

    let priceId, amount, creditsAmount;

    if (packageId) {
      // Get package details from Supabase
      const { data: packageData, error: packageError } = await supabaseClient
        .from("credit_packages")
        .select("*")
        .eq("id", packageId)
        .single();

      if (packageError) throw packageError;

      creditsAmount = packageData.credits;
      
      // Get the appropriate Stripe price ID based on currency
      switch (currency.toLowerCase()) {
        case "aed":
          priceId = packageData.stripe_price_id_aed;
          amount = packageData.price_aed * 100; // Convert to cents
          break;
        case "sar":
          priceId = packageData.stripe_price_id_sar;
          amount = packageData.price_sar * 100;
          break;
        case "usd":
          priceId = packageData.stripe_price_id_usd;
          amount = packageData.price_usd * 100;
          break;
        default:
          throw new Error("Unsupported currency");
      }
    } else {
      // Custom amount with dynamic pricing
      if (!credits || credits < 10) {
        throw new Error("Minimum 10 credits required for custom purchase");
      }

      creditsAmount = credits;
      
      // Calculate dynamic pricing
      const pricing = calculateDynamicPrice(credits, currency);
      amount = pricing.totalPrice;

      // Create a new product for this custom amount
      const product = await stripe.products.create({
        name: `${credits} Rawi Credits (${pricing.discountPercent}% off)`,
        description: `Custom credit package: ${credits} credits at ${pricing.perCreditRate.toFixed(2)} ${currency}/credit`,
      });

      const price = await stripe.prices.create({
        unit_amount: amount,
        currency: currency.toLowerCase(),
        product: product.id,
      });

      priceId = price.id;
    }

    // Get or create Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
      });
      customerId = customer.id;
    }

    // Create checkout session with automatic tax and invoicing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/app/wallet?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/app/wallet?canceled=true`,
      metadata: {
        user_id: user.id,
        credits: creditsAmount.toString(),
        currency: currency,
        type: "credit_purchase",
      },
      invoice_creation: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});