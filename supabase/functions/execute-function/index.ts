import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { function_id, payload, user_id } = await req.json();
    
    console.log('Execute function request:', { function_id, payload, user_id });

    // Validate required parameters
    if (!function_id || !payload) {
      console.error('Missing required parameters:', { function_id, payload });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: function_id and payload' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch function details
    console.log('Fetching function details...');
    const { data: functionData, error: functionError } = await supabase
      .from('functions')
      .select('*')
      .eq('id', function_id)
      .eq('active', true)
      .single();

    if (functionError || !functionData) {
      console.error('Function not found or inactive:', functionError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Function not found or inactive' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Function details:', functionData);

    // Check if user has sufficient credits before making webhook call
    if (user_id && functionData.price > 0) {
      console.log(`Checking ${functionData.price} credits for user ${user_id}`);
      
      // First check if user has enough credits without consuming them
      const { data: userCredits, error: creditsError } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user_id)
        .single();

      if (creditsError || !userCredits || userCredits.credits < functionData.price) {
        console.log('Insufficient credits for user');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Insufficient credits',
            required_credits: functionData.price,
            available_credits: userCredits?.credits || 0
          }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`User has sufficient credits: ${userCredits.credits}`);
    }

    // Test webhook connectivity first
    const webhookUrl = functionData.production_webhook || functionData.test_webhook;
    
    if (!webhookUrl) {
      console.error('No webhook URL configured for function');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Function webhook not configured' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Testing webhook connectivity to:', webhookUrl);
    
    // Simple connectivity test
    try {
      const testResponse = await fetch(webhookUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      console.log('Webhook connectivity test result:', testResponse.status);
    } catch (testError) {
      console.error('Webhook connectivity test failed:', testError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Webhook endpoint not accessible: ${testError.message}` 
        }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call the webhook
    console.log('Calling webhook:', webhookUrl);
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));
    
    let webhookResult;
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Webhook response status:', webhookResponse.status);
      console.log('Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()));

      if (!webhookResponse.ok) {
        const responseText = await webhookResponse.text();
        console.error('Webhook failed with response:', responseText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Webhook failed with status ${webhookResponse.status}: ${responseText}` 
          }),
          { 
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const responseText = await webhookResponse.text();
      console.log('Raw webhook response:', responseText);
      
      try {
        webhookResult = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse webhook response as JSON:', parseError);
        webhookResult = { raw_response: responseText };
      }
      
      console.log('Parsed webhook result:', webhookResult);
    } catch (webhookError) {
      console.error('Error calling webhook:', webhookError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Webhook call failed: ${webhookError.message}` 
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Now that webhook succeeded, consume the credits
    if (user_id && functionData.price > 0) {
      console.log(`Consuming ${functionData.price} credits for user ${user_id} after successful webhook`);
      
      const { data: creditResult, error: creditError } = await supabase.rpc('consume_credits', {
        p_user_id: user_id,
        p_credits: functionData.price,
        p_description: `${functionData.name} execution`
      });

      if (creditError || !creditResult) {
        console.error('Error consuming credits after successful webhook:', creditError);
        // Note: We don't return an error here since the webhook succeeded
        // This is a billing issue, not a functional failure
      } else {
        console.log('Credits consumed successfully after webhook completion');
      }
    }

    // For storyboard jobs, update the job with the webhook response
    if (payload.table_id === 'storyboard_jobs' && payload.row_id) {
      const { error: updateError } = await supabase
        .from('storyboard_jobs')
        .update({ 
          n8n_response: webhookResult,
          updated_at: new Date().toISOString()
        })
        .eq('id', payload.row_id);

      if (updateError) {
        console.error('Error updating storyboard job:', updateError);
      } else {
        console.log('Successfully updated storyboard job with webhook response');
      }
    }

    // Return success response with webhook result
    return new Response(
      JSON.stringify({
        success: true,
        data: webhookResult,
        function_name: functionData.name,
        credits_consumed: user_id ? functionData.price : 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in execute-function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});