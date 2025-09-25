import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerationRequest {
  nodeId: string;
  jobId: string;
  context?: Record<string, any>;
}

interface GenerationResponse {
  success: boolean;
  generatedContent?: Record<string, any>;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[generate-node-content] Processing generation request...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { nodeId, jobId, context }: GenerationRequest = await req.json();

    console.log(`[generate-node-content] Generating content for node ${nodeId} in job ${jobId}`);
    console.log(`[generate-node-content] Context:`, context);

    // Get node information
    const { data: node, error: nodeError } = await supabase
      .from('app.nodes')
      .select('generate_n8n_id, addr, content')
      .eq('id', nodeId)
      .single();

    if (nodeError) {
      console.error('[generate-node-content] Node fetch error:', nodeError);
      throw new Error(`Failed to fetch node: ${nodeError.message}`);
    }

    if (!node.generate_n8n_id) {
      console.log('[generate-node-content] No generation n8n function configured');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No generation function configured for this node'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get n8n function details
    const { data: n8nFunction, error: functionError } = await supabase
      .from('app.n8n_functions')
      .select('*')
      .eq('id', node.generate_n8n_id)
      .single();

    if (functionError) {
      console.error('[generate-node-content] N8N function fetch error:', functionError);
      throw new Error(`Failed to fetch n8n function: ${functionError.message}`);
    }

    console.log(`[generate-node-content] Using n8n function: ${n8nFunction.name}`);

    // TODO: Call n8n function with job context
    // For now, return mock generated content
    const mockGeneration = {
      character_name: 'Generated Character',
      character_description: 'A dynamically generated character based on your story context.',
      scene_setting: 'Generated scene setting'
    };

    // Update node content with generated values (mock)
    console.log('[generate-node-content] Mock generation completed:', mockGeneration);

    const response: GenerationResponse = {
      success: true,
      generatedContent: mockGeneration
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-node-content] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});