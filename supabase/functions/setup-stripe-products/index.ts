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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_TEST_SECRET") || "", {
      apiVersion: "2023-10-16",
    });

    console.log("Setting up Stripe products and prices...");

    // Create main product for credit purchases
    const creditProduct = await stripe.products.create({
      name: "Rawi Credits",
      description: "Credits for AI cinematic content generation",
    });

    console.log("Created credit product:", creditProduct.id);

    // Create subscription product
    const subscriptionProduct = await stripe.products.create({
      name: "Rawi Pro Subscription",
      description: "Weekly subscription for Rawi credits",
    });

    console.log("Created subscription product:", subscriptionProduct.id);

    // Get credit packages from database
    const { data: creditPackages } = await supabase
      .from("credit_packages")
      .select("*");

    // Get subscription plans from database
    const { data: subscriptionPlans } = await supabase
      .from("subscription_plans")
      .select("*");

    // Create prices for credit packages
    for (const pkg of creditPackages || []) {
      const currencies = [
        { currency: "aed", amount: Math.round(pkg.price_aed * 100), field: "stripe_price_id_aed" },
        { currency: "sar", amount: Math.round(pkg.price_sar * 100), field: "stripe_price_id_sar" },
        { currency: "usd", amount: Math.round(pkg.price_usd * 100), field: "stripe_price_id_usd" },
      ];

      for (const { currency, amount, field } of currencies) {
        const price = await stripe.prices.create({
          product: creditProduct.id,
          unit_amount: amount,
          currency: currency,
          metadata: {
            credits: pkg.credits.toString(),
            package_id: pkg.id,
            package_name: pkg.name,
          },
        });

        console.log(`Created price for ${pkg.name} in ${currency.toUpperCase()}: ${price.id}`);

        // Update database with Stripe price ID
        await supabase
          .from("credit_packages")
          .update({ [field]: price.id })
          .eq("id", pkg.id);
      }
    }

    // Create prices for subscription plans
    for (const plan of subscriptionPlans || []) {
      const currencies = [
        { currency: "aed", amount: Math.round(plan.price_aed * 100), field: "stripe_price_id_aed" },
        { currency: "sar", amount: Math.round(plan.price_sar * 100), field: "stripe_price_id_sar" },
        { currency: "usd", amount: Math.round(plan.price_usd * 100), field: "stripe_price_id_usd" },
      ];

      for (const { currency, amount, field } of currencies) {
        const price = await stripe.prices.create({
          product: subscriptionProduct.id,
          unit_amount: amount,
          currency: currency,
          recurring: {
            interval: "week",
          },
          metadata: {
            credits_per_week: plan.credits_per_week.toString(),
            plan_id: plan.id,
            plan_name: plan.name,
          },
        });

        console.log(`Created subscription price for ${plan.name} in ${currency.toUpperCase()}: ${price.id}`);

        // Update database with Stripe price ID
        await supabase
          .from("subscription_plans")
          .update({ [field]: price.id })
          .eq("id", plan.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Stripe products and prices created successfully",
        products: { creditProduct: creditProduct.id, subscriptionProduct: subscriptionProduct.id }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error setting up Stripe products:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});