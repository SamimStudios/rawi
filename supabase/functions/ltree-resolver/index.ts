import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LtreeRequest {
  operation: 'resolve' | 'set' | 'exists' | 'list_children';
  job_id: string;
  address: string;
  value?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { operation, job_id, address, value }: LtreeRequest = await req.json()

    console.log('LTree operation:', { operation, job_id, address, value })

    switch (operation) {
      case 'resolve': {
        const { data, error } = await supabaseClient
          .schema('app')
          .rpc('json_resolve_strict', {
            p_job_id: job_id,
            p_address: address
          })

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }

      case 'set': {
        // For setting values, we'll need to use a custom function
        // For now, let's use a direct update approach
        const pathParts = address.split('.')
        const nodePath = pathParts[0]
        const jsonPath = pathParts.slice(1).join('.')

        // Get the node first
        const { data: node, error: nodeError } = await supabaseClient
          .schema('app')
          .from('nodes')
          .select('id, content')
          .eq('job_id', job_id)
          .eq('path', nodePath)
          .single()

        if (nodeError) throw nodeError

        // Build the jsonb_set path
        const jsonbPath = '{' + jsonPath.split('.').join(',') + '}'
        
        const { error: updateError } = await supabaseClient
          .schema('app')
          .from('nodes')
          .update({ 
            content: supabaseClient.rpc('jsonb_set', {
              target: node.content,
              path: jsonbPath,
              new_value: JSON.stringify(value)
            })
          })
          .eq('id', node.id)

        if (updateError) throw updateError

        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }

      case 'exists': {
        try {
          const { data, error } = await supabaseClient
            .schema('app')
            .rpc('json_resolve_strict', {
              p_job_id: job_id,
              p_address: address
            })

          return new Response(
            JSON.stringify({ success: true, exists: !error && data !== null }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          )
        } catch {
          return new Response(
            JSON.stringify({ success: true, exists: false }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          )
        }
      }

      default:
        throw new Error(`Unknown operation: ${operation}`)
    }

  } catch (error) {
    console.error('LTree resolver error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})