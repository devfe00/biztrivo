import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Copy, Instagram, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { FUNCTIONS, callFunction } from '@/integrations/firebase/firebase';
import type { Product } from '@/contexts/StoreContext';

interface Props {
  product: Product;
  storeName: string;
  whatsapp: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tone = 'promocional' | 'elegante' | 'divertido';

const toneKeyMap: Record<Tone, string> = { promocional: 'promotional', elegante: 'elegant', divertido: 'funny' };

const RATE_KEY = 'ig_post_last_gen';
const RATE_LIMIT_MS = 60_000; // 1min entre gerações

export default function InstagramPostGenerator({ product, storeName, whatsapp, open, onOpenChange }: Props) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState<Tone>('promocional');
  const [result, setResult] = useState<{ imageUrl: string; caption: string; hashtags: string[] } | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    const last = Number(localStorage.getItem(RATE_KEY) || 0);
    if (Date.now() - last < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - (Date.now() - last)) / 1000);
      toast.error(t('instagram_post.rate_limit_wait', { seconds: wait }));
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await callFunction<{ imageUrl: string; caption: string; hashtags: string[]; error?: string }>(FUNCTIONS.generateInstagramPost, {
        product: {
          name: product.name,
          description: product.description,
          originalPrice: product.originalPrice,
          discountPrice: product.discountPrice,
          photo: product.photo,
        },
        storeName,
        whatsapp,
        tone,
      });
      if (!data?.imageUrl) throw new Error(data?.error || t('instagram_post.generate_error'));
      setResult(data);
      localStorage.setItem(RATE_KEY, String(Date.now()));
      toast.success(t('instagram_post.generate_success'));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t('instagram_post.generate_error_generic'));
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.imageUrl;
    a.download = `${product.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-instagram.png`;
    a.click();
    toast.success(t('instagram_post.image_downloaded'));
  };

  const copyCaption = async () => {
    if (!result) return;
    const text = `${result.caption}\n\n${result.hashtags.join(' ')}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t('instagram_post.caption_copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-500" />
            {t('instagram_post.dialog_title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">{t('instagram_post.tone_label')}</p>
            <div className="flex gap-2 flex-wrap">
              {(['promocional', 'elegante', 'divertido'] as Tone[]).map((tn) => (
                <button
                  key={tn}
                  onClick={() => setTone(tn)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    tone === tn ? 'gradient-primary text-primary-foreground shadow-glow' : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {t(`instagram_post.tone_${toneKeyMap[tn]}`)}
                </button>
              ))}
            </div>
          </div>

          {!result && !loading && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
              <Sparkles className="w-10 h-10 mx-auto text-primary/40" />
              <p className="text-sm text-muted-foreground">
                {t('instagram_post.intro_text', { name: product.name })}
              </p>
              <Button onClick={generate} className="gradient-primary text-primary-foreground shadow-glow">
                <Sparkles className="w-4 h-4 mr-2" /> {t('instagram_post.generate_post')}
              </Button>
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-border p-10 text-center space-y-3">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('instagram_post.generating_text')}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-fade-in">
              <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                <img src={result.imageUrl} alt="Post Instagram" className="w-full h-full object-cover" />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('instagram_post.caption_label')}</p>
                <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">{result.caption}</div>
              </div>

              {result.hashtags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('instagram_post.hashtags_label')}</p>
                  <div className="rounded-lg bg-muted p-3 text-sm text-primary">{result.hashtags.join(' ')}</div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={download} variant="default" className="gradient-primary text-primary-foreground shadow-glow">
                  <Download className="w-4 h-4 mr-2" /> {t('instagram_post.download_image')}
                </Button>
                <Button onClick={copyCaption} variant="outline">
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? t('instagram_post.copied') : t('instagram_post.copy_caption')}
                </Button>
                <Button onClick={generate} variant="ghost" disabled={loading}>
                  <Sparkles className="w-4 h-4 mr-2" /> {t('instagram_post.generate_another')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}