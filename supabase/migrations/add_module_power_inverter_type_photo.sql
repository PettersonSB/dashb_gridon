-- Adiciona potência do módulo (em W), tipo do inversor e foto da instalação
ALTER TABLE public.client_installations
ADD COLUMN module_power_w integer,
ADD COLUMN inverter_type text,
ADD COLUMN installation_photo_url text;
