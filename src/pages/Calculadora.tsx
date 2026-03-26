import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, DollarSign, Percent, Package, AlertCircle } from 'lucide-react';

const Calculadora = () => {
  const [custo, setCusto] = useState('');
  const [impostos, setImpostos] = useState('');
  const [margem, setMargem] = useState('');

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    const c = parseFloat(custo.replace(',', '.'));
    const m = parseFloat(margem.replace(',', '.'));
    const i = parseFloat(impostos.replace(',', '.'));

    if (custo && (isNaN(c) || c < 0)) errs.custo = 'O custo não pode ser negativo.';
    if (impostos && (isNaN(i) || i < 0)) errs.impostos = 'O valor de impostos não pode ser negativo.';
    if (margem && isNaN(m)) errs.margem = 'Insira um número válido.';
    else if (margem && m < 0) errs.margem = 'A margem não pode ser negativa.';
    else if (margem && m >= 100) errs.margem = 'A margem deve ser menor que 100%. Valores ≥ 100% tornam o cálculo impossível.';

    return errs;
  }, [custo, impostos, margem]);

  const hasErrors = Object.keys(errors).length > 0;

  const resultado = useMemo(() => {
    if (hasErrors) return null;
    const c = parseFloat(custo.replace(',', '.')) || 0;
    const i = parseFloat(impostos.replace(',', '.')) || 0;
    const m = parseFloat(margem.replace(',', '.')) || 0;

    if (c <= 0 || m <= 0) return null;

    const custoComImpostos = c * (1 + i / 100);
    const precoVenda = custoComImpostos / (1 - m / 100);
    const lucroUnitario = precoVenda - custoComImpostos;

    return { precoVenda, lucroUnitario, custoComImpostos };
  }, [custo, impostos, margem, hasErrors]);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderFieldError = (field: string) =>
    errors[field] ? (
      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {errors[field]}
      </p>
    ) : null;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading">Calculadora de Preço</h1>
        <p className="text-muted-foreground mt-1">Descubra o preço ideal para lucrar de verdade</p>
      </div>

      <Card className="p-6 border-none shadow-md space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="custo" className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Custo da Peça (R$)
            </Label>
            <Input id="custo" placeholder="25,00" value={custo} onChange={e => setCusto(e.target.value)} className={`mt-1 text-lg font-semibold ${errors.custo ? 'border-destructive' : ''}`} inputMode="decimal" />
            {renderFieldError('custo')}
          </div>
          <div>
            <Label htmlFor="impostos" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-warning" /> Impostos / Taxas (%)
            </Label>
            <Input id="impostos" placeholder="10" value={impostos} onChange={e => setImpostos(e.target.value)} className={`mt-1 text-lg font-semibold ${errors.impostos ? 'border-destructive' : ''}`} inputMode="decimal" />
            {renderFieldError('impostos')}
          </div>
          <div>
            <Label htmlFor="margem" className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-secondary" /> Margem de Lucro (%)
            </Label>
            <Input id="margem" placeholder="50" value={margem} onChange={e => setMargem(e.target.value)} className={`mt-1 text-lg font-semibold ${errors.margem ? 'border-destructive' : ''}`} inputMode="decimal" />
            {renderFieldError('margem')}
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
          <p className="text-lg font-semibold font-heading text-muted-foreground">
            {hasErrors ? 'Corrija os campos acima' : 'Preencha os campos acima'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {hasErrors ? 'Há valores inválidos que impedem o cálculo ⚠️' : 'O preço ideal aparecerá aqui automaticamente ✨'}
          </p>
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
