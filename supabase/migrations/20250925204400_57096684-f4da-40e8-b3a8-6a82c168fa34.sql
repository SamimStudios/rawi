-- Database Reset: Clear tables to start fresh with SSOT implementation
DELETE FROM app.nodes;
DELETE FROM app.node_library; 
DELETE FROM app.templates;

-- Reset sequences if needed
SELECT setval(pg_get_serial_sequence('app.nodes', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('app.node_library', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('app.templates', 'id'), 1, false);