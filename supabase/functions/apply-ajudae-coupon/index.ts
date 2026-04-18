// Aplica desconto Ajudaê na assinatura Stripe do usuário logado.
// Requer JWT (usuário autenticado). Cupom é uso único por email Ajudaê.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DISCOUNT_BY_PLAN: Record<string, number> = {
  premium: 30,
  pro: 15,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Cliente com JWT pra identificar o usuário
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = userData.user.id;
  const userEmail = (userData.user.email || "").toLowerCase().trim();
  if (!userEmail) {
    return new Response(JSON.stringify({ error: "User has no email" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Cliente com service role pra escrever na tabela protegida
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Verifica se o email do usuário existe na Ajudaê e está ativo
  const { data: ajudae } = await supabaseAdmin
    .from("ajudae_subscribers")
    .select("*")
    .ilike("email", userEmail)
    .maybeSingle();

  if (!ajudae || !ajudae.active || ajudae.plan === "none") {
    return new Response(JSON.stringify({
      error: "Email não encontrado como assinante ativo da Ajudaê",
    }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // 2. Verifica se já foi resgatado (uso único)
  if (ajudae.coupon_redeemed_at) {
    if (ajudae.redeemed_by_user_id === userId) {
      return new Response(JSON.stringify({
        ok: true, alreadyApplied: true,
        message: "Cupom já aplicado anteriormente nesta conta",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      error: "Este cupom Ajudaê já foi usado em outra conta",
    }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const discountPct = DISCOUNT_BY_PLAN[ajudae.plan];
  if (!discountPct) {
    return new Response(JSON.stringify({ error: "Plano Ajudaê inválido" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. Pega a assinatura Stripe ativa do usuário
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!sub?.stripe_subscription_id) {
    return new Response(JSON.stringify({
      error: "Você precisa ter uma assinatura ativa antes de aplicar o cupom",
    }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    // 4. Cria um Coupon Stripe (forever, percentual)
    const couponRes = await fetch("https://api.stripe.com/v1/coupons", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        percent_off: String(discountPct),
        duration: "forever",
        name: `Ajudaê ${ajudae.plan.toUpperCase()} -${discountPct}%`,
        "metadata[ajudae_email]": userEmail,
        "metadata[ajudae_plan]": ajudae.plan,
        "metadata[biztrivo_user_id]": userId,
      }).toString(),
    });
    const coupon = await couponRes.json();
    if (!couponRes.ok) {
      console.error("Stripe coupon error:", coupon);
      return new Response(JSON.stringify({ error: "Erro ao criar cupom no Stripe" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Aplica o coupon na subscription
    const applyRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ coupon: coupon.id }).toString(),
      }
    );
    const applied = await applyRes.json();
    if (!applyRes.ok) {
      console.error("Stripe apply error:", applied);
      return new Response(JSON.stringify({ error: "Erro ao aplicar cupom na assinatura" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Marca como resgatado
    await supabaseAdmin
      .from("ajudae_subscribers")
      .update({
        coupon_redeemed_at: new Date().toISOString(),
        redeemed_by_user_id: userId,
        stripe_coupon_id: coupon.id,
      })
      .eq("id", ajudae.id);

    console.log(`Applied ${discountPct}% Ajudaê coupon for ${userEmail}`);
    return new Response(JSON.stringify({
      ok: true, discountPct, plan: ajudae.plan,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("apply-ajudae-coupon error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
