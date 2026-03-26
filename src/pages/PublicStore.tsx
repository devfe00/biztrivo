import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle, ShoppingBag, AlertCircle, Search, Phone, X } from 'lucide-react';
import { listLocalStoreConfigs, slugifyStoreName } from '@/lib/local-store';

interface StoreData {
  storeName: string;
  logo: string;
  primaryColor: string;
  whatsapp: string;
  products: Array<{
    id: string;
    name: string;
    photo: string;
    originalPrice: number;
    discountPrice: number;
    description: string;
    stock: number;
  }>;
}

const PublicStore = () => {
  const { slug } = useParams();
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }

    const storeEntry = listLocalStoreConfigs().find(({ config }) =>
      config.vitrineActive && slugifyStoreName(config.storeName) === slug,
    );

    if (!storeEntry) { setLoading(false); return; }
    const { config } = storeEntry;

    setStore({
      storeName: config.storeName,
      logo: config.logo || '',
      primaryColor: config.primaryColor || '#3b82f6',
      whatsapp: config.whatsapp || '',
      products: config.products,
    });
    setLoading(false);
  }, [slug]);

  // Dynamic theme color meta tag
  useEffect(() => {
    if (!store) return;
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = store.primaryColor;
    document.title = `${store.storeName} | Biztrivo`;
    return () => { document.title = 'Biztrivo'; };
  }, [store]);

  const handleBuy = (productName: string, price: number) => {
    if (!store?.whatsapp) return;
    const phone = store.whatsapp.replace(/\D/g, '');
    const priceStr = price.toFixed(2).replace('.', ',');
    const message = encodeURIComponent(`Olá! Vi o ${productName} por R$ ${priceStr} na vitrine e quero garantir o meu!`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const handleWhatsAppContact = () => {
    if (!store?.whatsapp) return;
    const phone = store.whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Estou visitando a vitrine ${store.storeName} e gostaria de mais informações!`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const filteredProducts = store?.products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fafafa' }}>
        <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fafafa' }}>
        <div className="text-center px-4">
          <ShoppingBag className="w-14 h-14 mx-auto mb-4" style={{ color: '#cbd5e1' }} />
          <h1 className="text-xl font-bold" style={{ color: '#1e293b' }}>Vitrine não encontrada</h1>
          <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>Esta vitrine pode estar inativa ou não existir.</p>
        </div>
      </div>
    );
  }

  const pc = store.primaryColor;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#fafafa' }}>
      {/* Header — minimal, uses store branding */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: '#fff', borderColor: '#f1f5f9' }}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {store.logo && (
                <img src={store.logo} alt={store.storeName} className="w-10 h-10 rounded-lg object-cover" style={{ boxShadow: `0 2px 8px ${pc}30` }} />
              )}
              <div>
                <h1 className="text-lg font-bold leading-tight" style={{ color: pc }}>{store.storeName}</h1>
                <p className="text-xs" style={{ color: '#94a3b8' }}>{filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b' }}
              onFocus={(e) => (e.target.style.borderColor = pc)}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Products grid */}
      <main className="max-w-4xl mx-auto px-4 py-5">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-10 h-10 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
            <p style={{ color: '#94a3b8' }} className="text-sm">{searchQuery ? `Nenhum produto para "${searchQuery}"` : 'Nenhum produto disponível.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const outOfStock = product.stock === 0;
              return (
                <div key={product.id} className="rounded-xl overflow-hidden group relative" style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  {outOfStock && (
                    <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                      <AlertCircle className="w-3 h-3" /> Esgotado
                    </div>
                  )}
                  {product.photo ? (
                    <div className="aspect-square overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
                      <img src={product.photo} alt={product.name} loading="lazy" className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${outOfStock ? 'opacity-40 grayscale' : ''}`} />
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>
                      <ShoppingBag className="w-8 h-8" style={{ color: '#cbd5e1' }} />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2" style={{ color: '#1e293b' }}>{product.name}</h3>
                    {product.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#94a3b8' }}>{product.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {product.originalPrice > product.discountPrice && (
                        <span className="text-xs line-through" style={{ color: '#94a3b8' }}>R$ {product.originalPrice.toFixed(2).replace('.', ',')}</span>
                      )}
                      <span className="text-sm font-bold" style={{ color: pc }}>R$ {product.discountPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button
                      onClick={() => handleBuy(product.name, product.discountPrice)}
                      disabled={outOfStock}
                      className="mt-3 w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: outOfStock ? '#94a3b8' : pc, color: '#fff' }}
                    >
                      <MessageCircle className="w-4 h-4" /> {outOfStock ? 'Esgotado' : 'Comprar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating WhatsApp */}
      {showWhatsAppButton && store.whatsapp && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
          <button
            onClick={handleWhatsAppContact}
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            style={{ backgroundColor: '#25D366' }}
            title="Fale conosco"
          >
            <Phone className="w-6 h-6 text-white" />
          </button>
          <button onClick={() => setShowWhatsAppButton(false)} className="w-5 h-5 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity" style={{ backgroundColor: '#334155' }}>
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="py-5 text-center border-t" style={{ borderColor: '#f1f5f9' }}>
        <p className="text-xs" style={{ color: '#94a3b8' }}>Vitrine criada com <span className="font-semibold" style={{ color: pc }}>Biztrivo</span></p>
      </footer>
    </div>
  );
};

export default PublicStore;
