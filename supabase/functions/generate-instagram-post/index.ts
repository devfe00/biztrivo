import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface Product {
  name: string;
  description?: string;
  originalPrice?: number;
  discountPrice: number;
  photo?: string;
}

interface Payload {
  product: Product;
  storeName?: string;
  whatsapp?: string;
  tone?: 'promocional' | 'elegante' | 'divertido';
}

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// limite de uso 
const DAILY_LIMIT = 5;          // gerações por usuário por dia
const WINDOW_HOURS = 24;        // janela em horas

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildImagePrompt(p: Product, storeName: string, tone: string) {
  const discount = p.originalPrice && p.originalPrice > p.discountPrice
    ? `com etiqueta de desconto destacando "${brl(p.discountPrice)}" (preço antigo riscado: ${brl(p.originalPrice)})`
    : `com etiqueta destacando o preço "${brl(p.discountPrice)}"`;
  return `Crie uma imagem quadrada (1:1) estilo post de Instagram profissional para a loja "${storeName}".
Produto em destaque: "${p.name}". ${p.description ? `Descrição: ${p.description}.` : ''}
Tom visual: ${tone}, alta qualidade, fundo limpo e moderno, iluminação suave de estúdio, composição centralizada.
Inclua um selo/badge ${discount}, com tipografia bold e moderna. Use cores vibrantes e harmoniosas.
Adicione um pequeno call-to-action visual como "OFERTA" ou "NOVIDADE" no canto.
Mantenha o produto como protagonista absoluto da imagem. Sem marcas d'água.`;
}


async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  used: number;
  resetInMinutes: number;
}> {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE);
  const windowStart = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from('post_generation_log')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`rate_limit_check_failed: ${error.message}`);

  const used = data?.length ?? 0;

  if (used < DAILY_LIMIT) {
    return { allowed: true, used, resetInMinutes: 0 };
  }

  // Calcula quanto falta para a geração mais antiga sair da janela
  const oldest = new Date(data[0].created_at).getTime();
  const resetAt = oldest + WINDOW_HOURS * 60 * 60 * 1000;
  const resetInMinutes = Math.ceil((resetAt - Date.now()) / 60_000);

  return { allowed: false, used, resetInMinutes };
}

async function registerGeneration(userId: string): Promise<void> {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE);
  const { error } = await admin
    .from('post_generation_log')
    .insert({ user_id: userId });
  if (error) throw new Error(`rate_limit_register_failed: ${error.message}`);
}

// IA: imagem 

async function generateImage(prompt: string, productPhoto?: string): Promise<string> {
  const userContent: any[] = [{ type: 'text', text: prompt }];
  if (productPhoto && (productPhoto.startsWith('data:') || productPhoto.startsWith('http'))) {
    userContent.push({ type: 'image_url', image_url: { url: productPhoto } });
  }

  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image',
      messages: [{ role: 'user', content: userContent }],
      modalities: ['image', 'text'],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`image_gen_failed:${res.status}:${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const msg = data?.choices?.[0]?.message;
  const imgUrl: string | undefined =
    msg?.images?.[0]?.image_url?.url ||
    msg?.images?.[0]?.url ||
    (Array.isArray(msg?.content)
      ? msg.content.find((c: any) => c?.type === 'image_url')?.image_url?.url
      : undefined);
  if (!imgUrl) throw new Error('image_gen_no_output');
  return imgUrl;
}

// IA: legenda 

async function generateCaption(p: Product, storeName: string, whatsapp: string, tone: string) {
  const discountInfo = p.originalPrice && p.originalPrice > p.discountPrice
    ? `De ${brl(p.originalPrice)} por ${brl(p.discountPrice)}`
    : `Por apenas ${brl(p.discountPrice)}`;

  const sys = `Você cria legendas de Instagram em português brasileiro para pequenos lojistas.
Estilo: ${tone}. Use no máximo 3 emojis bem posicionados. Inclua CTA claro para WhatsApp.
Retorne APENAS JSON válido no formato: {"caption":"...", "hashtags":["#tag1", ...]}.
A caption deve ter 3-5 linhas curtas. As hashtags devem ser 8 a 12, relevantes ao produto e nicho, sem repetir.`;

  const user = `Loja: ${storeName}
Produto: ${p.name}
${p.description ? `Descrição: ${p.description}` : ''}
Preço: ${discountInfo}
WhatsApp: ${whatsapp || '(não informado)'}`;

  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`caption_failed:${res.status}:${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content ?? '{}';
  try {
    const parsed = JSON.parse(raw);
    return {
      caption: String(parsed.caption ?? '').trim(),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map((h: any) => String(h)) : [],
    };
  } catch {
    return { caption: raw, hashtags: [] };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE);
    const { data: { user }, error: authError } = await userClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ──rate limit ──
    const { allowed, used, resetInMinutes } = await checkRateLimit(user.id);
    if (!allowed) {
      const horas = Math.floor(resetInMinutes / 60);
      const mins  = resetInMinutes % 60;
      const tempo = horas > 0 ? `${horas}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins} minutos`;
      return new Response(
        JSON.stringify({
          error: `Limite diário atingido (${DAILY_LIMIT} posts/dia). Seu limite renova em ${tempo}.`,
          rateLimited: true,
          resetInMinutes,
          used,
          limit: DAILY_LIMIT,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ── Payload ──
    const body: Payload = await req.json();
    const product = body?.product;
    if (!product?.name || !product?.discountPrice) {
      return new Response(JSON.stringify({ error: 'Produto inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const storeName = body.storeName || 'Minha Loja';
    const whatsapp  = body.whatsapp || '';
    const tone      = body.tone || 'promocional';

    const imagePrompt = buildImagePrompt(product, storeName, tone);

    //gera imagem + legenda em paralelo ──
    const [imageUrl, captionData] = await Promise.all([
      generateImage(imagePrompt, product.photo),
      generateCaption(product, storeName, whatsapp, tone),
    ]);

    //registra a geração DEPOIS do sucesso 
    await registerGeneration(user.id);

    return new Response(
      JSON.stringify({
        imageUrl,
        caption: captionData.caption,
        hashtags: captionData.hashtags,
        used: used + 1,
        limit: DAILY_LIMIT,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('generate-instagram-post error:', msg);
    const status = msg.includes(':429:') ? 429 : msg.includes(':402:') ? 402 : 500;
    const userMsg =
      status === 429 ? 'Muitas requisições. Aguarde um instante e tente novamente.'
      : status === 402 ? 'Créditos de IA esgotados. Adicione créditos no workspace.'
      : 'Não foi possível gerar o post. Tente novamente.';
    return new Response(JSON.stringify({ error: userMsg, detail: msg }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});