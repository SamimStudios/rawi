-- Enable real-time updates for field_registry table
ALTER TABLE field_registry REPLICA IDENTITY FULL;

-- Add field_registry to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE field_registry;