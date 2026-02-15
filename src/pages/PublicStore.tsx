import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { StoreConfig } from '@/contexts/StoreContext';
import { MessageCircle, ShoppingBag, AlertCircle } from 'lucide-react';

const PublicStore = () => {
  const { slug } = useParams();
  const [store, setStore] = useState<StoreConfig | null>(null);

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
    <div className="min-h-screen bg-background">
      <header className="py-8 px-4 text-center" style={{ background: `linear-gradient(135deg, ${store.primaryColor}22, ${store.primaryColor}11)` }}>
        {store.logo && <img src={store.logo} alt={store.storeName} className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover shadow-lg" />}
        <h1 className="text-3xl font-bold font-heading" style={{ color: store.primaryColor }}>{store.storeName}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{store.products.length} produtos disponíveis</p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {store.products.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Nenhum produto disponível no momento.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {store.products.map(p => {
              const outOfStock = (p.stock ?? 0) === 0;
              return (
                <div key={p.id} className="bg-card rounded-xl shadow-md overflow-hidden group relative">
                  {outOfStock && (
                    <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md bg-destructive text-destructive-foreground text-xs font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Esgotado
                    </div>
                  )}
                  {p.photo ? (
                    <div className="aspect-square bg-muted overflow-hidden">
                      <img src={p.photo} alt={p.name} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${outOfStock ? 'opacity-50' : ''}`} />
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2">{p.name}</h3>
                    {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {p.originalPrice > p.discountPrice && (
                        <span className="text-xs text-muted-foreground line-through">R$ {p.originalPrice.toFixed(2).replace('.', ',')}</span>
                      )}
                      <span className="text-sm font-bold" style={{ color: store.primaryColor }}>R$ {p.discountPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button
                      onClick={() => handleBuy(p.name, p.discountPrice)}
                      disabled={outOfStock}
                      className="mt-3 w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: outOfStock ? undefined : store.primaryColor, color: outOfStock ? undefined : '#fff' }}
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

      <footer className="py-6 text-center border-t border-border">
        <p className="text-xs text-muted-foreground">Vitrine criada com <span className="font-semibold gradient-text">Biztrivo</span></p>
      </footer>
    </div>
  );
};

export default PublicStore;
