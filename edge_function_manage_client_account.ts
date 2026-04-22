// =====================================================
// Edge Function: manage-client-account
// =====================================================
// COMO CRIAR/ATUALIZAR:
// 1. Vá em Supabase Dashboard > Edge Functions
// 2. Clique em "Create a new function" (ou edite a existente)
// 3. Nome: manage-client-account
// 4. Cole este código e clique Deploy
//
// ⚠️  IMPORTANTE: Desabilitar "Enforce JWT Verification"
//     No Supabase Dashboard > Edge Functions > manage-client-account
//     Clique nos 3 pontinhos (...) > "Edit function"
//     Desmarque "Enforce JWT Verification" e salve
//     (Necessário porque o projeto usa tokens ES256,
//      mas o gateway só suporta HS256 na verificação automática.
//      A autenticação é feita manualmente dentro da função via getUser)
// =====================================================
// Gerencia ações sobre clientes existentes:
// - suspend: suspender conta
// - activate: reativar conta
// - deactivate: desativar permanentemente
// - reset_password: resetar senha
// - delete: deletar cliente e dados
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

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verificar caller
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: callerError } = await supabaseAdmin.auth.getUser(token)
    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, client_user_id, new_password } = await req.json()

    if (!action || !client_user_id) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: action, client_user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const statusMap: Record<string, string> = {
      suspend: 'suspenso',
      activate: 'ativo',
      deactivate: 'desativado',
    }

    switch (action) {
      case 'suspend':
      case 'activate':
      case 'deactivate': {
        // Atualizar status na tabela client_accounts
        const { error } = await supabaseAdmin
          .from('client_accounts')
          .update({
            status: statusMap[action],
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', client_user_id)

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Erro ao atualizar status: ' + error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Se suspender/desativar, banir o usuário no Auth
        if (action === 'suspend' || action === 'deactivate') {
          await supabaseAdmin.auth.admin.updateUserById(client_user_id, {
            ban_duration: action === 'deactivate' ? 'none' : '876000h', // ~100 anos
          })
        } else if (action === 'activate') {
          // Remover ban
          await supabaseAdmin.auth.admin.updateUserById(client_user_id, {
            ban_duration: 'none',
          })
        }

        return new Response(
          JSON.stringify({ message: `Cliente ${statusMap[action]} com sucesso` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'reset_password': {
        if (!new_password || new_password.length < 6) {
          return new Response(
            JSON.stringify({ error: 'Nova senha deve ter pelo menos 6 caracteres' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(client_user_id, {
          password: new_password,
        })

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Erro ao resetar senha: ' + error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Marcar que precisa trocar senha
        await supabaseAdmin
          .from('client_accounts')
          .update({ must_change_password: true, updated_at: new Date().toISOString() })
          .eq('user_id', client_user_id)

        return new Response(
          JSON.stringify({ message: 'Senha resetada com sucesso' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete': {
        // 1. Desvincular dispositivos
        await supabaseAdmin
          .from('devices')
          .update({ client_user_id: null })
          .eq('client_user_id', client_user_id)

        // 2. Deletar instalação
        await supabaseAdmin
          .from('client_installations')
          .delete()
          .eq('client_user_id', client_user_id)

        // 3. Deletar contas de energia
        await supabaseAdmin
          .from('energy_bills')
          .delete()
          .eq('client_user_id', client_user_id)

        // 4. Deletar chamados
        await supabaseAdmin
          .from('support_tickets')
          .delete()
          .eq('client_user_id', client_user_id)

        // 5. Deletar conta do cliente
        await supabaseAdmin
          .from('client_accounts')
          .delete()
          .eq('user_id', client_user_id)

        // 6. Deletar usuário do Auth
        const { error } = await supabaseAdmin.auth.admin.deleteUser(client_user_id)
        if (error) {
          console.error('Erro ao deletar usuário auth:', error)
        }

        return new Response(
          JSON.stringify({ message: 'Cliente deletado com sucesso' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (e) {
    console.error('Erro geral:', e)
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
