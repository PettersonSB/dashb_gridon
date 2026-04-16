-- ==========================================================
-- UPGRADE: Sistema de Monitoramento Contínuo de Dispositivos
-- ==========================================================
-- Execute CADA BLOCO separadamente no Supabase SQL Editor
-- ==========================================================

-- ==================
-- BLOCO 1: TABELAS DE RESUMO
-- ==================

-- Tabela de resumo diário (mantida PARA SEMPRE)
CREATE TABLE IF NOT EXISTS device_daily_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id TEXT NOT NULL,
    date DATE NOT NULL,
    avg_voltage NUMERIC,
    avg_current NUMERIC,
    avg_power NUMERIC,
    max_power NUMERIC,
    min_power NUMERIC,
    total_readings INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(device_id, date)
);

-- Tabela de resumo mensal (mantida PARA SEMPRE)
CREATE TABLE IF NOT EXISTS device_monthly_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id TEXT NOT NULL,
    year_month TEXT NOT NULL, -- formato: '2026-04'
    avg_voltage NUMERIC,
    avg_current NUMERIC,
    avg_power NUMERIC,
    max_power NUMERIC,
    min_power NUMERIC,
    total_readings INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(device_id, year_month)
);

-- Campo para vincular dispositivo a cliente (futuro app nativo)
ALTER TABLE devices ADD COLUMN IF NOT EXISTS client_user_id UUID DEFAULT NULL;

-- RLS policies
ALTER TABLE device_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_monthly_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON device_daily_summary
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON device_monthly_summary
    FOR ALL USING (auth.role() = 'authenticated');

-- ==================
-- BLOCO 2: EXTENSÕES (pg_cron e pg_net)
-- ==================
-- IMPORTANTE: pg_cron deve ser habilitado em Database > Extensions no Dashboard do Supabase
-- pg_net normalmente já vem habilitado. Verifique em Database > Extensions.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ==================
-- BLOCO 3: CRON JOBS
-- ==================
-- ATENÇÃO: Substitua <SEU_SUPABASE_URL> e <SUA_SERVICE_ROLE_KEY> pelos valores reais
-- Encontre a Service Role Key em: Supabase Dashboard > Settings > API > service_role

-- JOB 1: Coleta de dados a cada 5 minutos (chama a Edge Function)
SELECT cron.schedule(
    'refresh-devices-job',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://bfsddnjwjbqlxfxxlorf.supabase.co/functions/v1/cron-refresh-devices',
        headers := jsonb_build_object(
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc2Rkbmp3amJxbHhmeHhsb3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA1MjI0OSwiZXhwIjoyMDg0NjI4MjQ5fQ.Ywn6X_yNATxrM6Ay9KMXddxvGiHSYM50ffVHYPe0zTc',
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );
    $$
);

-- JOB 2: Agregar resumo diário (todo dia às 00:05 UTC)
SELECT cron.schedule(
    'aggregate-daily-summary',
    '5 0 * * *',
    $$
    INSERT INTO device_daily_summary (device_id, date, avg_voltage, avg_current, avg_power, max_power, min_power, total_readings)
    SELECT
        device_id,
        (NOW() - INTERVAL '1 day')::DATE,
        ROUND(AVG(voltage)::NUMERIC, 2),
        ROUND(AVG(current)::NUMERIC, 3),
        ROUND(AVG(power)::NUMERIC, 2),
        MAX(power),
        MIN(power),
        COUNT(*)
    FROM device_logs
    WHERE created_at >= (NOW() - INTERVAL '1 day')::DATE
      AND created_at < NOW()::DATE
    GROUP BY device_id
    ON CONFLICT (device_id, date) DO UPDATE SET
        avg_voltage = EXCLUDED.avg_voltage,
        avg_current = EXCLUDED.avg_current,
        avg_power = EXCLUDED.avg_power,
        max_power = EXCLUDED.max_power,
        min_power = EXCLUDED.min_power,
        total_readings = EXCLUDED.total_readings;
    $$
);

-- JOB 3: Agregar resumo mensal (dia 1 de cada mês às 01:00 UTC)
SELECT cron.schedule(
    'aggregate-monthly-summary',
    '0 1 1 * *',
    $$
    INSERT INTO device_monthly_summary (device_id, year_month, avg_voltage, avg_current, avg_power, max_power, min_power, total_readings)
    SELECT
        device_id,
        TO_CHAR(date, 'YYYY-MM'),
        ROUND(AVG(avg_voltage)::NUMERIC, 2),
        ROUND(AVG(avg_current)::NUMERIC, 3),
        ROUND(AVG(avg_power)::NUMERIC, 2),
        MAX(max_power),
        MIN(min_power),
        SUM(total_readings)
    FROM device_daily_summary
    WHERE date >= (DATE_TRUNC('month', NOW()) - INTERVAL '1 month')::DATE
      AND date < DATE_TRUNC('month', NOW())::DATE
    GROUP BY device_id, TO_CHAR(date, 'YYYY-MM')
    ON CONFLICT (device_id, year_month) DO UPDATE SET
        avg_voltage = EXCLUDED.avg_voltage,
        avg_current = EXCLUDED.avg_current,
        avg_power = EXCLUDED.avg_power,
        max_power = EXCLUDED.max_power,
        min_power = EXCLUDED.min_power,
        total_readings = EXCLUDED.total_readings;
    $$
);

-- JOB 4: Limpar logs brutos com mais de 60 dias (domingo 3h UTC)
-- Os resumos diários e mensais já existem, então os dados NÃO se perdem!
SELECT cron.schedule(
    'cleanup-old-device-logs',
    '0 3 * * 0',
    $$DELETE FROM device_logs WHERE created_at < NOW() - INTERVAL '60 days'$$
);

-- ==================
-- BLOCO 4: FUNÇÃO RPC para alterar intervalo do cron
-- ==================

CREATE OR REPLACE FUNCTION update_device_refresh_interval(new_cron TEXT)
RETURNS void AS $$
BEGIN
    PERFORM cron.unschedule('refresh-devices-job');
    PERFORM cron.schedule(
        'refresh-devices-job',
        new_cron,
        $job$
        SELECT net.http_post(
            url := 'https://bfsddnjwjbqlxfxxlorf.supabase.co/functions/v1/cron-refresh-devices',
            headers := jsonb_build_object(
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc2Rkbmp3amJxbHhmeHhsb3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA1MjI0OSwiZXhwIjoyMDg0NjI4MjQ5fQ.Ywn6X_yNATxrM6Ay9KMXddxvGiHSYM50ffVHYPe0zTc',
                'Content-Type', 'application/json'
            ),
            body := '{}'::jsonb
        );
        $job$
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
