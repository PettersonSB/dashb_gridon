-- ============================================
-- Analytics Helper RPCs
-- Execute no SQL Editor do Supabase após a migration principal
-- ============================================

-- Função para incrementar page_views de forma atômica
CREATE OR REPLACE FUNCTION increment_page_view(p_session_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE budget_sessions
  SET page_views = page_views + 1,
      last_seen_at = now()
  WHERE id = p_session_id;
END;
$$;

-- Função para incrementar cliques em CTAs no JSONB de forma atômica
CREATE OR REPLACE FUNCTION increment_cta_click(p_session_id UUID, p_cta_name TEXT)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  current_count INT;
BEGIN
  SELECT COALESCE((cta_clicks ->> p_cta_name)::INT, 0)
  INTO current_count
  FROM budget_sessions
  WHERE id = p_session_id;

  UPDATE budget_sessions
  SET cta_clicks = jsonb_set(
    COALESCE(cta_clicks, '{}'::jsonb),
    ARRAY[p_cta_name],
    to_jsonb(current_count + 1)
  )
  WHERE id = p_session_id;
END;
$$;

-- Função para incrementar external_link_clicks de forma atômica
CREATE OR REPLACE FUNCTION increment_external_click(p_session_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE budget_sessions
  SET external_link_clicks = external_link_clicks + 1
  WHERE id = p_session_id;
END;
$$;

-- Grant para funções anônimas (anon role)
GRANT EXECUTE ON FUNCTION increment_page_view TO anon;
GRANT EXECUTE ON FUNCTION increment_cta_click TO anon;
GRANT EXECUTE ON FUNCTION increment_external_click TO anon;
