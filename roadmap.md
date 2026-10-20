# Roadmap
- [ ] Criar preparação de NFS-e e nota de produtos com acesso aos portais oficiais, sem emissão fictícia.
- [ ] Criar acesso ao PGMEI para pagar DAS, sem gerar Pix próprio.
- [ ] Criar preparação de cobranças Pix/boleto Mercado Pago e contrato de limites/segurança para o backend externo.
- [ ] Conferir testes e consolidar arquivos desta entrega.
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
- [ ] Emissor NFS-e/NF-e (bloqueado: provedor fiscal, certificado/autorização e backend externo)
- [ ] DAS com Pix automático (bloqueado: integração fiscal autorizada; disponível acesso ao emissor oficial)
- [ ] Conta PJ / Pix via parceiro (bloqueado: contratação de parceiro regulado e credenciais)
- [ ] Cobrança WhatsApp automática e boletos bancários (bloqueado: provedores de mensagens/pagamentos e consentimentos)
- [ ] Validar autorização e persistência das operações comerciais (bloqueado: backend Firebase separado; contrato em backend-business-contract.md)

- [x] Concluir ferramentas independentes de parceiros, testes de cálculos/formulários e contrato para backend separado.

## Entrega final
- [x] Lista consolidada conferida no histórico e registrada em entrega-expansao.md para apresentação final.
