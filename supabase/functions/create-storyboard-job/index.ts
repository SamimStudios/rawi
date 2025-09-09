import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  leadName: string;
  leadGender: string;
  language: string;
  accent: string;
  genres: string[];
  prompt?: string;
  faceImageUrl?: string; // Changed from base64 to URL
  supportingCharacters?: Array<{
    name: string;
    gender: string;
    aiFace: boolean;
    faceImageUrl?: string;
  }>;
  template?: string;
  size?: string;
  userId?: string;
  sessionId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      leadName, 
      leadGender, 
      language, 
      accent, 
      genres, 
      prompt, 
      faceImageUrl,
      supportingCharacters,
      template,
      size,
      userId,
      sessionId 
    }: RequestBody = await req.json();

    console.log('Creating storyboard job for:', { leadName, leadGender, language, accent, genres, userId, sessionId });

    // Validate required fields
    if (!leadName || !leadGender || !language || !accent || !genres || genres.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate user authentication or guest session
    if (!userId && !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Either userId or sessionId is required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the start-storyboard-job function details
    const { data: functionData, error: functionError } = await supabase
      .from('functions')
      .select('*')
      .eq('name', 'start-storyboard-job')
      .eq('active', true)
      .single();

    if (functionError || !functionData) {
      console.error('Function lookup error:', functionError);
      return new Response(
        JSON.stringify({ error: 'Function not found or inactive' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Function found:', functionData.name, 'Price:', functionData.price);

    // Check and deduct credits for authenticated users
    if (userId) {
      const { data: success, error: creditError } = await supabase.rpc('consume_credits', {
        p_user_id: userId,
        p_credits: functionData.price,
        p_description: `${functionData.name} - ${functionData.description}`
      });

      if (creditError || !success) {
        console.error('Credit deduction failed:', creditError);
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient credits or credit deduction failed',
            required_credits: functionData.price 
          }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      console.log(`Successfully deducted ${functionData.price} credits from user ${userId}`);
    }

    // Prepare user input data (no need to upload face image as it's already uploaded)
    const userInput = {
      lead_name: leadName,
      lead_gender: leadGender,
      language: language,
      accent: accent,
      genres: genres,
      prompt: prompt,
      face_ref_url: faceImageUrl,
      supporting_characters: supportingCharacters,
      template: template,
      size: size
    };

    // Create storyboard job record
    const jobData = {
      user_id: userId || null,
      session_id: sessionId || null,
      function_id: functionData.id,
      user_input: userInput,
      status: 'pending',
      stage: 'created',
      n8n_webhook_sent: false
    };

    console.log('Inserting job data:', jobData);

    const { data: job, error: dbError } = await supabase
      .from('storyboard_jobs')
      .insert(jobData)
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to create job', details: dbError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Job created successfully:', job);

    // Send webhook to N8N using the function's test webhook URL
    const webhookUrl = functionData.test_webhook;
    const webhookPayload = {
      row_id: job.id,
      table_id: 'storyboard_jobs',
      function_name: functionData.name,
      user_input: userInput,
      status: job.status,
      stage: job.stage,
      created_at: job.created_at
    };

    console.log('Sending webhook to N8N:', webhookUrl, webhookPayload);

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      const webhookResult = await webhookResponse.text();
      console.log('N8N webhook response:', webhookResponse.status, webhookResult);

      // Update job with webhook status
      await supabase
        .from('storyboard_jobs')
        .update({
          n8n_webhook_sent: true,
          n8n_response: {
            status: webhookResponse.status,
            response: webhookResult,
            sentAt: new Date().toISOString()
          }
        })
        .eq('id', job.id);

      console.log('Job updated with webhook status');

    } catch (webhookError) {
      console.error('Error sending webhook to N8N:', webhookError);
      
      // Update job with webhook error
      await supabase
        .from('storyboard_jobs')
        .update({
          n8n_response: {
            error: webhookError.message,
            sentAt: new Date().toISOString()
          }
        })
        .eq('id', job.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: job.id,
        message: 'Storyboard job created successfully',
        creditsDeducted: functionData.price
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});