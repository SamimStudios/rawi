import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FieldRegistry {
  id: string;
  field_id: string;
  datatype: string;
  widget: string;
  options: any;
  rules: any;
  ui: any;
  default_value: any;
  version: number;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all fields from registry
    const { data: fields, error: fieldsError } = await supabase
      .from('field_registry')
      .select('*')
      .order('field_id');

    if (fieldsError) {
      throw new Error(`Failed to fetch fields: ${fieldsError.message}`);
    }

    // Resolve options for each field
    const fieldsWithResolvedOptions = await Promise.all(
      (fields as FieldRegistry[]).map(async (field) => {
        const resolvedOptions = await resolveFieldOptions(field, supabase);
        return {
          ...field,
          resolvedOptions
        };
      })
    );

    return new Response(
      JSON.stringify({ fields: fieldsWithResolvedOptions }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Field registry API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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

async function resolveFieldOptions(field: FieldRegistry, supabase: any) {
  if (!field.options?.source) {
    return null;
  }

  try {
    switch (field.options.source) {
      case 'static':
        return field.options.values || [];

      case 'table':
        return await resolveTableOptions(field.options, supabase);

      case 'endpoint':
        return await resolveEndpointOptions(field.options);

      default:
        console.warn(`Unknown options source: ${field.options.source}`);
        return null;
    }
  } catch (error) {
    console.error(`Error resolving options for field ${field.field_id}:`, error);
    return null;
  }
}

async function resolveTableOptions(options: any, supabase: any) {
  const { table, valueColumn, labelColumn, extraColumns = [], where = [], orderBy = [], limit } = options;

  // Remove any schema prefix if present, as supabase.from() expects just table name
  const tableName = table.replace(/^public\./, '');
  
  let query = supabase.from(tableName).select(`${valueColumn}, ${labelColumn}${extraColumns.length ? `, ${extraColumns.join(', ')}` : ''}`);

  // Apply where conditions
  where.forEach((condition: any) => {
    const { column, op, value } = condition;
    switch (op) {
      case '=':
      case 'eq':
        query = query.eq(column, value);
        break;
      case '!=':
      case 'neq':
        query = query.neq(column, value);
        break;
      case '>':
      case 'gt':
        query = query.gt(column, value);
        break;
      case '>=':
      case 'gte':
        query = query.gte(column, value);
        break;
      case '<':
      case 'lt':
        query = query.lt(column, value);
        break;
      case '<=':
      case 'lte':
        query = query.lte(column, value);
        break;
      case 'like':
        query = query.like(column, value);
        break;
      case 'ilike':
        query = query.ilike(column, value);
        break;
      case 'in':
        query = query.in(column, Array.isArray(value) ? value : [value]);
        break;
      default:
        console.warn(`Unsupported operator: ${op}`);
    }
  });

  // Apply ordering
  orderBy.forEach((order: any) => {
    query = query.order(order.column, { ascending: order.dir === 'asc' });
  });

  // Apply limit
  if (limit) {
    query = query.limit(limit);
  }

  console.log(`Querying table: ${tableName}`);
  const { data, error } = await query;

  if (error) {
    console.error(`Table query error:`, error);
    throw new Error(`Table query failed: ${error.message}`);
  }

  console.log(`Table query successful, got ${data?.length || 0} rows`);

  // Transform to standard format
  return data?.map((row: any) => ({
    value: row[valueColumn],
    label: {
      fallback: row[labelColumn],
      key: null
    },
    extras: extraColumns.reduce((acc: any, col: string) => {
      acc[col] = row[col];
      return acc;
    }, {})
  })) || [];
}

async function resolveEndpointOptions(options: any) {
  const { url, method = 'GET', query = {}, valueKey = 'value', labelKey = 'label', extraKeys = [] } = options;

  let fetchUrl = url;
  let fetchOptions: any = { method };

  if (method === 'GET' && Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams(query);
    fetchUrl += `?${searchParams.toString()}`;
  } else if (method !== 'GET') {
    fetchOptions.body = JSON.stringify(query);
    fetchOptions.headers = { 'Content-Type': 'application/json' };
  }

  const response = await fetch(fetchUrl, fetchOptions);
  if (!response.ok) {
    throw new Error(`Endpoint request failed: ${response.statusText}`);
  }

  const data = await response.json();
  const items = Array.isArray(data) ? data : data.items || data.data || [];

  // Transform to standard format
  return items.map((item: any) => ({
    value: item[valueKey],
    label: {
      fallback: item[labelKey],
      key: null
    },
    extras: extraKeys.reduce((acc: any, key: string) => {
      acc[key] = item[key];
      return acc;
    }, {})
  }));
}