# Plano — 5 novas features do Biztrivo

Ordem de execução proposta: **2 → 3 → 10 → 5 → 7** (mais simples/críticas primeiro, geração de imagem por último).

---

## 1) Previsão de Caixa com IA (Gemini) — feature #2

**Onde aparece:** novo card no `Dashboard.tsx` chamado **"Previsão de Caixa (IA)"**, abaixo dos cards de hoje.

**Como funciona:**
- Edge Function `forecast-cashflow` lê as transações dos últimos 60 dias do usuário (via service role, filtrado por `user_id` vindo do JWT).
- Manda pro Lovable AI Gateway, modelo `google/gemini-3-flash-preview` (gratuito enquanto durar o crédito).
- Prompt instrui a IA a retornar JSON estruturado (tool calling) com:
  - `previsao_7_dias`: saldo projetado
  - `previsao_30_dias`: saldo projetado
  - `risco`: `baixo` | `medio` | `alto`
  - `alerta`: string curta em PT-BR (ex: "Você pode ficar negativo dia 18")
  - `recomendacao`: string curta
- Frontend mostra cartão com cor por risco (verde/amarelo/vermelho) + botão "Atualizar previsão" (rate-limit local: 1x a cada 6h por usuário, cache em localStorage).

**Segurança:** edge function valida JWT, busca só transações do próprio usuário. Sem dados sensíveis no prompt (só valores e datas).

---

## 2) Modo Offline — feature #3

**Onde aparece:** novo item no menu lateral `AppLayout.tsx`, **abaixo de "Vitrine"**, com label **"Modo Offline"** e ícone `WifiOff`.

**Como funciona:**
- Nova rota `/offline` com página dedicada.
- Service Worker leve (apenas para essa rota + assets) usando `vite-plugin-pwa` no modo guard (não registra em preview Lovable — segue a skill PWA).
- IndexedDB local (`idb` lib) com tabela `offline_sales` armazenando vendas feitas sem internet (produto, valor, forma de pagto, data).
- Quando volta online → botão "Sincronizar X vendas" envia tudo pra tabela `transactions` em lote.
- UI mostra status de conexão (online/offline) e fila de pendentes.

**Escopo desta entrega:** registrar venda offline + sincronizar. Catálogo offline de produtos fica no localStorage (cache da última carga online).

---

## 3) Declaração MEI Automática — feature #10 (crítico, 100% eficaz)

**Onde aparece:** nova aba **"MEI"** no menu lateral (ou dentro de Relatórios — preferência sua, posso perguntar).

**Como funciona — 100% confiável:**
- Consolida entradas do ano vigente (jan→dez) da tabela `transactions` onde `type='entrada'` e `is_personal=false`.
- Aplica regras fixas do MEI 2026 (hardcoded, sem IA pra não errar):
  - Limite anual: R$ 81.000 (verifica e alerta se ultrapassou)
  - Quebra por categoria: Comércio/Indústria vs Serviços (usa o campo `category` já existente)
  - Gera o relatório anual no formato exato exigido pela DASN-SIMEI
- Exporta:
  - **PDF** pronto pra arquivar (com layout oficial-like)
  - **Resumo em tela** com os campos prontos pra digitar no portal gov.br
- Aviso claro: "Este relatório é uma consolidação dos seus dados. A declaração oficial deve ser feita no portal gov.br/mei até 31/maio."
- Validações: alerta se faltam meses sem nenhuma venda (provável dado faltando), se passou do limite, se tem categoria não classificada.

**Sem IA aqui** — cálculos puros pra garantir precisão. IA seria risco.

---

## 4) Comparador de Preço de Fornecedor (OCR) — feature #5

**Onde aparece:** botão "Comparar nota fiscal" dentro da página **Caixa** (ao registrar saída/compra).

**Como funciona:**
- Usuário tira foto da nota fiscal → upload pro Supabase Storage (bucket privado `notas-fiscais`).
- Edge Function `parse-invoice` manda a imagem pro Gemini (`google/gemini-2.5-flash` — suporta visão, gratuito).
- IA extrai JSON: lista de itens (nome, qtd, preço unitário, total).
- Compara com histórico do usuário (últimas compras com mesmo nome/categoria via fuzzy match) e mostra:
  - 🟢 mais barato que a média
  - 🔴 mais caro que a média (com %)
- Salva histórico em nova tabela `supplier_prices` (item, preço, fornecedor opcional, data).

---

## 5) Gerador de Posts pra Instagram — feature #7

**Decisão de IA:** uso o próprio **Lovable AI Gateway** com `google/gemini-3.1-flash-image-preview` (Nano Banana 2 — gratuito enquanto durar o crédito mensal do workspace, sem chave externa).

**Onde aparece:** botão "Gerar post" em cada produto da **Vitrine**.

**Como funciona:**
- Edge Function `generate-product-post` recebe produto (nome, preço, foto opcional, descrição).
- Pede pra IA gerar:
  - **Imagem** (1080x1080) com o produto destacado + preço (via Gemini image)
  - **Legenda** em PT-BR (via Gemini text), com hashtags e CTA pro WhatsApp
- Mostra preview, botão "Baixar imagem" e "Copiar legenda".
- Sem armazenamento permanente das imagens geradas (usuário baixa).

**Risco:** se o crédito grátis acabar, a feature volta 402. Trato no frontend mostrando "Limite mensal atingido, tente em X dias".

---

## Mudanças de banco necessárias

| Migration | Conteúdo |
|---|---|
| `supplier_prices` | tabela nova (feature #5) — RLS por user_id, GRANTs corretos |
| `transactions` | já tem tudo que MEI precisa, sem alteração |

## Edge Functions novas

1. `forecast-cashflow` (feature #2)
2. `parse-invoice` (feature #5)
3. `generate-product-post` (feature #7)

## Dependências npm novas

- `idb` (IndexedDB wrapper, feature #3)
- `vite-plugin-pwa` (feature #3, guard-mode)
- `jspdf` + `jspdf-autotable` (feature #10, PDF da MEI) — já pode estar instalado, verifico

---

## Confirmações antes de começar

1. **MEI**: você quer aba própria no menu **"MEI"** ou dentro de **Relatórios** como sub-seção?
2. **Modo Offline**: confirma que só venda offline (catálogo cacheado readonly) basta nesta primeira versão? Ou quer cadastro de produto offline também?
3. **Posts Instagram**: tudo bem usar o crédito grátis do workspace Lovable (pode estourar se muita gente usar)? Se quiser opção paga (Stability/Replicate) me avisa.

Confirma a ordem **2 → 3 → 10 → 5 → 7** e responde as 3 perguntas que eu começo pela #2.