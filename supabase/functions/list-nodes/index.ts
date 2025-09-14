import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

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
    // Initialize Supabase client and forward auth for RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false },
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || ''
          }
        }
      }
    );

    const url = new URL(req.url);
    
    // Parse query parameters
    const jobId = url.searchParams.get('job_id');
    const nodeType = url.searchParams.get('node_type');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    console.log('List nodes request:', { jobId, nodeType, search, limit, offset });

    // Build query
    let query = supabase
      .from('storyboard_nodes')
      .select('*')
      .order('path', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (nodeType) {
      query = query.eq('node_type', nodeType);
    }

    if (search) {
      query = query.or(`path.ilike.%${search}%, node_type.ilike.%${search}%`);
    }

    const { data: nodes, error, count } = await query;

    if (error) {
      console.error('Query error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('storyboard_nodes')
      .select('*', { count: 'exact', head: true });

    if (jobId) countQuery = countQuery.eq('job_id', jobId);
    if (nodeType) countQuery = countQuery.eq('node_type', nodeType);
    if (search) countQuery = countQuery.or(`path.ilike.%${search}%, node_type.ilike.%${search}%`);

    const { count: totalCount } = await countQuery;

    const response = {
      nodes: nodes || [],
      pagination: {
        offset,
        limit,
        total: totalCount || 0,
        hasMore: (totalCount || 0) > offset + limit
      },
      meta: {
        filters: { jobId, nodeType, search },
        count: nodes?.length || 0
      }
    };

    console.log('Response prepared:', { nodeCount: nodes?.length, totalCount });

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});