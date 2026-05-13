// =====================================================
// Edge Function: create-client-account
// =====================================================
// COMO CRIAR/ATUALIZAR:
// 1. Vá em Supabase Dashboard > Edge Functions
// 2. Clique em "Create a new function" (ou edite a existente)
// 3. Nome: create-client-account
// 4. Cole este código e clique Deploy
//
// ⚠️  IMPORTANTE: Desabilitar "Enforce JWT Verification"
//     No Supabase Dashboard > Edge Functions > create-client-account
//     Clique nos 3 pontinhos (...) > "Edit function"
//     Desmarque "Enforce JWT Verification" e salve
//     (Necessário porque o projeto usa tokens ES256,
//      mas o gateway só suporta HS256 na verificação automática.
//      A autenticação é feita manualmente dentro da função via getUser)
// =====================================================
// Esta função cria um novo usuário no Supabase Auth,
// insere na tabela client_accounts e client_installations,
// e opcionalmente vincula dispositivos ao cliente.
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

    // Verificar autenticação do admin que está chamando
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase com service_role para operações admin
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verificar se o usuário chamador é autenticado
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: callerError } = await supabaseAdmin.auth.getUser(token)
    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parsear o body
    const {
      email,
      password,
      full_name,
      phone,
      energy_tariff = 0.85,
      installation,
      device_ids,
    } = await req.json()

    // Validar campos obrigatórios
    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: email, password, full_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        full_name,
        role: 'client',
      },
    })

    if (authError) {
      console.error('Erro ao criar usuário auth:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = authData.user.id

    // 2. Inserir na tabela client_accounts
    const { error: accountError } = await supabaseAdmin
      .from('client_accounts')
      .insert({
        user_id: newUserId,
        full_name,
        email,
        phone: phone || null,
        energy_tariff: energy_tariff,
        status: 'ativo',
        must_change_password: true,
        created_by: callerUser.id,
      })

    if (accountError) {
      console.error('Erro ao inserir client_accounts:', accountError)
      // Tentar remover o usuário auth criado para não ficar órfão
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar conta do cliente: ' + accountError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Inserir instalação (se dados foram enviados)
    if (installation) {
      const installData: any = {
        client_user_id: newUserId,
      }

      if (installation.address) installData.address = installation.address
      if (installation.city) installData.city = installation.city
      if (installation.state) installData.state = installation.state
      if (installation.cep) installData.cep = installation.cep
      if (installation.neighborhood) installData.neighborhood = installation.neighborhood
      if (installation.latitude !== undefined) installData.latitude = installation.latitude
      if (installation.longitude !== undefined) installData.longitude = installation.longitude
      if (installation.system_power_kwp) installData.system_power_kwp = installation.system_power_kwp
      if (installation.module_count) installData.module_count = installation.module_count
      if (installation.module_power_w) installData.module_power_w = installation.module_power_w
      if (installation.module_model) installData.module_model = installation.module_model
      if (installation.inverter_model) installData.inverter_model = installation.inverter_model
      if (installation.inverter_type) installData.inverter_type = installation.inverter_type
      if (installation.installation_date) installData.installation_date = installation.installation_date
      if (installation.installation_photo_url) installData.installation_photo_url = installation.installation_photo_url
      if (installation.notes) installData.notes = installation.notes

      const { error: installError } = await supabaseAdmin
        .from('client_installations')
        .insert(installData)

      if (installError) {
        console.error('Erro ao inserir instalação:', installError)
        // Não faz rollback, instalação pode ser adicionada depois
      }
    }

    // 4. Vincular dispositivos (se IDs foram enviados)
    if (device_ids && device_ids.length > 0) {
      for (const deviceId of device_ids) {
        const { error: linkError } = await supabaseAdmin
          .from('devices')
          .update({ client_user_id: newUserId })
          .eq('device_id', deviceId)

        if (linkError) {
          console.error(`Erro ao vincular dispositivo ${deviceId}:`, linkError)
        }
      }
    }

    // 5. Sucesso
    return new Response(
      JSON.stringify({
        user_id: newUserId,
        email,
        message: 'Cliente criado com sucesso',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (e) {
    console.error('Erro geral:', e)
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
