# Entrega para o backend separado

## O que o frontend faz agora
- `/notas-fiscais`: prepara e copia dados de serviços e produtos. NÃO emite NF-e/NFS-e, XML autorizado ou DANFE. Emissão ocorre no portal oficial com o próprio acesso do usuário.
- `/das-mei`: valida CNPJ/competência e abre o PGMEI sem transmitir dados. NÃO gera guia, código Pix nem confirmação de pagamento.
- `/pagamentos`: valida e permite baixar um JSON `draft_not_submitted`. NÃO chama API, não gera Pix/boleto e não movimenta dinheiro.
- Dados em memória da tela; não há novos registros no banco, segredos ou alterações de permissões.
- `src/lib/fiscal.ts` contém validações de documentos (incluindo CNPJ alfanumérico), datas reais, valores com centavos e itens. As mesmas regras precisam existir no servidor quando houver persistência ou integração. Validação de dígitos não comprova situação cadastral; código de serviço/NCM com formato válido não comprova enquadramento tributário.

## Mercado Pago: implementação pendente com Claude
1. Credenciar a integração e confirmar que o produto contratado suporta Pix/boleto e autorização de vendedores, sem split nem score. Tarifas e disponibilidade precisam ser confirmadas no Mercado Pago; não prometer gratuidade.
2. Cada vendedor autoriza sua PRÓPRIA conta. Não usar o token da Ajudaê para receber vendas de todas as lojas. Stripe continua exclusiva à assinatura Biztrivo. Não é abertura de conta PJ própria da Biztrivo.
3. OAuth authorization code: `state` imprevisível, expiração, associação ao usuário autenticado e consumo único. Callback permitido em lista fixa. Troca de código, tokens e renovação somente no servidor; tokens criptografados e nunca legíveis por clientes Firestore ou retornados ao navegador.
4. Verificar Firebase ID token, vendedor proprietário, assinatura/permissão e vínculo da conta antes de qualquer geração ou consulta. Não confiar em userId, status ou conta recebedora enviados pelo cliente.
5. Validar método Pix/boleto, BRL, CPF/CNPJ, nome, email, vencimento permitido pelo provedor e valor em centavos; para vendas vinculadas, calcular valor a partir dos registros autorizados no servidor. Boletos podem exigir endereço completo e outros campos: consultar a documentação atual e ampliar o formulário antes de habilitar.
6. **Limites obrigatórios, ainda sem números escolhidos pelo usuário:** máximo por cobrança, número de gerações por janela e volume monetário por janela por vendedor; limites adicionais por IP/usuário e tentativas falhas. Configuração ausente => rejeitar geração, nunca ilimitado. Reservar cota atomicamente antes do provedor e definir tratamento de falhas sem permitir concorrência contornar o limite. A interface ainda não aplica limite comercial inventado; seus limites de formato não substituem cotas de geração.
7. Chave de idempotência vinculada a vendedor e solicitação. Repetir a requisição não cria outro pagamento. Registrar tentativa e ID de provedor de forma durável; lidar com timeout consultando o provedor antes de repetir.
8. Webhook: verificar assinatura conforme documentação atual, impedir replay e consultar o pagamento autenticado no provedor. Conferir vendedor recebedor, valor, moeda e identificador local. Não confiar no redirecionamento do navegador ou apenas no corpo do webhook.
9. Lançar recebimento e estado confirmado atomicamente e uma única vez. Cancelado, expirado, pendente, estornado e reembolsado não devem virar entrada duplicada. Definir tratamento contábil de tarifas e estornos.
10. Persistência isolada por proprietário, regras Firestore negando alterações cliente em status/recebedor/cotas/tokens, logs sem documentos completos ou segredos, retenção e consentimentos LGPD, auditoria e revogação de conta.

## Contrato sugerido (ainda não implementado nem conectado)
- `GET seller-payment-connection`: estado da autorização e recursos disponíveis, nunca tokens.
- `POST seller-payment-authorize`: URL OAuth validada gerada no servidor.
- `POST create-seller-charge`: draft validado + chave de idempotência; servidor retorna ID interno e dados de pagamento reais confirmados pelo provedor.
- `GET seller-charge/:id`: consulta owner-scoped, status e vencimento reais.
- `POST provider-webhook`: endpoint exclusivo de reconciliação verificada.
Não adicionar URLs fictícias ao frontend. Conectar os endpoints apenas após deploy e teste em sandbox.

## Fiscal
Não automatizar login gov.br, captchas ou guardar senhas fiscais. NF-e de produtos depende da UF e operação; alguns estados oferecem NFA-e/NFF sem A1, não todos. RS e SC têm links oficiais específicos na tela; demais UFs recebem orientação nacional e devem confirmar o caminho na SEFAZ. O material preparado não substitui enquadramento, CFOP, NCM e impostos aprovados no emissor.

## Critérios de aceite
Testar duas lojas distintas sem acesso cruzado, limite ausente rejeitando, concorrência de cotas, idempotência, webhook inválido, replay, divergência de valor/recebedor, token revogado, timeout, estorno e leitura real do resultado na tela. Só então habilitar geração; nenhum botão atual afirma que pagou ou emitiu nota.