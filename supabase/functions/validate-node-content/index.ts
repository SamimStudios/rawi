import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  nodeId: string;
  jobId: string;
  fieldValues: Record<string, any>;
}

interface ValidationResponse {
  valid: boolean;
  suggestions?: Record<string, string>;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[validate-node-content] Processing validation request...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { nodeId, jobId, fieldValues }: ValidationRequest = await req.json();

    console.log(`[validate-node-content] Validating node ${nodeId} for job ${jobId}`);
    console.log(`[validate-node-content] Field values:`, fieldValues);

    // Get node information
    const { data: node, error: nodeError } = await supabase
      .from('app.nodes')
      .select('validate_n8n_id')
      .eq('id', nodeId)
      .single();

    if (nodeError) {
      console.error('[validate-node-content] Node fetch error:', nodeError);
      throw new Error(`Failed to fetch node: ${nodeError.message}`);
    }

    if (!node.validate_n8n_id) {
      console.log('[validate-node-content] No validation n8n function configured');
      return new Response(JSON.stringify({ 
        valid: true,
        message: 'No validation configured for this node'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get n8n function details
    const { data: n8nFunction, error: functionError } = await supabase
      .from('app.n8n_functions')
      .select('*')
      .eq('id', node.validate_n8n_id)
      .single();

    if (functionError) {
      console.error('[validate-node-content] N8N function fetch error:', functionError);
      throw new Error(`Failed to fetch n8n function: ${functionError.message}`);
    }

    console.log(`[validate-node-content] Using n8n function: ${n8nFunction.name}`);

    // TODO: Call n8n function with field values
    // For now, return mock validation result
    const mockValidation: ValidationResponse = {
      valid: Object.keys(fieldValues).length > 0,
      suggestions: Object.keys(fieldValues).length === 0 ? {
        general: 'Please fill in at least one field'
      } : undefined
    };

    console.log('[validate-node-content] Validation result:', mockValidation);

    return new Response(JSON.stringify(mockValidation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[validate-node-content] Error:', error);
    return new Response(JSON.stringify({ 
      valid: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});