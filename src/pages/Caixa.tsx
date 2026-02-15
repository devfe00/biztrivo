import { useState, useMemo } from 'react';
import { useStore, Transaction } from '@/contexts/StoreContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Trash2, Search, Wallet } from 'lucide-react';

const categories = ['Venda', 'Reposição', 'Embalagem', 'Frete', 'Pessoal', 'Outros'];

const Caixa = () => {
  const { config, addTransaction, removeTransaction } = useStore();
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Venda');
  const [isPersonal, setIsPersonal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');

  const todayStr = new Date().toISOString().split('T')[0];

  const todayTransactions = useMemo(() =>
    config.transactions
      .filter(t => t.date.startsWith(todayStr))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [config.transactions, todayStr]
  );

  const runningBalance = useMemo(() => {
    let balance = 0;
    const sorted = [...todayTransactions].reverse();
    return sorted.map(t => {
      balance += t.type === 'entrada' ? t.value : -t.value;
      return { ...t, balance };
    }).reverse();
  }, [todayTransactions]);

  const totalEntradas = todayTransactions.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0);
  const totalSaidas = todayTransactions.filter(t => t.type === 'saida').reduce((s, t) => s + t.value, 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleAdd = (type: 'entrada' | 'saida') => {
    const numValue = parseFloat(value.replace(',', '.'));
    if (!numValue || numValue <= 0 || !description.trim()) return;

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      value: numValue,
      description: description.trim(),
      category,
      isPersonal: type === 'saida' && isPersonal,
      date: new Date().toISOString(),
    };
    addTransaction(transaction);
    setValue('');
    setDescription('');
    setIsPersonal(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">Caixa Diário</h1>
        <p className="text-muted-foreground mt-1">Controle cada centavo do seu negócio</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-none shadow-md text-center">
          <p className="text-xs text-muted-foreground">Entradas</p>
          <p className="text-xl font-bold font-heading text-secondary">{formatCurrency(totalEntradas)}</p>
        </Card>
        <Card className="p-4 border-none shadow-md text-center">
          <p className="text-xs text-muted-foreground">Saídas</p>
          <p className="text-xl font-bold font-heading text-destructive">{formatCurrency(totalSaidas)}</p>
        </Card>
        <Card className="p-4 border-none shadow-md text-center">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className={`text-xl font-bold font-heading ${totalEntradas - totalSaidas >= 0 ? 'text-secondary' : 'text-destructive'}`}>
            {formatCurrency(totalEntradas - totalSaidas)}
          </p>
        </Card>
      </div>

      {/* Input Form */}
      <Card className="p-6 border-none shadow-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="value">Valor (R$)</Label>
            <Input
              id="value"
              type="text"
              placeholder="0,00"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="mt-1 text-lg font-semibold"
            />
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="desc">Descrição</Label>
          <Input
            id="desc"
            placeholder="Ex: Venda de camiseta, compra de embalagens..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={isPersonal} onCheckedChange={setIsPersonal} />
          <Label className="text-sm cursor-pointer">
            Gasto Pessoal <span className="text-muted-foreground">(marca separado no extrato)</span>
          </Label>
        </div>

        {/* Big action buttons */}
        <div className="flex gap-4 pt-2">
          <button
            onClick={() => handleAdd('entrada')}
            className="flex-1 py-4 rounded-xl bg-secondary text-secondary-foreground font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-glow-green"
          >
            <TrendingUp className="w-6 h-6" />
            + Entrada
          </button>
          <button
            onClick={() => handleAdd('saida')}
            className="flex-1 py-4 rounded-xl bg-destructive text-destructive-foreground font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <TrendingDown className="w-6 h-6" />
            - Saída
          </button>
        </div>
      </Card>

      {/* Ledger */}
      <div>
        <h2 className="text-lg font-semibold font-heading mb-4">Extrato de Hoje</h2>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lançamento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(() => {
          const filtered = runningBalance.filter(t => {
            const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase());
            const matchCategory = filterCategory === 'Todas' || t.category === filterCategory;
            return matchSearch && matchCategory;
          });

          return filtered.length === 0 ? (
          <Card className="p-10 border-none shadow-md text-center">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-primary/30" />
            <p className="text-lg font-semibold font-heading">
              {runningBalance.length === 0 ? 'Seu dia começa agora!' : 'Nenhum resultado encontrado'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {runningBalance.length === 0
                ? 'Registre sua primeira venda e tome controle do seu dinheiro 💪'
                : 'Tente buscar por outro termo ou categoria'}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => (
              <Card
                key={t.id}
                className={`p-4 border-none shadow-sm flex items-center justify-between ${
                  t.isPersonal ? 'border-l-4 border-l-warning bg-warning/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    t.type === 'entrada' ? 'bg-secondary/10' : 'bg-destructive/10'
                  }`}>
                    {t.type === 'entrada'
                      ? <TrendingUp className="w-5 h-5 text-secondary" />
                      : <TrendingDown className="w-5 h-5 text-destructive" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{t.category}</span>
                      {t.isPersonal && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                          Pessoal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`font-bold text-sm ${t.type === 'entrada' ? 'text-secondary' : 'text-destructive'}`}>
                      {t.type === 'entrada' ? '+' : '-'} {formatCurrency(t.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saldo: {formatCurrency(t.balance)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeTransaction(t.id)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        );
        })()}
      </div>
    </div>
  );
};

export default Caixa;
