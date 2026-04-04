import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = sigHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1Signatures = parts
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3));

  if (!timestamp || v1Signatures.length === 0) return false;

  // Reject events older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (age > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );
  const expectedSig = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return v1Signatures.some((sig) => sig === expectedSig);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.text();

  const valid = await verifyStripeSignature(body, signature, webhookSecret);
  if (!valid) {
    console.error("Invalid Stripe signature");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const event = JSON.parse(body);
  console.log("Stripe event received:", event.type);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerEmail = session.customer_email || session.customer_details?.email;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (!customerEmail) {
        console.error("No customer email in checkout session");
        return new Response(JSON.stringify({ error: "No email" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find user by email
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find(
        (u: any) => u.email?.toLowerCase() === customerEmail.toLowerCase()
      );

      if (!user) {
        console.error("User not found for email:", customerEmail);
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          plan: "pro",
          stripe_customer_id: customerId || null,
          stripe_subscription_id: subscriptionId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating subscription:", error);
        return new Response(JSON.stringify({ error: "DB update failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Subscription activated for user:", user.id);
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const stripeSubId = subscription.id;
      const status = subscription.status === "active" ? "active" : "inactive";
      const periodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from("subscriptions")
        .update({
          status,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", stripeSubId);

      if (error) {
        console.error("Error updating subscription:", error);
        return new Response(JSON.stringify({ error: "DB update failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Subscription updated for stripe_subscription_id:", stripeSubId);
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const stripeSubId = subscription.id;

      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", stripeSubId);

      if (error) console.error("Error deactivating subscription:", error);
      else console.log("Subscription deactivated for:", stripeSubId);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
