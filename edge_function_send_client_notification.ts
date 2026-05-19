// =====================================================
// Edge Function: send-client-notification
// =====================================================
// COMO CRIAR/ATUALIZAR:
// 1. Vá em Supabase Dashboard > Edge Functions
// 2. Clique em "Create a new function" (ou edite a existente)
// 3. Nome: send-client-notification
// 4. Cole este código e clique Deploy
//
// ⚠️  IMPORTANTE: Desabilitar "Enforce JWT Verification"
//     (Mesma razão das outras edge functions: tokens ES256)
//
// ⚠️  SECRETS NECESSÁRIOS (adicionar em Supabase > Edge Functions > Secrets):
//     - ONESIGNAL_CLIENT_APP_ID    = ffc5524d-7a5c-4cb4-9edb-7ddef6b1a382
//     - ONESIGNAL_CLIENT_REST_API_KEY = (sua REST API Key do projeto OneSignal do CLIENTE)
//
// ⚠️  ATENÇÃO: Esta função usa o projeto OneSignal do CLIENTE (Gridon+).
//     NÃO confundir com o projeto OneSignal do app interno da empresa.
// =====================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
        const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_CLIENT_APP_ID')!
        const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_CLIENT_REST_API_KEY')!

        // Verificar autenticação
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return jsonResponse({ error: 'Token de autenticação ausente' }, 401)
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // Decodificar JWT para obter user_id
        const token = authHeader.replace('Bearer ', '')
        let callerId: string
        try {
            const payloadBase64 = token.split('.')[1]
            const payload = JSON.parse(atob(payloadBase64))
            callerId = payload.sub
            if (!callerId) throw new Error('sub ausente no token')
        } catch (e) {
            return jsonResponse({ error: 'Token inválido', details: String(e) }, 401)
        }

        // Validar que o usuário existe via admin API
        const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.admin.getUserById(callerId)
        if (callerError || !caller) {
            return jsonResponse({ error: 'Usuário não encontrado' }, 401)
        }

        // Ler o body da requisição
        const body = await req.json()
        const { title, body: messageBody, type, target_user_id, route } = body

        if (!title || !messageBody) {
            return jsonResponse({ error: 'Campos obrigatórios: title, body' }, 400)
        }

        // ── Montar payload do OneSignal ──────────────────
        const onesignalPayload: any = {
            app_id: ONESIGNAL_APP_ID,
            headings: { en: title },
            contents: { en: messageBody },
            data: {
                route: route || '/home',
                type: type || 'general',
                ...(body.data || {}),
            },
        }

        if (target_user_id) {
            // Enviar para cliente específico via External ID (= user_id do Supabase)
            onesignalPayload.include_aliases = { external_id: [target_user_id] }
            onesignalPayload.target_channel = 'push'
        } else {
            // Broadcast para todos os clientes inscritos
            onesignalPayload.included_segments = ['Subscribed Users']
        }

        // ── Enviar via OneSignal REST API ────────────────
        let onesignalResponse: any = null
        try {
            const osRes = await fetch('https://api.onesignal.com/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
                },
                body: JSON.stringify(onesignalPayload),
            })

            onesignalResponse = await osRes.json()

            if (!osRes.ok) {
                console.error('OneSignal error:', onesignalResponse)
                return jsonResponse({
                    error: 'Erro ao enviar notificação via OneSignal',
                    details: onesignalResponse,
                }, 502)
            }
        } catch (e) {
            console.error('Fetch OneSignal error:', e)
            return jsonResponse({
                error: 'Falha ao conectar com OneSignal',
                details: String(e),
            }, 502)
        }

        // ── Salvar na tabela client_notifications ────────
        const callerName = caller.user_metadata?.full_name || caller.email || 'Admin'

        const { error: insertError } = await supabaseAdmin
            .from('client_notifications')
            .insert({
                target_user_id: target_user_id || null,
                title,
                body: messageBody,
                type: type || 'general',
                route: route || '/home',
                data: body.data || {},
                sent_by: callerId,
                sent_by_name: callerName,
                onesignal_response: onesignalResponse,
            })

        if (insertError) {
            console.error('Insert error:', insertError)
            // Notificação já foi enviada via OneSignal, apenas log do erro de persistência
        }

        return jsonResponse({
            message: 'Notificação enviada com sucesso',
            recipients: onesignalResponse?.recipients || 0,
        })

    } catch (e) {
        console.error('Erro geral:', e)
        return jsonResponse({ error: String(e) }, 500)
    }
})

function jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}
