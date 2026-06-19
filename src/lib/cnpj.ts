// src/lib/cnpj.ts
// Validação de dígito verificador (offline) + consulta de situação cadastral
// na Receita Federal via BrasilAPI (gratuita, sem chave, com CORS liberado).

/** Remove tudo que não for dígito. */
export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

/** Aplica a máscara 00.000.000/0000-00 progressivamente, útil em onChange. */
export function formatCNPJ(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

/** Valida o dígito verificador do CNPJ (algoritmo oficial). Apenas formato — não diz se está ativo. */
export function isValidCNPJ(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false; // todos os dígitos iguais (00000000000000, 11111111111111...)

  const calcDigit = (base: string, weights: number[]): number => {
    const sum = base
      .split('')
      .reduce((acc, ch, i) => acc + Number(ch) * weights[i], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const dv1 = calcDigit(d.slice(0, 12), w1);
  const dv2 = calcDigit(d.slice(0, 12) + dv1, w2);

  return d === d.slice(0, 12) + String(dv1) + String(dv2);
}

export type SituacaoCadastral = 'ATIVA' | 'BAIXADA' | 'INAPTA' | 'SUSPENSA' | 'NULA' | 'DESCONHECIDA';

export interface CnpjStatusResult {
  ok: boolean;
  situacao?: SituacaoCadastral;
  razaoSocial?: string;
  error?: string;
}

/**
 * Consulta a Receita Federal (via BrasilAPI) e retorna a situação cadastral atual.
 * Trate qualquer `situacao !== 'ATIVA'` como bloqueio.
 */
export async function checkCnpjStatus(cnpj: string): Promise<CnpjStatusResult> {
  const d = onlyDigits(cnpj);

  if (!isValidCNPJ(d)) {
    return { ok: false, error: 'CNPJ inválido. Verifique os números digitados.' };
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${d}`);

    if (res.status === 404) {
      return { ok: false, error: 'CNPJ não encontrado na base da Receita Federal.' };
    }
    if (res.status === 429) {
      return { ok: false, error: 'Muitas consultas em sequência. Aguarde um instante e tente de novo.' };
    }
    if (!res.ok) {
      return { ok: false, error: 'Não foi possível consultar o CNPJ agora. Tente novamente em breve.' };
    }

    const data = await res.json();
    const situacaoRaw = String(data?.descricao_situacao_cadastral ?? '').toUpperCase().trim();
    const situacao: SituacaoCadastral =
      (['ATIVA', 'BAIXADA', 'INAPTA', 'SUSPENSA', 'NULA'] as const).includes(situacaoRaw as any)
        ? (situacaoRaw as SituacaoCadastral)
        : 'DESCONHECIDA';

    return { ok: true, situacao, razaoSocial: data?.razao_social };
  } catch {
    return { ok: false, error: 'Falha de conexão ao consultar a Receita Federal. Verifique sua internet.' };
  }
}