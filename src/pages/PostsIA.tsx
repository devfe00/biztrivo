import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Instagram, Sparkles, Loader2, Download, Copy, Check,
  Trash2, Clock, CheckCircle2, Circle, Info, Image as ImageIcon,
  Calendar, BarChart2, Lightbulb, Grid3x3, Hash, UserCircle2,
  Film, PenLine, TrendingUp, ChevronDown, ChevronUp, RefreshCw,
  Star, Eye, Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { FUNCTIONS, callFunction } from '@/integrations/firebase/firebase';
import { useT, useI18n } from '@/lib/i18n';

interface PostRecord {
  id: string;
  productName: string;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  tone: string;
  createdAt: number;
  published: boolean;
  reach?: number;
  likes?: number;
}

interface PlanoItem {
  day: number;
  productName: string;
  tone: string;
  type: string;
  idea: string;
}

interface HashtagSet {
  large: string[];
  medium: string[];
  niche: string[];
}

type Tone = 'promocional' | 'elegante' | 'divertido';
type Tab = 'gerar' | 'historico' | 'templates' | 'plano' | 'ferramentas';

const HISTORY_KEY = 'posts_ia_history';
const RATE_KEY = 'ig_post_last_gen';
const RATE_LIMIT_MS = 60_000;
const MAX_HISTORY = 20;
const PLANO_KEY = 'posts_ia_plano';
const HASHTAG_KEY = 'posts_ia_hashtags';
const BIO_KEY = 'posts_ia_bio';

const TEMPLATE_IDS = ['promo', 'novo', 'ultimas', 'destaque'] as const;
const DICA_ICONS = ['⏰', '🏷️', '📅', '🎯', '💬', '📖', '🔁', '👁️'];

const loadHistory = (): PostRecord[] => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
};
const saveHistory = (records: PostRecord[]) =>
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, MAX_HISTORY)));

const loadPlano = (): PlanoItem[] => {
  try { return JSON.parse(localStorage.getItem(PLANO_KEY) || '[]'); } catch { return []; }
};
const savePlano = (p: PlanoItem[]) => localStorage.setItem(PLANO_KEY, JSON.stringify(p));

const loadHashtags = (): HashtagSet | null => {
  try { return JSON.parse(localStorage.getItem(HASHTAG_KEY) || 'null'); } catch { return null; }
};
const saveHashtags = (h: HashtagSet) => localStorage.setItem(HASHTAG_KEY, JSON.stringify(h));

const loadBio = (): string => localStorage.getItem(BIO_KEY) || '';
const saveBio = (b: string) => localStorage.setItem(BIO_KEY, b);

export default function PostsIA() {
  const { config } = useStore();
  const t = useT();
  const { lang } = useI18n();

  const TEMPLATES = useMemo(() => TEMPLATE_IDS.map(id => ({
    id,
    label: t(`posts_ia.templates_tab.items.${id}`),
    text: t(`posts_ia.template_texts.${id}`),
  })), [t]);

  const DICAS = useMemo(() => DICA_ICONS.map((icon, i) => ({
    icon,
    text: t(`posts_ia.tips.${i}`),
  })), [t]);

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>('gerar');

  // Gerar post
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [tone, setTone] = useState<Tone>('promocional');
  const [loading, setLoading] = useState(false);

  // Histórico
  const [history, setHistory] = useState<PostRecord[]>(loadHistory);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingStats, setEditingStats] = useState<string | null>(null);
  const [statsInput, setStatsInput] = useState({ reach: '', likes: '' });

  // Templates
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateTexts, setTemplateTexts] = useState<Record<string, string>>({});
  useEffect(() => {
    setTemplateTexts(prev => {
      const next = { ...prev };
      TEMPLATES.forEach(tpl => { if (next[tpl.id] === undefined) next[tpl.id] = tpl.text; });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //plano mensal
  const [plano, setPlano] = useState<PlanoItem[]>(loadPlano);
  const [gerandoPlano, setGerandoPlano] = useState(false);
  const [planoChecked, setPlanoChecked] = useState<Record<number, boolean>>({});
  const [planoExpanded, setPlanoExpanded] = useState<number | null>(null);

  //dica
  const [dicaIdx, setDicaIdx] = useState(() => Math.floor(Math.random() * DICAS.length));
  const [dicaSmartMsg, setDicaSmartMsg] = useState('');

  //##
  const [hashtags, setHashtags] = useState<HashtagSet | null>(loadHashtags);
  const [gerandoHashtags, setGerandoHashtags] = useState(false);
  const [copiedHashSet, setCopiedHashSet] = useState<string | null>(null);

  // Bio
  const [bio, setBio] = useState<string>(loadBio);
  const [gerandoBio, setGerandoBio] = useState(false);
  const [bioCopiado, setBioCopiado] = useState(false);

  //reescritor de legenda
  const [textoOriginal, setTextoOriginal] = useState('');
  const [toneRewrite, setToneRewrite] = useState<Tone>('promocional');
  const [legendaReescrita, setLegendaReescrita] = useState('');
  const [reescrevendo, setReescrevendo] = useState(false);
  const [copiedRewrite, setCopiedRewrite] = useState(false);

  //stories
  const [selectedProductStories, setSelectedProductStories] = useState('');
  const [gerandoStories, setGerandoStories] = useState(false);
  const [stories, setStories] = useState<{ slide: string; texto: string }[] | null>(null);
  const [copiedStory, setCopiedStory] = useState<number | null>(null);

  const USAGE_KEY = 'posts_ia_usage';
  const [aiUsage, setAiUsage] = useState<{ percent: number; resetAt: number | null }>(() => {
    try { return JSON.parse(localStorage.getItem(USAGE_KEY) || 'null') ?? { percent: 0, resetAt: null }; }
    catch { return { percent: 0, resetAt: null }; }
  });
  const isBlocked = aiUsage.resetAt !== null && Date.now() < aiUsage.resetAt;
  const updateUsage = (percent: number, rateLimited = false) => {
    const newUsage = { percent: rateLimited ? 100 : percent, resetAt: rateLimited ? Date.now() + 5 * 60 * 60 * 1000 : null };
    setAiUsage(newUsage);
    localStorage.setItem(USAGE_KEY, JSON.stringify(newUsage));
  };

  // ── Derived ──
  const selectedProduct = config.products.find(p => p.id === selectedProductId) ?? null;
  const pendingCount = history.filter(r => !r.published).length;
  const publishedCount = history.filter(r => r.published).length;

  // ── Dica contextual inteligente ──
  useEffect(() => {
    const last = Number(localStorage.getItem(RATE_KEY) || 0);
    const daysSinceLast = (Date.now() - last) / (1000 * 60 * 60 * 24);
    const postsThisWeek = history.filter(r => Date.now() - r.createdAt < 7 * 24 * 60 * 60 * 1000).length;

    if (daysSinceLast > 4 && last > 0) {
      setDicaSmartMsg(t('posts_ia.smart_tip.no_post_days', { days: Math.floor(daysSinceLast) }));
    } else if (postsThisWeek >= 4) {
      setDicaSmartMsg(t('posts_ia.smart_tip.great_pace', { count: postsThisWeek }));
    } else if (postsThisWeek === 0 && history.length > 0) {
      setDicaSmartMsg(t('posts_ia.smart_tip.no_post_week'));
    } else {
      setDicaSmartMsg('');
    }
  }, [history, t]);

  useEffect(() => {
    if (aiUsage.resetAt && Date.now() >= aiUsage.resetAt) {
      const cleared = { percent: 0, resetAt: null };
      setAiUsage(cleared);
      localStorage.setItem(USAGE_KEY, JSON.stringify(cleared));
    }
  }, []);

  // ── Análise de desempenho ──
  const postsComStats = history.filter(r => r.reach !== undefined && r.likes !== undefined);
  const melhorTom = (() => {
    if (postsComStats.length < 2) return null;
    const porTom: Record<string, { totalLikes: number; count: number }> = {};
    postsComStats.forEach(r => {
      if (!porTom[r.tone]) porTom[r.tone] = { totalLikes: 0, count: 0 };
      porTom[r.tone].totalLikes += r.likes ?? 0;
      porTom[r.tone].count += 1;
    });
    let best = { tom: '', avg: 0 };
    Object.entries(porTom).forEach(([tom, { totalLikes, count }]) => {
      const avg = totalLikes / count;
      if (avg > best.avg) best = { tom, avg };
    });
    return best.tom || null;
  })();

  const generate = async () => {
    if (!selectedProduct) { toast.error(t('posts_ia.toast.select_product')); return; }
    const last = Number(localStorage.getItem(RATE_KEY) || 0);
    if (Date.now() - last < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - (Date.now() - last)) / 1000);
      toast.error(t('posts_ia.toast.wait_seconds', { seconds: wait }));
      return;
    }
    setLoading(true);
    try {
      const data = await callFunction<{ imageUrl: string; caption: string; hashtags: string[]; error?: string }>(FUNCTIONS.generateInstagramPost, {
        product: {
          name: selectedProduct.name,
          description: selectedProduct.description,
          originalPrice: selectedProduct.originalPrice,
          discountPrice: selectedProduct.discountPrice,
          photo: selectedProduct.photo,
        },
        storeName: config.storeName,
        whatsapp: config.whatsapp,
        tone,
        lang,
      });
      if (!data?.imageUrl) throw new Error(data?.error || t('posts_ia.toast.gen_error_image'));
      const record: PostRecord = {
        id: crypto.randomUUID(),
        productName: selectedProduct.name,
        imageUrl: data.imageUrl,
        caption: data.caption,
        hashtags: data.hashtags ?? [],
        tone,
        createdAt: Date.now(),
        published: false,
      };
      const updated = [record, ...history];
      setHistory(updated);
      saveHistory(updated);
      localStorage.setItem(RATE_KEY, String(Date.now()));
      toast.success(t('posts_ia.toast.post_generated'));
      setActiveTab('historico');
    } catch (e: any) {
      toast.error(e?.message || t('posts_ia.toast.gen_error'));
    } finally {
      setLoading(false);
    }
  };

  const togglePublished = (id: string) => {
    const updated = history.map(r => r.id === id ? { ...r, published: !r.published } : r);
    setHistory(updated); saveHistory(updated);
  };
  const deleteRecord = (id: string) => {
    const updated = history.filter(r => r.id !== id);
    setHistory(updated); saveHistory(updated);
    toast.success(t('posts_ia.toast.post_removed'));
  };
  const downloadImage = (record: PostRecord) => {
    const a = document.createElement('a');
    a.href = record.imageUrl;
    a.download = `${record.productName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-instagram.png`;
    a.click();
    toast.success(t('posts_ia.toast.image_downloaded'));
  };
  const copyCaption = async (record: PostRecord) => {
    const text = `${record.caption}\n\n${record.hashtags.join(' ')}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(record.id);
    toast.success(t('posts_ia.toast.caption_copied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveStats = (id: string) => {
    const reach = parseInt(statsInput.reach);
    const likes = parseInt(statsInput.likes);
    if (isNaN(reach) || isNaN(likes)) { toast.error(t('posts_ia.toast.invalid_numbers')); return; }
    const updated = history.map(r => r.id === id ? { ...r, reach, likes } : r);
    setHistory(updated); saveHistory(updated);
    setEditingStats(null);
    toast.success(t('posts_ia.toast.stats_saved'));
  };

  const copyTemplate = async (id: string) => {
    await navigator.clipboard.writeText(templateTexts[id]);
    setCopiedId(id);
    toast.success(t('posts_ia.toast.template_copied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const gerarPlano = async () => {
    if (config.products.length === 0) { toast.error(t('posts_ia.toast.register_products_first')); return; }
    setGerandoPlano(true);
    try {
      const nomes = config.products.map(p => p.name).join(', ');
      const prompt = `Você é especialista em marketing de Instagram para pequenos lojistas brasileiros.
Crie um plano de conteúdo para 30 dias para a loja "${config.storeName}" que vende: ${nomes}.
Responda APENAS com um JSON array de 30 objetos, sem texto antes ou depois, sem markdown.
Cada objeto: { "day": <número 1-30>, "productName": "<nome do produto>", "tone": "<promocional|elegante|divertido>", "type": "<Post no Feed|Stories|Reels|Enquete|Depoimento>", "idea": "<ideia criativa de 1 frase max 80 chars>" }
Varie os tipos de conteúdo e tons ao longo do mês. Distribua os produtos de forma equilibrada.`;
      const { text: raw, percent } = await callFunction<{ text: string; percent: number }>(FUNCTIONS.postsIA, { action: 'gerarPlano', prompt, lang });
      updateUsage(percent);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed: PlanoItem[] = JSON.parse(clean);
      setPlano(parsed);
      savePlano(parsed);
      setPlanoChecked({});
      toast.success(t('posts_ia.toast.plan_generated'));
    } catch (e: any) {
      if (e?.message?.includes('Limite')) updateUsage(100, true);
      toast.error(e?.message || t('posts_ia.toast.plan_error'));
    } finally {
      setGerandoPlano(false);
    }
  };

  const gerarHashtags = async () => {
    if (config.products.length === 0) { toast.error(t('posts_ia.toast.register_products')); return; }
    setGerandoHashtags(true);
    try {
      const nomes = config.products.map(p => p.name).join(', ');
      const prompt = `Você é especialista em hashtags do Instagram Brasil para pequenos lojistas.
A loja "${config.storeName}" vende: ${nomes}.
Gere 3 sets de hashtags em PT-BR. Responda APENAS com JSON, sem texto, sem markdown:
{ "large": [10 hashtags com +1M posts], "medium": [10 hashtags com 100k-500k posts], "niche": [10 hashtags nichadas com -50k posts, específicas do nicho] }
Todas em português, sem o símbolo #.`;
      const { text: raw, percent } = await callFunction<{ text: string; percent: number }>(FUNCTIONS.postsIA, { action: 'gerarHashtags', prompt, lang });
      updateUsage(percent);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed: HashtagSet = JSON.parse(clean);
      setHashtags(parsed);
      saveHashtags(parsed);
      toast.success(t('posts_ia.toast.hashtags_generated'));
    } catch (e: any) {
      if (e?.message?.includes('Limite')) updateUsage(100, true);
      toast.error(e?.message || t('posts_ia.toast.hashtags_error'));
    } finally {
      setGerandoHashtags(false);
    }
  };

  const copyHashSet = async (set: string[], key: string) => {
    const text = set.map(h => `#${h}`).join(' ');
    await navigator.clipboard.writeText(text);
    setCopiedHashSet(key);
    toast.success(t('posts_ia.toast.hashtags_copied'));
    setTimeout(() => setCopiedHashSet(null), 2000);
  };

  const gerarBio = async () => {
    if (!config.storeName) { toast.error(t('posts_ia.toast.configure_store_name')); return; }
    setGerandoBio(true);
    try {
      const nomes = config.products.slice(0, 5).map(p => p.name).join(', ');
      const prompt = `Crie uma bio otimizada para Instagram de uma loja brasileira chamada "${config.storeName}".
Produtos principais: ${nomes || 'produtos variados'}.
WhatsApp: ${config.whatsapp || 'não informado'}.
A bio deve ter: emojis estratégicos, palavras-chave do nicho, CTA direto, máximo 150 caracteres.
Responda APENAS com o texto da bio, sem aspas, sem explicações.`;
      const { text: result, percent } = await callFunction<{ text: string; percent: number }>(FUNCTIONS.postsIA, { action: 'gerarBio', prompt, lang });
      updateUsage(percent);
      const bioTexto = result.trim();
      setBio(bioTexto);
      saveBio(bioTexto);
      toast.success(t('posts_ia.toast.bio_generated'));
    } catch (e: any) {
      if (e?.message?.includes('Limite')) updateUsage(100, true);
      toast.error(e?.message || t('posts_ia.toast.bio_error'));
    } finally {
      setGerandoBio(false);
    }
  };

  const copyBio = async () => {
    await navigator.clipboard.writeText(bio);
    setBioCopiado(true);
    toast.success(t('posts_ia.toast.bio_copied'));
    setTimeout(() => setBioCopiado(false), 2000);
  };

  const reescreverLegenda = async () => {
    if (!textoOriginal.trim()) { toast.error(t('posts_ia.toast.paste_text')); return; }
    setReescrevendo(true);
    setLegendaReescrita('');
    try {
      const prompt = `Você é copywriter especialista em Instagram para lojas brasileiras.
Reescreva a legenda abaixo com tom "${toneRewrite}" para a loja "${config.storeName}".
Mantenha o sentido mas troque as palavras completamente. Use emojis adequados.
Adicione uma linha de CTA no final chamando pro WhatsApp.
Responda APENAS com a legenda reescrita, sem aspas, sem explicações.

TEXTO ORIGINAL:
${textoOriginal}`;
      const { text: result, percent } = await callFunction<{ text: string; percent: number }>(FUNCTIONS.postsIA, { action: 'reescreverLegenda', prompt, lang });
      updateUsage(percent);
      setLegendaReescrita(result.trim());
    } catch (e: any) {
      if (e?.message?.includes('Limite')) updateUsage(100, true);
      toast.error(e?.message || t('posts_ia.toast.rewrite_error'));
    } finally {
      setReescrevendo(false);
    }
  };

  const copyRewrite = async () => {
    await navigator.clipboard.writeText(legendaReescrita);
    setCopiedRewrite(true);
    toast.success(t('posts_ia.toast.caption_copied'));
    setTimeout(() => setCopiedRewrite(false), 2000);
  };

  // ─── stories em sequência ───────────────────────────────────────────────────

  const gerarStories = async () => {
    const product = config.products.find(p => p.id === selectedProductStories);
    if (!product) { toast.error(t('posts_ia.toast.select_product_short')); return; }
    setGerandoStories(true);
    setStories(null);
    try {
      const preco = product.discountPrice
        ? `R$ ${product.discountPrice.toFixed(2).replace('.', ',')}`
        : `R$ ${product.originalPrice.toFixed(2).replace('.', ',')}`;
      const prompt = `Você é especialista em Stories de Instagram para lojas brasileiras.
Crie 3 slides de Stories para o produto "${product.name}" (${preco}) da loja "${config.storeName}".
Slide 1: Teaser (gera curiosidade sem revelar o produto).
Slide 2: Reveal (mostra o produto com preço e benefício principal).
Slide 3: CTA (urgência + link WhatsApp ${config.whatsapp || ''}).
Use emojis. Cada texto deve ter no máximo 80 caracteres. Tom direto e animado.
Responda APENAS com JSON, sem markdown: [{"slide":"Slide 1 - Teaser","texto":"..."},{"slide":"Slide 2 - Reveal","texto":"..."},{"slide":"Slide 3 - CTA","texto":"..."}]`;
      const { text: raw, percent } = await callFunction<{ text: string; percent: number }>(FUNCTIONS.postsIA, { action: 'gerarStories', prompt, lang });
      updateUsage(percent);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setStories(parsed);
      toast.success(t('posts_ia.toast.stories_generated'));
    } catch (e: any) {
      if (e?.message?.includes('Limite')) updateUsage(100, true);
      toast.error(e?.message || t('posts_ia.toast.stories_error'));
    } finally {
      setGerandoStories(false);
    }
  };

  const copyStory = async (texto: string, idx: number) => {
    await navigator.clipboard.writeText(texto);
    setCopiedStory(idx);
    toast.success(t('posts_ia.toast.text_copied'));
    setTimeout(() => setCopiedStory(null), 2000);
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'gerar', label: t('posts_ia.tabs.generate'), icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'historico', label: history.length ? t('posts_ia.tabs.history_count', { count: history.length }) : t('posts_ia.tabs.history'), icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'templates', label: t('posts_ia.tabs.templates'), icon: <PenLine className="w-3.5 h-3.5" /> },
    { id: 'plano', label: t('posts_ia.tabs.plan'), icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'ferramentas', label: t('posts_ia.tabs.tools'), icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
          <Instagram className="w-7 h-7 text-pink-500" />
          {t('posts_ia.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('posts_ia.subtitle')}</p>
      </div>

      {/* Aviso localStorage */}
      <div className="flex items-start gap-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          {t('posts_ia.storage_notice')}
        </span>
      </div>
      {dicaSmartMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{dicaSmartMsg}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-xl w-fit max-w-full">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'gradient-primary text-primary-foreground shadow-glow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {isBlocked && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t('posts_ia.limit_reached', { time: new Date(aiUsage.resetAt!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) })}
        </div>
      )}
      {!isBlocked && aiUsage.percent >= 90 && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
          {t('posts_ia.credits_warning', { percent: aiUsage.percent })}
        </div>
      )}

      {activeTab === 'gerar' && (
        <Card className="p-6 border-none shadow-md space-y-6">

          <div>
            <Label className="text-sm font-medium mb-3 block">{t('posts_ia.generate_tab.select_product')}</Label>
            {config.products.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('posts_ia.generate_tab.no_products')}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {config.products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    disabled={loading}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      selectedProductId === p.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {p.photo
                      ? <img src={p.photo} alt={p.name} className="w-16 h-16 object-cover rounded-lg" />
                      : <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="w-6 h-6 text-muted-foreground/40" /></div>
                    }
                    <span className="text-xs font-medium text-center line-clamp-2 w-full">{p.name}</span>
                    {!config.vitrineOnlyMode && (
                      <span className="text-xs text-secondary font-semibold">R$ {p.discountPrice?.toFixed(2).replace('.', ',') ?? p.originalPrice.toFixed(2).replace('.', ',')}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">{t('posts_ia.generate_tab.tone_label')}</Label>
            <div className="flex gap-2 flex-wrap">
              {(['promocional', 'elegante', 'divertido'] as Tone[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    tone === t ? 'gradient-primary text-primary-foreground shadow-glow' : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !selectedProduct}
            className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('posts_ia.generate_tab.generating')}</> : <><Sparkles className="w-4 h-4" /> {t('posts_ia.generate_tab.generate_button')}</>}
          </button>

          {loading && (
            <p className="text-xs text-center text-muted-foreground animate-pulse">
              {t('posts_ia.generate_tab.loading_msg', { product: selectedProduct?.name ?? '' })}
            </p>
          )}

          {/* Dica do dia */}
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> {t('posts_ia.generate_tab.tip_of_day')}
              </p>
              <button
                onClick={() => setDicaIdx(i => (i + 1) % DICAS.length)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> {t('posts_ia.generate_tab.next_tip')}
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {DICAS[dicaIdx].icon} {DICAS[dicaIdx].text}
            </p>
          </div>
        </Card>
      )}

      {activeTab === 'historico' && (
        <div className="space-y-4">

          {/* métricas rápidas */}
          {history.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('posts_ia.history_tab.generated'), value: history.length, icon: <ImageIcon className="w-4 h-4" /> },
                { label: t('posts_ia.history_tab.published'), value: publishedCount, icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
                { label: t('posts_ia.history_tab.pending'), value: pendingCount, icon: <Clock className="w-4 h-4 text-yellow-500" /> },
              ].map(m => (
                <Card key={m.label} className="p-3 border-none shadow-sm text-center space-y-1">
                  <div className="flex justify-center text-muted-foreground">{m.icon}</div>
                  <p className="text-lg font-bold font-heading">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </Card>
              ))}
            </div>
          )}

          {/* análise de desempenho */}
          {postsComStats.length >= 1 && (
            <Card className="p-4 border-none shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">{t('posts_ia.history_tab.performance_analysis')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {postsComStats.slice(0, 4).map(r => (
                  <div key={r.id} className="rounded-lg bg-muted/60 p-3 space-y-1">
                    <p className="text-xs font-medium line-clamp-1">{r.productName}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {r.reach?.toLocaleString('pt-BR')}</span>
<span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {r.likes?.toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-xs capitalize text-muted-foreground">{r.tone}</p>
                  </div>
                ))}
              </div>
              {melhorTom && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                  <Star className="w-3.5 h-3.5 text-primary" />
                  <p className="text-xs">{t('posts_ia.history_tab.best_tone', { tone: melhorTom ?? '' })}</p>
                </div>
              )}
              {postsComStats.length < 2 && (
                <p className="text-xs text-muted-foreground">{t('posts_ia.history_tab.register_more_stats')}</p>
              )}
            </Card>
          )}

          {pendingCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{t('posts_ia.history_tab.pending_posts', { count: pendingCount, plural: pendingCount > 1 ? 's' : '' })}</span>
            </div>
          )}

          {history.length === 0 ? (
            <Card className="p-10 border-none shadow-md text-center">
              <Instagram className="w-10 h-10 mx-auto mb-3 text-pink-500/30" />
              <p className="font-semibold font-heading">{t('posts_ia.history_tab.empty_title')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('posts_ia.history_tab.empty_subtitle')}</p>
            </Card>
          ) : (
            <>
              {/* Preview de feed 3×3 */}
              {history.length >= 3 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('posts_ia.history_tab.feed_preview')}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden border border-border">
                    {history.slice(0, 9).map(r => (
                      <div key={r.id} className="aspect-square bg-muted overflow-hidden">
                        <img src={r.imageUrl} alt={r.productName} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('posts_ia.history_tab.feed_simulation', { count: Math.min(history.length, 9) })}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {history.map(record => (
                  <Card key={record.id} className="border-none shadow-md overflow-hidden">
                    <div className="aspect-square bg-muted">
                      <img src={record.imageUrl} alt={record.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{record.productName}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {record.tone} · {new Date(record.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={() => togglePublished(record.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                            record.published
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-muted text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          {record.published ? <><CheckCircle2 className="w-3 h-3" /> {t('posts_ia.history_tab.published_badge')}</> : <><Circle className="w-3 h-3" /> {t('posts_ia.history_tab.pending_badge')}</>}
                        </button>
                      </div>

                      {/*métricas */}
                      {editingStats === record.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder={t('posts_ia.history_tab.reach_placeholder')}
                              value={statsInput.reach}
                              onChange={e => setStatsInput(s => ({ ...s, reach: e.target.value }))}
                              className="w-full text-xs bg-muted rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <input
                              type="number"
                              placeholder={t('posts_ia.history_tab.likes_placeholder')}
                              value={statsInput.likes}
                              onChange={e => setStatsInput(s => ({ ...s, likes: e.target.value }))}
                              className="w-full text-xs bg-muted rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveStats(record.id)}
                              className="flex-1 py-1 rounded-lg gradient-primary text-primary-foreground text-xs font-medium"
                            >{t('posts_ia.history_tab.save')}</button>
                            <button
                              onClick={() => setEditingStats(null)}
                              className="flex-1 py-1 rounded-lg bg-muted text-xs text-muted-foreground"
                            >{t('posts_ia.history_tab.cancel')}</button>
                          </div>
                        </div>
                      ) : record.reach !== undefined ? (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {t('posts_ia.history_tab.reach_value', { value: record.reach.toLocaleString() })}</span>
<span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {t('posts_ia.history_tab.likes_value', { value: record.likes?.toLocaleString() ?? '' })}</span>
                          <button
                            onClick={() => { setEditingStats(record.id); setStatsInput({ reach: String(record.reach), likes: String(record.likes) }); }}
                            className="text-primary text-xs hover:underline ml-auto"
                          >{t('posts_ia.history_tab.edit')}</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingStats(record.id); setStatsInput({ reach: '', likes: '' }); }}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                        >
                          <BarChart2 className="w-3 h-3" /> {t('posts_ia.history_tab.register_reach_likes')}
                        </button>
                      )}

                      <div>
                        <p className={`text-xs text-muted-foreground leading-relaxed ${expandedId === record.id ? '' : 'line-clamp-2'}`}>
                          {record.caption}
                        </p>
                        {record.caption.length > 80 && (
                          <button
                            onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                            className="text-[10px] text-primary mt-0.5 flex items-center gap-0.5"
                          >
                            {expandedId === record.id ? <><ChevronUp className="w-3 h-3" /> {t('posts_ia.history_tab.less')}</> : <><ChevronDown className="w-3 h-3" /> {t('posts_ia.history_tab.see_more')}</>}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => downloadImage(record)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-medium shadow-glow hover:opacity-90 transition-opacity"
                        >
                          <Download className="w-3 h-3" /> {t('posts_ia.history_tab.download')}
                        </button>
                        <button
                          onClick={() => copyCaption(record)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium hover:bg-accent transition-colors"
                        >
                          {copiedId === record.id ? <><Check className="w-3 h-3" /> {t('posts_ia.history_tab.copied')}</> : <><Copy className="w-3 h-3" /> {t('posts_ia.history_tab.caption')}</>}
                        </button>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('posts_ia.templates_tab.description')}
          </p>
          {TEMPLATES.map(tpl => (
            <Card key={tpl.id} className="p-5 border-none shadow-md space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm font-semibold">{tpl.label}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTemplate(editingTemplate === tpl.id ? null : tpl.id)}
                    className="px-3 py-1 rounded-lg bg-muted text-xs font-medium hover:bg-accent transition-colors"
                  >
                    {editingTemplate === tpl.id ? t('posts_ia.templates_tab.close') : t('posts_ia.templates_tab.edit')}
                  </button>
                  <button
                    onClick={() => copyTemplate(tpl.id)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg gradient-primary text-primary-foreground text-xs font-medium shadow-glow hover:opacity-90 transition-opacity"
                  >
                    {copiedId === tpl.id ? <><Check className="w-3 h-3" /> {t('posts_ia.templates_tab.copied')}</> : <><Copy className="w-3 h-3" /> {t('posts_ia.templates_tab.copy')}</>}
                  </button>
                </div>
              </div>
              {editingTemplate === tpl.id ? (
                <textarea
                  value={templateTexts[tpl.id]}
                  onChange={e => setTemplateTexts(prev => ({ ...prev, [tpl.id]: e.target.value }))}
                  rows={7}
                  className="w-full text-sm bg-muted rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary font-sans"
                />
              ) : (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted rounded-lg p-3 font-sans leading-relaxed">
                  {templateTexts[tpl.id]}
                </pre>
              )}
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'plano' && (
        <div className="space-y-4">
          <Card className="p-5 border-none shadow-md space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> {t('posts_ia.plan_tab.title')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('posts_ia.plan_tab.description')}
                </p>
              </div>
              {plano.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {t('posts_ia.plan_tab.done_count', { done: Object.keys(planoChecked).length, total: plano.length })}
                </span>
              )}
            </div>
            <button
              onClick={gerarPlano}
              disabled={gerandoPlano || config.products.length === 0}
              className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {gerandoPlano
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('posts_ia.plan_tab.generating')}</>
                : plano.length > 0
                  ? <><RefreshCw className="w-4 h-4" /> {t('posts_ia.plan_tab.new_plan')}</>
                  : <><Sparkles className="w-4 h-4" /> {t('posts_ia.plan_tab.generate_month_plan')}</>
              }
            </button>
          </Card>

          {plano.length > 0 && (
            <div className="space-y-2">
              {plano.map(item => (
                <Card key={item.day} className={`border-none shadow-sm transition-all ${planoChecked[item.day] ? 'opacity-60' : ''}`}>
                  <button
                    className="w-full p-4 flex items-start gap-3 text-left"
                    onClick={() => setPlanoExpanded(planoExpanded === item.day ? null : item.day)}
                  >
                    <button
                      onClick={e => { e.stopPropagation(); setPlanoChecked(prev => ({ ...prev, [item.day]: !prev[item.day] })); }}
                      className="mt-0.5 shrink-0"
                    >
                      {planoChecked[item.day]
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <Circle className="w-4 h-4 text-muted-foreground" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-primary">{t('posts_ia.plan_tab.day', { day: item.day })}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{item.tone}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{item.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.productName}</p>
                    </div>
                    {planoExpanded === item.day ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                  {planoExpanded === item.day && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground leading-relaxed">
                        <span className="flex items-start gap-1.5"><Lightbulb className="w-3 h-3 shrink-0 mt-0.5" /><span><strong>{t('posts_ia.plan_tab.idea')}</strong> {item.idea}</span></span>
                      </div>
                      <button
                        onClick={() => { setSelectedProductId(config.products.find(p => p.name === item.productName)?.id ?? ''); setTone(item.tone as Tone); setActiveTab('gerar'); }}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-medium shadow-glow hover:opacity-90 transition-opacity"
                      >
                        <Sparkles className="w-3 h-3" /> {t('posts_ia.plan_tab.generate_day_post')}
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/*FERRAMENTAS IA ── */}
      {activeTab === 'ferramentas' && (
        <div className="space-y-6">

          {/* Sets de Hashtags */}
          <Card className="p-5 border-none shadow-md space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" /> {t('posts_ia.tools_tab.hashtag_sets_title')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('posts_ia.tools_tab.hashtag_sets_description')}
                </p>
              </div>
            </div>
            <button
              onClick={gerarHashtags}
              disabled={gerandoHashtags || config.products.length === 0}
              className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {gerandoHashtags
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('posts_ia.tools_tab.generating_hashtags')}</>
                : hashtags ? <><RefreshCw className="w-4 h-4" /> {t('posts_ia.tools_tab.new_sets')}</> : <><Sparkles className="w-4 h-4" /> {t('posts_ia.tools_tab.generate_sets')}</>
              }
            </button>
            {hashtags && (
              <div className="space-y-3">
                {[
                  { key: 'large', label: t('posts_ia.tools_tab.large'), set: hashtags.large },
{ key: 'medium', label: t('posts_ia.tools_tab.medium'), set: hashtags.medium },
{ key: 'niche', label: t('posts_ia.tools_tab.niche'), set: hashtags.niche },
                ].map(({ key, label, set }) => (
                  <div key={key} className="rounded-lg bg-muted p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">{label}</p>
                      <button
                        onClick={() => copyHashSet(set, key)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg gradient-primary text-primary-foreground text-xs font-medium shadow-glow"
                      >
                        {copiedHashSet === key ? <><Check className="w-3 h-3" /> {t('posts_ia.tools_tab.copied')}</> : <><Copy className="w-3 h-3" /> {t('posts_ia.tools_tab.copy')}</>}
                      </button>
                    </div>
                    <p className="text-xs text-primary leading-relaxed">{set.map(h => `#${h}`).join(' ')}</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground flex items-start gap-1.5"><Lightbulb className="w-3 h-3 shrink-0 mt-0.5" /> {t('posts_ia.tools_tab.combine_hashtags_tip')}</p>
              </div>
            )}
          </Card>

          {/* Bio Otimizada */}
          <Card className="p-5 border-none shadow-md space-y-4">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                <UserCircle2 className="w-4 h-4 text-primary" /> {t('posts_ia.tools_tab.bio_title')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('posts_ia.tools_tab.bio_description')}
              </p>
            </div>
            <button
              onClick={gerarBio}
              disabled={gerandoBio}
              className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {gerandoBio
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('posts_ia.tools_tab.generating_bio')}</>
                : bio ? <><RefreshCw className="w-4 h-4" /> {t('posts_ia.tools_tab.new_bio')}</> : <><Sparkles className="w-4 h-4" /> {t('posts_ia.tools_tab.generate_bio')}</>
              }
            </button>
            {bio && (
              <div className="space-y-2">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{bio}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{t('posts_ia.tools_tab.chars_count', { count: bio.length })}</p>
                  <button
                    onClick={copyBio}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-medium shadow-glow"
                  >
                    {bioCopiado ? <><Check className="w-3 h-3" /> {t('posts_ia.tools_tab.copied_bio')}</> : <><Copy className="w-3 h-3" /> {t('posts_ia.tools_tab.copy_bio')}</>}
                  </button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 border-none shadow-md space-y-4">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" /> {t('posts_ia.tools_tab.stories_title')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('posts_ia.tools_tab.stories_description')}
              </p>
            </div>
            {config.products.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('posts_ia.tools_tab.register_products_first')}</p>
            ) : (
              <>
                <div>
                  <Label className="text-xs font-medium mb-2 block">{t('posts_ia.tools_tab.select_product')}</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {config.products.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProductStories(p.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-left ${
                          selectedProductStories === p.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                        }`}
                      >
                        {p.photo
                          ? <img src={p.photo} alt={p.name} className="w-8 h-8 object-cover rounded" />
                          : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground/40" /></div>
                        }
                        <span className="text-xs font-medium line-clamp-2">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={gerarStories}
                  disabled={gerandoStories || !selectedProductStories}
                  className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {gerandoStories
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('posts_ia.tools_tab.generating_slides')}</>
                    : <><Sparkles className="w-4 h-4" /> {t('posts_ia.tools_tab.generate_stories')}</>
                  }
                </button>
              </>
            )}
            {stories && (
              <div className="space-y-3">
                {stories.map((s, i) => (
                  <div key={i} className="rounded-lg bg-muted p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">{s.slide}</p>
                      <button
                        onClick={() => copyStory(s.texto, i)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg gradient-primary text-primary-foreground text-xs font-medium shadow-glow"
                      >
                        {copiedStory === i ? <><Check className="w-3 h-3" /> {t('posts_ia.tools_tab.copied')}</> : <><Copy className="w-3 h-3" /> {t('posts_ia.tools_tab.copy')}</>}
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed">{s.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 border-none shadow-md space-y-4">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                <PenLine className="w-4 h-4 text-primary" /> {t('posts_ia.tools_tab.rewrite_title')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('posts_ia.tools_tab.rewrite_description')}
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">{t('posts_ia.tools_tab.original_text')}</Label>
              <textarea
                value={textoOriginal}
                onChange={e => setTextoOriginal(e.target.value)}
                placeholder={t('posts_ia.tools_tab.rewrite_placeholder')}
                rows={5}
                className="w-full text-sm bg-muted rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary font-sans placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block">{t('posts_ia.tools_tab.desired_tone')}</Label>
              <div className="flex gap-2 flex-wrap">
                {(['promocional', 'elegante', 'divertido'] as Tone[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setToneRewrite(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      toneRewrite === t ? 'gradient-primary text-primary-foreground shadow-glow' : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={reescreverLegenda}
              disabled={reescrevendo || !textoOriginal.trim()}
              className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {reescrevendo ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('posts_ia.tools_tab.rewriting')}</> : <><Sparkles className="w-4 h-4" /> {t('posts_ia.tools_tab.rewrite_button')}</>}
            </button>
            {legendaReescrita && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">{t('posts_ia.tools_tab.rewritten_caption')}</Label>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{legendaReescrita}</p>
                </div>
                <button
                  onClick={copyRewrite}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-medium shadow-glow"
                >
                  {copiedRewrite ? <><Check className="w-3 h-3" /> {t('posts_ia.tools_tab.copied_caption')}</> : <><Copy className="w-3 h-3" /> {t('posts_ia.tools_tab.copy_caption')}</>}
                </button>
              </div>
            )}
          </Card>

        </div>
      )}

    </div>
  );
}