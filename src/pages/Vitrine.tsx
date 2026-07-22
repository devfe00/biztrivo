import { useStore, Product } from '@/contexts/StoreContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ExternalLink, Copy, Check, Image as ImageIcon, AlertCircle, Download, Rocket, Share2, Pencil, Instagram, FileText, CheckCircle2, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { sanitizeText } from '@/lib/sanitize';
import { validateImageFile } from '@/lib/fileValidation';
import InstagramPostGenerator from '@/components/InstagramPostGenerator';
import InvoiceComparator from '@/components/InvoiceComparator';

const Vitrine = () => {
  const { config, updateConfig, addProduct, removeProduct, updateProduct } = useStore();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [igProduct, setIgProduct] = useState<Product | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const { checkStockAlert } = useNotifications();
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);
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
    toast.success('QR Code baixado!');
  }, [slug]);

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    config.products.forEach(product => {
      const hasShown = sessionStorage.getItem(`stock-alert-${product.id}`);
      if (!hasShown) {
        checkStockAlert(product.name, product.stock);
        if (product.stock <= 3) sessionStorage.setItem(`stock-alert-${product.id}`, 'true');
      }
    });
  }, [config.products, checkStockAlert]);

  const handleAddProduct = async () => {
  if (!name.trim() || !originalPrice) return;
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
    toast.success('Produto adicionado!');
  } catch (err) {
    console.error('Erro ao salvar produto:', err);
    toast.error('Erro ao salvar produto. Verifique o console.');
  }
};

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

 const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.ok) {
      toast.error(check.error ?? 'Arquivo inválido.');
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
      toast.error(check.error ?? 'Arquivo inválido.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateConfig({ logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleEditSave = async () => {
    if (!editingProduct) return;
    if (editingProduct.originalPrice <= 0) { toast.error('O preço deve ser maior que zero.'); return; }
    await updateProduct({
      ...editingProduct,
      name: sanitizeText(editingProduct.name),
      description: sanitizeText(editingProduct.description),
      stock: Math.max(0, editingProduct.stock),
      originalPrice: Math.max(0, editingProduct.originalPrice),
    });
    setEditingProduct(null);
    toast.success('Produto atualizado!');
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.ok) {
      toast.error(check.error ?? 'Arquivo inválido.');
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
        <h1 className="text-3xl font-bold font-heading">Minha Vitrine</h1>
        <p className="text-muted-foreground mt-1">Configure seu catálogo profissional</p>
      </div>

      <Card className="p-6 border-none shadow-md space-y-5">
        <h2 className="font-semibold font-heading text-lg">Configurações da Loja</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Nome da Loja</Label>
            <Input value={config.storeName} onChange={e => updateConfig({ storeName: e.target.value })} className="mt-1" placeholder="Ex: Moda da Mari" maxLength={60} />
          </div>
          <div>
            <Label>WhatsApp (com DDD)</Label>
            <Input value={config.whatsapp} onChange={e => updateConfig({ whatsapp: e.target.value })} className="mt-1" placeholder="11999999999" />
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <div>
            <Label>Logo da Loja</Label>
            <label className="mt-2 flex items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors overflow-hidden">
              {config.logo ? <img src={config.logo} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-muted-foreground" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
          <div>
            <Label>Cor Principal</Label>
            <input type="color" value={config.primaryColor} onChange={e => updateConfig({ primaryColor: e.target.value })} className="mt-2 w-20 h-20 rounded-xl cursor-pointer border-0" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={config.vitrineActive} onCheckedChange={v => updateConfig({ vitrineActive: v })} />
          <Label>Vitrine Ativa</Label>
        </div>
      </Card>

      <Card className="p-5 border-none shadow-md space-y-4">
        <Label className="text-sm text-muted-foreground">Link da sua vitrine</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-2.5 rounded-lg bg-muted text-sm font-mono truncate">{publicUrl}</div>
          <button onClick={handleCopy} className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center gap-2 shadow-glow hover:opacity-90 transition-opacity">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar'}
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
            <p className="text-sm font-medium">QR Code da sua loja</p>
            <p className="text-xs text-muted-foreground">Imprima e cole no seu ponto de venda ou cartão de visita.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleDownloadQR} className="px-4 py-2 rounded-lg bg-muted text-sm font-medium flex items-center gap-2 hover:bg-accent transition-colors">
                <Download className="w-4 h-4" /> Baixar PNG
              </button>
              <button
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: config.storeName, text: `Confira a vitrine ${config.storeName}!`, url: publicUrl });
                    } catch { /* user cancelled */ }
                  } else {
                    navigator.clipboard.writeText(publicUrl);
                    toast.success('Link copiado!');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-muted text-sm font-medium flex items-center gap-2 hover:bg-accent transition-colors"
              >
                <Share2 className="w-4 h-4" /> Compartilhar
              </button>
            </div>
          </div>
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-heading">Produtos ({config.products.length})</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setInvoiceOpen(true)} className="px-4 py-2 rounded-lg bg-muted text-sm font-medium flex items-center gap-2 hover:bg-accent transition-colors">
              <FileText className="w-4 h-4" /> Comparar Nota
            </button>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center gap-2 shadow-glow hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>

        {showForm && (
          <Card className="p-6 border-none shadow-md mb-4 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Produto</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" placeholder="Ex: Camiseta Básica" />
              </div>
              <div>
                <Label>Foto do Produto</Label>
                <label className="mt-1 flex items-center justify-center h-10 px-4 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-muted transition-colors">
                  {photo ? <><CheckCircle2 className="w-3.5 h-3.5" /> Foto selecionada</> : <><Camera className="w-3.5 h-3.5" /> Selecionar foto</>}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Preço Original (R$)</Label>
                <Input value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className="mt-1" placeholder="49,90" />
              </div>
              <div>
                <Label>Preço com Desconto (R$)</Label>
                <Input value={discountPrice} onChange={e => setDiscountPrice(e.target.value)} className="mt-1" placeholder="39,90" />
              </div>
              <div>
                <Label>Estoque Atual</Label>
                <Input type="number" value={stock} onChange={e => setStock(e.target.value)} className="mt-1" placeholder="10" min="0" />
              </div>
            </div>
            <div>
              <Label>Descrição Curta</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1" placeholder="Uma breve descrição do produto..." rows={2} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddProduct} className="px-6 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity">Salvar Produto</button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-lg bg-muted text-muted-foreground font-medium text-sm hover:bg-accent transition-colors">Cancelar</button>
            </div>
          </Card>
        )}

        {config.products.length === 0 ? (
          <Card className="p-10 border-none shadow-md text-center">
            <Rocket className="w-12 h-12 mx-auto mb-3 text-primary/30" />
            <p className="text-lg font-semibold font-heading">Sua vitrine está esperando!</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Adicione seu primeiro produto e comece a vender agora mesmo 🚀</p>
            <button onClick={() => setShowForm(true)} className="px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Cadastrar Primeiro Produto
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.products.map(p => (
              <Card key={p.id} className="border-none shadow-md overflow-hidden relative">
                {p.stock === 0 && (
                  <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md bg-destructive text-destructive-foreground text-xs font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Esgotado
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
                  <div className="flex items-center gap-2 mt-2">
                    {p.originalPrice > p.discountPrice && <span className="text-xs text-muted-foreground line-through">R$ {p.originalPrice.toFixed(2).replace('.', ',')}</span>}
                    <span className="text-sm font-bold text-secondary">R$ {p.discountPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Estoque: {p.stock ?? 0}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button onClick={() => setEditingProduct({ ...p })} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                    <button onClick={() => setIgProduct(p)} className="text-xs text-muted-foreground hover:text-pink-500 flex items-center gap-1 transition-colors">
                      <Instagram className="w-3 h-3" /> Post IA
                    </button>
                    <button onClick={() => removeProduct(p.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                      <Trash2 className="w-3 h-3" /> Remover
                    </button>
                  </div>
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
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div>
                <Label>Nome do Produto</Label>
                <Input value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Foto</Label>
                <label className="mt-1 flex items-center justify-center h-10 px-4 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-muted transition-colors">
                  {editingProduct.photo ? <><CheckCircle2 className="w-3.5 h-3.5" /> Foto selecionada</> : <><Camera className="w-3.5 h-3.5" /> Selecionar foto</>}
                  <input type="file" accept="image/*" className="hidden" onChange={handleEditPhotoUpload} />
                </label>
                {editingProduct.photo && (
                  <img src={editingProduct.photo} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-lg" />
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Preço Original (R$)</Label>
                  <Input type="number" step="0.01" min="0" value={editingProduct.originalPrice} onChange={e => setEditingProduct({ ...editingProduct, originalPrice: Math.max(0, parseFloat(e.target.value) || 0) })} className="mt-1" />
                </div>
                <div>
                  <Label>Preço Desconto (R$)</Label>
                  <Input type="number" step="0.01" min="0.01" value={editingProduct.discountPrice} onChange={e => setEditingProduct({ ...editingProduct, discountPrice: parseFloat(e.target.value) || 0 })} className="mt-1" />
                </div>
                <div>
                  <Label>Estoque</Label>
                  <Input type="number" min="0" value={editingProduct.stock} onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Descrição Curta</Label>
                <Textarea value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} className="mt-1" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleEditSave} className="px-6 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity">Salvar</button>
                <button onClick={() => setEditingProduct(null)} className="px-6 py-2.5 rounded-lg bg-muted text-muted-foreground font-medium text-sm hover:bg-accent transition-colors">Cancelar</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vitrine;
