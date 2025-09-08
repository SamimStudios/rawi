import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the job details
    const { data: job, error: fetchError } = await supabase
      .from('storyboard_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      console.error('Error fetching job:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Retrying job:', job.id);

    // Get the function details to know which webhook to call
    const { data: func, error: funcError } = await supabase
      .from('functions')
      .select('*')
      .eq('id', job.function_id)
      .single();

    if (funcError || !func) {
      console.error('Error fetching function:', funcError);
      return new Response(
        JSON.stringify({ error: 'Function configuration not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Reset job status to pending for retry
    const { error: updateError } = await supabase
      .from('storyboard_jobs')
      .update({
        status: 'pending',
        stage: 'created',
        n8n_webhook_sent: false,
        n8n_response: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Error updating job:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to reset job status' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Job reset to pending status');

    // Prepare webhook payload
    const webhookPayload = {
      row_id: job.id,
      table_id: 'storyboard_jobs',
      function_name: func.name,
      user_input: job.user_input,
      status: 'pending',
      stage: 'created',
      created_at: job.created_at
    };

    // Call the N8N webhook
    const webhookUrl = func.test_webhook; // Use test webhook for now
    console.log('Sending retry webhook to N8N:', webhookUrl, webhookPayload);

    let webhookResponse;
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        webhookResponse = {
          error: `${response.status} ${responseText}`,
          status: response.status
        };
        console.error('N8N webhook error:', webhookResponse);
      } else {
        webhookResponse = {
          success: true,
          status: response.status,
          response: responseText
        };
        console.log('N8N webhook success:', webhookResponse);
      }
    } catch (webhookError) {
      webhookResponse = {
        error: `Network error: ${webhookError.message}`,
        status: 0
      };
      console.error('Webhook network error:', webhookError);
    }

    // Update job with webhook response
    const { error: webhookUpdateError } = await supabase
      .from('storyboard_jobs')
      .update({
        n8n_webhook_sent: !webhookResponse.error,
        n8n_response: webhookResponse,
        status: webhookResponse.error ? 'failed' : 'pending',
        stage: webhookResponse.error ? 'failed' : 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (webhookUpdateError) {
      console.error('Error updating webhook status:', webhookUpdateError);
    } else {
      console.log('Job updated with retry webhook status');
    }

    // Return success even if webhook failed - user can retry again
    return new Response(
      JSON.stringify({ 
        success: true,
        jobId: job.id,
        webhookSent: !webhookResponse.error,
        message: webhookResponse.error ? 'Job reset but webhook failed. You can try again.' : 'Job successfully retried'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in retry-storyboard-job function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});