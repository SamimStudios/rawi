-- Helper function to split JSON path
CREATE OR REPLACE FUNCTION app._json_path(p text)
RETURNS text[] 
LANGUAGE sql 
IMMUTABLE 
AS $$
  SELECT CASE 
    WHEN p IS NULL OR length(p) = 0 THEN ARRAY[]::text[] 
    ELSE regexp_split_to_array(p, '\.') 
  END
$$;

-- Atomic batch writer for addresses
CREATE OR REPLACE FUNCTION app.addr_write_many(p_job_id uuid, p_writes jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp, app
AS $$
DECLARE
  w jsonb;
  v_addr ltree;
  v_json_path text[];
  v_value jsonb;
  r record;
BEGIN
  IF jsonb_typeof(p_writes) <> 'array' THEN
    RAISE EXCEPTION 'writes must be a JSON array';
  END IF;

  FOR w IN SELECT * FROM jsonb_array_elements(p_writes) LOOP
    IF NOT (w ? 'address') THEN 
      RAISE EXCEPTION 'missing address'; 
    END IF;
    IF NOT (w ? 'value') THEN 
      RAISE EXCEPTION 'missing value'; 
    END IF;

    v_addr := split_part(w->>'address', '#', 1)::ltree;
    v_json_path := app._json_path(split_part(w->>'address', '#', 2));
    v_value := w->'value';

    -- Lock the target node row
    SELECT id, content INTO r
    FROM app.nodes
    WHERE job_id = p_job_id AND addr = v_addr
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'node not found for addr % (job_id %)', v_addr, p_job_id;
    END IF;

    -- Write JSON (create_missing = true)
    UPDATE app.nodes
    SET content = jsonb_set(r.content, v_json_path, COALESCE(v_value, 'null'::jsonb), true),
        updated_at = now()
    WHERE id = r.id;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END
$$;

-- Create app schema credits tables
CREATE TABLE IF NOT EXISTS app.user_credits (
  user_id uuid PRIMARY KEY,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app.user_credits(user_id),
  delta numeric(12,2) NOT NULL,
  reason text,
  job_id uuid,
  function_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Atomic credit consumption function
CREATE OR REPLACE FUNCTION app.consume_credits(p_user uuid, p_amount numeric, p_reason text, p_job uuid, p_function text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE app.user_credits
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user;

  INSERT INTO app.credit_transactions(user_id, delta, reason, job_id, function_id)
  VALUES (p_user, -p_amount, p_reason, p_job, p_function);
END
$$;

-- Grant permissions for the RPC functions
REVOKE ALL ON FUNCTION app.addr_write_many(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.addr_write_many(uuid, jsonb) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION app.consume_credits(uuid, numeric, text, uuid, text) TO authenticated, service_role;