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

    // No function lookup or credit deduction needed

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
      user_input: userInput,
      status: 'pending',
      stage: 'created'
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