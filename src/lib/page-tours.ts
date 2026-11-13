import type { Lang } from './useLang';

// Selectors are scoped to the page, never the sidebar or a public storefront.
export const TOUR_TARGETS: Record<string, { target: string; copy: string }[]> = {
  '/dashboard': [{ target: '[data-tour="balance"]', copy: 'balance' }, { target: '[data-tour="quick-cash"]', copy: 'quick' }],
  '/caixa': [{ target: '#value', copy: 'entry' }, { target: '[data-tour="personal"]', copy: 'personal' }],
  '/vitrine': [{ target: '[data-tour="store-link"]', copy: 'link' }, { target: '[data-tour="add-product"]', copy: 'product' }],
  '/pagamentos': [{ target: 'form', copy: 'pix' }],
  '/fidelidade': [{ target: '[data-tour="loyalty"]', copy: 'loyalty' }, { target: '[data-tour="dormant"]', copy: 'dormant' }],
  '/etiquetas': [{ target: '[data-tour="recipient"]', copy: 'label' }],
  '/cobrancas': [{ target: 'form', copy: 'debt' }],
  '/devolucoes': [{ target: 'form', copy: 'refund' }],
  '/alugueis': [{ target: 'form', copy: 'rent' }],
  '/notas-fiscais': [{ target: '[role="tablist"]', copy: 'invoice' }],
  '/das-mei': [{ target: 'form button[type="submit"]', copy: 'das' }],
  '/posts-ia': [{ target: '[data-tour="post-generate"]', copy: 'post' }],
  '/calculadora': [{ target: '#custo', copy: 'price' }],
  '/relatorios': [{ target: '[data-tour="export"]', copy: 'report' }],
  '/contador': [{ target: '[data-tour="accounting-export"]', copy: 'accountant' }],
  '/mei': [{ target: '[data-tour="mei-year"]', copy: 'mei' }],
  '/offline': [{ target: 'form', copy: 'offline' }],
  '/academy': [{ target: 'a[download]', copy: 'academy' }],
  '/configuracoes': [{ target: '#storeName', copy: 'settings' }, { target: '[data-tour="replay"]', copy: 'replay' }],
};

const prefix = 'biztrivo:tours:v1:';
const key = (uid: string, path: string) => `${prefix}${encodeURIComponent(uid)}:${path}`;
export function hasSeenTour(uid: string, path: string): boolean {
  try { return localStorage.getItem(key(uid, path)) === 'seen'; } catch { return false; }
}
export function markTourSeen(uid: string, path: string) {
  try { localStorage.setItem(key(uid, path), 'seen'); } catch { /* Storage can be disabled. */ }
}
export function resetTours(uid: string) {
  Object.keys(TOUR_TARGETS).forEach(path => {
    try { localStorage.removeItem(key(uid, path)); } catch { /* No account data is changed. */ }
  });
}

type Copy = Record<string, [string, string]>;
const pt: Copy = {
  balance: ['Seu saldo do dia', 'Aqui estão as entradas menos as saídas de hoje. Gastos pessoais aparecem separados para você acompanhar as retiradas.'],
  quick: ['Registre o movimento', 'Use estes atalhos para lançar uma entrada ou uma saída no Caixa.'],
  entry: ['Novo lançamento', 'Informe o valor e a descrição. Depois escolha Entrada para dinheiro recebido ou Saída para dinheiro gasto.'],
  personal: ['Loja e bolso separados', 'Ative Gasto Pessoal quando uma saída for para você, não para a loja. Ela reduz o saldo, mas não entra como custo do negócio.'],
  link: ['Sua loja, em um link', 'Copie o link e compartilhe no WhatsApp ou na bio do Instagram para seus clientes verem os produtos.'],
  product: ['Cadastre seus produtos', 'Comece por aqui para adicionar foto, preço e estoque. Use variações para tamanhos e cores quando necessário.'],
  pix: ['Cobre por Pix', 'Confira a chave, o recebedor e o valor para gerar o Copia e Cola e o QR Code. O dinheiro vai direto ao vendedor; confira o recebimento no banco.'],
  loyalty: ['Um motivo para voltar', 'Cadastre o cliente e escolha quantas compras valem uma recompensa. Registre cada compra e envie o cartão pelo WhatsApp.'],
  dormant: ['Recupere clientes', 'Escolha quantos dias sem comprar deseja acompanhar. Os clientes inativos aparecem com uma mensagem de recompra pronta para você enviar.'],
  label: ['Prepare seu envio', 'Preencha os endereços e os itens do pacote. Depois imprima a etiqueta e a declaração de conteúdo, sem contratar frete por aqui.'],
  debt: ['Seu fiado organizado', 'Registre cliente, valor, vencimento e parcelas. Só marque como recebido depois de conferir o pagamento.'],
  refund: ['Devolução com controle', 'Selecione a venda, a quantidade e se os itens devem voltar ao estoque. Confira os dados antes de confirmar o reembolso.'],
  rent: ['Acompanhe os aluguéis', 'Cadastre o contrato e seus vencimentos. Depois gere os registros mensais e acompanhe os reajustes.'],
  invoice: ['Prepare os dados da nota', 'Escolha serviço ou produto, preencha e copie os dados validados. A emissão oficial é feita no portal, não na Biztrivo.'],
  das: ['DAS no portal oficial', 'Informe os dados pedidos para abrir o PGMEI. Você gera a guia e o Pix oficial no portal; a Biztrivo não efetua o pagamento.'],
  post: ['Seu próximo post', 'Escolha um produto, o formato e o tom. Gere a imagem e a legenda, revise o resultado e publique no seu Instagram.'],
  price: ['Venda com margem', 'Preencha custo, impostos e margem desejada para calcular um preço sugerido. Ajuste os valores à realidade da sua loja.'],
  report: ['Leve seus números', 'Escolha o período e exporte em PDF ou CSV para conferir os resultados ou compartilhar com sua contabilidade.'],
  accountant: ['Organize a contabilidade', 'Confira o resumo e exporte os dados. As estimativas são auxiliares e não substituem declarações oficiais ou orientação profissional.'],
  mei: ['Acompanhe seu MEI', 'Escolha o ano para conferir as receitas e preparar seu resumo. O relatório é auxiliar; a declaração oficial é enviada no portal do governo.'],
  offline: ['Registre sem internet', 'Anote as vendas aqui mesmo sem conexão. Ao voltar à internet, confira e sincronize os registros pendentes.'],
  academy: ['Aprenda no seu ritmo', 'Baixe os guias sobre preços, estoque e vendas para consultar quando precisar.'],
  settings: ['A identidade da sua loja', 'Salve o nome e a foto da loja. No Brasil, cadastre também a chave Pix para facilitar as compras pela vitrine.'],
  replay: ['Quer ver de novo?', 'Rever tutoriais reinicia os balões neste navegador. Cada tela mostra seus passos novamente quando você a visitar.'],
};
const en: Copy = {
  balance:['Your daily balance','Today’s income minus outflows appears here. Personal spending is listed separately so you can track withdrawals.'],
  quick:['Record a movement','Use these shortcuts to record income or an expense in Cash Flow.'],
  entry:['New entry','Enter the amount and description. Choose Income for money received or Expense for money spent.'],
  personal:['Keep store and pocket separate','Enable Personal Expense for withdrawals for yourself. They reduce the balance but are not business costs.'],
  link:['Your store in a link','Copy this link to WhatsApp or your Instagram bio so customers can see your products.'],
  product:['Add your products','Add a photo, price and stock here. Use variants for sizes and colors when needed.'],
  pix:['Request a Pix payment','Check the key, recipient and amount to generate a copy-and-paste code and QR code. Money goes directly to the seller; verify receipt in your bank.'],
  loyalty:['A reason to return','Add customers and choose how many purchases earn a reward. Record each purchase and send the card via WhatsApp.'],
  dormant:['Bring customers back','Choose how many days without a purchase to track. Inactive customers get a ready-made message for you to send.'],
  label:['Prepare your shipment','Fill in addresses and package items, then print the label and contents declaration. Shipping is not purchased here.'],
  debt:['Keep credit sales organized','Record the customer, amount, due date and installments. Mark as received only after checking payment.'],
  refund:['Manage returns','Select the sale, quantity and whether items should return to stock. Review details before confirming the refund.'],
  rent:['Track rentals','Add the contract and due dates, then create monthly records and track adjustments.'],
  invoice:['Prepare invoice details','Choose services or goods, fill in and copy validated details. Official invoices are issued on the official portal, not in Biztrivo.'],
  das:['DAS on the official portal','Enter the requested details to open PGMEI. Generate the official bill and Pix there; Biztrivo does not make the payment.'],
  post:['Your next post','Choose a product, format and tone. Generate the image and caption, review them and publish on Instagram.'],
  price:['Sell with a margin','Enter cost, taxes and your desired margin for a suggested price. Adjust inputs to your store’s actual costs.'],
  report:['Take your numbers with you','Choose a period and export PDF or CSV to review results or share with your accountant.'],
  accountant:['Organize your accounting','Review the summary and export your data. Estimates are advisory, not official filings or professional advice.'],
  mei:['Track your MEI','Choose the year to review income and prepare your summary. File the official declaration on the government portal.'],
  offline:['Record without internet','Record sales here without a connection. Once online, review and synchronize pending entries.'],
  academy:['Learn at your own pace','Download guides about pricing, stock and sales to consult when needed.'],
  settings:['Your store’s identity','Save the store name and photo. In Brazil, also add your Pix key for storefront purchases.'],
  replay:['Want to see it again?','Review tutorials resets tips in this browser. Each screen will show its steps again when you visit.'],
};
const es: Copy = {
  balance:['Tu saldo del día','Aquí aparecen los ingresos menos las salidas de hoy. Los gastos personales se muestran separados para controlar los retiros.'],
  quick:['Registra el movimiento','Usa estos accesos para registrar un ingreso o un gasto en Caja.'],
  entry:['Nuevo movimiento','Indica el importe y la descripción. Elige Entrada para dinero recibido o Salida para dinero gastado.'],
  personal:['Separa tienda y bolsillo','Activa Gasto Personal para tus propios retiros. Reducen el saldo, pero no se consideran costos del negocio.'],
  link:['Tu tienda en un enlace','Copia el enlace a WhatsApp o a tu biografía de Instagram para mostrar tus productos.'],
  product:['Añade tus productos','Añade foto, precio y existencias. Usa variantes para tallas y colores cuando sea necesario.'],
  pix:['Cobra con Pix','Comprueba la clave, el destinatario y el importe para generar el código y el QR. El dinero va al vendedor; verifica la recepción en el banco.'],
  loyalty:['Un motivo para volver','Añade clientes y elige cuántas compras dan una recompensa. Registra cada compra y envía la tarjeta por WhatsApp.'],
  dormant:['Recupera clientes','Elige cuántos días sin comprar quieres controlar. Los clientes inactivos aparecen con un mensaje listo para enviar.'],
  label:['Prepara tu envío','Completa direcciones y artículos, y luego imprime la etiqueta y la declaración de contenido. Aquí no se contrata el envío.'],
  debt:['Ventas a crédito organizadas','Registra cliente, importe, vencimiento y cuotas. Marca como recibido solo tras verificar el pago.'],
  refund:['Controla las devoluciones','Selecciona venta, cantidad y si los artículos vuelven al inventario. Revisa antes de confirmar el reembolso.'],
  rent:['Controla los alquileres','Añade el contrato y los vencimientos. Después genera registros mensuales y controla los ajustes.'],
  invoice:['Prepara los datos fiscales','Elige servicios o productos y copia los datos validados. La emisión oficial se hace en el portal, no en Biztrivo.'],
  das:['DAS en el portal oficial','Completa los datos para abrir PGMEI. Genera la guía y el Pix oficial allí; Biztrivo no realiza el pago.'],
  post:['Tu próxima publicación','Elige producto, formato y tono. Genera imagen y texto, revísalos y publica en Instagram.'],
  price:['Vende con margen','Introduce costo, impuestos y margen deseado para obtener un precio sugerido. Usa los costos reales de tu tienda.'],
  report:['Lleva tus cifras','Elige el período y exporta PDF o CSV para revisar resultados o compartir con tu contabilidad.'],
  accountant:['Organiza tu contabilidad','Revisa el resumen y exporta datos. Las estimaciones no son declaraciones oficiales ni asesoría profesional.'],
  mei:['Controla tu MEI','Elige el año para revisar ingresos y preparar un resumen. La declaración oficial se presenta en el portal del gobierno.'],
  offline:['Registra sin internet','Anota ventas sin conexión. Cuando vuelva internet, revisa y sincroniza los registros pendientes.'],
  academy:['Aprende a tu ritmo','Descarga guías sobre precios, inventario y ventas para consultarlas cuando las necesites.'],
  settings:['La identidad de tu tienda','Guarda nombre y foto. En Brasil, añade también la clave Pix para las compras desde el catálogo.'],
  replay:['¿Quieres verlo de nuevo?','Revisar tutoriales reinicia los consejos en este navegador. Cada pantalla mostrará sus pasos cuando la visites.'],
};
const fr: Copy = {
  balance:['Votre solde du jour','Voici les recettes moins les sorties du jour. Les dépenses personnelles sont affichées séparément pour suivre vos retraits.'],
  quick:['Enregistrez un mouvement','Utilisez ces raccourcis pour enregistrer une recette ou une dépense dans la caisse.'],
  entry:['Nouvelle écriture','Indiquez le montant et la description. Choisissez Entrée pour une recette ou Sortie pour une dépense.'],
  personal:['Séparez boutique et dépenses privées','Activez Dépense personnelle pour vos retraits privés. Ils réduisent le solde mais ne sont pas des coûts professionnels.'],
  link:['Votre boutique en un lien','Copiez le lien sur WhatsApp ou dans votre bio Instagram pour montrer vos produits.'],
  product:['Ajoutez vos produits','Ajoutez photo, prix et stock. Utilisez les variantes pour les tailles et couleurs si nécessaire.'],
  pix:['Demandez un paiement Pix','Vérifiez clé, bénéficiaire et montant pour générer le code et le QR. L’argent va au vendeur ; vérifiez sa réception à la banque.'],
  loyalty:['Une raison de revenir','Ajoutez un client et choisissez le nombre d’achats pour une récompense. Enregistrez chaque achat et envoyez la carte sur WhatsApp.'],
  dormant:['Faites revenir vos clients','Choisissez le nombre de jours sans achat à surveiller. Les clients inactifs apparaissent avec un message prêt à envoyer.'],
  label:['Préparez votre envoi','Complétez adresses et articles, puis imprimez l’étiquette et la déclaration de contenu. Aucun transport n’est acheté ici.'],
  debt:['Organisez les ventes à crédit','Enregistrez client, montant, échéance et mensualités. Confirmez la réception uniquement après vérification du paiement.'],
  refund:['Gérez les retours','Sélectionnez vente, quantité et retour éventuel en stock. Vérifiez les détails avant de confirmer le remboursement.'],
  rent:['Suivez les locations','Ajoutez contrat et échéances, puis créez les écritures mensuelles et suivez les révisions.'],
  invoice:['Préparez la facture','Choisissez services ou produits et copiez les données validées. L’émission officielle se fait sur le portail, pas dans Biztrivo.'],
  das:['DAS sur le portail officiel','Saisissez les données pour ouvrir PGMEI. Générez le document et le Pix officiel sur place ; Biztrivo n’effectue pas le paiement.'],
  post:['Votre prochaine publication','Choisissez produit, format et ton. Générez image et légende, vérifiez-les et publiez sur Instagram.'],
  price:['Vendez avec une marge','Indiquez coût, taxes et marge souhaitée pour un prix suggéré. Utilisez les coûts réels de votre boutique.'],
  report:['Emportez vos chiffres','Choisissez la période et exportez en PDF ou CSV pour vérifier les résultats ou les partager avec votre comptable.'],
  accountant:['Organisez votre comptabilité','Vérifiez le résumé et exportez les données. Les estimations ne sont ni des déclarations officielles ni des conseils professionnels.'],
  mei:['Suivez votre MEI','Choisissez l’année pour vérifier les recettes et préparer un résumé. La déclaration officielle se fait sur le portail gouvernemental.'],
  offline:['Enregistrez sans internet','Notez les ventes hors connexion. Une fois en ligne, vérifiez et synchronisez les écritures en attente.'],
  academy:['Apprenez à votre rythme','Téléchargez les guides sur les prix, le stock et les ventes pour les consulter au besoin.'],
  settings:['L’identité de votre boutique','Enregistrez le nom et la photo. Au Brésil, ajoutez votre clé Pix pour les achats depuis le catalogue.'],
  replay:['Envie de revoir les conseils ?','Revoir les tutoriels réinitialise les conseils dans ce navigateur. Chaque page affichera ses étapes à votre prochaine visite.'],
};
export const tourCopy = (lang: Lang, id: string) => ({ pt, en, es, fr })[lang][id];
export const tourLabels = {
  pt: { next: 'Próximo', previous: 'Voltar', skip: 'Pular tour', done: 'Entendido', replay: 'Rever tutoriais', progress: '{{current}} de {{total}}' },
  en: { next: 'Next', previous: 'Back', skip: 'Skip tour', done: 'Got it', replay: 'Review tutorials', progress: '{{current}} of {{total}}' },
  es: { next: 'Siguiente', previous: 'Atrás', skip: 'Omitir tutorial', done: 'Entendido', replay: 'Revisar tutoriales', progress: '{{current}} de {{total}}' },
  fr: { next: 'Suivant', previous: 'Retour', skip: 'Passer', done: 'Compris', replay: 'Revoir les tutoriels', progress: '{{current}} sur {{total}}' },
};