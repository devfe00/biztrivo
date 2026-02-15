import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, DollarSign, Percent, Package, Lock, Star } from 'lucide-react';

const Calculadora = () => {
  // SIMULAÇÃO: Mude para 'true' para ver como fica para quem pagou
  const [isPro, setIsPro] = useState(false);

  const [custo, setCusto] = useState('');
  const [impostos, setImpostos] = useState('');
  const [margem, setMargem] = useState('');

  const resultado = useMemo(() => {
    const c = parseFloat(custo.replace(',', '.')) || 0;
    const i = parseFloat(impostos.replace(',', '.')) || 0;
    const m = parseFloat(margem.replace(',', '.')) || 0;

    if (c <= 0 || m >= 100) return null;

    const custoComImpostos = c * (1 + i / 100);
    const precoVenda = custoComImpostos / (1 - m / 100);
    const lucroUnitario = precoVenda - custoComImpostos;

    return { precoVenda, lucroUnitario, custoComImpostos };
  }, [custo, impostos, margem]);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleUpgrade = () => {
    // Coloque aqui o mesmo link do AppLayout ou abra o modal
    window.open('https://www.mercadopago.com.br/subscriptions', '_blank');
  };

  return (
    <div className="relative min-h-[600px]">
      
      {/* --- CABEÇALHO (Sempre visível) --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
          Calculadora de Preço
          {isPro && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">PRO ATIVO</span>}
        </h1>
        <p className="text-muted-foreground mt-1">Descubra o preço ideal para lucrar de verdade</p>
      </div>

      {/* --- OVERLAY DE BLOQUEIO (Só aparece se NÃO for PRO) --- */}
      {!isPro && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pt-20">
            {/* Fundo levemente escuro para destacar o modal */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[6px] z-40 rounded-xl" />
            
            <Card className="relative z-50 w-full max-w-md p-8 text-center border-2 border-primary/20 shadow-2xl bg-card animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold font-heading mb-3">Funcionalidade PRO</h2>
              <p className="text-muted-foreground mb-8">
                Pare de perder dinheiro errando no preço. A calculadora de margem real é exclusiva para assinantes Biztrivo.
              </p>
              
              <Button 
                onClick={handleUpgrade} 
                className="w-full h-12 text-lg font-semibold shadow-lg hover:scale-105 transition-all gradient-primary text-primary-foreground"
              >
                <Star className="w-5 h-5 mr-2 fill-current" />
                Desbloquear Agora
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Apenas R$ 19,90/mês. Cancele quando quiser.
              </p>
            </Card>
        </div>
      )}

      {/* --- CONTEÚDO DA CALCULADORA (Fica borrado atrás do overlay) --- */}
      <div className={`space-y-8 transition-all duration-500 ${!isPro ? 'opacity-40 pointer-events-none select-none filter blur-[2px]' : ''}`}>
        
        <Card className="p-6 border-none shadow-md space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="custo" className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Custo da Peça (R$)
              </Label>
              <Input
                id="custo"
                placeholder="25,00"
                value={custo}
                onChange={e => setCusto(e.target.value)}
                className="mt-1 text-lg font-semibold"
              />
            </div>
            <div>
              <Label htmlFor="impostos" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-warning" />
                Impostos / Taxas (%)
              </Label>
              <Input
                id="impostos"
                placeholder="10"
                value={impostos}
                onChange={e => setImpostos(e.target.value)}
                className="mt-1 text-lg font-semibold"
              />
            </div>
            <div>
              <Label htmlFor="margem" className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-secondary" />
                Margem de Lucro (%)
              </Label>
              <Input
                id="margem"
                placeholder="50"
                value={margem}
                onChange={e => setMargem(e.target.value)}
                className="mt-1 text-lg font-semibold"
              />
            </div>
          </div>

          <div className="pt-2 text-xs text-muted-foreground">
            <p>Fórmula: Preço = Custo com impostos ÷ (1 - Margem/100)</p>
          </div>
        </Card>

        {resultado ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-6 border-none shadow-md text-center gradient-primary text-primary-foreground">
              <Calculator className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-sm opacity-90">Preço de Venda Sugerido</p>
              <p className="text-3xl font-bold font-heading mt-1">{formatCurrency(resultado.precoVenda)}</p>
            </Card>
            <Card className="p-6 border-none shadow-md text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-secondary" />
              <p className="text-sm text-muted-foreground">Lucro por Unidade</p>
              <p className="text-3xl font-bold font-heading mt-1 text-secondary">{formatCurrency(resultado.lucroUnitario)}</p>
            </Card>
            <Card className="p-6 border-none shadow-md text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-warning" />
              <p className="text-sm text-muted-foreground">Custo + Impostos</p>
              <p className="text-3xl font-bold font-heading mt-1 text-warning">{formatCurrency(resultado.custoComImpostos)}</p>
            </Card>
          </div>
        ) : (
          <Card className="p-10 border-none shadow-md text-center">
            <Calculator className="w-12 h-12 mx-auto mb-3 text-primary/30" />
            <p className="text-lg font-semibold font-heading text-muted-foreground">Preencha os campos acima</p>
            <p className="text-sm text-muted-foreground mt-1">O preço ideal aparecerá aqui automaticamente ✨</p>
          </Card>
        )}

        <Card className="p-5 border-none shadow-md bg-muted/50">
          <h3 className="font-semibold font-heading text-sm mb-2">💡 Dica de Precificação</h3>
          <p className="text-sm text-muted-foreground">
            Margens entre <strong>40% e 60%</strong> são ideais para revenda. Abaixo de 30% pode não cobrir seus custos operacionais.
            Lembre-se de incluir embalagem, frete e tempo dedicado no custo!
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Calculadora;