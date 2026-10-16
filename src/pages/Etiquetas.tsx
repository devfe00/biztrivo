import { useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Printer, Plus, Trash2, Package } from 'lucide-react';

interface Addr { nome: string; doc: string; endereco: string; cidade: string; uf: string; cep: string; }
interface Item { desc: string; qtd: string; valor: string; }

const emptyAddr: Addr = { nome: '', doc: '', endereco: '', cidade: '', uf: '', cep: '' };

const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const num = (v: string) => parseFloat(v.replace(',', '.')) || 0;
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const AddrFields = ({ title, v, set }: { title: string; v: Addr; set: (a: Addr) => void }) => (
  <Card className="p-5 border-none shadow-md space-y-3">
    <h2 className="font-semibold font-heading">{title}</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div><Label>Nome</Label><Input maxLength={80} value={v.nome} onChange={e => set({ ...v, nome: e.target.value })} /></div>
      <div><Label>CPF/CNPJ</Label><Input maxLength={18} value={v.doc} onChange={e => set({ ...v, doc: e.target.value })} /></div>
      <div className="sm:col-span-2"><Label>Endereço (rua, nº, bairro, complemento)</Label><Input maxLength={160} value={v.endereco} onChange={e => set({ ...v, endereco: e.target.value })} /></div>
      <div><Label>Cidade</Label><Input maxLength={60} value={v.cidade} onChange={e => set({ ...v, cidade: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>UF</Label><Input maxLength={2} value={v.uf} onChange={e => set({ ...v, uf: e.target.value.toUpperCase() })} /></div>
        <div><Label>CEP</Label><Input maxLength={9} value={v.cep} onChange={e => set({ ...v, cep: e.target.value })} /></div>
      </div>
    </div>
  </Card>
);

const addrHtml = (label: string, a: Addr) => `
  <div class="box"><b>${label}</b><br/>${esc(a.nome)}<br/>${esc(a.endereco)}<br/>
  ${esc(a.cidade)} / ${esc(a.uf)} . CEP ${esc(a.cep)}${a.doc ? `<br/>CPF/CNPJ: ${esc(a.doc)}` : ''}</div>`;

const Etiquetas = () => {
  const { config } = useStore();
  const [rem, setRem] = useState<Addr>({ ...emptyAddr, nome: config.storeName || '' });
  const [dest, setDest] = useState<Addr>(emptyAddr);
  const [items, setItems] = useState<Item[]>([{ desc: '', qtd: '1', valor: '' }]);
  const [peso, setPeso] = useState('');

  const total = items.reduce((s, i) => s + num(i.qtd) * num(i.valor), 0);
  const ok = rem.nome && rem.endereco && rem.cep && dest.nome && dest.endereco && dest.cep && items.some(i => i.desc);

  const print = () => {
    const rows = items.filter(i => i.desc).map((i, n) =>
      `<tr><td>${n + 1}</td><td>${esc(i.desc)}</td><td>${num(i.qtd)}</td><td>${brl(num(i.valor))}</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Etiqueta</title><style>
      body{font-family:Arial,sans-serif;color:#000;margin:20px}
      .label{border:2px dashed #000;padding:14px;width:100mm;margin-bottom:30px}
      .box{margin:8px 0;font-size:13px;line-height:1.4}
      h2{font-size:15px;text-align:center;margin:0 0 10px}
      table{width:100%;border-collapse:collapse;font-size:12px}td,th{border:1px solid #000;padding:4px;text-align:left}
      .decl{page-break-before:always}.sig{margin-top:40px;border-top:1px solid #000;width:60%;padding-top:4px;font-size:12px}
    </style></head><body>
      <div class="label">${addrHtml('DESTINATÁRIO', dest)}<hr/>${addrHtml('REMETENTE', rem)}</div>
      <div class="decl"><h2>DECLARAÇÃO DE CONTEÚDO</h2>
        ${addrHtml('REMETENTE', rem)}${addrHtml('DESTINATÁRIO', dest)}
        <table><tr><th>Item</th><th>Conteúdo</th><th>Qtd</th><th>Valor</th></tr>${rows}
        <tr><td colspan="3"><b>Total</b></td><td><b>${brl(total)}</b></td></tr></table>
        <p style="font-size:12px">Peso total (kg): ${esc(peso || '____')}</p>
        <p style="font-size:11px">Declaro que não me enquadro no conceito de contribuinte previsto no art. 4º da Lei Complementar nº 87/1996, uma vez que não realizo, com habitualidade ou em volume que caracterize intuito comercial, operações de circulação de mercadoria, ainda que se iniciem no exterior, ou estou dispensado da emissão da nota fiscal por força da legislação tributária vigente. Declaro ainda que não estou postando conteúdo inflamável, explosivo, causador de combustão espontânea, tóxico, corrosivo, gás ou qualquer outro conteúdo que constitua perigo, conforme o art. 13 da Lei Postal nº 6.538/78.</p>
        <p style="font-size:12px">_____________________, ____ de ______________ de ______</p>
        <div class="sig">Assinatura do Declarante/Remetente</div>
      </div><script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  const setItem = (i: number, p: Partial<Item>) => setItems(items.map((it, n) => (n === i ? { ...it, ...p } : it)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-2"><Package className="w-7 h-7" /> Etiquetas de Envio</h1>
        <p className="text-muted-foreground mt-1">Gere a etiqueta com endereço e a declaração de conteúdo para postar nos Correios.</p>
      </div>
      <AddrFields title="Destinatário (cliente)" v={dest} set={setDest} />
      <AddrFields title="Remetente (sua loja)" v={rem} set={setRem} />
      <Card className="p-5 border-none shadow-md space-y-3">
        <h2 className="font-semibold font-heading">Conteúdo do pacote</h2>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-6"><Label>Item</Label><Input maxLength={80} value={it.desc} onChange={e => setItem(i, { desc: e.target.value })} /></div>
            <div className="col-span-2"><Label>Qtd</Label><Input value={it.qtd} onChange={e => setItem(i, { qtd: e.target.value })} /></div>
            <div className="col-span-3"><Label>Valor un.</Label><Input placeholder="0,00" value={it.valor} onChange={e => setItem(i, { valor: e.target.value })} /></div>
            <button aria-label="Remover item" className="col-span-1 p-2 text-muted-foreground hover:text-destructive" onClick={() => setItems(items.filter((_, n) => n !== i))}><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <Button variant="outline" onClick={() => setItems([...items, { desc: '', qtd: '1', valor: '' }])}><Plus className="w-4 h-4 mr-1" /> Item</Button>
          <div className="flex items-center gap-2"><Label>Peso (kg)</Label><Input className="w-24" value={peso} onChange={e => setPeso(e.target.value)} /></div>
          <p className="font-semibold">Total: {brl(total)}</p>
        </div>
      </Card>
      <Button size="lg" className="w-full" disabled={!ok} onClick={print}><Printer className="w-5 h-5 mr-2" /> Imprimir etiqueta e declaração</Button>
    </div>
  );
};

export default Etiquetas;
