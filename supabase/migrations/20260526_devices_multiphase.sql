-- ==========================================================
-- MIGRATION: Adaptação de Dispositivos Multi-fase e Geração vs. Consumo
-- ==========================================================

-- 1. Adicionar colunas de telemetria estendida às tabelas de leitura instantânea e histórico
ALTER TABLE devices ADD COLUMN IF NOT EXISTS telemetry_data JSONB DEFAULT NULL;
ALTER TABLE device_logs ADD COLUMN IF NOT EXISTS telemetry_data JSONB DEFAULT NULL;

-- 2. Adicionar colunas de telemetria e totais de geração/consumo na tabela de resumo diário
ALTER TABLE device_daily_summary ADD COLUMN IF NOT EXISTS telemetry_data JSONB DEFAULT NULL;
ALTER TABLE device_daily_summary ADD COLUMN IF NOT EXISTS generation NUMERIC DEFAULT 0;
ALTER TABLE device_daily_summary ADD COLUMN IF NOT EXISTS consumption NUMERIC DEFAULT 0;

-- 3. Adicionar colunas de totais de geração/consumo na tabela de resumo mensal
ALTER TABLE device_monthly_summary ADD COLUMN IF NOT EXISTS generation NUMERIC DEFAULT 0;
ALTER TABLE device_monthly_summary ADD COLUMN IF NOT EXISTS consumption NUMERIC DEFAULT 0;

-- ==========================================================
-- REAGENDAMENTO DOS JOBS CRON
-- ==========================================================

-- Remover jobs antigos para evitar duplicações/conflitos
SELECT cron.unschedule('aggregate-daily-summary');
SELECT cron.unschedule('aggregate-monthly-summary');

-- Reagendar JOB 2: Agregar resumo diário com geração e consumo (todo dia às 00:05 UTC)
SELECT cron.schedule(
    'aggregate-daily-summary',
    '5 0 * * *',
    $$
    INSERT INTO device_daily_summary (
        device_id, 
        date, 
        avg_voltage, 
        avg_current, 
        avg_power, 
        max_power, 
        min_power, 
        total_readings,
        generation,
        consumption,
        telemetry_data
    )
    SELECT
        device_id,
        (NOW() - INTERVAL '1 day')::DATE,
        ROUND(AVG(voltage)::NUMERIC, 2),
        ROUND(AVG(current)::NUMERIC, 3),
        ROUND(AVG(power)::NUMERIC, 2),
        MAX(power),
        MIN(power),
        COUNT(*),
        -- Geração diária: delta do forward_energy_total (acumulado)
        ROUND(COALESCE(
            MAX((telemetry_data->>'forward_energy_total')::numeric) - 
            MIN((telemetry_data->>'forward_energy_total')::numeric), 
            0
        )::numeric, 2) as generation,
        -- Consumo diário: delta do reverse_energy_total (acumulado)
        ROUND(COALESCE(
            MAX((telemetry_data->>'reverse_energy_total')::numeric) - 
            MIN((telemetry_data->>'reverse_energy_total')::numeric), 
            0
        )::numeric, 2) as consumption,
        -- Snapshot de agregação em JSONB
        jsonb_build_object(
            'avg_power_factor', ROUND(AVG(COALESCE((telemetry_data->>'power_factor')::numeric, 0))::numeric, 2)
        ) as telemetry_data
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
        total_readings = EXCLUDED.total_readings,
        generation = EXCLUDED.generation,
        consumption = EXCLUDED.consumption,
        telemetry_data = EXCLUDED.telemetry_data;
    $$
);

-- Reagendar JOB 3: Agregar resumo mensal com soma das colunas diárias (dia 1 de cada mês às 01:00 UTC)
SELECT cron.schedule(
    'aggregate-monthly-summary',
    '0 1 1 * *',
    $$
    INSERT INTO device_monthly_summary (
        device_id, 
        year_month, 
        avg_voltage, 
        avg_current, 
        avg_power, 
        max_power, 
        min_power, 
        total_readings,
        generation,
        consumption
    )
    SELECT
        device_id,
        TO_CHAR(date, 'YYYY-MM'),
        ROUND(AVG(avg_voltage)::NUMERIC, 2),
        ROUND(AVG(avg_current)::NUMERIC, 3),
        ROUND(AVG(avg_power)::NUMERIC, 2),
        MAX(max_power),
        MIN(min_power),
        SUM(total_readings),
        ROUND(SUM(generation)::numeric, 2) as generation,
        ROUND(SUM(consumption)::numeric, 2) as consumption
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
        total_readings = EXCLUDED.total_readings,
        generation = EXCLUDED.generation,
        consumption = EXCLUDED.consumption;
    $$
);
