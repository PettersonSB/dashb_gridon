-- ============================================
-- Gridon Solar Dashboard — Migração Supabase
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Hero Content
CREATE TABLE IF NOT EXISTS hero_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_text TEXT,
  headline TEXT NOT NULL,
  subheadline TEXT,
  cta_text TEXT,
  cta_link TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed inicial
INSERT INTO hero_content (badge_text, headline, subheadline, cta_text, cta_link)
VALUES (
  'Avaliação 5.0 ★ no Google – Mais de 500 projetos',
  'Economize até 95% na luz',
  'Soluções completas em energia fotovoltaica para residências e empresas em Brasília e região.',
  'Solicitar Orçamento Grátis',
  '#contato'
);

-- 2. Problem Cards
CREATE TABLE IF NOT EXISTS problem_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color_from TEXT,
  color_to TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO problem_cards (title, description, icon, color_from, color_to, sort_order) VALUES
('Conta de luz cada vez mais cara', 'As tarifas de energia elétrica sobem ano após ano, comprometendo o orçamento de famílias e empresas.', 'TrendingUp', 'from-red-500/20', 'to-orange-500/20', 0),
('Dependência da rede elétrica', 'Apagões, bandeiras tarifárias e instabilidade no fornecimento afetam diretamente sua rotina.', 'Zap', 'from-orange-500/20', 'to-amber-500/20', 1),
('Impacto ambiental crescente', 'A geração de energia por fontes não renováveis contribui para as mudanças climáticas e poluição.', 'CloudRain', 'from-amber-500/20', 'to-yellow-500/20', 2);

-- 3. Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO services (title, description, icon, features, sort_order) VALUES
('Sistemas Fotovoltaicos', 'Painéis solares de alta eficiência com dimensionamento personalizado para sua residência ou empresa.', 'Sun', ARRAY['Até 95% de economia', 'Garantia de 25 anos', 'Monitoramento remoto'], 0),
('Carregadores EV', 'Estações de recarga para veículos elétricos, integrando mobilidade sustentável ao seu dia a dia.', 'Zap', ARRAY['Compatibilidade universal', 'Recarga inteligente', 'Instalação residencial'], 1),
('Garantia Estendida', '25 anos de garantia nos painéis e 10 anos nos inversores, com suporte técnico especializado.', 'Shield', ARRAY['Manutenção preventiva', 'Suporte dedicado', 'Peças originais'], 2),
('Retorno Garantido', 'Payback médio de 3 a 5 anos, com economia contínua por mais de 25 anos de operação.', 'BarChart3', ARRAY['ROI comprovado', 'Financiamento facilitado', 'Valoriza imóvel em 8%'], 3),
('Tecnologia de Ponta', 'Equipamentos de primeira linha com monitoramento inteligente em tempo real via aplicativo.', 'Cpu', ARRAY['Inversores premium', 'App de monitoramento', 'Eficiência máxima'], 4),
('Energia 100% Limpa', 'Contribua para um planeta mais sustentável gerando sua própria energia renovável.', 'Leaf', ARRAY['Zero emissões', 'Fonte inesgotável', 'Responsabilidade ambiental'], 5);

-- 4. Stats
CREATE TABLE IF NOT EXISTS stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value NUMERIC NOT NULL,
  suffix TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

INSERT INTO stats (value, suffix, label, sort_order) VALUES
(500, '+', 'Projetos realizados', 0),
(95, '%', 'Economia média', 1),
(25, ' anos', 'Garantia dos painéis', 2),
(5.0, '★', 'Nota no Google', 3);

-- 5. Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  role TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO testimonials (text, author, role, sort_order) VALUES
('A Gridon transformou nossa empresa. Reduzimos a conta de luz em 92% e o investimento se pagou em menos de 3 anos.', 'Carlos M.', 'Empresário', 0),
('Profissionalismo do início ao fim. A equipe é extremamente atenciosa e a instalação foi impecável.', 'Ana P.', 'Residencial', 1),
('Melhor investimento que fiz. Além da economia absurda, meu imóvel se valorizou significativamente.', 'Roberto S.', 'Investidor', 2),
('O processo foi super simples. Desde o orçamento até a instalação, tudo transparente e no prazo prometido.', 'Juliana F.', 'Residencial', 3);

-- 6. Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  author TEXT DEFAULT 'Equipe Gridon',
  read_time TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Company Info
CREATE TABLE IF NOT EXISTS company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  opening_hours TEXT,
  instagram TEXT,
  facebook TEXT,
  linkedin TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO company_info (name, phone, whatsapp, email, address, city, state, zip, opening_hours)
VALUES (
  'Gridon Energia Solar',
  '(61) 99978-6125',
  '5561999786125',
  'contato@gridon.com.br',
  'St. Placa das Mercedes, conj. 3, lote 5',
  'Núcleo Bandeirante, Brasília',
  'DF',
  '71732-030',
  'Seg-Sex: 8h às 18h'
);

-- 8. SEO Config
CREATE TABLE IF NOT EXISTS seo_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  og_image TEXT,
  keywords TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO seo_config (page, title, description, keywords) VALUES
('home', 'Gridon Energia Solar', 'A Gridon Energia Solar oferece soluções completas em energia fotovoltaica para residências e empresas em Brasília. Economize até 95% na conta de luz.', 'energia solar, painéis solares, fotovoltaica, Brasília, DF'),
('blog', 'Blog — Gridon Energia Solar', 'Artigos, guias e novidades sobre energia fotovoltaica, economia e sustentabilidade.', 'blog energia solar, artigos fotovoltaica, dicas economia energia');

-- ============================================
-- RLS (Row Level Security) — Permitir leitura pública, escrita autenticada
-- ============================================
ALTER TABLE hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_config ENABLE ROW LEVEL SECURITY;

-- Política: leitura pública para todos
CREATE POLICY "public_read" ON hero_content FOR SELECT USING (true);
CREATE POLICY "public_read" ON problem_cards FOR SELECT USING (true);
CREATE POLICY "public_read" ON services FOR SELECT USING (true);
CREATE POLICY "public_read" ON stats FOR SELECT USING (true);
CREATE POLICY "public_read" ON testimonials FOR SELECT USING (true);
CREATE POLICY "public_read" ON blog_posts FOR SELECT USING (true);
CREATE POLICY "public_read" ON company_info FOR SELECT USING (true);
CREATE POLICY "public_read" ON seo_config FOR SELECT USING (true);

-- Política: escrita apenas para usuários autenticados
CREATE POLICY "auth_write" ON hero_content FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON problem_cards FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON services FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON stats FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON testimonials FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON blog_posts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON company_info FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON seo_config FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
