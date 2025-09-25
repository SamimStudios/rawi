import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LtreeOperation {
  operation: 'resolve' | 'set' | 'exists' | 'list_children';
  job_id: string;
  address: string;
  value?: any;
}

interface LtreeResponse {
  success: boolean;
  data?: any;
  exists?: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ltree-resolver] Processing ltree operation...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { operation, job_id, address, value }: LtreeOperation = await req.json();

    console.log(`[ltree-resolver] Operation: ${operation}, JobID: ${job_id}, Address: ${address}`);

    // Parse hybrid address: "ltree.path#json.dot.path"
    const parseAddress = (addr: string) => {
      const hashIndex = addr.indexOf('#');
      if (hashIndex === -1) {
        return { ltreePath: addr, jsonKeys: [] };
      }
      
      const ltreePath = addr.substring(0, hashIndex);
      const jsonPath = addr.substring(hashIndex + 1);
      const jsonKeys = jsonPath.split('.').filter(key => key.length > 0);
      
      return { ltreePath, jsonKeys };
    };

    const { ltreePath, jsonKeys } = parseAddress(address);
    console.log(`[ltree-resolver] Parsed - LTree: ${ltreePath}, JSON keys:`, jsonKeys);

    switch (operation) {
      case 'resolve': {
        // Get data from ltree address using app.nodes table
        const { data: nodeData, error: nodeError } = await supabase
          .schema('app')
          .from('nodes')
          .select('content')
          .eq('job_id', job_id)
          .eq('addr', ltreePath)
          .single();

        if (nodeError) {
          if (nodeError.code === 'PGRST116') {
            // No data found - return null
            return new Response(JSON.stringify({
              success: true,
              data: null
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          throw nodeError;
        }

        let result = nodeData?.content;

        // Navigate through JSON keys if provided
        for (const key of jsonKeys) {
          if (result && typeof result === 'object' && key in result) {
            result = result[key];
          } else {
            result = null;
            break;
          }
        }

        console.log(`[ltree-resolver] Resolved value:`, result);

        return new Response(JSON.stringify({
          success: true,
          data: result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'set': {
        console.log(`[ltree-resolver] Setting value:`, value);

        if (jsonKeys.length === 0) {
          // Direct ltree path update - update entire content
          const { error: setError } = await supabase
            .schema('app')
            .from('nodes')
            .upsert({
              job_id,
              addr: ltreePath,
              content: value,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'job_id,addr'
            });

          if (setError) {
            console.error('[ltree-resolver] Direct set error:', setError);
            throw setError;
          }
        } else {
          // JSON path update - need to get existing content first
          const { data: existingData, error: getError } = await supabase
            .schema('app')
            .from('nodes')
            .select('content')
            .eq('job_id', job_id)
            .eq('addr', ltreePath)
            .single();

          let currentContent = existingData?.content || {};

          // Navigate to the parent object and set the final key
          let target = currentContent;
          for (let i = 0; i < jsonKeys.length - 1; i++) {
            const key = jsonKeys[i];
            if (!(key in target) || typeof target[key] !== 'object') {
              target[key] = {};
            }
            target = target[key];
          }

          // Set the final value
          const finalKey = jsonKeys[jsonKeys.length - 1];
          target[finalKey] = value;

          // Update the node with modified content
          const { error: setError } = await supabase
            .schema('app')
            .from('nodes')
            .upsert({
              job_id,
              addr: ltreePath,
              content: currentContent,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'job_id,addr'
            });

          if (setError) {
            console.error('[ltree-resolver] JSON path set error:', setError);
            throw setError;
          }
        }

        console.log(`[ltree-resolver] Value set successfully`);

        return new Response(JSON.stringify({
          success: true,
          data: value
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'exists': {
        const { data: existsData, error: existsError } = await supabase
          .schema('app')
          .from('nodes')
          .select('addr')
          .eq('job_id', job_id)
          .eq('addr', ltreePath)
          .single();

        if (existsError && existsError.code !== 'PGRST116') {
          throw existsError;
        }

        const nodeExists = !existsError;
        let pathExists = nodeExists;

        // If node exists and we have json keys, check if the json path exists
        if (nodeExists && jsonKeys.length > 0) {
          const { data: contentData } = await supabase
            .schema('app')
            .from('nodes')
            .select('content')
            .eq('job_id', job_id)
            .eq('addr', ltreePath)
            .single();

          let current = contentData?.content;
          for (const key of jsonKeys) {
            if (current && typeof current === 'object' && key in current) {
              current = current[key];
            } else {
              pathExists = false;
              break;
            }
          }
        }

        console.log(`[ltree-resolver] Address exists: ${pathExists}`);

        return new Response(JSON.stringify({
          success: true,
          exists: pathExists
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list_children': {
        // List child nodes under the given ltree path
        const { data: childrenData, error: childrenError } = await supabase
          .schema('app')
          .from('nodes')
          .select('addr')
          .eq('job_id', job_id)
          .like('addr', `${ltreePath}.%`);

        if (childrenError) {
          throw childrenError;
        }

        const children = childrenData?.map(row => row.addr) || [];
        console.log(`[ltree-resolver] Found ${children.length} children`);

        return new Response(JSON.stringify({
          success: true,
          data: children
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

  } catch (error) {
    console.error('[ltree-resolver] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});