import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Gift, Plus, MessageCircle, Trash2, AlertTriangle, Share2 } from 'lucide-react';
import { useStore, LoyaltyCustomer } from '@/contexts/StoreContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { addStamp, daysSinceLastPurchase, dormantCustomers } from '@/lib/loyalty';

const waPhone = (p: string) => { const d = p.replace(/\D/g, ''); return d.length <= 11 ? `55${d}` : d; };

const Fidelidade = () => {
  const { config, updateConfig } = useStore();
  const customers = config.loyaltyCustomers;
  const goal = config.loyaltyGoal || 10;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [days, setDays] = useState(30);

  const vitrineUrl = config.slug ? `${window.location.origin}/loja/${config.slug}?fidelidade=1` : '';
  const dormant = useMemo(() => dormantCustomers(customers, days), [customers, days]);
  const save = (list: LoyaltyCustomer[]) => updateConfig({ loyaltyCustomers: list }).catch(() => toast.error('Não foi possível salvar.'));

  const add = () => {
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) { toast.error('Informe nome e WhatsApp com DDD.'); return; }
    save([{ id: crypto.randomUUID(), name: name.trim(), phone, stamps: 0, rewards: 0, purchases: [] }, ...customers]);
    setName(''); setPhone('');
  };
  const stamp = (c: LoyaltyCustomer) => {
    const r = addStamp(c, goal);
    save(customers.map(x => x.id === c.id ? r.customer : x));
    if (r.earnedReward) toast.success(`🎁 ${c.name} ganhou um prêmio!`);
  };
  const remove = (c: LoyaltyCustomer) => { if (window.confirm(`Remover ${c.name}?`)) save(customers.filter(x => x.id !== c.id)); };
  const cardLink = (c: LoyaltyCustomer) => `${window.location.origin}/cartao?${new URLSearchParams({ l: config.storeName, n: c.name, s: String(c.stamps), r: String(c.rewards), g: String(goal) })}`;
  const shareCard = (c: LoyaltyCustomer) => {
    const msg = `Oi ${c.name}! Aqui está seu cartão fidelidade da ${config.storeName}: ${c.stamps}/${goal} carimbos. ${cardLink(c)}`;
    window.open(`https://wa.me/${waPhone(c.phone)}?text=${encodeURIComponent(msg)}`, '_blank');
  };
  const winBack = (c: LoyaltyCustomer, d: number) => {
    const falta = goal - c.stamps;
    const msg = `Oi ${c.name}, tudo bem? Sentimos sua falta aqui na ${config.storeName}! 💚 Faz ${d} dias da sua última compra. Chegaram novidades que acho que você vai gostar${falta < goal ? `, e você está a só ${falta} compra(s) de ganhar um prêmio no cartão fidelidade 🎁` : ''}. Quer que eu te mande as opções?${vitrineUrl ? ' ' + vitrineUrl.replace('?fidelidade=1', '') : ''}`;
    window.open(`https://wa.me/${waPhone(c.phone)}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">Clientes e Fidelidade</h1>
        <p className="text-muted-foreground mt-1">Cartão "compre {goal}, ganhe 1" e alertas de clientes que pararam de comprar.</p>
      </div>

      <Card className="p-6 border-none shadow-md">
        <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-warning" /><h2 className="font-semibold font-heading">Venda parada</h2></div>
        <div className="flex items-center gap-2 text-sm mb-4">
          Clientes sem comprar há pelo menos
          <Input type="number" min={7} max={365} value={days} onChange={e => setDays(Math.max(1, Number(e.target.value) || 30))} className="w-20 h-8" /> dias
        </div>
        {dormant.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum cliente parado. 👏</p> : (
          <div className="space-y-2">
            {dormant.map(({ c, d }) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-warning/5">
                <div><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{d} dias sem comprar</p></div>
                <Button size="sm" onClick={() => winBack(c, d)}><MessageCircle className="w-4 h-4 mr-1" /> Mensagem de recompra</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-[1fr_auto] gap-6">
        <Card className="p-6 border-none shadow-md space-y-3">
          <h2 className="font-semibold font-heading">Novo cliente no cartão</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} maxLength={80} />
            <Input placeholder="WhatsApp com DDD" value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={add}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            <span className="text-sm text-muted-foreground flex items-center gap-2">Compras para ganhar 1:
              <Input type="number" min={2} max={50} value={goal} onChange={e => updateConfig({ loyaltyGoal: Number(e.target.value) || 10 })} className="w-20 h-8" />
            </span>
          </div>
        </Card>
        {vitrineUrl && (
          <Card className="p-6 border-none shadow-md text-center">
            <div className="bg-white p-2 rounded-lg inline-block"><QRCodeSVG value={vitrineUrl} size={130} /></div>
            <p className="text-xs text-muted-foreground mt-2 max-w-[160px]">Cliente escaneia, abre sua vitrine e pede o cartão pelo WhatsApp</p>
          </Card>
        )}
      </div>

      <div className="space-y-2">
        {customers.length === 0 && <Card className="p-10 border-none shadow-md text-center text-muted-foreground"><Gift className="w-10 h-10 mx-auto mb-2 opacity-40" />Nenhum cliente no cartão ainda.</Card>}
        {customers.map(c => {
          const d = daysSinceLastPurchase(c);
          return (
            <Card key={c.id} className="p-4 border-none shadow-sm flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-medium">{c.name} {c.rewards > 0 && <span className="text-xs text-secondary ml-1">🎁 {c.rewards}</span>}</p>
                <div className="flex gap-1 mt-1">{Array.from({ length: goal }, (_, i) => <span key={i} className={`w-3 h-3 rounded-full ${i < c.stamps ? 'bg-secondary' : 'bg-muted'}`} />)}</div>
                <p className="text-xs text-muted-foreground mt-1">{c.stamps}/{goal}{d !== null ? ` · última compra há ${d} dia(s)` : ''}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => stamp(c)}><Plus className="w-4 h-4 mr-1" /> Compra</Button>
                <Button size="sm" variant="outline" onClick={() => shareCard(c)} aria-label="Enviar cartão"><Share2 className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(c)} aria-label="Remover"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
export default Fidelidade;
