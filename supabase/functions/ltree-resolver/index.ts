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
      const jsonKeys = jsonPath.split('.').filter((key) => key.length > 0);
      return { ltreePath, jsonKeys };
    };

    const { ltreePath, jsonKeys } = parseAddress(address);
    console.log(`[ltree-resolver] Parsed - LTree: ${ltreePath}, JSON keys:`, jsonKeys);

    switch (operation) {
      case 'resolve': {
        const { data: nodeData, error: nodeError } = await supabase
          .schema('app')
          .from('nodes')
          .select('content')
          .eq('job_id', job_id)
          .eq('addr', ltreePath)
          .single();

        if (nodeError) {
          if ((nodeError as any).code === 'PGRST116') {
            return new Response(JSON.stringify({ success: true, data: null }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          throw nodeError as any;
        }

        let result: any = nodeData?.content;
        for (const key of jsonKeys) {
          if (result === null || result === undefined) break;
          if (
            typeof result === 'object' &&
            (result as any).kind === 'FormContent' &&
            key !== 'kind' &&
            key !== 'version' &&
            key !== 'items'
          ) {
            if (Array.isArray((result as any).items)) {
              const fieldItem = (result as any).items.find(
                (item: any) => item.kind === 'FieldItem' && item.ref === key
              );
              if (fieldItem) {
                result = fieldItem;
                continue;
              } else {
                result = null;
                break;
              }
            }
          }
          if (typeof result === 'object' && key in (result as any)) {
            result = (result as any)[key];
          } else {
            result = null;
            break;
          }
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'set': {
        if (jsonKeys.length === 0) {
          // Update entire content; require existing row
          const { data: updated, error: setError } = await supabase
            .schema('app')
            .from('nodes')
            .update({ content: value, updated_at: new Date().toISOString() })
            .eq('job_id', job_id)
            .eq('addr', ltreePath)
            .select('addr');

          if (setError) throw setError as any;
          if (!updated || updated.length === 0) throw new Error('Node not found for update');
        } else {
          // JSON path update - get existing content first
          const { data: existingData, error: getError } = await supabase
            .schema('app')
            .from('nodes')
            .select('content')
            .eq('job_id', job_id)
            .eq('addr', ltreePath)
            .single();
          if (getError) throw getError as any;

          let currentContent: any = existingData?.content || {};
          let current: any = currentContent;
          for (let i = 0; i < jsonKeys.length - 1; i++) {
            const key = jsonKeys[i];
            if (
              typeof current === 'object' &&
              current?.kind === 'FormContent' &&
              key !== 'kind' &&
              key !== 'version' &&
              key !== 'items'
            ) {
              if (Array.isArray(current.items)) {
                let fieldItem = current.items.find(
                  (item: any) => item.kind === 'FieldItem' && item.ref === key
                );
                if (!fieldItem) {
                  fieldItem = { kind: 'FieldItem', ref: key, idx: current.items.length + 1 };
                  current.items.push(fieldItem);
                }
                current = fieldItem;
                continue;
              }
            }
            if (!(key in current) || typeof current[key] !== 'object') {
              current[key] = {};
            }
            current = current[key];
          }
          const finalKey = jsonKeys[jsonKeys.length - 1];
          current[finalKey] = value;

          const { data: updated, error: setError } = await supabase
            .schema('app')
            .from('nodes')
            .update({ content: currentContent, updated_at: new Date().toISOString() })
            .eq('job_id', job_id)
            .eq('addr', ltreePath)
            .select('addr');

          if (setError) throw setError as any;
          if (!updated || updated.length === 0) throw new Error('Node not found for update');
        }

        return new Response(JSON.stringify({ success: true, data: value }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'exists': {
        const { error: existsError } = await supabase
          .schema('app')
          .from('nodes')
          .select('addr')
          .eq('job_id', job_id)
          .eq('addr', ltreePath)
          .single();
        const nodeExists = !existsError;
        let pathExists = nodeExists;

        if (nodeExists && jsonKeys.length > 0) {
          const { data: contentData } = await supabase
            .schema('app')
            .from('nodes')
            .select('content')
            .eq('job_id', job_id)
            .eq('addr', ltreePath)
            .single();
          let current: any = contentData?.content;
          for (const key of jsonKeys) {
            if (current && typeof current === 'object' && key in current) {
              current = current[key];
            } else {
              pathExists = false;
              break;
            }
          }
        }

        return new Response(JSON.stringify({ success: true, exists: pathExists }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list_children': {
        const { data: childrenData, error: childrenError } = await supabase
          .schema('app')
          .from('nodes')
          .select('addr')
          .eq('job_id', job_id)
          .like('addr', `${ltreePath}.%`);
        if (childrenError) throw childrenError as any;
        const children = childrenData?.map((row: any) => row.addr) || [];
        return new Response(JSON.stringify({ success: true, data: children }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error('[ltree-resolver] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any)?.message ?? String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});