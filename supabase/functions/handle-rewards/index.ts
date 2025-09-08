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
    const { rewardType, userId } = await req.json();

    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log(`Processing reward: ${rewardType} for user: ${userId}`);

    // Get the reward configuration
    const { data: reward, error: rewardError } = await supabaseAdmin
      .from("rewards")
      .select("*")
      .eq("reward_type", rewardType)
      .eq("active", true)
      .single();

    if (rewardError || !reward) {
      console.log(`No active reward found for type: ${rewardType}`);
      return new Response(
        JSON.stringify({ success: false, message: "Reward not found or inactive" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`Found reward: ${reward.name} - ${reward.credits_amount} credits`);

    // Check if this is a one-time reward that user has already received
    if (reward.conditions?.one_time) {
      const { data: existingTransaction } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "reward")
        .eq("description", reward.name)
        .single();

      if (existingTransaction) {
        console.log(`User ${userId} already received one-time reward: ${reward.name}`);
        return new Response(
          JSON.stringify({ success: false, message: "Reward already claimed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Add credits to user account
    const { error: addCreditsError } = await supabaseAdmin.rpc("add_credits", {
      p_user_id: userId,
      p_credits: reward.credits_amount,
      p_type: "reward",
      p_description: reward.name,
      p_currency: "AED"
    });

    if (addCreditsError) {
      console.error("Error adding credits:", addCreditsError);
      throw addCreditsError;
    }

    console.log(`Successfully awarded ${reward.credits_amount} credits to user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        creditsAwarded: reward.credits_amount,
        rewardName: reward.name
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error processing reward:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});