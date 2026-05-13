-- Adiciona os campos cep e neighborhood (bairro) na tabela client_installations
ALTER TABLE public.client_installations
ADD COLUMN cep text,
ADD COLUMN neighborhood text;
