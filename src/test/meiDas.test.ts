import { describe, it, expect } from 'vitest';
import { MEI_DAS } from '@/lib/meiDas';

describe('DAS MEI', () => {
  it('Serviços = 86,05', () => expect(MEI_DAS.servicos.total).toBe(86.05));
  it('Comércio e Indústria = 82,05', () => expect(MEI_DAS.comercio_industria.total).toBe(82.05));
  it('Comércio e Serviços = 87,05', () => expect(MEI_DAS.comercio_servicos.total).toBe(87.05));
});
