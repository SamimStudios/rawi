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
          .rpc('json_resolve_by_path', {
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
        const { data, error } = await supabaseClient
          .schema('app')
          .rpc('json_set_by_path', {
            p_job_id: job_id,
            p_address: address,
            p_value: value
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

      case 'exists': {
        try {
          const { data, error } = await supabaseClient
            .schema('app')
            .rpc('json_resolve_by_path', {
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})