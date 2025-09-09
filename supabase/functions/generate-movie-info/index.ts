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
    const { table_id, row_id } = await req.json();
    
    console.log('Generate movie info request:', { table_id, row_id });

    // Validate required parameters
    if (!table_id || !row_id) {
      console.error('Missing required parameters:', { table_id, row_id });
      return new Response(
        JSON.stringify({ 
          accepted: false, 
          error_message: 'Missing required parameters: table_id and row_id' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call the N8N webhook
    console.log('Calling N8N webhook...');
    const webhookResponse = await fetch('https://samim-studios.app.n8n.cloud/webhook-test/movie-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table_id,
        row_id
      }),
    });

    console.log('N8N webhook response status:', webhookResponse.status);

    if (!webhookResponse.ok) {
      console.error('N8N webhook failed:', webhookResponse.status, webhookResponse.statusText);
      return new Response(
        JSON.stringify({ 
          accepted: false, 
          error_message: `Webhook failed with status ${webhookResponse.status}` 
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const webhookResult = await webhookResponse.json();
    console.log('N8N webhook result:', webhookResult);

    // Initialize Supabase client to update the job with the webhook response
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the storyboard job with the N8N response
    const { error: updateError } = await supabase
      .from('storyboard_jobs')
      .update({ 
        n8n_response: webhookResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', row_id);

    if (updateError) {
      console.error('Error updating storyboard job:', updateError);
      // Still return success since the webhook call succeeded
    } else {
      console.log('Successfully updated storyboard job with N8N response');
    }

    // Return the webhook response
    return new Response(
      JSON.stringify(webhookResult),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-movie-info function:', error);
    return new Response(
      JSON.stringify({ 
        accepted: false, 
        error_message: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});