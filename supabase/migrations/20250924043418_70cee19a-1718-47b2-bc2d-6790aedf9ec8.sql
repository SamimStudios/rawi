-- Fix remaining critical RLS issues - Corrected Version

-- Enable RLS on all remaining public tables that need it
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
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', tbl.schemaname, tbl.tablename);
            RAISE NOTICE 'Enabled RLS on %.%', tbl.schemaname, tbl.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not enable RLS on %.%: %', tbl.schemaname, tbl.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- Create policies for system tables that may need them
-- Using proper syntax without IF NOT EXISTS
DO $$
BEGIN
    -- Check and create policies for n8n_functions if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'n8n_functions') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'n8n_functions' AND policyname = 'System access only') THEN
            CREATE POLICY "System access only" ON public.n8n_functions FOR ALL USING (false);
        END IF;
    END IF;
    
    -- Check and create policies for video_jobs if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'video_jobs') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_jobs' AND policyname = 'System access only') THEN
            CREATE POLICY "System access only" ON public.video_jobs FOR ALL USING (false);
        END IF;
    END IF;
    
    -- Check and create policies for storyboard_jobs if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'storyboard_jobs') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'storyboard_jobs' AND policyname = 'System access only') THEN
            CREATE POLICY "System access only" ON public.storyboard_jobs FOR ALL USING (false);
        END IF;
    END IF;
    
    -- Check and create policies for storyboard_nodes if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'storyboard_nodes') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'storyboard_nodes' AND policyname = 'System access only') THEN
            CREATE POLICY "System access only" ON public.storyboard_nodes FOR ALL USING (false);
        END IF;
    END IF;
END $$;