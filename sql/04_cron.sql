-- pg_cron setup for Sync Worker invocation

-- Enable pg_cron extension if not present (available in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job to hit the Edge Function every minute (standard pg_cron resolution)
-- To execute more frequently (e.g. every 30 seconds), the Edge Function itself
-- or a pg_net trigger on pending rows can be set up.
SELECT cron.schedule(
  'github-sync-worker-job',
  '* * * * *', -- runs every minute
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/github-sync-worker',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer your-service-role-key"}'::jsonb
  );
  $$
);
