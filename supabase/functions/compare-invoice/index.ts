import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface ProductRef {
  id: string;
  name: string;
  discountPrice: number;
  stock: number;
}

interface Payload {
  fileBase64: string; // data URL (data:image/...;base64,xxx or data:application/pdf;base64,xxx)
  products: ProductRef[];
}

interface ExtractedItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Dice coefficient on bigrams — robust for short product names
function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return na === nb ? 1 : 0;
  const bigrams = (s: string) => {
    const set = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      set.set(bg, (set.get(bg) || 0) + 1);
    }
    return set;
  };
  const ba = bigrams(na);
  const bb = bigrams(nb);
  let intersection = 0;
  for (const [k, v] of ba) {
    const o = bb.get(k);
    if (o) intersection += Math.min(v, o);
  }
  const total = [...ba.values()].reduce((s, n) => s + n, 0) + [...bb.values()].reduce((s, n) => s + n, 0);
  return total === 0 ? 0 : (2 * intersection) / total;
}

async function extractItems(fileBase64: string): Promise<{ items: ExtractedItem[]; supplier?: string; date?: string; total?: number }> {
  const sys = `Você é um especialista em OCR de notas fiscais brasileiras (NF-e, NFC-e, cupons fiscais).
Extraia TODOS os itens (produtos) da nota. Para cada item retorne nome, quantidade, preço unitário e total.
Ignore impostos, frete e descontos separados. Valores em BRL como número decimal (use ponto).
Retorne APENAS JSON válido neste formato exato:
{"supplier":"<nome do fornecedor ou null>","date":"<YYYY-MM-DD ou null>","total":<numero ou null>,"items":[{"name":"...","quantity":<n>,"unit_price":<n>,"total":<n>}]}`;

  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: sys },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extraia os itens desta nota fiscal e retorne o JSON solicitado.' },
            { type: 'image_url', image_url: { url: fileBase64 } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`ocr_failed:${res.status}:${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content ?? '{}';
  try {
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    return {
      items: items.map((i: any) => ({
        name: String(i.name || '').trim(),
        quantity: Number(i.quantity) || 0,
        unit_price: Number(i.unit_price) || 0,
        total: Number(i.total) || 0,
      })).filter((i: ExtractedItem) => i.name),
      supplier: parsed.supplier || undefined,
      date: parsed.date || undefined,
      total: parsed.total ? Number(parsed.total) : undefined,
    };
  } catch {
    throw new Error('ocr_parse_failed');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
    const body: Payload = await req.json();

    if (!body?.fileBase64 || !body.fileBase64.startsWith('data:')) {
      return new Response(JSON.stringify({ error: 'Arquivo inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const products = Array.isArray(body.products) ? body.products : [];

    const extracted = await extractItems(body.fileBase64);

    // Match each extracted item against the store products
    const SIM_THRESHOLD = 0.55;
    const comparisons = extracted.items.map((item) => {
      let best: { product: ProductRef; score: number } | null = null;
      for (const p of products) {
        const score = similarity(item.name, p.name);
        if (!best || score > best.score) best = { product: p, score };
      }
      const matched = best && best.score >= SIM_THRESHOLD ? best.product : null;
      const priceDiff = matched ? +(item.unit_price - matched.discountPrice).toFixed(2) : null;
      const priceDiffPct = matched && matched.discountPrice > 0
        ? +(((item.unit_price - matched.discountPrice) / matched.discountPrice) * 100).toFixed(1)
        : null;

      return {
        invoice: item,
        matchedProductId: matched?.id ?? null,
        matchedProductName: matched?.name ?? null,
        matchedPrice: matched?.discountPrice ?? null,
        matchedStock: matched?.stock ?? null,
        matchScore: best ? +best.score.toFixed(2) : 0,
        priceDiff,
        priceDiffPct,
        status: matched
          ? (priceDiff !== null && Math.abs(priceDiff) > 0.01 ? 'price_changed' : 'ok')
          : 'new',
      };
    });

    const summary = {
      totalItems: extracted.items.length,
      matched: comparisons.filter(c => c.matchedProductId).length,
      newItems: comparisons.filter(c => c.status === 'new').length,
      priceChanges: comparisons.filter(c => c.status === 'price_changed').length,
      invoiceTotal: extracted.total ?? null,
      supplier: extracted.supplier ?? null,
      date: extracted.date ?? null,
    };

    return new Response(JSON.stringify({ summary, comparisons }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('compare-invoice error:', msg);
    const status = msg.includes(':429:') ? 429 : msg.includes(':402:') ? 402 : 500;
    const userMsg =
      status === 429 ? 'Muitas requisições. Aguarde um instante.' :
      status === 402 ? 'Créditos de IA esgotados.' :
      'Não foi possível processar a nota. Verifique se a imagem está legível.';
    return new Response(JSON.stringify({ error: userMsg, detail: msg }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});