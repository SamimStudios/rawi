-- Drop and recreate functions with correct type casting
DROP FUNCTION IF EXISTS public.is_valid_form_content(jsonb);
DROP FUNCTION IF EXISTS public.get_form_node(uuid);

-- Recreate is_valid_form_content function 
CREATE OR REPLACE FUNCTION public.is_valid_form_content(content jsonb)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
  with items as (
    select jsonb_array_elements(content->'items') as it
  ),
  field_refs as (
    select distinct it->>'ref' as ref
    from items
    where it->>'kind' = 'field'
  ),
  valid_refs as (
    select count(*) as found_count
    from field_refs fr_outer
    join field_registry fr on fr.id = fr_outer.ref
  ),
  total_refs as (
    select count(*) as total_count
    from field_refs
  )
  select 
    jsonb_typeof(content) = 'object'
    and content ? 'items'
    and jsonb_typeof(content->'items') = 'array'
    and (select found_count from valid_refs) = (select total_count from total_refs);
$function$;

-- Recreate get_form_node function with proper type casting
CREATE OR REPLACE FUNCTION public.get_form_node(p_node_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  with node_data as (
    select nl.content
    from app.node_library nl 
    where nl.id = p_node_id::text and nl.node_type = 'form'
  ),
  item_registry as (
    select jsonb_array_elements(nd.content->'items') as itm
    from node_data nd
  ),
  field_details as (
    select 
      ir.itm,
      case 
        when ir.itm->>'kind' = 'field' then
          jsonb_build_object(
            'kind', 'field',
            'ref', fr.id,
            'datatype', fr.datatype,
            'widget', fr.widget,
            'ui', fr.ui,
            'rules', fr.rules,
            'options', fr.options,
            'default_value', fr.default_value,
            'path', ir.itm->>'path',
            'importance', ir.itm->>'importance',
            'required', coalesce((ir.itm->>'required')::boolean, false),
            'editable', coalesce((ir.itm->>'editable')::boolean, true)
          )
        else ir.itm
      end as resolved_item
    from item_registry ir
    left join field_registry fr on fr.id = (ir.itm->>'ref')
  )
  select jsonb_build_object(
    'items', jsonb_agg(fd.resolved_item order by (fd.itm->>'path'))
  )
  from field_details fd;
$function$;