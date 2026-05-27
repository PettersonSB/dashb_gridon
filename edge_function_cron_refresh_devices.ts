// =====================================================
// Edge Function: cron-refresh-devices
// =====================================================
// COMO CRIAR:
// 1. Vá em Supabase Dashboard > Edge Functions
// 2. Clique em "Create a new function"
// 3. Nome: cron-refresh-devices
// 4. Cole este código e clique Deploy
// =====================================================
// Esta função é chamada pelo pg_cron a cada X minutos
// Ela busca dados elétricos de TODOS os dispositivos na Tuya
// e grava em devices (atual) + device_logs (histórico)
// =====================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  try {
    // 1. Buscar todos os dispositivos
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('device_id, user_id, phase_config')

    if (devicesError) {
      console.error('Erro ao buscar devices:', devicesError)
      return new Response(JSON.stringify({ error: devicesError.message }), { status: 500 })
    }

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum dispositivo encontrado', total: 0 }))
    }

    const results: any[] = []
    const errors: any[] = []

    // 2. Para cada dispositivo, chamar tuya-token para pegar dados elétricos
    for (const device of devices) {
      try {
        const tuyaResponse = await fetch(`${SUPABASE_URL}/functions/v1/tuya-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ 
            device_id: device.device_id,
            phase_config: (device as any).phase_config
          }),
        })

        if (!tuyaResponse.ok) {
          const errText = await tuyaResponse.text()
          console.error(`tuya-token falhou para ${device.device_id}:`, errText)
          errors.push({ device_id: device.device_id, error: errText })
          continue
        }

        const realtime = await tuyaResponse.json()

        const saoPauloTimestamp = new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(new Date()).replace(' ', 'T')

        // 3. Atualizar tabela devices (valores atuais)
        const { error: updateError } = await supabase
          .from('devices')
          .update({
            voltage: realtime.voltage,
            current: realtime.current,
            power: realtime.power,
            is_on: realtime.isOn,
            online: realtime.online === 'online' ? 'true' : 'false',
            telemetry_data: realtime.telemetry_data,
            updated_at: saoPauloTimestamp,
          })
          .eq('device_id', device.device_id)

        if (updateError) {
          console.error(`Erro ao atualizar device ${device.device_id}:`, updateError)
        }

        // 4. Gravar snapshot no histórico (device_logs)
        if (realtime.voltage != null || realtime.current != null || realtime.power != null || realtime.telemetry_data != null) {
          const { error: logError } = await supabase
            .from('device_logs')
            .insert({
              device_id: device.device_id,
              user_id: device.user_id,
              voltage: realtime.voltage,
              current: realtime.current,
              power: realtime.power,
              telemetry_data: realtime.telemetry_data,
              created_at: saoPauloTimestamp,
            })

          if (logError) {
            console.error(`Erro ao gravar log de ${device.device_id}:`, logError)
          }
        }

        results.push({
          device_id: device.device_id,
          voltage: realtime.voltage,
          current: realtime.current,
          power: realtime.power,
          online: realtime.online,
          telemetry_data: realtime.telemetry_data,
        })
      } catch (e) {
        console.error(`Exceção para ${device.device_id}:`, e)
        errors.push({ device_id: device.device_id, error: String(e) })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Coleta concluída',
        timestamp: new Date().toISOString(),
        total: devices.length,
        success: results.length,
        failures: errors.length,
        results,
        errors,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('Erro geral:', e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
