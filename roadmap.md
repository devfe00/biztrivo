# Roadmap
- [x] Adicionar tutoriais contextuais às 19 telas internas com pular, tradução e reinício nas configurações; testar persistência e apresentação.
- [x] Substituir pix-utils pelo gerador nativo de BR Code: 21 testes passaram e compilação OK; configuração gerenciada do Cloud preservada. Verificação da tela bloqueada por auth/invalid-api-key.
- [x] Substituir Mercado Pago em /pagamentos por Pix estático direto, com validação, QR Code, Copia e Cola e download; sem confirmação automática ou boleto.
- [x] Criar preparação de NFS-e e nota de produtos com acesso aos portais oficiais, sem emissão fictícia.
- [x] Criar acesso ao PGMEI para pagar DAS, sem gerar Pix próprio.
- [x] Criar preparação de cobranças Pix/boleto Mercado Pago e contrato de limites/segurança para o backend externo.
- [x] Conferir testes e consolidar arquivos desta entrega: 35 testes focados passaram; prévia autenticada bloqueada por configuração Firebase inválida.
- [x] Gerador de etiqueta de envio + declaração de conteúdo
- [x] Grade de variações (tamanho/cor) com estoque e seleção na vitrine pública
- [x] Alerta de estoque baixo por variação com limite configurável
- [ ] Validar no backend separado: propriedade dos produtos, variantes, preços e venda com baixa de estoque atômica; expor variantes na resposta pública (bloqueado: backend externo ao projeto)
- [ ] Testar gravação e compra com conta real (bloqueado: prévia falha com auth/invalid-api-key)

## Ferramentas implementadas, dependentes das permissões do backend externo para uso real
- [x] Termômetro do teto MEI proporcional + prévia DASN e PDF auxiliar
- [x] Cobranças parceladas + mensagem WhatsApp iniciada pelo vendedor + recebimento manual e recibo
- [x] Devoluções vinculadas à venda com reembolso/estoque atômicos; acompanhamento de solicitações de troca
- [x] Comanda digital com etapas + ficha técnica e custo por porção
- [x] Contratos de aluguel, cobranças mensais únicas, cálculos de taxa e reajustes manuais com histórico
- [x] Registro separado de pró-labore, distribuição de lucros e retiradas; estimativas auxiliares de lucro
- [x] Emissão fiscal assistida, sem custo de API: preparação NFS-e/produtos e acesso a portais oficiais. Emissão oficial ocorre fora da Biztrivo; API fiscal não habilitada.
- [x] DAS: acesso ao PGMEI conforme escopo aprovado; Pix oficial é gerado pelo usuário no portal, não automaticamente pela Biztrivo.
- [x] Abandonar integração Mercado Pago conforme decisão do usuário; Pix direto não depende de OAuth, secrets ou provedores.
- [ ] Cobrança WhatsApp automática e boletos bancários (bloqueado: provedores de mensagens/pagamentos e consentimentos)
- [ ] Validar autorização e persistência das operações comerciais (bloqueado: backend Firebase separado; contrato em backend-business-contract.md)

- [x] Concluir ferramentas independentes de parceiros, testes de cálculos/formulários e contrato para backend separado.

## Entrega final
- [x] Lista consolidada conferida no histórico e registrada em entrega-expansao.md para apresentação final.
