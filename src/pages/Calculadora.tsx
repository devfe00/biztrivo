import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, DollarSign, Percent, Package } from 'lucide-react';

const Calculadora = () => {
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">Calculadora de Preço</h1>
        <p className="text-muted-foreground mt-1">Descubra o preço ideal para lucrar de verdade</p>
      </div>

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
  );
};

export default Calculadora;
