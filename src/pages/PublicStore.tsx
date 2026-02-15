import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { StoreConfig } from '@/contexts/StoreContext';
import { MessageCircle, ShoppingBag, AlertCircle, Search, Phone, X } from 'lucide-react';

const PublicStore = () => {
  const { slug } = useParams();
  const [store, setStore] = useState<StoreConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('biztrivo-store');
    if (saved) {
      const config = JSON.parse(saved) as StoreConfig;
      const configSlug = config.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (configSlug === slug && config.vitrineActive) {
        setStore(config);
        const updated = { ...config, vitrineClicks: (config.vitrineClicks || 0) + 1 };
        localStorage.setItem('biztrivo-store', JSON.stringify(updated));
      }
    }
  }, [slug]);

  const handleBuy = (productName: string, price: number) => {
    if (!store?.whatsapp) return;
    const phone = store.whatsapp.replace(/\D/g, '');
    const priceStr = price.toFixed(2).replace('.', ',');
    const message = encodeURIComponent(
      `Olá! Vi o ${productName} por R$ ${priceStr} na vitrine da Biztrivo e quero garantir o meu!`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const handleWhatsAppContact = () => {
    if (!store?.whatsapp) return;
    const phone = store.whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá! Estou visitando a vitrine ${store.storeName} e gostaria de mais informações!`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const filteredProducts = store?.products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold font-heading">Vitrine não encontrada</h1>
          <p className="text-muted-foreground mt-2">Esta vitrine pode estar inativa ou não existir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header 
        className="sticky top-0 z-40 backdrop-blur-lg border-b border-border/50"
        style={{ 
          background: `linear-gradient(135deg, ${store.primaryColor}15, ${store.primaryColor}08)` 
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {store.logo && (
                <img 
                  src={store.logo} 
                  alt={store.storeName} 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shadow-lg ring-2 ring-background" 
                />
              )}
              <div>
                <h1 
                  className="text-xl sm:text-2xl font-bold font-heading" 
                  style={{ color: store.primaryColor }}
                >
                  {store.storeName}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'} disponíveis
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {searchQuery && filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum produto encontrado para "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-sm font-medium hover:underline"
              style={{ color: store.primaryColor }}
            >
              Limpar busca
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Nenhum produto disponível no momento.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(p => {
              const outOfStock = (p.stock ?? 0) === 0;
              return (
                <div key={p.id} className="bg-card rounded-xl shadow-md overflow-hidden group relative hover:shadow-xl transition-all duration-300">
                  {outOfStock && (
                    <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md bg-destructive text-destructive-foreground text-xs font-semibold flex items-center gap-1 shadow-lg">
                      <AlertCircle className="w-3 h-3" />
                      Esgotado
                    </div>
                  )}
                  {p.photo ? (
                    <div className="aspect-square bg-muted overflow-hidden">
                      <img 
                        src={p.photo} 
                        alt={p.name} 
                        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${outOfStock ? 'opacity-50 grayscale' : ''}`} 
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                    {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {p.originalPrice > p.discountPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          R$ {p.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      <span className="text-sm font-bold" style={{ color: store.primaryColor }}>
                        R$ {p.discountPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    {p.originalPrice > p.discountPrice && (
                      <div className="mt-1">
                        <span className="text-xs font-semibold text-secondary">
                          {Math.round(((p.originalPrice - p.discountPrice) / p.originalPrice) * 100)}% OFF
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => handleBuy(p.name, p.discountPrice)}
                      disabled={outOfStock}
                      className="mt-3 w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
                      style={{ 
                        backgroundColor: outOfStock ? '#7f8c8d' : store.primaryColor, 
                        color: '#fff' 
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {outOfStock ? 'Esgotado' : 'Comprar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showWhatsAppButton && store.whatsapp && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          <button
            onClick={handleWhatsAppContact}
            className="group relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 animate-bounce"
            style={{ backgroundColor: '#25D366' }}
            title="Fale conosco no WhatsApp"
          >
            <Phone className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            
            <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
              Fale conosco!
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          </button>

          <button
            onClick={() => setShowWhatsAppButton(false)}
            className="w-6 h-6 rounded-full bg-gray-800/80 hover:bg-gray-800 flex items-center justify-center transition-all opacity-60 hover:opacity-100"
            title="Fechar"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      <footer className="py-6 text-center border-t border-border bg-card/50 backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">
          Vitrine criada com <span className="font-semibold gradient-text">Biztrivo</span>
        </p>
      </footer>
    </div>
  );
};

export default PublicStore;