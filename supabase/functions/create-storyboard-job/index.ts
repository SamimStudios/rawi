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
  faceImage?: string; // base64 encoded
  faceImageType?: string;
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
      faceImage, 
      faceImageType,
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

    let faceRefUrl = null;

    // Handle face image upload if provided
    if (faceImage && faceImageType) {
      try {
        console.log('Uploading face reference image...');
        
        // Extract base64 data (remove data:image/xxx;base64, prefix)
        const base64Data = faceImage.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Generate unique filename
        const fileExtension = faceImageType.split('/')[1] || 'jpg';
        const fileName = `face_ref_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = `storyboard-face-refs/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ai-scenes-uploads')
          .upload(filePath, imageBuffer, {
            contentType: faceImageType,
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading face image:', uploadError);
          throw new Error('Failed to upload face reference image');
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('ai-scenes-uploads')
          .getPublicUrl(filePath);

        faceRefUrl = urlData.publicUrl;
        console.log('Face reference image uploaded:', faceRefUrl);

      } catch (error) {
        console.error('Error processing face image:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to process face reference image' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Create storyboard job record
    const jobData = {
      user_id: userId || null,
      session_id: sessionId || null,
      lead_name: leadName,
      lead_gender: leadGender,
      face_ref_url: faceRefUrl,
      language: language,
      accent: accent,
      genres: genres,
      prompt: prompt || null,
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

    // Send webhook to N8N
    const webhookUrl = 'https://samim-studios.app.n8n.cloud/webhook-test/start-job';
    const webhookPayload = {
      rowId: job.id,
      tableId: 'storyboard_jobs',
      leadName: job.lead_name,
      leadGender: job.lead_gender,
      faceRefUrl: job.face_ref_url,
      language: job.language,
      accent: job.accent,
      genres: job.genres,
      prompt: job.prompt,
      createdAt: job.created_at
    };

    console.log('Sending webhook to N8N:', webhookPayload);

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
        message: 'Storyboard job created successfully'
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