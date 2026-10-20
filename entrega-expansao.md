# Entrega da expansão Biztrivo

## Situação real
Ferramentas implementadas: etiquetas, variações/estoque, fidelidade e recompra, cobranças parceladas e mensagens WhatsApp manuais, devoluções vinculadas às vendas, solicitações de troca, comandas, fichas técnicas, contratos/cobranças de aluguéis, prévia DASN e remuneração do titular. Cálculos e formulários têm testes automatizados. A prévia real continua em branco por `Firebase auth/invalid-api-key`, portanto persistência autenticada, concorrência, impressão e PDFs reais não foram verificados de ponta a ponta. Não é uma declaração de segurança pronta para produção.

O backend separado precisa implementar os contratos `backend-inventory-contract.md` e `backend-business-contract.md`. Nenhuma regra de autorização foi relaxada neste projeto.

Não conectados: NF-e/NFS-e, DAS/Pix automático, conta PJ/Pix bancário, boletos e envio automático WhatsApp. Dependem de parceiros, credenciais, autorização fiscal e/ou backend separado. Não há score de crédito nem split.

## Todos os arquivos desde o pedido de remover lançamentos
Conferência: histórico Git desde o commit que introduziu `meiDas.ts`, histórico anterior do pedido e alterações desta expansão. `Planos.tsx` é citado na conversa anterior, mas não apresenta alteração no intervalo Git disponível; incluído explicitamente como referência do histórico, não como alteração comprovada pelo Git.

### Telas
- `src/pages/Caixa.tsx`
- `src/pages/Contador.tsx`
- `src/pages/MEI.tsx`
- `src/pages/Configuracoes.tsx`
- `src/pages/Planos.tsx` (citado no histórico; sem alteração Git comprovada no intervalo)
- `src/pages/LandingPage.tsx`
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`
- `src/pages/Vitrine.tsx`
- `src/pages/PublicStore.tsx`
- `src/pages/Fidelidade.tsx`
- `src/pages/CartaoFidelidade.tsx`
- `src/pages/Etiquetas.tsx`
- `src/pages/Cobrancas.tsx`
- `src/pages/Devolucoes.tsx`
- `src/pages/Comandas.tsx`
- `src/pages/Alugueis.tsx`

### Navegação, controles e contexto
- `src/App.tsx`
- `src/components/AppLayout.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/UpgradeModal.tsx`
- `src/components/ProductVariantsEditor.tsx`
- `src/components/BusinessFields.tsx`
- `src/components/MeiPlanning.tsx`
- `src/components/OwnerPayments.tsx`
- `src/contexts/StoreContext.tsx`
- `src/hooks/useBusinessRecords.ts`

### Regras e traduções
- `src/lib/meiDas.ts`
- `src/lib/loyalty.ts`
- `src/lib/inventory.ts`
- `src/lib/inventory-i18n.ts`
- `src/lib/business.ts`
- `src/lib/business-i18n.ts`
- `src/i18n/locales/pt.json`
- `src/i18n/locales/en.json`
- `src/i18n/locales/es.json`
- `src/i18n/locales/fr.json`

### Testes
- `src/test/meiDas.test.ts`
- `src/test/loyalty.test.ts`
- `src/test/inventory.test.ts`
- `src/test/inventory-flow.test.tsx`
- `src/test/business.test.ts`
- `src/test/business-flow.test.tsx`

### Documentação
- `AGENTS.md`
- `roadmap.md`
- `backend-inventory-contract.md`
- `backend-business-contract.md`
- `entrega-expansao.md`

### Arquivo gerenciado pela plataforma
- `src/integrations/supabase/previewAuthStorage.ts`: aparece no intervalo histórico como atualização gerenciada pela plataforma, não como código de negócio editado nesta etapa; não enviar como implementação Firebase nem editar manualmente.