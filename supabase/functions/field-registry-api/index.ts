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

  // Normalize table name (remove schema prefix if present)
  const tableName = String(table || '').replace(/^public\./, '');

  const applyWhere = (q: any) => {
    where.forEach((condition: any) => {
      const { column, op, value } = condition || {};
      switch (op) {
        case '=':
        case 'eq':
          q = q.eq(column, value);
          break;
        case '!=':
        case 'neq':
          q = q.neq(column, value);
          break;
        case '>':
        case 'gt':
          q = q.gt(column, value);
          break;
        case '>=':
        case 'gte':
          q = q.gte(column, value);
          break;
        case '<':
        case 'lt':
          q = q.lt(column, value);
          break;
        case '<=':
        case 'lte':
          q = q.lte(column, value);
          break;
        case 'like':
          q = q.like(column, value);
          break;
        case 'ilike':
          q = q.ilike(column, value);
          break;
        case 'in':
          q = q.in(column, Array.isArray(value) ? value : [value]);
          break;
        default:
          console.warn(`Unsupported operator in where: ${op}`);
      }
    });
    return q;
  };

  const applyOrder = (q: any) => {
    orderBy.forEach((order: any) => {
      if (!order || !order.column) return;
      q = q.order(order.column, { ascending: order.dir === 'asc' });
    });
    return q;
  };

  const run = async (selectCols: string, withWhere: boolean, withOrder: boolean) => {
    let q = supabase.from(tableName).select(selectCols);
    if (withWhere && Array.isArray(where) && where.length) q = applyWhere(q);
    if (withOrder && Array.isArray(orderBy) && orderBy.length) q = applyOrder(q);
    if (limit) q = q.limit(limit);
    return await q;
  };

  const requiredSelect = `${valueColumn}, ${labelColumn}`;
  const extrasSelect = extraColumns.length ? `, ${extraColumns.join(', ')}` : '';

  // Try full query first
  let { data, error } = await run(requiredSelect + extrasSelect, true, true);
  if (error) {
    console.warn(`Full table query failed for ${tableName}: ${error.message}. Retrying without extraColumns...`);
    ({ data, error } = await run(requiredSelect, true, true));
  }
  if (error) {
    console.warn(`Retry without extraColumns failed: ${error.message}. Retrying without where...`);
    ({ data, error } = await run(requiredSelect, false, true));
  }
  if (error) {
    console.warn(`Retry without where failed: ${error.message}. Retrying without orderBy...`);
    ({ data, error } = await run(requiredSelect, false, false));
  }
  if (error) {
    console.error(`Table query failed after fallbacks for ${tableName}:`, error);
    throw new Error(`Table query failed: ${error.message}`);
  }

  // Transform to normalized options format
  return (data || []).map((row: any) => ({
    value: row?.[valueColumn],
    label: {
      fallback: String(row?.[labelColumn] ?? ''),
      key: null
    },
    extras: extraColumns.reduce((acc: any, col: string) => {
      acc[col] = row?.[col];
      return acc;
    }, {})
  }));
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