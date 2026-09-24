import { useStore, Product } from '@/contexts/StoreContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ExternalLink, Copy, Check, Image as ImageIcon, AlertCircle, Download, Rocket, Share2, Pencil, Instagram, FileText, CheckCircle2, Camera, ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { sanitizeText } from '@/lib/sanitize';
import { validateImageFile } from '@/lib/fileValidation';
import InstagramPostGenerator from '@/components/InstagramPostGenerator';
import InvoiceComparator from '@/components/InvoiceComparator';
import { useT } from '@/lib/i18n';

const shownAlertsRef = new Set<string>();

const Vitrine = () => {
  const t = useT();
  const { config, updateConfig, addProduct, removeProduct, updateProduct, addTransaction } = useStore();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [igProduct, setIgProduct] = useState<Product | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const { checkStockAlert } = useNotifications();
const [showForm, setShowForm] = useState(false);
const [copied, setCopied] = useState(false);
const [registeringSaleFor, setRegisteringSaleFor] = useState<string | null>(null);
const [saleQty, setSaleQty] = useState('1');
  const qrRef = useRef<HTMLDivElement>(null);

  const slug = config.slug || config.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const publicUrl = `${window.location.origin}/loja/${slug}`;

  const handleDownloadQR = useCallback(() => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qrcode-${slug}.png`;
    link.href = url;
    link.click();
    toast.success(t('ext.vt_qr_downloaded'));
  }, [slug]);

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');

useEffect(() => {
    if (config.vitrineOnlyMode) {
      shownAlertsRef.clear();
      return;
    }
    config.products.forEach(product => {
      if (product.stock === 0) return;
      const alertKey = `${product.id}-${product.stock}`;
      if (!shownAlertsRef.has(alertKey)) {
        shownAlertsRef.add(alertKey);
        checkStockAlert(product.name, product.stock);
      }
    });
  }, [config.products, config.vitrineOnlyMode]);

  const handleAddProduct = async () => {
  if (!name.trim() || (!config.vitrineOnlyMode && !originalPrice)) return;
  try {
    await addProduct({
      name: sanitizeText(name),
      photo,
      originalPrice: Math.max(0, parseFloat(originalPrice.replace(',', '.')) || 0),
      discountPrice: discountPrice
  ? Math.max(0.01, parseFloat(discountPrice.replace(',', '.')) || 0)
  : 0,
      description: sanitizeText(description),
      stock: Math.max(0, parseInt(stock) || 0),
    });
    setName(''); setPhoto(''); setOriginalPrice(''); setDiscountPrice(''); setDescription(''); setStock('');
    setShowForm(false);
    toast.success(t('ext.vt_toast_added'));
  } catch (err) {
    console.error('Erro ao salvar produto:', err);
    toast.error(t('ext.vt_toast_save_err'));
  }
};

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success(t('ext.vt_toast_link'));
    setTimeout(() => setCopied(false), 2000);
  };

 const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.ok) {
      toast.error(check.error ?? t('ext.vt_toast_invalid'));
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.ok) {
      toast.error(check.error ?? t('ext.vt_toast_invalid'));
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateConfig({ logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleEditSave = async () => {
    if (!editingProduct) return;
    if (!config.vitrineOnlyMode && editingProduct.originalPrice <= 0) { toast.error(t('ext.vt_toast_price_err')); return; }
    await updateProduct({
      ...editingProduct,
      name: sanitizeText(editingProduct.name),
      description: sanitizeText(editingProduct.description),
      stock: Math.max(0, editingProduct.stock),
      originalPrice: Math.max(0, editingProduct.originalPrice),
    });
    setEditingProduct(null);
    toast.success(t('ext.vt_toast_updated'));
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.ok) {
      toast.error(check.error ?? t('ext.vt_toast_invalid'));
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEditingProduct(prev => prev ? { ...prev, photo: reader.result as string } : null);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">{t('ext.vt_title')}</h1>
        <p className="text-muted-foreground mt-1">{t('ext.vt_subtitle')}</p>
      </div>

      <Card className="p-6 border-none shadow-md space-y-5">
        <h2 className="font-semibold font-heading text-lg">{t('ext.vt_store_config')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('ext.vt_store_name')}</Label>
            <Input value={config.storeName} onChange={e => updateConfig({ storeName: e.target.value })} className="mt-1" placeholder={t('ext.vt_store_name_ph')} maxLength={60} />
          </div>
          <div>
            <Label>{t('ext.vt_whatsapp')}</Label>
            <Input value={config.whatsapp} onChange={e => updateConfig({ whatsapp: e.target.value })} className="mt-1" placeholder={t('ext.vt_whatsapp_ph')} />
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <div>
            <Label>{t('ext.vt_logo')}</Label>
            <label className="mt-2 flex items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors overflow-hidden">
              {config.logo ? <img src={config.logo} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-muted-foreground" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
          <div>
            <Label>{t('ext.vt_color')}</Label>
            <input type="color" value={config.primaryColor} onChange={e => updateConfig({ primaryColor: e.target.value })} className="mt-2 w-20 h-20 rounded-xl cursor-pointer border-0" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={config.vitrineActive} onCheckedChange={v => updateConfig({ vitrineActive: v, ...(v && { vitrineOnlyMode: false }) })} />
          <Label>{t('ext.vt_active')}</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={config.vitrineOnlyMode} onCheckedChange={v => updateConfig({ vitrineOnlyMode: v, ...(v && { vitrineActive: false }) })} />
          <div>
            <Label>{t('ext.vt_only_mode')}</Label>
            <p className="text-xs text-muted-foreground mt-0.5">{t('ext.vt_only_mode_hint')}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 border-none shadow-md space-y-4">
        <Label className="text-sm text-muted-foreground">{t('ext.vt_link')}</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-2.5 rounded-lg bg-muted text-sm font-mono truncate">{publicUrl}</div>
          <button onClick={handleCopy} className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center gap-2 shadow-glow hover:opacity-90 transition-opacity">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t('ext.vt_copied') : t('ext.vt_copy')}
          </button>
          <a href={`/loja/${slug}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-lg bg-muted text-sm font-medium flex items-center gap-2 hover:bg-accent transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div ref={qrRef} className="p-3 bg-white rounded-xl shadow-sm">
            <QRCodeCanvas value={publicUrl} size={120} />
          </div>
          <div className="space-y-2 flex-1 min-w-[160px]">
            <p className="text-sm font-medium">{t('ext.vt_qr_title')}</p>
            <p className="text-xs text-muted-foreground">{t('ext.vt_qr_sub')}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleDownloadQR} className="px-4 py-2 rounded-lg bg-muted text-sm font-medium flex items-center gap-2 hover:bg-accent transition-colors">
                <Download className="w-4 h-4" /> {t('ext.vt_download_png')}
              </button>
              <button
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: config.storeName, text: t('ext.vt_share_text', { name: config.storeName }), url: publicUrl });
                    } catch { /* user cancelled */ }
                  } else {
                    navigator.clipboard.writeText(publicUrl);
                    toast.success(t('ext.vt_toast_link'));
                  }
                }}
                className="px-4 py-2 rounded-lg bg-muted text-sm font-medium flex items-center gap-2 hover:bg-accent transition-colors"
              >
                <Share2 className="w-4 h-4" /> {t('ext.vt_share')}
              </button>
            </div>
          </div>
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-heading">{t('ext.vt_products_count', { n: config.products.length })}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setInvoiceOpen(true)} className="px-4 py-2 rounded-lg bg-muted text-sm font-medium flex items-center gap-2 hover:bg-accent transition-colors">
              <FileText className="w-4 h-4" /> {t('ext.vt_compare')}
            </button>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center gap-2 shadow-glow hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> {t('ext.vt_add')}
            </button>
          </div>
        </div>

        {showForm && (
          <Card className="p-6 border-none shadow-md mb-4 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('ext.vt_form_name')}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" placeholder={t('ext.vt_form_name_ph')} />
              </div>
              <div>
                <Label>{t('ext.vt_form_photo')}</Label>
                <label className="mt-1 flex items-center justify-center h-10 px-4 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-muted transition-colors">
                  {photo ? <><CheckCircle2 className="w-3.5 h-3.5" /> {t('ext.vt_photo_selected')}</> : <><Camera className="w-3.5 h-3.5" /> {t('ext.vt_photo_pick')}</>}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>
            {!config.vitrineOnlyMode && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>{t('ext.vt_form_price')}</Label>
                  <Input value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className="mt-1" placeholder="49,90" />
                </div>
                <div>
                  <Label>{t('ext.vt_form_disc')}</Label>
                  <Input value={discountPrice} onChange={e => setDiscountPrice(e.target.value)} className="mt-1" placeholder="39,90" />
                </div>
                <div>
                  <Label>{t('ext.vt_form_stock')}</Label>
                  <Input type="number" value={stock} onChange={e => setStock(e.target.value)} className="mt-1" placeholder="10" min="0" />
                </div>
              </div>
            )}
            <div>
              <Label>{t('ext.vt_form_desc')}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1" placeholder={t('ext.vt_form_desc_ph')} rows={2} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddProduct} className="px-6 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity">{t('ext.vt_save')}</button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-lg bg-muted text-muted-foreground font-medium text-sm hover:bg-accent transition-colors">{t('ext.vt_cancel')}</button>
            </div>
          </Card>
        )}

        {config.products.length === 0 ? (
          <Card className="p-10 border-none shadow-md text-center">
            <Rocket className="w-12 h-12 mx-auto mb-3 text-primary/30" />
            <p className="text-lg font-semibold font-heading">{t('ext.vt_empty_title')}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{t('ext.vt_empty_sub')}</p>
            <button onClick={() => setShowForm(true)} className="px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> {t('ext.vt_empty_cta')}
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.products.map(p => (
              <Card key={p.id} className="border-none shadow-md overflow-hidden relative">
{p.stock === 0 && !config.vitrineOnlyMode && (
  <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md bg-destructive text-destructive-foreground text-xs font-semibold flex items-center gap-1">
    <AlertCircle className="w-3 h-3" /> {t('ext.vt_out_of_stock')}
  </div>
)}
{p.stock > 0 && p.stock <= 3 && !config.vitrineOnlyMode && (
  <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
    <span className="px-2 py-1 rounded-md bg-warning text-warning-foreground text-xs font-semibold">
      ⚡ {p.stock} restante{p.stock > 1 ? 's' : ''}
    </span>
    <button
      onClick={() => setIgProduct(p)}
      className="px-2 py-1 rounded-md bg-pink-500 text-white text-xs font-semibold flex items-center gap-1 shadow"
    >
      <Instagram className="w-3 h-3" /> Post urgência
    </button>
  </div>
)}
                {p.photo ? (
                  <div className="aspect-square bg-muted"><img src={p.photo} alt={p.name} className="w-full h-full object-cover" /></div>
                ) : (
  <div className="aspect-square bg-black">
    <img src="/produtcs.png" alt="Produto sem foto" className="w-full h-full object-cover" />
  </div>
)}
                <div className="p-4">
                  <h3 className="font-semibold text-sm">{p.name}</h3>
                  {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                  {!config.vitrineOnlyMode && (
                    <div className="flex items-center gap-2 mt-2">
                      {p.discountPrice > 0 && p.originalPrice > p.discountPrice && (
                        <span className="text-xs text-muted-foreground line-through">R$ {p.originalPrice.toFixed(2).replace('.', ',')}</span>
                      )}
                      <span className="text-sm font-bold text-secondary">
                        R$ {(p.discountPrice > 0 ? p.discountPrice : p.originalPrice).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}
                  {!config.vitrineOnlyMode && (
                    <p className="text-xs text-muted-foreground mt-1">{t('ext.vt_stock', { n: p.stock ?? 0 })}</p>
                  )}
<div className="mt-3 flex items-center gap-3 flex-wrap">
  <button onClick={() => setEditingProduct({ ...p })} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
    <Pencil className="w-3 h-3" /> {t('ext.vt_edit')}
  </button>
  <button onClick={() => setIgProduct(p)} className="text-xs text-muted-foreground hover:text-pink-500 flex items-center gap-1 transition-colors">
    <Instagram className="w-3 h-3" /> {t('ext.vt_ig_post')}
  </button>
{!config.vitrineOnlyMode && p.stock > 0 && (
<button
onClick={() => { setRegisteringSaleFor(p.id); setSaleQty('1'); }}
className="text-xs text-muted-foreground hover:text-secondary flex items-center gap-1 transition-colors"
>
<ShoppingCart className="w-3 h-3" /> Registrar venda
</button>
)}
  <button onClick={() => { if (window.confirm('Tem certeza que deseja excluir esse produto?')) removeProduct(p.id); }} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
    <Trash2 className="w-3 h-3" /> {t('ext.vt_remove')}
  </button>
</div>

{registeringSaleFor === p.id && !config.vitrineOnlyMode && (
<div className="mt-3 p-3 rounded-lg bg-secondary/5 border border-secondary/20 space-y-2">
    <p className="text-xs font-medium text-secondary">Registrar venda de "{p.name}"</p>
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="1"
        value={saleQty}
        onChange={e => setSaleQty(e.target.value)}
        className="w-16 h-8 px-2 rounded-md border border-input bg-background text-sm text-center"
        placeholder="Qtd"
      />
      <span className="text-xs text-muted-foreground">×</span>
      <span className="text-xs font-semibold text-secondary">
        R$ {((p.discountPrice > 0 ? p.discountPrice : p.originalPrice) * (parseInt(saleQty) || 1)).toFixed(2).replace('.', ',')}
      </span>
    </div>
    <div className="flex gap-2">
      <button
        onClick={async () => {
          const qty = Math.max(1, parseInt(saleQty) || 1);
          const unitPrice = p.discountPrice > 0 ? p.discountPrice : p.originalPrice;
          await addTransaction({
            type: 'entrada',
            value: unitPrice * qty,
            description: qty > 1 ? `${p.name} (${qty}x)` : p.name,
            category: 'Venda',
            isPersonal: false,
            date: new Date().toISOString(),
          });
          toast.success(`Venda de "${p.name}" registrada no Caixa!`);
          setRegisteringSaleFor(null);
        }}
        className="flex-1 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:opacity-90"
      >
        Confirmar
      </button>
      <button
        onClick={() => setRegisteringSaleFor(null)}
        className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-accent"
      >
        Cancelar
      </button>
    </div>
  </div>
)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {igProduct && (
        <InstagramPostGenerator
          product={igProduct}
          storeName={config.storeName}
          whatsapp={config.whatsapp}
          open={!!igProduct}
          onOpenChange={(o) => !o && setIgProduct(null)}
        />
      )}

      <InvoiceComparator
        products={config.products}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
      />

      <Dialog open={!!editingProduct} onOpenChange={open => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('ext.vt_edit_title')}</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div>
                <Label>{t('ext.vt_form_name')}</Label>
                <Input value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>{t('ext.vt_edit_photo')}</Label>
                <label className="mt-1 flex items-center justify-center h-10 px-4 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-muted transition-colors">
                  {editingProduct.photo ? <><CheckCircle2 className="w-3.5 h-3.5" /> {t('ext.vt_photo_selected')}</> : <><Camera className="w-3.5 h-3.5" /> {t('ext.vt_photo_pick')}</>}
                  <input type="file" accept="image/*" className="hidden" onChange={handleEditPhotoUpload} />
                </label>
                {editingProduct.photo && (
                  <img src={editingProduct.photo} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-lg" />
                )}
              </div>
              {!config.vitrineOnlyMode && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>{t('ext.vt_form_price')}</Label>
                    <Input type="number" step="0.01" min="0" value={editingProduct.originalPrice} onChange={e => setEditingProduct({ ...editingProduct, originalPrice: Math.max(0, parseFloat(e.target.value) || 0) })} className="mt-1" />
                  </div>
                  <div>
                    <Label>{t('ext.vt_edit_price_disc')}</Label>
                    <Input type="number" step="0.01" min="0.01" value={editingProduct.discountPrice} onChange={e => setEditingProduct({ ...editingProduct, discountPrice: parseFloat(e.target.value) || 0 })} className="mt-1" />
                  </div>
                  <div>
                    <Label>{t('ext.vt_edit_stock_short')}</Label>
                    <Input type="number" min="0" value={editingProduct.stock} onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })} className="mt-1" />
                  </div>
                </div>
              )}
              <div>
                <Label>{t('ext.vt_form_desc')}</Label>
                <Textarea value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} className="mt-1" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleEditSave} className="px-6 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity">{t('ext.vt_edit_save')}</button>
                <button onClick={() => setEditingProduct(null)} className="px-6 py-2.5 rounded-lg bg-muted text-muted-foreground font-medium text-sm hover:bg-accent transition-colors">{t('ext.vt_cancel')}</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vitrine;
