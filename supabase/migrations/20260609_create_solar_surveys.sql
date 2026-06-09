-- Criação da Tabela solar_surveys e Bucket de Arquivos para Vistorias
CREATE TABLE IF NOT EXISTS public.solar_surveys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Identificação do Cliente
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    
    -- Configuração Dinâmica das Etapas (Definido pelo Admin)
    -- Tipo SurveyStep[]: [{'id': 'uuid', 'type': 'images|video|audio|text', 'title': '...', 'description': '...', 'min_qty': integer, 'required': boolean}]
    steps JSONB DEFAULT '[]'::JSONB NOT NULL,
    
    -- Respostas Submetidas pelo Cliente
    -- Tipo Record<string, SurveyResponseValue>: {'step-id-1': {'urls': ['...']}, 'step-id-2': {'url': '...'}, 'step-id-3': {'text': '...'}}
    responses JSONB DEFAULT '{}'::JSONB NOT NULL,
    
    -- Status da Vistoria
    status TEXT DEFAULT 'pendente' NOT NULL CHECK (status IN ('pendente', 'enviado', 'respondido')),
    
    -- Relacionamentos e Auditoria
    budget_id UUID REFERENCES public.solar_budgets(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.solar_surveys ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para a Tabela solar_surveys
DROP POLICY IF EXISTS "Leitura pública de vistorias por ID" ON public.solar_surveys;
CREATE POLICY "Leitura pública de vistorias por ID" ON public.solar_surveys
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Apenas admins inserem vistorias" ON public.solar_surveys;
CREATE POLICY "Apenas admins inserem vistorias" ON public.solar_surveys
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

DROP POLICY IF EXISTS "Clientes e admins podem atualizar respostas" ON public.solar_surveys;
CREATE POLICY "Clientes e admins podem atualizar respostas" ON public.solar_surveys
    FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Apenas admins deletam vistorias" ON public.solar_surveys;
CREATE POLICY "Apenas admins deletam vistorias" ON public.solar_surveys
    FOR DELETE TO authenticated USING (true);


-- Configuração do Storage Bucket para os Arquivos de Vistoria
INSERT INTO storage.buckets (id, name, public) 
VALUES ('survey_files', 'survey_files', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de RLS para o Storage survey_files
DROP POLICY IF EXISTS "Arquivos de vistoria são públicos para leitura" ON storage.objects;
CREATE POLICY "Arquivos de vistoria são públicos para leitura" ON storage.objects
    FOR SELECT USING (bucket_id = 'survey_files');

DROP POLICY IF EXISTS "Qualquer um pode fazer upload de arquivos na vistoria" ON storage.objects;
CREATE POLICY "Qualquer um pode fazer upload de arquivos na vistoria" ON storage.objects
    FOR INSERT TO public WITH CHECK (bucket_id = 'survey_files');

DROP POLICY IF EXISTS "Qualquer um pode atualizar arquivos de vistoria" ON storage.objects;
CREATE POLICY "Qualquer um pode atualizar arquivos de vistoria" ON storage.objects
    FOR UPDATE TO public USING (bucket_id = 'survey_files');

DROP POLICY IF EXISTS "Apenas administradores podem deletar arquivos de vistoria" ON storage.objects;
CREATE POLICY "Apenas administradores podem deletar arquivos de vistoria" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'survey_files');
