-- Tabela de assinantes Ajudaê (sincronizada via webhook do Firebase)
CREATE TABLE public.ajudae_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('premium', 'pro', 'none')),
  active BOOLEAN NOT NULL DEFAULT true,
  coupon_redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by_user_id UUID,
  stripe_coupon_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ajudae_subscribers_email ON public.ajudae_subscribers(lower(email));
CREATE INDEX idx_ajudae_subscribers_redeemed_user ON public.ajudae_subscribers(redeemed_by_user_id);

-- RLS: ninguém acessa direto. Só edge functions com service role.
ALTER TABLE public.ajudae_subscribers ENABLE ROW LEVEL SECURITY;

-- Permitir que o usuário logado VEJA apenas o registro do próprio email (pra UI mostrar "você tem desconto disponível")
CREATE POLICY "Users can view their own ajudae status by email"
ON public.ajudae_subscribers
FOR SELECT
TO authenticated
USING (
  lower(email) = lower((SELECT auth.jwt() ->> 'email'))
);

-- Trigger updated_at
CREATE TRIGGER update_ajudae_subscribers_updated_at
BEFORE UPDATE ON public.ajudae_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();