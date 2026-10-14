export type MeiAtividade = 'servicos' | 'comercio_industria' | 'comercio_servicos';

export const MEI_DAS: Record<MeiAtividade, { label: string; total: number; detalhe: string }> = {
  servicos: { label: 'Serviços', total: 86.05, detalhe: 'R$ 81,05 INSS + R$ 5,00 ISS' },
  comercio_industria: { label: 'Comércio e Indústria', total: 82.05, detalhe: 'R$ 81,05 INSS + R$ 1,00 ICMS' },
  comercio_servicos: { label: 'Comércio e Serviços', total: 87.05, detalhe: 'R$ 81,05 INSS + R$ 1,00 ICMS + R$ 5,00 ISS' },
};

const KEY = 'biztrivo_mei_atividade';

export const getMeiAtividade = (): MeiAtividade => {
  try {
    const v = localStorage.getItem(KEY) as MeiAtividade | null;
    return v && v in MEI_DAS ? v : 'comercio_industria';
  } catch { return 'comercio_industria'; }
};

export const setMeiAtividade = (v: MeiAtividade) => {
  try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
};
