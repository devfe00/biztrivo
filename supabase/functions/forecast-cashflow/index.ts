import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Pega últimos 60 dias de transações
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: txs, error: txErr } = await supabase
      .from("transactions")
      .select("type, value, date, is_personal, category")
      .eq("user_id", userId)
      .gte("date", sixtyDaysAgo.toISOString())
      .order("date", { ascending: true });

    if (txErr) throw txErr;

    if (!txs || txs.length < 5) {
      return new Response(JSON.stringify({
        insufficient_data: true,
        message: "Adicione pelo menos 5 transações para gerar uma previsão confiável.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Agrega por dia para reduzir tokens
    const byDay: Record<string, { entradas: number; saidas: number }> = {};
    for (const t of txs) {
      const d = new Date(t.date).toISOString().slice(0, 10);
      if (!byDay[d]) byDay[d] = { entradas: 0, saidas: 0 };
      if (t.type === "entrada") byDay[d].entradas += Number(t.value);
      else byDay[d].saidas += Number(t.value);
    }
    const series = Object.entries(byDay).map(([date, v]) => ({ date, ...v }));

    const systemPrompt = `Você é um analista financeiro para pequenos vendedores brasileiros. Analise o histórico diário de caixa e gere uma previsão realista. Use a tendência observada, sazonalidade simples (dias da semana) e a média móvel. Responda APENAS chamando a ferramenta forecast.`;
    const userPrompt = `Histórico dos últimos ${series.length} dias (R$):\n${JSON.stringify(series)}\n\nGere a previsão para os próximos 7 e 30 dias.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "forecast",
            description: "Retorna previsão de caixa estruturada",
            parameters: {
              type: "object",
              properties: {
                previsao_7_dias: { type: "number", description: "Saldo líquido projetado nos próximos 7 dias em R$" },
                previsao_30_dias: { type: "number", description: "Saldo líquido projetado nos próximos 30 dias em R$" },
                risco: { type: "string", enum: ["baixo", "medio", "alto"] },
                alerta: { type: "string", description: "Alerta curto em PT-BR, máx 120 chars" },
                recomendacao: { type: "string", description: "Recomendação prática curta em PT-BR, máx 140 chars" },
              },
              required: ["previsao_7_dias", "previsao_30_dias", "risco", "alerta", "recomendacao"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "forecast" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Crédito de IA esgotado neste mês." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("IA não retornou previsão estruturada");
    const forecast = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ ...forecast, generated_at: new Date().toISOString() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("forecast-cashflow error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});