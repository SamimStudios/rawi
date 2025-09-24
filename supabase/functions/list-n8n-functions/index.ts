import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔄 Fetching N8N functions from database...');
    
    const { data, error } = await supabaseAdmin
      .from('n8n_functions')
      .select('id, name, kind, active')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log('✅ Found N8N functions:', data?.length || 0);
    
    return new Response(
      JSON.stringify({ data: data || [] }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error in list-n8n-functions:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        data: []
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});