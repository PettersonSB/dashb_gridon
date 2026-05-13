// =====================================================
// Edge Function: manage-team
// =====================================================
// COMO CRIAR/ATUALIZAR:
// 1. Vá em Supabase Dashboard > Edge Functions
// 2. Clique em "Create a new function" (ou edite a existente)
// 3. Nome: manage-team
// 4. Cole este código e clique Deploy
//
// ⚠️  IMPORTANTE: Desabilitar "Enforce JWT Verification"
//     (Mesma razão do create-client-account: tokens ES256)
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
            return jsonResponse({
                error: 'Usuário não encontrado',
                details: callerError?.message || 'getUserById retornou null'
            }, 401)
        }

        // Buscar role do caller
        const { data: callerMember } = await supabaseAdmin
            .from('team_members')
            .select('role')
            .eq('user_id', caller.id)
            .single()

        const callerRole = callerMember?.role || null

        // Se o caller não está na tabela team_members, não pode gerenciar
        if (!callerRole || (callerRole !== 'owner' && callerRole !== 'admin')) {
            return jsonResponse({ error: 'Sem permissão para gerenciar equipe' }, 403)
        }

        const body = await req.json()
        const { action } = body

        switch (action) {
            case 'create':
                return await handleCreate(supabaseAdmin, body, caller.id, callerRole)
            case 'update':
                return await handleUpdate(supabaseAdmin, body, callerRole)
            case 'suspend':
                return await handleStatusChange(supabaseAdmin, body, callerRole, 'suspenso')
            case 'reactivate':
                return await handleStatusChange(supabaseAdmin, body, callerRole, 'ativo')
            case 'delete':
                return await handleDelete(supabaseAdmin, body, callerRole)
            case 'reset_password':
                return await handleResetPassword(supabaseAdmin, body, callerRole)
            default:
                return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400)
        }

    } catch (e) {
        console.error('Erro geral:', e)
        return jsonResponse({ error: String(e) }, 500)
    }
})

// ── Handlers ──────────────────────────────────────────

async function handleCreate(supabase: any, body: any, callerId: string, callerRole: string) {
    const { email, password, full_name, role, permissions } = body

    // Validar campos obrigatórios
    if (!email || !password || !full_name || !role) {
        return jsonResponse({ error: 'Campos obrigatórios: email, password, full_name, role' }, 400)
    }

    // Validar hierarquia de roles
    if (role === 'owner') {
        return jsonResponse({ error: 'Não é possível criar outro owner' }, 403)
    }
    if (callerRole === 'admin' && role !== 'vendedor') {
        return jsonResponse({ error: 'Administradores só podem criar vendedores' }, 403)
    }

    // Verificar limite de membros
    const limitCheck = await checkMemberLimit(supabase)
    if (limitCheck.error) {
        return jsonResponse({ error: limitCheck.error }, 400)
    }

    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name,
            role: role, // 'admin' ou 'vendedor'
        },
    })

    if (authError) {
        console.error('Erro ao criar usuário auth:', authError)
        return jsonResponse({ error: authError.message }, 400)
    }

    const newUserId = authData.user.id

    // Inserir em team_members
    const { error: insertError } = await supabase
        .from('team_members')
        .insert({
            user_id: newUserId,
            email,
            full_name,
            role,
            permissions: permissions || {},
            status: 'ativo',
            created_by: callerId,
        })

    if (insertError) {
        console.error('Erro ao inserir team_members:', insertError)
        // Rollback: remover user do auth
        await supabase.auth.admin.deleteUser(newUserId)
        return jsonResponse({ error: 'Erro ao registrar membro: ' + insertError.message }, 500)
    }

    return jsonResponse({
        user_id: newUserId,
        email,
        message: 'Membro criado com sucesso',
    })
}

async function handleUpdate(supabase: any, body: any, callerRole: string) {
    const { target_user_id, role, permissions } = body

    if (!target_user_id) {
        return jsonResponse({ error: 'target_user_id é obrigatório' }, 400)
    }

    // Buscar membro alvo
    const { data: target } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', target_user_id)
        .single()

    if (!target) {
        return jsonResponse({ error: 'Membro não encontrado' }, 404)
    }

    // Proteções de hierarquia
    if (target.role === 'owner') {
        return jsonResponse({ error: 'O owner não pode ser editado' }, 403)
    }
    if (callerRole === 'admin' && target.role !== 'vendedor') {
        return jsonResponse({ error: 'Admins só podem editar vendedores' }, 403)
    }
    if (callerRole === 'admin' && role && role !== 'vendedor') {
        return jsonResponse({ error: 'Admins só podem definir role como vendedor' }, 403)
    }

    const updates: any = { updated_at: new Date().toISOString() }
    if (role) updates.role = role
    if (permissions !== undefined) updates.permissions = permissions

    const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('user_id', target_user_id)

    if (error) {
        return jsonResponse({ error: 'Erro ao atualizar: ' + error.message }, 500)
    }

    // Atualizar metadata do Auth também
    if (role) {
        await supabase.auth.admin.updateUserById(target_user_id, {
            user_metadata: { role }
        })
    }

    return jsonResponse({ message: 'Membro atualizado com sucesso' })
}

async function handleStatusChange(supabase: any, body: any, callerRole: string, newStatus: string) {
    const { target_user_id } = body

    if (!target_user_id) {
        return jsonResponse({ error: 'target_user_id é obrigatório' }, 400)
    }

    const { data: target } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', target_user_id)
        .single()

    if (!target) {
        return jsonResponse({ error: 'Membro não encontrado' }, 404)
    }

    if (target.role === 'owner') {
        return jsonResponse({ error: 'O owner não pode ser suspenso' }, 403)
    }
    if (callerRole === 'admin' && target.role !== 'vendedor') {
        return jsonResponse({ error: 'Admins só podem alterar status de vendedores' }, 403)
    }

    const { error } = await supabase
        .from('team_members')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('user_id', target_user_id)

    if (error) {
        return jsonResponse({ error: 'Erro ao alterar status: ' + error.message }, 500)
    }

    // Desabilitar/habilitar login no Auth
    if (newStatus === 'suspenso') {
        await supabase.auth.admin.updateUserById(target_user_id, { ban_duration: '876000h' }) // ~100 anos
    } else {
        await supabase.auth.admin.updateUserById(target_user_id, { ban_duration: 'none' })
    }

    return jsonResponse({ message: `Membro ${newStatus === 'suspenso' ? 'suspenso' : 'reativado'} com sucesso` })
}

async function handleDelete(supabase: any, body: any, callerRole: string) {
    const { target_user_id } = body

    if (!target_user_id) {
        return jsonResponse({ error: 'target_user_id é obrigatório' }, 400)
    }

    const { data: target } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', target_user_id)
        .single()

    if (!target) {
        return jsonResponse({ error: 'Membro não encontrado' }, 404)
    }

    if (target.role === 'owner') {
        return jsonResponse({ error: 'O owner não pode ser removido' }, 403)
    }
    if (callerRole === 'admin' && target.role !== 'vendedor') {
        return jsonResponse({ error: 'Admins só podem remover vendedores' }, 403)
    }

    // Remover da tabela
    await supabase.from('team_members').delete().eq('user_id', target_user_id)

    // Remover do Auth
    await supabase.auth.admin.deleteUser(target_user_id)

    return jsonResponse({ message: 'Membro removido com sucesso' })
}

async function handleResetPassword(supabase: any, body: any, callerRole: string) {
    const { target_user_id, new_password } = body

    if (!target_user_id || !new_password) {
        return jsonResponse({ error: 'target_user_id e new_password são obrigatórios' }, 400)
    }

    const { data: target } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', target_user_id)
        .single()

    if (!target) {
        return jsonResponse({ error: 'Membro não encontrado' }, 404)
    }

    if (target.role === 'owner') {
        return jsonResponse({ error: 'A senha do owner só pode ser alterada por ele mesmo' }, 403)
    }
    if (callerRole === 'admin' && target.role !== 'vendedor') {
        return jsonResponse({ error: 'Admins só podem resetar senha de vendedores' }, 403)
    }

    const { error } = await supabase.auth.admin.updateUserById(target_user_id, {
        password: new_password
    })

    if (error) {
        return jsonResponse({ error: 'Erro ao resetar senha: ' + error.message }, 500)
    }

    return jsonResponse({ message: 'Senha resetada com sucesso' })
}

// ── Helpers ──────────────────────────────────────────

async function checkMemberLimit(supabase: any) {
    // Ler limite de global_settings
    const { data: setting } = await supabase
        .from('global_settings')
        .select('value')
        .eq('key', 'team_max_members')
        .single()

    const maxMembers = setting?.value ? parseInt(setting.value) : 6

    // Contar membros atuais
    const { count, error } = await supabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })

    if (error) {
        return { error: 'Erro ao verificar limite: ' + error.message }
    }

    if ((count || 0) >= maxMembers) {
        return { error: `Limite de ${maxMembers} membros atingido. O owner pode alterar o limite nas configurações.` }
    }

    return { error: null }
}

function jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
}
