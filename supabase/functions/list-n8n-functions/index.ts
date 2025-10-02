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
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    console.log('🔄 Fetching N8N functions from database...');

    const selectAndNormalize = async (schema?: string) => {
      const client = schema ? supabaseAdmin.schema(schema as any) : supabaseAdmin;
      const { data, error } = await client
        .from('n8n_functions')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) return { data: [], error };

      const getPrice = (row: any) => {
        const candidates = ['price_in_credits', 'credit_price', 'credits_cost', 'cost', 'creditCost'];
        for (const k of candidates) {
          const v = row?.[k];
          const num = typeof v === 'string' ? parseFloat(v) : v;
          if (typeof num === 'number' && !Number.isNaN(num)) return num;
        }
        return 0;
      };

      const mapped = (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        kind: r.kind,
        active: r.active,
        price: getPrice(r)
      }));
      return { data: mapped, error: null };
    };

    // Try app schema first, then public
    let res = await selectAndNormalize('app');
    if (res.error) {
      console.warn('⚠️ app.n8n_functions query failed, falling back to public:', res.error.message);
      res = await selectAndNormalize();
    }

    if (res.error) throw res.error;

    console.log('✅ Found N8N functions:', res.data.length);

    return new Response(
      JSON.stringify({ data: res.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in list-n8n-functions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, data: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});