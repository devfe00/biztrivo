import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Get user's subscription
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: sub, error: subError } = await adminClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (subError || !sub) {
      return new Response(
        JSON.stringify({ error: "Subscription not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Cancel at period end in Stripe if subscription exists
    if (sub.stripe_subscription_id) {
      const stripeRes = await fetch(
        `https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "cancel_at_period_end=true",
        }
      );

      if (!stripeRes.ok) {
        const stripeError = await stripeRes.text();
        console.error("Stripe cancel error:", stripeError);
        // If subscription already cancelled or not found, proceed anyway
        if (stripeRes.status !== 404) {
          return new Response(
            JSON.stringify({ error: "Failed to cancel with Stripe" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // Set grace period: 30 days from now or current_period_end, whichever is later
    const now = new Date();
    const gracePeriodEnd = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    const finalEnd = sub.current_period_end
      ? new Date(
          Math.max(
            gracePeriodEnd.getTime(),
            new Date(sub.current_period_end).getTime()
          )
        )
      : gracePeriodEnd;

    // Update subscription status to 'cancelled' with grace period
    const { error: updateError } = await adminClient
      .from("subscriptions")
      .update({
        status: "cancelled",
        current_period_end: finalEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update subscription" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        grace_period_end: finalEnd.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
