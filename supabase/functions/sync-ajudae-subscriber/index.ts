// Endpoint público chamado pelo backend da Ajudaê (Firebase Cloud Function)
// Protegido por header `x-ajudae-secret` validado contra AJUDAE_SYNC_SECRET.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ajudae-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Comparação em tempo constante pra evitar timing attacks
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expectedSecret = Deno.env.get("AJUDAE_SYNC_SECRET");
  if (!expectedSecret) {
    console.error("AJUDAE_SYNC_SECRET not configured");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const providedSecret = req.headers.get("x-ajudae-secret") || "";
  if (!safeEqual(providedSecret, expectedSecret)) {
    console.warn("Invalid x-ajudae-secret from", req.headers.get("x-forwarded-for"));
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = (body?.email || "").toString().trim().toLowerCase();
  const plan = (body?.plan || "").toString().trim().toLowerCase();

  if (!isValidEmail(email)) {
    return new Response(JSON.stringify({ error: "Invalid email" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!["premium", "pro", "none"].includes(plan)) {
    return new Response(JSON.stringify({ error: "Invalid plan (premium|pro|none)" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const active = plan !== "none";

  // Upsert por email
  const { error } = await supabase
    .from("ajudae_subscribers")
    .upsert(
      { email, plan, active, updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );

  if (error) {
    console.error("Upsert error:", error);
    return new Response(JSON.stringify({ error: "DB error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Se cancelou na Ajudaê e tem assinatura Stripe ativa na Biztrivo, remover desconto
  if (!active) {
    const { data: sub } = await supabase
      .from("ajudae_subscribers")
      .select("redeemed_by_user_id, stripe_coupon_id")
      .eq("email", email)
      .maybeSingle();

    if (sub?.redeemed_by_user_id) {
      const { data: stripeSub } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", sub.redeemed_by_user_id)
        .maybeSingle();

      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeSub?.stripe_subscription_id && stripeKey) {
        try {
          // Remove o desconto da assinatura
          await fetch(`https://api.stripe.com/v1/subscriptions/${stripeSub.stripe_subscription_id}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stripeKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "discounts=",
          });
          console.log("Removed Stripe discount for user", sub.redeemed_by_user_id);
        } catch (e) {
          console.error("Failed to remove Stripe discount:", e);
        }
      }
    }
  }

  console.log(`Synced Ajudaê: ${email} -> ${plan} (active=${active})`);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
