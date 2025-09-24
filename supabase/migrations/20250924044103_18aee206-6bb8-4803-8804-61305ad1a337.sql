-- Critical Security Fixes Migration
-- Address remaining critical database security issues

-- First, let's secure the field_registry table/view
-- Check if field_registry is a table or view and secure it appropriately
DO $$
BEGIN
    -- If field_registry is a table, enable RLS and create policies
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'field_registry'
    ) THEN
        -- Enable RLS on field_registry table
        ALTER TABLE public.field_registry ENABLE ROW LEVEL SECURITY;
        
        -- Create admin-only access policy for field_registry
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'field_registry' 
            AND policyname = 'Admin access only for field registry'
        ) THEN
            CREATE POLICY "Admin access only for field registry" 
            ON public.field_registry 
            FOR ALL 
            USING (false); -- Deny all access by default - configure admin access as needed
        END IF;
    END IF;
    
    -- If field_registry is a view, we need to secure the underlying tables
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'field_registry'
    ) THEN
        RAISE NOTICE 'field_registry is a view - underlying tables need to be secured separately';
    END IF;
END $$;

-- Fix any remaining tables without RLS in public schema
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' 
            AND c.relname = pg_tables.tablename
            AND c.relrowsecurity = true
        )
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
        AND tablename NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', tbl.schemaname, tbl.tablename);
            RAISE NOTICE 'Enabled RLS on %.%', tbl.schemaname, tbl.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not enable RLS on %.%: %', tbl.schemaname, tbl.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- Create default deny policies for any system tables that need them
DO $$
DECLARE
    tbl RECORD;
    policy_count INTEGER;
BEGIN
    -- For tables that have RLS enabled but no policies, create default deny policies
    FOR tbl IN 
        SELECT t.schemaname, t.tablename
        FROM pg_tables t
        WHERE t.schemaname = 'public'
        AND EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = t.schemaname 
            AND c.relname = t.tablename
            AND c.relrowsecurity = true
        )
        AND t.tablename IN ('n8n_functions', 'video_jobs', 'storyboard_jobs', 'storyboard_nodes', 'node_definitions')
    LOOP
        -- Count existing policies
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE schemaname = tbl.schemaname AND tablename = tbl.tablename;
        
        -- If no policies exist, create a default deny policy
        IF policy_count = 0 THEN
            BEGIN
                EXECUTE format(
                    'CREATE POLICY "System access only" ON %I.%I FOR ALL USING (false)',
                    tbl.schemaname, tbl.tablename
                );
                RAISE NOTICE 'Created default deny policy for %.%', tbl.schemaname, tbl.tablename;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not create policy for %.%: %', tbl.schemaname, tbl.tablename, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- Fix functions with mutable search paths (most critical ones first)
-- Update critical security functions to have immutable search paths
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Update some of the most critical functions with proper search_path
    FOR func_record IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname IN ('is_valid_field_default_strict', 'is_valid_field_rules_strict', 'is_valid_field_ui_strict')
        LIMIT 10 -- Start with just a few critical ones
    LOOP
        BEGIN
            EXECUTE format(
                'ALTER FUNCTION %I.%I(%s) SET search_path = public',
                func_record.nspname, func_record.proname, func_record.args
            );
            RAISE NOTICE 'Updated search_path for function %.%', func_record.nspname, func_record.proname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not update function %.%: %', func_record.nspname, func_record.proname, SQLERRM;
        END;
    END LOOP;
END $$;