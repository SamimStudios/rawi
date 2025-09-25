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
    
    // Try app schema first, then fall back to public
    let data: any[] | null = null;
    let error: any = null;

    const fetchFromSchema = async (schema?: string) => {
      const client = supabaseAdmin;
      const query = schema ? client.schema(schema as any).from('n8n_functions') : client.from('n8n_functions');
      return await query
        .select('id, name, kind, active')
        .eq('active', true)
        .order('name');
    };

    let res = await fetchFromSchema('app');
    if (res.error) {
      console.warn('⚠️ app.n8n_functions query failed, falling back to public:', res.error.message);
      res = await fetchFromSchema();
    }

    data = res.data ?? [];
    error = res.error;

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
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