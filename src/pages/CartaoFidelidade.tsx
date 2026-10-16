import { useMemo } from 'react';
import { Gift, Check } from 'lucide-react';

const CartaoFidelidade = () => {
  const data = useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const goal = Math.min(50, Math.max(2, Number(p.get('g')) || 10));
      return {
        store: (p.get('l') || '').slice(0, 80),
        name: (p.get('n') || '').slice(0, 80),
        stamps: Math.min(goal, Math.max(0, Number(p.get('s')) || 0)),
        rewards: Math.max(0, Number(p.get('r')) || 0),
        goal,
      };
    } catch { return null; }
  }, []);
  if (!data || !data.store) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cartão inválido</div>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white text-gray-900 shadow-2xl p-6">
        <div className="flex items-center gap-2 mb-1"><Gift className="w-5 h-5 text-green-600" /><p className="font-bold">{data.store}</p></div>
        <p className="text-sm text-gray-500 mb-5">Cartão fidelidade de <b className="text-gray-800">{data.name}</b></p>
        <div className="grid grid-cols-5 gap-3 mb-5">
          {Array.from({ length: data.goal }, (_, i) => (
            <div key={i} className={`aspect-square rounded-full flex items-center justify-center border-2 ${i < data.stamps ? 'bg-green-500 border-green-500 text-white' : 'border-dashed border-gray-300 text-gray-300'}`}>
              {i < data.stamps ? <Check className="w-5 h-5" /> : i === data.goal - 1 ? <Gift className="w-4 h-4" /> : i + 1}
            </div>
          ))}
        </div>
        <p className="text-center font-semibold">Compre {data.goal}, ganhe 1 🎁</p>
        <p className="text-center text-sm text-gray-500">Faltam {data.goal - data.stamps} compras · Prêmios ganhos: {data.rewards}</p>
        <p className="text-center text-[10px] text-gray-400 mt-4">Biztrivo</p>
      </div>
    </div>
  );
};
export default CartaoFidelidade;
