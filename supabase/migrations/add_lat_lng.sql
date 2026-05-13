-- Adiciona os campos latitude e longitude na tabela client_installations
ALTER TABLE public.client_installations
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision;
