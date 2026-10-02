import React, { useState, useEffect, useRef } from 'react';
import { useLang as useGlobalLang } from '@/lib/useLang';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  BarChart3,
  Package,
  Calculator,
  BookOpen,
  Wallet,
  ChevronRight,
  Star,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Moon,
  Sun,
  Zap,
  Store,
  Download,
  Instagram,
  Linkedin,
  Mail,
  FileSpreadsheet,
  Briefcase,
  Sparkles,
  Heart,
} from 'lucide-react';

type Lang = 'pt' | 'en' | 'es' | 'fr';

const translations = {
  pt: {
    nav: {
      features: 'Funcionalidades',
      testimonials: 'PostsAI',
      pricing: 'Planos',
      login: 'Entrar',
      register: 'Começar grátis',
      registerMobile: 'Cadastrar',
    },
    hero: {
      h1a: 'Venda mais.',
      h1b: 'Controle tudo.',
      subtitle:
        'Caixa diário, vitrine própria, vendas no WhatsApp ou na Web, relatórios, PostsAI com sugestes inteligentes, calculadora de preço e materiais para vender mais. Feito para lojistas que querem crescer de verdade.',
      cta: 'Criar minha conta grátis',
      login: 'Já tenho conta',
    },
    dashboard: {
      url: 'biztrivo.com/dashboard',
      chartLabel: 'Entradas vs Saídas últimos 3 meses',
      cards: [
        {
          label: 'Saldo do Dia',
          value: 'R$ 1.240',
          trend: '🏆 Meta batida!',
          detail: 'Meta: R$ 1.000',
          detail2: '↑ 24% vs ontem',
        },
        {
          label: 'Entradas',
          value: 'R$ 1.820',
          trend: '12 vendas hoje',
          detail: 'Ticket médio: R$ 152',
          detail2: '3 pendentes',
        },
        {
          label: 'Margem Real',
          value: '54%',
          trend: 'Acima do ideal ✓',
          detail: 'Ideal: 40%+',
          detail2: '↑ 8pp vs mês',
        },
      ],
    },
    // Features section
    featuresSection: {
      eyebrow: 'Funcionalidades',
      title: 'Tudo que sua loja precisa',
      subtitle: 'Do controle de caixa à vitrine online, sem planilha e sem complicação.',
    },
    features: [
      {
        title: 'Caixa Diário',
        description:
          'Registre entradas e saídas em segundos. Acompanhe seu saldo, separe gastos pessoais e defina metas de faturamento com confete ao bater! 🎉',
      },
      {
        title: 'Vitrine Online Grátis',
        description:
          'Crie um catálogo digital com seus produtos e compartilhe um link. Seus clientes compram direto pelo WhatsApp sem taxa, sem complicação.',
      },
      {
        title: 'Relatórios Financeiros',
        description:
          'Veja sua margem de lucro real, distribuição de gastos e compare meses. Exporte em PDF ou CSV com um clique.',
      },
      {
        title: 'Calculadora de Preço',
        description:
          'Descubra o preço ideal considerando custo, impostos e margem de lucro. Nunca mais venda no prejuízo sem saber.',
      },
      {
        title: 'Academy',
        description:
          'Guias práticos para vender mais: precificação, fotos de catálogo, script de WhatsApp, promoções inteligentes e muito mais.',
      },
      {
        title: 'Integração WhatsApp',
        description:
          'Sua vitrine conectada diretamente ao WhatsApp. O cliente vê o produto, clica em comprar e já entra em contato com você automaticamente.',
      },
      {
        title: 'Modo Contador',
        description:
          'Tenha DRE automática, Score Financeiro e estimativa de impostos prontos a partir do seu caixa. Conversa direta com seu contador, sem planilha.',
      },
      {
        title: 'MEI Inteligente',
        description:
          'Acompanhe seu limite anual de faturamento MEI, alertas de risco de desenquadramento e lembrete do DAS mensal sempre na palma da mão.',
      },
      {
        title: 'PostsAI Instagram',
        description:
          'Gere posts profissionais para o Instagram dos seus produtos com inteligência artificial: imagem, legenda e hashtags prontas em segundos.',
      },
    ],
    // Storefront section
    storefront: {
      eyebrow: 'Vitrine Online',
      title: 'Seu catálogo no WhatsApp em minutos',
      subtitle:
        'Cadastre seus produtos, ative a vitrine e compartilhe um link único. Seus clientes veem tudo organizado e pedem direto pelo WhatsApp, você só atende e vende.',
      bullets: [
        'Link personalizado da sua loja',
        'Fotos, preços e descrições dos produtos',
        'Botão de compra integrado ao WhatsApp',
        'Funciona no celular e no computador',
      ],
      cta: 'Criar minha vitrine grátis',
      mockupStoreName: 'Minha Loja',
      mockupProducts: '3 produtos',
      mockupItems: [
        { name: 'Camiseta Floral', price: 'R$ 49,90', orig: 'R$ 79,90' },
        { name: 'Bolsa de Couro', price: 'R$ 129,00', orig: '' },
        { name: 'Vestido Longo', price: 'R$ 89,90', orig: 'R$ 120,00' },
      ],
      buyButton: 'Comprar',
    },
    // Academy section
    academy: {
      eyebrow: 'Academy',
      title: 'Aprenda a vender mais e melhor',
      subtitle: 'Guias práticos e gratuitos para lojistas que querem crescer.',
      guides: [
        'Como Precificar seus Produtos',
        'Fotos Profissionais com o Celular',
        'Script de Vendas no WhatsApp',
        'Como Fidelizar Clientes',
      ],
      download: 'Baixar grátis',
    },
    // PostIA section
    postIASection: {
      eyebrow: 'PostsAI',
      title: 'Posts para o Instagram em segundos',
      subtitle: 'Escolha o produto, o tom e a IA cria a imagem, a legenda e as hashtags. Você só posta.',
      steps: [
        { label: 'Escolha o produto', desc: 'Selecione da sua vitrine' },
        { label: 'Defina o tom', desc: 'Promocional, elegante ou divertido' },
        { label: 'Gere e publique', desc: 'Imagem + legenda + hashtags prontas' },
      ],
      mockup: {
        product: 'Bolsa de Couro Premium',
        price: 'R$ 129,00',
        caption: 'Sofisticação que cabe na mão. Nossa Bolsa de Couro Premium chegou para elevar o seu estilo! 🛍️ Link do catálogo na bio. Chama no WhatsApp! 💬',
        hashtags: '#moda #bolsa #couro #lookdodia #estilo',
        tag: 'IA gerou em 8 segundos',
      },
      bullets: [
        'Imagem profissional gerada por IA',
        'Legenda com CTA para WhatsApp',
        'Hashtags segmentadas por nicho',
        'Plano de conteúdo para 30 dias',
      ],
      cta: 'Testar PostsAI grátis',
    },
    // Pricing
    pricing: {
      eyebrow: 'Planos',
      title: 'Simples e sem surpresas',
      subtitle: 'Assine quando quiser desbloquear tudo.',
      badge: 'ÚNICO PLANO',
      planName: 'Biztrivo Pro',
      planDesc: 'Acesso completo a tudo',
      price: 'R$ 19,90',
      period: '/mês',
      items: [
        'Caixa Diário',
        'Vitrine Online',
        'Relatórios Financeiros',
        'Calculadora de Preço',
        'Academy completo',
        'Suporte por email',
        'Modo Contador',
        'MEI',
        'PostsAI',
        'Modo Offline',
      ],
      cta: 'Assinar agora',
    },
    ctaFinal: {
      title: 'Pronto para vender mais e controlar tudo?',
      subtitle:
        'Cadastre-se grátis agora e tenha sua vitrine online funcionando em menos de 5 minutos.',
      cta: 'Criar minha conta grátis',
      disclaimer: ' ',
    },
    footer: {
      rights: '© 2026 Biztrivo. Todos os direitos reservados.',
      terms: 'Termos de Uso',
      privacy: 'Política de Privacidade',
    },
  },

  en: {
    nav: {
      features: 'Features',
      testimonials: 'PostsAI',
      pricing: 'Pricing',
      login: 'Log in',
      register: 'Start free',
      registerMobile: 'Sign up',
    },
    hero: {
      badge: 'Everything your store needs in one place',
      h1a: 'Sell more.',
      h1b: 'Control everything.',
      subtitle:
        'Daily cash register, own storefront, WhatsApp & web sales, reports, PostsAI with smart suggestions, price calculator and resources to sell more. Built for retailers who are serious about growing.',      cta: 'Create my free account',
      login: 'I already have an account',
    },
    dashboard: {
      url: 'biztrivo.com/dashboard',
      chartLabel: 'Revenue vs Expenses last 3 months',
      cards: [
        {
          label: "Today's Balance",
          value: '$ 248',
          trend: '🏆 Goal reached!',
          detail: 'Goal: $ 200',
          detail2: '↑ 24% vs yesterday',
        },
        {
          label: 'Revenue',
          value: '$ 364',
          trend: '12 sales today',
          detail: 'Avg ticket: $ 30',
          detail2: '3 pending',
        },
        {
          label: 'Real Margin',
          value: '54%',
          trend: 'Above target ✓',
          detail: 'Target: 40%+',
          detail2: '↑ 8pp vs last month',
        },
      ],
    },
    stats: [
      { value: '12+', label: 'Active retailers' },
      { value: '$ 16k+', label: 'In tracked sales' },
      { value: '99.6%', label: 'Guaranteed uptime' },
      { value: '4.8★', label: 'Average rating' },
    ],
    featuresSection: {
      eyebrow: 'Features',
      title: 'Everything your store needs',
      subtitle: 'From cash management to online storefront, no spreadsheets and no hassle.',
    },
    features: [
      {
        title: 'Daily Cash Register',
        description:
          'Log income and expenses in seconds. Track your balance, separate personal costs, and set revenue goals complete with confetti when you hit them! 🎉',
      },
      {
        title: 'Free Online Storefront',
        description:
          'Create a digital catalog and share a link. Customers buy directly via WhatsApp no fees, no complexity.',
      },
      {
        title: 'Financial Reports',
        description:
          'See your real profit margin, expense breakdown, and compare months. Export to PDF or CSV in one click.',
      },
      {
        title: 'Price Calculator',
        description:
          'Find the ideal price considering cost, taxes, and profit margin. Never unknowingly sell at a loss again.',
      },
      {
        title: 'Academy',
        description:
          'Practical guides to sell more: pricing strategy, product photography, WhatsApp sales scripts, smart promotions, and much more.',
      },
      {
        title: 'WhatsApp Integration',
        description:
          'Your storefront connected directly to WhatsApp. Customers see the product, tap buy, and message you automatically.',
      },
      {
        title: 'Accountant Mode',
        description:
          'Automatic P&L, Financial Score and tax estimates built from your cash register. Talk to your accountant with real numbers, no spreadsheets.',
      },
      {
        title: 'Smart MEI',
        description:
          'Track your MEI annual revenue limit, get early alerts before exceeding it, and never miss the monthly DAS tax reminder.',
      },
      {
        title: 'PostsAI for Instagram',
        description:
          'Generate professional Instagram posts for your products with AI: image, caption and hashtags ready in seconds.',
      },
    ],
    storefront: {
      eyebrow: 'Online Storefront',
      title: 'Your catalog on WhatsApp in minutes',
      subtitle:
        'Add your products, activate your storefront, and share a unique link. Customers see everything organized and order via WhatsApp you just sell.',
      bullets: [
        'Personalized link for your store',
        'Photos, prices, and product descriptions',
        'Buy button integrated with WhatsApp',
        'Works on mobile and desktop',
      ],
      cta: 'Create my free storefront',
      mockupStoreName: 'My Store',
      mockupProducts: '3 products',
      mockupItems: [
        { name: 'Floral T-Shirt', price: '$ 9.90', orig: '$ 15.90' },
        { name: 'Leather Bag', price: '$ 25.90', orig: '' },
        { name: 'Long Dress', price: '$ 17.90', orig: '$ 24.00' },
      ],
      buyButton: 'Buy',
    },
    academy: {
      eyebrow: 'Academy',
      title: 'Learn to sell more and better',
      subtitle: 'Free practical guides for retailers who want to grow.',
      guides: [
        'How to Price Your Products',
        'Professional Photos with Your Phone',
        'WhatsApp Sales Script',
        'How to Build Customer Loyalty',
      ],
      download: 'Download free',
    },
    // PostIA section
    postIASection: {
      eyebrow: 'PostsAI',
      title: 'Instagram posts in seconds',
      subtitle: 'Pick a product, choose a tone, and AI creates the image, caption, and hashtags. Just post.',
      steps: [
        { label: 'Choose a product', desc: 'Select from your storefront' },
        { label: 'Set the tone', desc: 'Promotional, elegant, or fun' },
        { label: 'Generate & post', desc: 'Image + caption + hashtags ready' },
      ],
      mockup: {
        product: 'Premium Leather Bag',
        price: '$ 25.90',
        caption: 'Sophistication that fits in your hand. Our Premium Leather Bag is here to elevate your style! 🛍️ Catalog link in bio. Message us on WhatsApp! 💬',
        hashtags: '#fashion #bag #leather #ootd #style',
        tag: 'AI generated in 8 seconds',
      },
      bullets: [
        'Professional image generated by AI',
        'Caption with WhatsApp CTA',
        'Hashtags segmented by niche',
        '30-day content plan',
      ],
      cta: 'Try PostsAI free',
    },
    pricing: {
      eyebrow: 'Pricing',
      title: 'Simple and no surprises',
      subtitle: 'Subscribe when you want to unlock everything.',
      badge: 'ONE PLAN',
      planName: 'Biztrivo Pro',
      planDesc: 'Full access to everything',
      price: '$ 8.90',
      period: '/month',
      items: [
        'Daily Cash Register',
        'Online Storefront',
        'Financial Reports',
        'Price Calculator',
        'Full Academy',
        'Email support',
        'Accountant Mode',
        'Smart MEI',
        'PostsAI',
        'Offline Mode',
      ],
      cta: 'Subscribe now',
    },
    ctaFinal: {
      title: 'Ready to sell more and control everything?',
      subtitle: 'Sign up free now and have your online storefront running in under 5 minutes.',
      cta: 'Create my free account',
      disclaimer: ' ',
    },
    footer: {
      rights: '© 2026 Biztrivo. All rights reserved.',
      terms: 'Terms of Use',
      privacy: 'Privacy Policy',
    },
  },

  es: {
    nav: {
      features: 'Funciones',
      testimonials: 'PostsAI',
      pricing: 'Planes',
      login: 'Entrar',
      register: 'Empezar gratis',
      registerMobile: 'Registrarse',
    },
    hero: {
      badge: 'Todo lo que tu tienda necesita en un solo lugar',
      h1a: 'Vende más.',
      h1b: 'Controla todo.',
     subtitle:
        'Caja diaria, vitrina propia, ventas por WhatsApp o en la Web, informes, PostsAI con sugerencias inteligentes, calculadora de precios y materiales para vender más. Hecho para comerciantes que quieren crecer de verdad.',      cta: 'Crear mi cuenta gratis',
      login: 'Ya tengo cuenta',
    },
    dashboard: {
      url: 'biztrivo.com/dashboard',
      chartLabel: 'Ingresos vs Gastos últimos 3 meses',
      cards: [
        {
          label: 'Saldo del Día',
          value: '$ 248',
          trend: '🏆 ¡Meta alcanzada!',
          detail: 'Meta: $ 200',
          detail2: '↑ 24% vs ayer',
        },
        {
          label: 'Ingresos',
          value: '$ 364',
          trend: '12 ventas hoy',
          detail: 'Ticket medio: $ 30',
          detail2: '3 pendientes',
        },
        {
          label: 'Margen Real',
          value: '54%',
          trend: 'Por encima del ideal ✓',
          detail: 'Ideal: 40%+',
          detail2: '↑ 8pp vs mes',
        },
      ],
    },
    stats: [
      { value: '14+', label: 'Comerciantes activos' },
      { value: '$ 21k+', label: 'En ventas controladas' },
      { value: '99.6%', label: 'Uptime garantizado' },
      { value: '4.8★', label: 'Valoración media' },
    ],
    featuresSection: {
      eyebrow: 'Funciones',
      title: 'Todo lo que tu tienda necesita',
      subtitle: 'Del control de caja a la vitrina online sin hojas de cálculo, sin complicaciones.',
    },
    features: [
      {
        title: 'Caja Diaria',
        description:
          'Registra ingresos y gastos en segundos. Controla tu saldo, separa gastos personales y establece metas de facturación con confeti al alcanzarlas! 🎉',
      },
      {
        title: 'Vitrina Online Gratis',
        description:
          'Crea un catálogo digital con tus productos y comparte un enlace. Tus clientes compran directo por WhatsApp, sin comisión, sin complicación.',
      },
      {
        title: 'Informes Financieros',
        description:
          'Ve tu margen de ganancia real, distribución de gastos y compara meses. Exporta en PDF o CSV con un clic.',
      },
      {
        title: 'Calculadora de Precios',
        description:
          'Descubre el precio ideal considerando costo, impuestos y margen de ganancia. Nunca más vendas sin saber si pierdes dinero.',
      },
      {
        title: 'Academy',
        description:
          'Guías prácticas para vender más: precios, fotos de catálogo, guión de WhatsApp, promociones inteligentes y mucho más.',
      },
      {
        title: 'Integración WhatsApp',
        description:
          'Tu vitrina conectada directamente a WhatsApp. El cliente ve el producto, hace clic en comprar y te contacta automáticamente.',
      },
      {
        title: 'Modo Contador',
        description:
          'DRE automática, Score Financiero y estimación de impuestos generados desde tu caja. Habla con tu contador con datos reales, sin planillas.',
      },
      {
        title: 'MEI Inteligente',
        description:
          'Controla tu límite anual de facturación MEI, recibe alertas de riesgo y nunca olvides el pago mensual del DAS.',
      },
      {
        title: 'PostsAI para Instagram',
        description:
          'Genera publicaciones profesionales de Instagram de tus productos con IA: imagen, texto y hashtags listos en segundos.',
      },
    ],
    storefront: {
      eyebrow: 'Vitrina Online',
      title: 'Tu catálogo en WhatsApp en minutos',
      subtitle:
        'Registra tus productos, activa la vitrina y comparte un enlace único. Tus clientes ven todo organizado y piden directo por WhatsApp, tú solo atiendes y vendes.',
      bullets: [
        'Enlace personalizado de tu tienda',
        'Fotos, precios y descripciones de productos',
        'Botón de compra integrado con WhatsApp',
        'Funciona en móvil y en computadora',
      ],
      cta: 'Crear mi vitrina gratis',
      mockupStoreName: 'Mi Tienda',
      mockupProducts: '3 productos',
      mockupItems: [
        { name: 'Camiseta Floral', price: '$ 9,90', orig: '$ 15,90' },
        { name: 'Bolso de Cuero', price: '$ 25,90', orig: '' },
        { name: 'Vestido Largo', price: '$ 17,90', orig: '$ 24,00' },
      ],
      buyButton: 'Comprar',
    },
    academy: {
      eyebrow: 'Academy',
      title: 'Aprende a vender más y mejor',
      subtitle: 'Guías prácticas y gratuitas para comerciantes que quieren crecer.',
      guides: [
        'Cómo Fijar el Precio de tus Productos',
        'Fotos Profesionales con el Celular',
        'Guión de Ventas en WhatsApp',
        'Cómo Fidelizar Clientes',
      ],
      download: 'Descargar gratis',
    },
    // PostIA section
    postIASection: {
      eyebrow: 'PostsAI',
      title: 'Posts de Instagram en segundos',
      subtitle: 'Elige el producto, el tono, y la IA crea la imagen, el texto y los hashtags. Solo publicas.',
      steps: [
        { label: 'Elige el producto', desc: 'Selecciona de tu vitrina' },
        { label: 'Define el tono', desc: 'Promocional, elegante o divertido' },
        { label: 'Genera y publica', desc: 'Imagen + texto + hashtags listos' },
      ],
      mockup: {
        product: 'Bolso de Cuero Premium',
        price: '$ 25,90',
        caption: 'Sofisticación que cabe en la mano. ¡Nuestro Bolso de Cuero Premium llegó para elevar tu estilo! 🛍️ Enlace del catálogo en bio. ¡Escríbenos! 💬',
        hashtags: '#moda #bolso #cuero #lookdeldia #estilo',
        tag: 'IA generó en 8 segundos',
      },
      bullets: [
        'Imagen profesional generada por IA',
        'Texto con CTA para WhatsApp',
        'Hashtags segmentados por nicho',
        'Plan de contenido de 30 días',
      ],
      cta: 'Probar PostsAI gratis',
    },
    pricing: {
      eyebrow: 'Planes',
      title: 'Simple y sin sorpresas',
      subtitle: 'Suscríbete cuando quieras desbloquear todo.',
      badge: 'ÚNICO PLAN',
      planName: 'Biztrivo Pro',
      planDesc: 'Acceso completo a todo',
      price: '$ 8.90',
      period: '/mes',
      items: [
        'Caja Diaria',
        'Vitrina Online',
        'Informes Financieros',
        'Calculadora de Precios',
        'Academy completo',
        'Soporte por email',
        'Modo Contador',
        'MEI Inteligente',
        'PostsAI',
        'Modo Offline',
      ],
      cta: 'Suscribirme ahora',
    },
    ctaFinal: {
      title: '¿Listo para vender más y controlar todo?',
      subtitle:
        'Regístrate gratis ahora y ten tu vitrina online funcionando en menos de 5 minutos.',
      cta: 'Crear mi cuenta gratis',
      disclaimer: ' ',
    },
    footer: {
      rights: '© 2026 Biztrivo. Todos los derechos reservados.',
      terms: 'Términos de Uso',
      privacy: 'Política de Privacidad',
    },
  },

  fr: {
    nav: {
      features: 'Fonctionnalités',
      testimonials: 'PostsAI',
      pricing: 'Tarifs',
      login: 'Connexion',
      register: 'Commencer gratuit',
      registerMobile: "S'inscrire",
    },
    hero: {
      badge: 'Tout ce dont votre boutique a besoin en un seul endroit',
      h1a: 'Vendez plus.',
      h1b: 'Contrôlez tout.',
       subtitle:
        'Caisse journalière, vitrine propre, ventes sur WhatsApp ou le Web, rapports, PostsAI avec suggestions intelligentes, calculateur de prix et ressources pour vendre plus. Conçu pour les commerçants qui veulent vraiment croître.',
      cta: 'Créer mon compte gratuit',
      login: "J'ai déjà un compte",
    },
    dashboard: {
      url: 'biztrivo.com/dashboard',
      chartLabel: 'Recettes vs Dépenses 3 derniers mois',
      cards: [
        {
          label: 'Solde du Jour',
          value: '€ 248',
          trend: '🏆 Objectif atteint !',
          detail: 'Objectif : € 200',
          detail2: '↑ 24 % vs hier',
        },
        {
          label: 'Recettes',
          value: '€ 364',
          trend: '12 ventes aujourd\'hui',
          detail: 'Panier moyen : € 30',
          detail2: '3 en attente',
        },
        {
          label: 'Marge Réelle',
          value: '54 %',
          trend: 'Au-dessus de l\'idéal ✓',
          detail: 'Idéal : 40 %+',
          detail2: '↑ 8pp vs mois',
        },
      ],
    },
    stats: [
      { value: '17+', label: 'Commerçants actifs' },
      { value: '€ 36k+', label: 'En ventes suivies' },
      { value: '99,6 %', label: 'Disponibilité garantie' },
      { value: '4,8★', label: 'Note moyenne' },
    ],
    featuresSection: {
      eyebrow: 'Fonctionnalités',
      title: 'Tout ce dont votre boutique a besoin',
      subtitle: 'De la gestion de caisse à la vitrine en ligne sans tableur, sans tracas.',
    },
    features: [
      {
        title: 'Caisse Journalière',
        description:
          'Enregistrez entrées et sorties en quelques secondes. Suivez votre solde, séparez dépenses personnelles et fixez des objectifs de chiffre d\'affaires avec confettis ! 🎉',
      },
      {
        title: 'Vitrine en Ligne Gratuite',
        description:
          'Créez un catalogue numérique et partagez un lien. Vos clients achètent directement via WhatsApp, sans commission, sans complication.',
      },
      {
        title: 'Rapports Financiers',
        description:
          'Consultez votre marge bénéficiaire réelle, la répartition des dépenses et comparez les mois. Exportez en PDF ou CSV en un clic.',
      },
      {
        title: 'Calculateur de Prix',
        description:
          'Trouvez le prix idéal en tenant compte du coût, des taxes et de la marge. Ne vendez plus jamais à perte sans le savoir.',
      },
      {
        title: 'Academy',
        description:
          'Guides pratiques pour vendre plus : tarification, photos de catalogue, script WhatsApp, promotions intelligentes et bien plus.',
      },
      {
        title: 'Intégration WhatsApp',
        description:
          'Votre vitrine connectée directement à WhatsApp. Le client voit le produit, clique sur acheter et vous contacte automatiquement.',
      },
      {
        title: 'Mode Comptable',
        description:
          'Compte de résultat automatique, Score Financier et estimation des taxes générés depuis votre caisse. Parlez à votre comptable avec des chiffres réels.',
      },
      {
        title: 'MEI Intelligent',
        description:
          'Suivez votre plafond annuel de chiffre d\'affaires MEI, recevez des alertes en cas de risque et ne ratez plus jamais le paiement mensuel du DAS.',
      },
      {
        title: 'PostsAI pour Instagram',
        description:
          'Générez des publications Instagram professionnelles pour vos produits avec l\'IA : image, légende et hashtags prêts en quelques secondes.',
      },
    ],
    storefront: {
      eyebrow: 'Vitrine en Ligne',
      title: 'Votre catalogue sur WhatsApp en quelques minutes',
      subtitle:
        'Ajoutez vos produits, activez votre vitrine et partagez un lien unique. Vos clients voient tout organisé et commandent via WhatsApp, il ne reste qu\'à vendre.',
      bullets: [
        'Lien personnalisé de votre boutique',
        'Photos, prix et descriptions des produits',
        "Bouton d'achat intégré à WhatsApp",
        'Fonctionne sur mobile et ordinateur',
      ],
      cta: 'Créer ma vitrine gratuite',
      mockupStoreName: 'Ma Boutique',
      mockupProducts: '3 produits',
      mockupItems: [
        { name: 'T-Shirt Floral', price: '€ 9,90', orig: '€ 15,90' },
        { name: 'Sac en Cuir', price: '€ 25,90', orig: '' },
        { name: 'Robe Longue', price: '€ 17,90', orig: '€ 24,00' },
      ],
      buyButton: 'Acheter',
    },
    academy: {
      eyebrow: 'Academy',
      title: 'Apprenez à vendre plus et mieux',
      subtitle: 'Guides pratiques et gratuits pour les commerçants qui veulent grandir.',
      guides: [
        'Comment Fixer le Prix de vos Produits',
        'Photos Professionnelles avec votre Téléphone',
        'Script de Vente sur WhatsApp',
        'Comment Fidéliser vos Clients',
      ],
      download: 'Télécharger gratuit',
    },
    // PostIA section
    postIASection: {
      eyebrow: 'PostsAI',
      title: 'Publications Instagram en secondes',
      subtitle: 'Choisissez le produit, le ton, et l\'IA crée l\'image, la légende et les hashtags. Il ne reste qu\'à publier.',
      steps: [
        { label: 'Choisissez un produit', desc: 'Sélectionnez dans votre vitrine' },
        { label: 'Définissez le ton', desc: 'Promotionnel, élégant ou amusant' },
        { label: 'Générez & publiez', desc: 'Image + légende + hashtags prêts' },
      ],
      mockup: {
        product: 'Sac en Cuir Premium',
        price: '€ 25,90',
        caption: 'La sophistication au bout des doigts. Notre Sac en Cuir Premium est là pour sublimer votre style ! 🛍️ Lien du catalogue en bio. Contactez-nous ! 💬',
        hashtags: '#mode #sac #cuir #lookdujour #style',
        tag: 'IA générée en 8 secondes',
      },
      bullets: [
        'Image professionnelle générée par IA',
        'Légende avec CTA pour WhatsApp',
        'Hashtags segmentés par niche',
        'Plan de contenu sur 30 jours',
      ],
      cta: 'Essayer PostsAI gratuitement',
    },
    pricing: {
      eyebrow: 'Tarifs',
      title: 'Simple et sans surprises',
      subtitle: 'Abonnez-vous quand vous voulez tout débloquer.',
      badge: 'PLAN UNIQUE',
      planName: 'Biztrivo Pro',
      planDesc: 'Accès complet à tout',
     price: '$ 8.90',
      period: '/mois',
      items: [
        'Caisse Journalière',
        'Vitrine en Ligne',
        'Rapports Financiers',
        'Calculateur de Prix',
        'Academy complet',
        'Support par email',
        'Mode Comptable',
        'MEI Intelligent',
        'PostsAI',
        'Mode Hors-ligne',
      ],
      cta: "S'abonner maintenant",
    },
    ctaFinal: {
      title: 'Prêt à vendre plus et tout contrôler ?',
      subtitle:
        'Inscrivez-vous gratuitement et lancez votre vitrine en ligne en moins de 5 minutes.',
      cta: 'Créer mon compte gratuit',
      disclaimer: ' ',
    },
    footer: {
      rights: '© 2026 Biztrivo. Tous droits réservés.',
      terms: "Conditions d'utilisation",
      privacy: 'Politique de confidentialité',
    },
  },
} as const;

// idioma detectado/persistido globalmente via useGlobalLang (src/lib/useLang.ts)

const featureIcons = [
  <Wallet size={28} />,
  <Store size={28} />,
  <BarChart3 size={28} />,
  <Calculator size={28} />,
  <BookOpen size={28} />,
  <MessageCircle size={28} />,
  <FileSpreadsheet size={28} />,
  <Briefcase size={28} />,
  <Sparkles size={28} />,
];

const featureColors = [
  'from-green-400 to-emerald-500',
  'from-blue-400 to-cyan-500',
  'from-purple-400 to-indigo-500',
  'from-orange-400 to-pink-500',
  'from-teal-400 to-blue-500',
  'from-rose-400 to-red-500',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-indigo-500',
  'from-fuchsia-400 to-pink-500',
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function useCounter(target: number, decimals = 0, duration = 1400, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const factor = Math.pow(10, decimals);
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * target * factor) / factor);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, decimals, duration]);
  return count;
}

const HERO_PHRASE: Record<Lang, { a: string; b: string; subtitle: string }> = {
  pt: {
    a: 'Venda mais.',
    b: 'Controle tudo.',
    subtitle: 'Do caixa diário à vitrine online, com posts gerados por IA e relatórios que mostram o lucro real do seu negócio.',
  },
  en: {
    a: 'Grow your business.',
    b: 'Without the chaos.',
    subtitle: 'Track every sale, showcase your products online and let AI handle your Instagram content while you focus on selling.',
  },
  es: {
    a: 'Tu negocio en orden.',
    b: 'Sin complicaciones.',
    subtitle: 'Registra tus ventas, muestra tus productos en línea y deja que la IA cree tu contenido para que tú solo te dediques a vender.',
  },
  fr: {
    a: 'Votre boutique,',
    b: 'enfin maîtrisée.',
    subtitle: 'Suivez vos ventes au quotidien, exposez vos produits en ligne et laissez l\'IA créer vos publications pendant que vous vendez.',
  },
};

function useHeroPhrase(lang: Lang) {
  const [visible, setVisible] = useState(true);
  const [phrase, setPhrase] = useState(HERO_PHRASE[lang]);
  const prevLang = useRef(lang);

  useEffect(() => {
    if (lang === prevLang.current) return;
    prevLang.current = lang;
    setVisible(false);
    const id = setTimeout(() => {
      setPhrase(HERO_PHRASE[lang]);
      setVisible(true);
    }, 220);
    return () => clearTimeout(id);
  }, [lang]);

  return { phrase, visible };
}

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

const StatCard: React.FC<{ value: string; label: string; active: boolean }> = ({ value, label, active }) => {
  const numMatch = value.match(/\d+(\.\d+)?/);
  const numStr = numMatch ? numMatch[0] : '0';
  const numVal = parseFloat(numStr) || 0;
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
  const prefix = value.match(/^[^\d]*/)?.[0] ?? '';
  const suffix = value.replace(/^[^\d]*[\d.]+/, '');
  const count = useCounter(numVal, decimals, 1400, active);

  const display = numVal >= 1000
    ? (count / 1000).toFixed(1) + 'k'
    : count.toFixed(decimals);

  return (
    <div>
      <p className="text-4xl font-extrabold text-white mb-1">
        {prefix}{display}{suffix}
      </p>
      <p className="text-green-100 text-sm font-medium">{label}</p>
    </div>
  );
};

const langLabels: Record<Lang, string> = { pt: '🇧🇷 PT', en: '🇺🇸 EN', es: '🇪🇸 ES', fr: '🇫🇷 FR' };

const LangSwitcher: React.FC<{ lang: Lang; setLang: (l: Lang) => void; isDark?: boolean }> = ({ lang, setLang, isDark }) => {
  const [open, setOpen] = useState(false);
  const langs: Lang[] = ['pt', 'en', 'es', 'fr'];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border ${isDark ? 'text-green-200 hover:text-white hover:bg-white/10 border-white/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-200'}`}
      >
        {langLabels[lang]}
      </button>
      {open && (
        <div className={`absolute right-0 mt-1 rounded-xl shadow-lg overflow-hidden z-50 border ${isDark ? 'bg-[#0a2a18] border-green-900/40' : 'bg-white border-gray-200'}`}>
          {langs.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              className={`block w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${l === lang ? 'text-green-400' : isDark ? 'text-green-200' : 'text-gray-700'} ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}
            >
              {langLabels[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const HeroDashboard: React.FC<{ isDark: boolean; lang: Lang }> = ({ isDark, lang }) => {
  const [activeTab, setActiveTab] = useState<'relatorios' | 'posts' | 'vitrine' | 'contador'>('relatorios');

  const tabs = [
    { id: 'relatorios' as const, label: lang === 'pt' ? 'Relatórios' : lang === 'en' ? 'Reports' : lang === 'es' ? 'Informes' : 'Rapports', icon: <BarChart3 size={13} /> },
    { id: 'posts'     as const, label: 'Posts IA',                                                                                                                                    icon: <Sparkles size={13} /> },
    { id: 'vitrine'   as const, label: lang === 'pt' ? 'Vitrine' : lang === 'en' ? 'Storefront' : lang === 'es' ? 'Vitrina' : 'Vitrine',                                             icon: <Store size={13} /> },
    { id: 'contador'  as const, label: lang === 'pt' ? 'Contador' : lang === 'en' ? 'Accountant' : lang === 'es' ? 'Contador' : 'Comptable',                                        icon: <FileSpreadsheet size={13} /> },
  ] as const;

  const bg    = isDark ? 'bg-[#0b1e13]'     : 'bg-[#0f172a]';
  const panel = isDark ? 'bg-[#0d2318]/80'  : 'bg-[#1e293b]';
  const card  = isDark ? 'bg-[#0a2a18]/90'  : 'bg-[#273548]';
  const muted = 'text-slate-400';
  const hi    = 'text-emerald-400';

  // ── dados mockados fiéis ao produto real ──
  const dreRows = [
    { label: lang === 'pt' ? 'Receita bruta'       : lang === 'en' ? 'Gross revenue'  : lang === 'es' ? 'Ingresos brutos'   : 'CA brut',          value: lang === 'pt' ? 'R$ 8.420' : lang === 'en' ? '$ 1.684' : '$ 1.684', color: 'text-white',         bar: 100 },
    { label: lang === 'pt' ? '(-) DAS / Impostos'  : lang === 'en' ? '(-) Taxes'      : lang === 'es' ? '(-) Impuestos'     : '(-) Cotisations',  value: lang === 'pt' ? '- R$ 421' : lang === 'en' ? '- $ 129' : '- $ 129', color: 'text-red-400',       bar: 5  },
    { label: lang === 'pt' ? '(-) Custos'          : lang === 'en' ? '(-) Costs'      : lang === 'es' ? '(-) Costos'        : '(-) Charges',      value: lang === 'pt' ? '- R$ 3.100' : '- $ 620',                            color: 'text-amber-400',     bar: 37 },
    { label: lang === 'pt' ? '(-) Gastos pessoais' : lang === 'en' ? '(-) Personal'   : lang === 'es' ? '(-) Gast. pers.'   : '(-) Pers.',        value: lang === 'pt' ? '- R$ 980' : '- $ 196',                             color: 'text-violet-400',    bar: 12 },
    { label: lang === 'pt' ? '= Lucro líquido'     : lang === 'en' ? '= Net profit'   : lang === 'es' ? '= Lucro neto'      : '= Bénéfice net',   value: lang === 'pt' ? 'R$ 3.919' : lang === 'en' ? '$ 739'  : '$ 739',  color: 'text-emerald-400',   bar: 47 },
  ];

  const barData = [
    { h: 45, label: 'Jan' }, { h: 58, label: 'Fev' }, { h: 42, label: 'Mar' },
    { h: 71, label: 'Abr' }, { h: 63, label: 'Mai' }, { h: 88, label: 'Jun' },
  ];

  const produtos = [
    { name: lang === 'pt' ? 'Bolsa de Couro Premium' : 'Premium Leather Bag', price: lang === 'pt' ? 'R$ 129,00' : '$ 25.90', stock: 8,  hot: true  },
    { name: lang === 'pt' ? 'Vestido Longo Floral'   : 'Floral Long Dress',   price: lang === 'pt' ? 'R$ 89,90'  : '$ 17.90', stock: 3,  hot: false },
    { name: lang === 'pt' ? 'Camiseta Estampada'     : 'Printed T-Shirt',     price: lang === 'pt' ? 'R$ 49,90'  : '$ 9.90',  stock: 15, hot: true  },
    { name: lang === 'pt' ? 'Tênis Casual Branco'    : 'White Casual Sneaker',price: lang === 'pt' ? 'R$ 199,00' : '$ 39.90', stock: 2,  hot: false },
  ];

  const pedidos = [
    { id: '#BZ-0091', item: lang === 'pt' ? 'Bolsa Couro'   : 'Leather Bag',   time: '2min'  },
    { id: '#BZ-0090', item: lang === 'pt' ? 'Vestido Longo' : 'Long Dress',    time: '18min' },
    { id: '#BZ-0089', item: lang === 'pt' ? 'Camiseta Est.' : 'Printed T-Shirt',time: '1h'  },
    { id: '#BZ-0088', item: lang === 'pt' ? 'Tênis Casual'  : 'Casual Sneaker', time: '2h'  },
  ];

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      {/* moldura */}
      <div className="rounded-2xl p-[2px] bg-gradient-to-br from-emerald-500 via-blue-500 to-emerald-700 shadow-2xl">
        <div className={`${bg} rounded-2xl overflow-hidden`}>

          {/* barra superior do browser */}
          <div className="bg-[#0a0f0d] px-4 py-2 flex flex-col gap-1.5 border-b border-white/5">
            {/* linha 1: dots + URL */}
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 bg-white/5 rounded-md px-3 py-1 text-left min-w-0">
                <span className="text-slate-500 text-[11px] truncate block">biztrivo.com/dashboard</span>
              </div>
            </div>
            {/* linha 2: tabs */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md transition-all shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* conteúdo fixo em altura */}
          <div style={{ height: 'clamp(260px, 55vw, 500px)' }} className="overflow-hidden">

            {/* ── ABA: RELATÓRIOS ── */}
            {activeTab === 'relatorios' && (
              <div className="h-full grid grid-cols-12 gap-2 p-3">

                {/* col esquerda: KPIs estilo Relatorios.tsx */}
                <div className="col-span-4 flex flex-col gap-2">
                  {[
                    { label: lang === 'pt' ? 'Faturamento do mês' : lang === 'en' ? 'Monthly revenue' : lang === 'es' ? 'Facturación' : 'CA du mois', value: lang === 'pt' ? 'R$ 8.420' : '$ 1.684', delta: '+18%', bar: 74 },
                    { label: lang === 'pt' ? 'Margem real'        : lang === 'en' ? 'Real margin'      : lang === 'es' ? 'Margen real' : 'Marge réelle', value: '54%', delta: '+8pp', bar: 54 },
                    { label: lang === 'pt' ? 'Ticket médio'       : lang === 'en' ? 'Avg ticket'       : lang === 'es' ? 'Ticket medio' : 'Ticket moyen', value: lang === 'pt' ? 'R$ 152' : '$ 30', delta: '+11%', bar: 62 },
                  ].map(k => (
                    <div key={k.label} className={`${card} rounded-xl p-3 flex-1`}>
                      <p className={`${muted} text-[10px] mb-1`}>{k.label}</p>
                      <div className="flex items-end justify-between mb-2">
                        <p className="text-white font-bold text-lg leading-none">{k.value}</p>
                        <span className="text-emerald-400 text-[10px] font-semibold">{k.delta}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1">
                        <div className="h-1 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400" style={{ width: `${k.bar}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* col central: gráfico Entradas vs Saídas (fiel ao BarChart do Relatorios.tsx) */}
                <div className={`col-span-5 ${panel} rounded-xl p-3 flex flex-col`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 text-[11px] font-medium">
                      {lang === 'pt' ? 'Entradas vs Saídas' : lang === 'en' ? 'Revenue vs Expenses' : lang === 'es' ? 'Entradas vs Salidas' : 'Revenus vs Charges'}
                    </span>
                    <TrendingUp size={12} className="text-emerald-400" />
                  </div>
                  {/* legenda */}
                  <div className="flex gap-3 mb-2">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500" /><span className={`${muted} text-[8px]`}>{lang === 'pt' ? 'Entradas' : 'Revenue'}</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-400" /><span className={`${muted} text-[8px]`}>{lang === 'pt' ? 'Saídas' : 'Expenses'}</span></div>
                  </div>
                  <div className="flex-1 flex items-end gap-1">
                    {barData.map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full flex items-end justify-center gap-0.5" style={{ height: '100px' }}>
                          {/* barra entrada */}
                          <div className="w-[45%] rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400" style={{ height: `${bar.h}%` }} />
                          {/* barra saída — ~55% da entrada */}
                          <div className="w-[45%] rounded-t-sm bg-red-400/70" style={{ height: `${Math.round(bar.h * 0.52)}%` }} />
                        </div>
                        <span className={`${muted} text-[8px]`}>{bar.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* col direita: gastos por categoria (fiel ao PieChart/barras do Relatorios.tsx) */}
                <div className="col-span-3 flex flex-col gap-2">
                  <div className={`${panel} rounded-xl p-3 flex-1`}>
                    <p className={`${muted} text-[10px] mb-2`}>
                      {lang === 'pt' ? 'Gastos por categoria' : lang === 'en' ? 'Expenses by category' : lang === 'es' ? 'Gastos por categoría' : 'Dépenses par catégorie'}
                    </p>
                    {[
                      { label: lang === 'pt' ? 'Reposição' : 'Restock',  pct: 48, color: 'bg-blue-400' },
                      { label: lang === 'pt' ? 'Embalagem' : 'Packaging', pct: 22, color: 'bg-amber-400' },
                      { label: lang === 'pt' ? 'Frete'     : 'Shipping',  pct: 18, color: 'bg-violet-400' },
                      { label: lang === 'pt' ? 'Outros'    : 'Others',    pct: 12, color: 'bg-slate-500' },
                    ].map(c => (
                      <div key={c.label} className="mb-1.5">
                        <div className="flex justify-between mb-0.5">
                          <span className={`${muted} text-[9px]`}>{c.label}</span>
                          <span className="text-slate-300 text-[9px]">{c.pct}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1">
                          <div className={`h-1 rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* curva de saldo acumulado — mini linha (fiel ao LineChart do Relatorios.tsx) */}
                  <div className={`${card} rounded-xl p-3`}>
                    <p className={`${muted} text-[10px] mb-1`}>
                      {lang === 'pt' ? 'Saldo acumulado' : lang === 'en' ? 'Accumulated balance' : lang === 'es' ? 'Saldo acumulado' : 'Solde cumulé'}
                    </p>
                    <svg viewBox="0 0 80 30" className="w-full h-6">
                      <polyline
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points="0,28 13,22 26,18 39,14 52,10 65,6 80,2"
                      />
                    </svg>
                    <p className="text-emerald-400 font-bold text-sm mt-0.5">{lang === 'pt' ? 'R$ 3.919' : '$ 739'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── ABA: POSTS IA ── */}
            {activeTab === 'posts' && (
              <div className="h-full grid grid-cols-12 gap-3 p-4">
                {/* preview do post */}
                <div className="col-span-4 flex flex-col">
                  <div className={`${panel} rounded-xl overflow-hidden flex-1 flex flex-col`}>
                    <div className="bg-gradient-to-br from-emerald-700 to-blue-800 h-32 flex items-center justify-center relative">
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1.5">
                          <ShoppingBag size={18} className="text-white" />
                        </div>
                    <p className="text-white font-bold text-xs">
                      {lang === 'pt' ? 'Bolsa de Couro' : lang === 'en' ? 'Leather Bag' : lang === 'es' ? 'Bolso de Cuero' : 'Sac en Cuir'}
                    </p>
                    <p className="text-emerald-300 font-extrabold text-sm">
                      {lang === 'pt' ? 'R$ 129,00' : lang === 'en' ? '$ 25.90' : lang === 'es' ? '$ 25,90' : '€ 25,90'}
                    </p>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles size={8} className="text-yellow-400" />
                        IA
                      </div>
                    </div>
                    <div className="p-2.5 flex-1">
                      <div className="flex gap-2 mb-1.5">
                        <Heart size={12} className="text-slate-400" />
                        <MessageCircle size={12} className="text-slate-400" />
                      </div>
                      <p className="text-slate-300 text-[9px] leading-relaxed">
                        {lang === 'pt' ? '✨ Sofisticação que cabe na mão. Nossa Bolsa de Couro chegou! 🛍️'
                          : lang === 'en' ? '✨ Sophistication that fits. Our Leather Bag is here! 🛍️'
                          : lang === 'es' ? '✨ Sofisticación al alcance de tu mano. ¡Nuestro Bolso de Cuero llegó! 🛍️'
                          : '✨ La sophistication à portée de main. Notre Sac en Cuir est arrivé ! 🛍️'}
                      </p>
                      <p className="text-blue-400 text-[9px] mt-1">#moda #bolsa #couro</p>
                    </div>
                  </div>
                </div>

                {/* seletor de tom + histórico */}
                <div className="col-span-5 flex flex-col gap-3">
                  <div className={`${panel} rounded-xl p-3`}>
                    <p className={`${muted} text-[10px] mb-2`}>
                      {lang === 'pt' ? 'Tom do post' : lang === 'en' ? 'Post tone' : lang === 'es' ? 'Tono del post' : 'Ton de la publication'}
                    </p>
                    <div className="flex gap-2">
                      {[
                        { id: 'promo',    label: lang === 'pt' ? 'Promocional' : 'Promotional', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
                        { id: 'elegante', label: lang === 'pt' ? 'Elegante'    : 'Elegant',     color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
                        { id: 'fun',      label: lang === 'pt' ? 'Divertido'   : 'Fun',         color: 'bg-violet-500/20 text-violet-400 border-violet-500/40' },
                      ].map((t, i) => (
                        <div key={t.id} className={`flex-1 text-center text-[9px] font-semibold py-1.5 rounded-lg border ${t.color} ${i === 0 ? 'ring-1 ring-emerald-400/60' : ''}`}>
                          {t.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`${panel} rounded-xl p-3 flex-1`}>
                    <p className={`${muted} text-[10px] mb-2`}>
                      {lang === 'pt' ? 'Últimos posts gerados' : lang === 'en' ? 'Recent generated posts' : lang === 'es' ? 'Últimas publicaciones' : 'Dernières publications'}
                    </p>
                    {[
                      { prod: 'Vestido Longo',    reach: '1.240', likes: '87' },
                      { prod: 'Camiseta Floral',  reach: '980',   likes: '63' },
                      { prod: 'Tênis Casual',     reach: '2.100', likes: '142' },
                    ].map(p => (
                      <div key={p.prod} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                            <Instagram size={10} className="text-white" />
                          </div>
                          <span className="text-slate-300 text-[10px]">{p.prod}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className={`${muted} text-[9px]`}>{p.reach} reach</span>
                          <span className="text-emerald-400 text-[9px]">{p.likes} ♥</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* plano 30 dias */}
                <div className="col-span-3 flex flex-col gap-3">
                  <div className={`${panel} rounded-xl p-3 flex-1`}>
                    <p className={`${muted} text-[10px] mb-2`}>
                      {lang === 'pt' ? 'Plano 30 dias' : lang === 'en' ? '30-day plan' : lang === 'es' ? 'Plan 30 días' : 'Plan 30 jours'}
                    </p>
                    <div className="grid grid-cols-5 gap-0.5">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-4 rounded-sm ${
                            [1,4,7,10,13,16,19,22,25,28].includes(i)
                              ? 'bg-emerald-500'
                              : [2,9,15,21,27].includes(i)
                              ? 'bg-blue-500/60'
                              : 'bg-white/5'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-3 mt-2">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500" /><span className={`${muted} text-[8px]`}>10 posts</span></div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-blue-500/60" /><span className={`${muted} text-[8px]`}>5 stories</span></div>
                    </div>
                  </div>
                  <div className={`${card} rounded-xl p-3`}>
                    <p className={`${muted} text-[10px] mb-1`}>
                      {lang === 'pt' ? 'Gerados este mês' : 'Generated this month'}
                    </p>
                    <p className="text-white font-bold text-xl">23</p>
                    <p className={`${hi} text-[9px]`}>
                      {lang === 'pt' ? 'posts prontos' : 'ready posts'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── ABA: VITRINE ── */}
            {activeTab === 'vitrine' && (
              <div className="h-full grid grid-cols-12 gap-3 p-4">
                {/* info da loja */}
                <div className="col-span-4 flex flex-col gap-3">
                  <div className={`${panel} rounded-xl p-3`}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shrink-0">
                        <Store size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-xs">Minha Loja</p>
                        <p className="text-emerald-400 text-[9px]">biztrivo.com/loja/minha-loja</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: lang === 'pt' ? 'Visitas hoje' : 'Visits today', value: '247' },
                        { label: lang === 'pt' ? 'Pedidos'      : 'Orders',       value: '18' },
                        { label: lang === 'pt' ? 'Produtos'     : 'Products',     value: '34' },
                        { label: lang === 'pt' ? 'Conversão'    : 'Conversion',   value: '7.3%' },
                      ].map(s => (
                        <div key={s.label} className={`${card} rounded-lg p-2`}>
                          <p className={`${muted} text-[9px]`}>{s.label}</p>
                          <p className="text-white font-bold text-sm">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`${card} rounded-xl p-3 flex-1 flex flex-col justify-between`}>
                    <div>
                      <p className={`${muted} text-[10px] mb-1`}>QR Code</p>
                      <div className="w-16 h-16 sm:w-28 sm:h-28 mx-auto bg-white rounded-lg overflow-hidden flex items-center justify-center">
                        <img src="/qrcode.png" alt="QR Code" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 bg-emerald-500/10 rounded-lg px-2 py-1.5">
                      <Download size={10} className="text-emerald-400" />
                      <span className="text-emerald-400 text-[9px] font-medium">
                        {lang === 'pt' ? 'Baixar QR Code' : 'Download QR Code'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* catálogo */}
                <div className="col-span-5 flex flex-col gap-2">
                  <p className={`${muted} text-[10px]`}>
                    {lang === 'pt' ? 'Produtos em destaque' : lang === 'en' ? 'Featured products' : lang === 'es' ? 'Productos destacados' : 'Produits en vedette'}
                  </p>
                  {[
                    { name: 'Bolsa de Couro Premium', price: 'R$ 129,00', stock: 8,  hot: true },
                    { name: 'Vestido Longo Floral',   price: 'R$ 89,90',  stock: 3,  hot: false },
                    { name: 'Camiseta Estampada',     price: 'R$ 49,90',  stock: 15, hot: true },
                    { name: 'Tênis Casual Branco',    price: 'R$ 199,00', stock: 2,  hot: false },
                  ].map(p => (
                    <div key={p.name} className={`${card} rounded-xl p-2.5 flex items-center gap-3`}>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0">
                        <Package size={14} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-white text-[10px] font-medium truncate">{p.name}</p>
                          {p.hot && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded">top</span>}
                        </div>
                        <p className="text-emerald-400 text-[10px] font-bold">{p.price}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-[9px] ${p.stock <= 3 ? 'text-amber-400' : muted}`}>{p.stock} un.</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* pedidos recentes */}
                <div className="col-span-3 flex flex-col gap-2">
                  <p className={`${muted} text-[10px]`}>
                    {lang === 'pt' ? 'Pedidos recentes' : lang === 'en' ? 'Recent orders' : lang === 'es' ? 'Pedidos recientes' : 'Commandes récentes'}
                  </p>
                  {[
                    { id: '#BZ-0091', item: 'Bolsa Couro',   status: 'WhatsApp', time: '2min' },
                    { id: '#BZ-0090', item: 'Vestido Longo', status: 'WhatsApp', time: '18min' },
                    { id: '#BZ-0089', item: 'Camiseta Est.', status: 'WhatsApp', time: '1h' },
                    { id: '#BZ-0088', item: 'Tênis Casual',  status: 'WhatsApp', time: '2h' },
                  ].map(o => (
                    <div key={o.id} className={`${panel} rounded-xl p-2.5`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-emerald-400 text-[9px] font-mono">{o.id}</span>
                        <span className={`${muted} text-[8px]`}>{o.time}</span>
                      </div>
                      <p className="text-slate-300 text-[10px]">{o.item}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MessageCircle size={8} className="text-emerald-500" />
                        <span className="text-emerald-500 text-[8px]">{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ABA: CONTADOR ── */}
            {activeTab === 'contador' && (
              <div className="h-full grid grid-cols-12 gap-3 p-4">
                {/* DRE */}
                <div className="col-span-5 flex flex-col gap-3">
                  <div className={`${panel} rounded-xl p-3 flex-1`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-slate-300 text-[11px] font-semibold">
                        {lang === 'pt' ? 'DRE — Outubro 2026' : lang === 'en' ? 'P&L — October 2026' : lang === 'es' ? 'DRE — Octubre 2026' : 'Compte de résultat — Oct. 2026'}
                      </p>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">MEI</span>
                    </div>
                    {[
                      { label: lang === 'pt' ? 'Receita bruta'    : 'Gross revenue',    value: 'R$ 8.420', color: 'text-white',       bar: 100 },
                      { label: lang === 'pt' ? '(-) DAS / Impostos' : '(-) Taxes',      value: '- R$ 421', color: 'text-red-400',     bar: 5 },
                      { label: lang === 'pt' ? '(-) Custos'       : '(-) Costs',        value: '- R$ 3.100', color: 'text-amber-400', bar: 37 },
                      { label: lang === 'pt' ? '(-) Gastos pessoais' : '(-) Personal',  value: '- R$ 980', color: 'text-violet-400',  bar: 12 },
                      { label: lang === 'pt' ? '= Lucro líquido'  : '= Net profit',     value: 'R$ 3.919', color: 'text-emerald-400', bar: 47 },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0">
                        <div className="w-1 h-3 rounded-full bg-white/10 overflow-hidden shrink-0">
                          <div className="w-full rounded-full bg-emerald-400/60" style={{ height: `${row.bar}%` }} />
                        </div>
                        <span className={`${muted} text-[9px] flex-1`}>{row.label}</span>
                        <span className={`${row.color} text-[10px] font-semibold`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* score + impostos */}
                <div className="col-span-4 flex flex-col gap-3">
                  <div className={`${panel} rounded-xl p-3`}>
                    <p className={`${muted} text-[10px] mb-2`}>
                      {lang === 'pt' ? 'Score financeiro' : lang === 'en' ? 'Financial score' : lang === 'es' ? 'Score financiero' : 'Score financier'}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="url(#scoreGrad)" strokeWidth="3"
                            strokeDasharray={`${78 * 0.88} ${88}`} strokeLinecap="round" />
                          <defs>
                            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#34d399" />
                              <stop offset="100%" stopColor="#60a5fa" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">78</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-emerald-400 font-semibold text-xs">
                          {lang === 'pt' ? 'Saudável' : lang === 'en' ? 'Healthy' : lang === 'es' ? 'Saludable' : 'Sain'}
                        </p>
                        <p className={`${muted} text-[9px] mt-0.5`}>
                          {lang === 'pt' ? 'Margem acima de 40%' : 'Margin above 40%'}
                        </p>
                        <p className={`${muted} text-[9px]`}>
                          {lang === 'pt' ? 'Gastos pessoais ok' : 'Personal expenses ok'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={`${card} rounded-xl p-3 flex-1`}>
                    <p className={`${muted} text-[10px] mb-2`}>
                      {lang === 'pt' ? 'Impostos estimados' : lang === 'en' ? 'Estimated taxes' : lang === 'es' ? 'Impuestos estimados' : 'Impôts estimés'}
                    </p>
                    {[
                      { label: 'DAS MEI', value: 'R$ 76,90', due: lang === 'pt' ? 'Vence dia 20' : 'Due day 20' },
                      { label: lang === 'pt' ? 'Reserva sugerida' : 'Suggested reserve', value: 'R$ 421', due: '5% receita' },
                    ].map(t => (
                      <div key={t.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-slate-300 text-[10px]">{t.label}</p>
                          <p className={`${muted} text-[8px]`}>{t.due}</p>
                        </div>
                        <p className="text-amber-400 font-semibold text-[10px]">{t.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* limite MEI */}
                <div className="col-span-3 flex flex-col gap-3">
                  <div className={`${panel} rounded-xl p-3`}>
                    <p className={`${muted} text-[10px] mb-2`}>
                      {lang === 'pt' ? 'Limite MEI 2026' : 'MEI Limit 2026'}
                    </p>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300 text-[10px]">R$ 64.200</span>
                      <span className="text-slate-300 text-[10px]">R$ 81.000</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-1.5">
                      <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-amber-400" style={{ width: '79%' }} />
                    </div>
                    <p className="text-amber-400 text-[9px] font-medium">79% utilizado</p>
                    <p className={`${muted} text-[8px] mt-0.5`}>
                      {lang === 'pt' ? 'Restam R$ 16.800' : 'R$ 16,800 remaining'}
                    </p>
                  </div>
                  <div className={`${card} rounded-xl p-3 flex-1`}>
                    <p className={`${muted} text-[10px] mb-1.5`}>DASN-SIMEI</p>
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      <span className="text-emerald-400 text-[9px]">
                        {lang === 'pt' ? 'Dados prontos' : 'Data ready'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 rounded-lg px-2 py-1.5">
                      <Download size={9} className="text-emerald-400" />
                      <span className="text-emerald-400 text-[9px]">
                        {lang === 'pt' ? 'Exportar PDF' : 'Export PDF'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* fade bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 rounded-b-2xl pointer-events-none"
        style={{ background: isDark ? 'linear-gradient(to bottom, transparent, #071f12)' : 'linear-gradient(to bottom, transparent, rgba(220,252,231,0.6))' }}
      />
    </div>
  );
};

const LandingPage: React.FC = () => {
  const { lang, setLang } = useGlobalLang();
const t = translations[lang];
  const { phrase: heroAnimated, visible: heroVisible } = useHeroPhrase(lang);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);  const [scrolled, setScrolled] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  //modo escuro: detecta noite automaticamente (hora local do dispositivo)
  const [isDark, setIsDark] = useState(() => {
    const h = new Date().getHours();
    return h >= 20 || h < 6;
  });

  const statsRef = useRef<HTMLDivElement>(null);
  const [statsActive, setStatsActive] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setParallaxY(window.scrollY * 0.35);
      const progress = Math.min(window.scrollY / (window.innerHeight * 0.8), 1);
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsActive(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(to bottom, #071f12 0%, #0d2340 15%, #0a1e38 30%, #071f12 45%, #0a1e38 60%, #071f12 75%, #0d2340 90%, #071a12 100%)'
          : 'linear-gradient(160deg, #dcfce7 0%, #f0fdf4 20%, #f8fafc 50%, #eff6ff 80%, #dbeafe 100%)',
      }}
    >

      {/* ── HEADER ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? isDark
              ? 'bg-[#071a12]/95 backdrop-blur-md shadow-sm'
              : 'bg-white/95 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
         <img src="/logo.png" alt="Biztrivo" className="h-12 w-auto object-contain" />

<nav className={`hidden md:flex items-center gap-8 text-sm font-medium ${isDark ? 'text-green-200' : 'text-gray-600'}`}>
  <a href="#funcionalidades" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}>{t.nav.features}</a>
  <a href="#depoimentos" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}>{t.nav.testimonials}</a>
  <a href="#vitrine" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}>Vitrine</a>
  <a href="#academy" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}>Academy</a>
  <a href="#planos" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}>{t.nav.pricing}</a>
</nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setIsDark(d => !d)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
              title={isDark ? 'Modo claro' : 'Modo escuro'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <LangSwitcher lang={lang} setLang={setLang} isDark={isDark} />
            <Link to="/login" className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${isDark ? 'text-green-200 hover:text-white hover:bg-white/10' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}>
              {t.nav.login}
            </Link>
            <Link to="/register" className="text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-blue-600 px-5 py-2.5 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg">
              {t.nav.register}
            </Link>
          </div>

          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className={`md:hidden border-t px-6 py-4 flex flex-col gap-4 ${isDark ? 'bg-[#071a12] border-white/10' : 'bg-white border-gray-100'}`}>
<a href="#funcionalidades" className={`font-medium ${isDark ? 'text-green-200' : 'text-gray-700'}`} onClick={() => setMobileMenuOpen(false)}>{t.nav.features}</a>
<a href="#depoimentos" className={`font-medium ${isDark ? 'text-green-200' : 'text-gray-700'}`} onClick={() => setMobileMenuOpen(false)}>{t.nav.testimonials}</a>
<a href="#planos" className={`font-medium ${isDark ? 'text-green-200' : 'text-gray-700'}`} onClick={() => setMobileMenuOpen(false)}>{t.nav.pricing}</a>
            <div className="flex gap-3 pt-2 items-center">
              <button
                onClick={() => setIsDark(d => !d)}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 transition-colors"
                title={isDark ? 'Modo claro' : 'Modo escuro'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <LangSwitcher lang={lang} setLang={setLang} isDark={isDark} />
              <Link to="/login" className={`flex-1 text-center py-2.5 border rounded-lg text-sm font-semibold ${isDark ? 'border-white/20 text-green-200' : 'border-gray-300 text-gray-700'}`}>{t.nav.login}</Link>
              <Link to="/register" className="flex-1 text-center py-2.5 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg text-sm font-semibold text-white">{t.nav.registerMobile}</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className={`relative min-h-screen flex items-start justify-center overflow-hidden ${isDark ? 'bg-transparent' : 'bg-gradient-to-br from-green-200 via-gray-100 to-blue-200'}`}>
        <div
          className="absolute top-20 -left-32 w-96 h-96 bg-green-300 rounded-full blur-3xl will-change-transform"
          style={{
            transform: `translateY(${parallaxY * 0.6}px)`,
            opacity: 0.3 - scrollProgress * 0.3,
          }}
        />
        <div
          className="absolute bottom-20 -right-32 w-96 h-96 bg-blue-300 rounded-full blur-3xl will-change-transform"
          style={{
            transform: `translateY(${-parallaxY * 0.4}px)`,
            opacity: 0.3 - scrollProgress * 0.3,
          }}
        />

        <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 text-center pt-40 pb-16">

          <div className="mb-16">
            <h1 className={`text-6xl md:text-8xl font-extrabold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {heroAnimated.a}{' '}
              <span
                className="inline-block"
                style={{ opacity: heroVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}
              >
                {heroAnimated.b.split('').map((char, i) => (
                  <span
                    key={i}
                    className="bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent"
                    style={{
                      display: 'inline-block',
                      animation: char === ' ' ? 'none' : 'wave 2s ease-in-out infinite',
                      animationDelay: `${i * 0.08}s`,
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </span>
            </h1>
          </div>

          <div className="mb-8">
            <p className={`text-lg max-w-xl mx-auto leading-relaxed ${isDark ? 'text-green-200' : 'text-gray-500'}`}>
              {heroAnimated.subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '80px' }}>
            <Link to="/register"
              className="group flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 text-white text-lg font-bold px-8 py-4 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
              {t.hero.cta}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login"
              className={`flex items-center gap-2 text-lg font-semibold px-8 py-4 rounded-xl transition-all ${isDark ? 'text-green-200 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
              {t.hero.login}
              <ChevronRight size={18} />
            </Link>
          </div>

          <div className="w-full px-0">
            <HeroDashboard isDark={isDark} lang={lang} />
          </div>

        </div>
      </section>

      <section id="funcionalidades" className="py-24 bg-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-widest mb-3">{t.featuresSection.eyebrow}</p>
            <h2 className={`text-4xl md:text-5xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.featuresSection.title}</h2>
            <p className={`text-lg max-w-xl mx-auto ${isDark ? 'text-green-200' : 'text-gray-500'}`}>{t.featuresSection.subtitle}</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className={`group rounded-2xl p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full border ${isDark ? 'bg-[#0a2a18] border-green-900/40 hover:border-green-700/60' : 'bg-white border-gray-100'}`}>
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${featureColors[i]} text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    {featureIcons[i]}
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{f.title}</h3>
                  <p className={`leading-relaxed ${isDark ? 'text-green-200' : 'text-gray-500'}`}>{f.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── STOREFRONT HIGHLIGHT ── */}
      <section id="vitrine" className={`py-20 ${isDark ? 'bg-transparent' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
          <Reveal className="flex-1">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-widest mb-3">{t.storefront.eyebrow}</p>
            <h2 className={`text-4xl font-extrabold mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.storefront.title}</h2>
            <p className={`text-lg mb-6 leading-relaxed ${isDark ? 'text-green-200' : 'text-gray-500'}`}>{t.storefront.subtitle}</p>
            <ul className="space-y-3 mb-8">
              {t.storefront.bullets.map(item => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                  <span className={isDark ? 'text-green-100' : 'text-gray-600'}>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold px-7 py-3.5 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all shadow-lg">
              {t.storefront.cta} <ArrowRight size={18} />
            </Link>
          </Reveal>

          <Reveal delay={150} className="flex-1 max-w-sm w-full">
            <div className={`rounded-2xl shadow-2xl overflow-hidden border ${isDark ? 'bg-[#0a2a18] border-green-900/40' : 'bg-white border-gray-100'}`}>
              <div className="bg-gradient-to-r from-green-600 to-blue-700 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{t.storefront.mockupStoreName}</p>
                  <p className="text-white/70 text-xs">{t.storefront.mockupProducts}</p>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {t.storefront.mockupItems.map((p) => (
                  <div key={p.name} className={`rounded-xl overflow-hidden border border-gray-100 ${p.name === t.storefront.mockupItems[1].name ? 'col-span-2' : ''}`}>
                    <div className={`h-24 flex items-center justify-center ${isDark ? 'bg-[#0d3520]' : 'bg-gray-100'}`}>
                      <Package size={28} className={isDark ? 'text-green-700' : 'text-gray-300'} />
                    </div>
                    <div className="p-2">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{p.name}</p>
                      {p.orig && <p className="text-xs line-through text-gray-400">{p.orig}</p>}
                      <p className="text-sm font-bold text-green-600">{p.price}</p>
                      <div className="mt-2 bg-green-500 text-white text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1">
                        <MessageCircle size={12} /> {t.storefront.buyButton}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="academy" className="py-20 bg-transparent">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <Reveal>
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">{t.academy.eyebrow}</p>
            <h2 className={`text-4xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.academy.title}</h2>
            <p className={`text-lg mb-10 max-w-xl mx-auto ${isDark ? 'text-green-200' : 'text-gray-500'}`}>{t.academy.subtitle}</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.academy.guides.map((title, i) => (
              <Reveal key={title} delay={i * 70}>
                <div className={`rounded-2xl p-5 text-left hover:shadow-md transition-shadow h-full border ${isDark ? 'bg-[#0a2a18] border-green-900/40' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center mb-3">
                    <BookOpen size={18} className="text-white" />
                  </div>
                  <p className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
                  <div className="flex items-center gap-1 text-green-600 text-xs font-medium mt-3">
                    <Download size={12} /> {t.academy.download}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── POSTS AI SHOWCASE ── */}
      <section id="depoimentos" className={`py-24 ${isDark ? 'bg-transparent' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">{t.postIASection.eyebrow}</p>
            <h2 className={`text-4xl md:text-5xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.postIASection.title}</h2>
            <p className={`text-lg max-w-xl mx-auto ${isDark ? 'text-green-200' : 'text-gray-500'}`}>{t.postIASection.subtitle}</p>
          </Reveal>

          <div className="flex flex-col lg:flex-row items-center gap-14">
            {/* Left: steps + bullets */}
            <Reveal className="flex-1 w-full">
              {/* Steps */}
              <div className="flex flex-col gap-5 mb-10">
                {t.postIASection.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                      {i + 1}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{step.label}</p>
                      <p className={`text-sm ${isDark ? 'text-green-300' : 'text-gray-500'}`}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bullets */}
              <ul className="space-y-3 mb-8">
                {t.postIASection.bullets.map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                    <span className={`text-sm ${isDark ? 'text-green-100' : 'text-gray-600'}`}>{item}</span>
                  </li>
                ))}
              </ul>

              <Link to="/register"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold px-7 py-3.5 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all shadow-lg">
                <Sparkles size={18} /> {t.postIASection.cta}
              </Link>
            </Reveal>

            {/* Right: Instagram post mockup */}
            <Reveal delay={150} className="flex-1 w-full max-w-sm mx-auto">
              <div className={`rounded-2xl shadow-2xl overflow-hidden border ${isDark ? 'bg-[#0a2a18] border-green-900/40' : 'bg-white border-gray-100'}`}>
                {/* Instagram-style header */}
                <div className={`flex items-center gap-3 px-4 py-3 border-b ${isDark ? 'border-green-900/40' : 'border-gray-100'}`}>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    <Store size={16} className="text-white" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>minhaloja</p>
                    <p className="text-xs text-gray-400">Patrocinado</p>
                  </div>
                  <div className="ml-auto">
                    <Instagram size={18} className="text-pink-500" />
                  </div>
                </div>

                {/* AI-generated image placeholder */}
                <div className="relative bg-gradient-to-br from-green-700 to-blue-800 h-52 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
                  <div className="relative text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <ShoppingBag size={28} className="text-white" />
                    </div>
                    <p className="text-white font-bold text-base leading-tight">{t.postIASection.mockup.product}</p>
                    <p className="text-green-300 font-extrabold text-xl mt-1">{t.postIASection.mockup.price}</p>
                  </div>
                  {/* AI tag badge */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <Sparkles size={10} className="text-yellow-400" /> {t.postIASection.mockup.tag}
                  </div>
                </div>

                {/* Caption area */}
                <div className="px-4 py-3">
                  <div className="flex gap-3 mb-2">
                    <Heart size={20} className="text-gray-400" />
                    <MessageCircle size={20} className="text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">{t.postIASection.mockup.caption}</p>
                  <p className="text-xs text-blue-500 font-medium">{t.postIASection.mockup.hashtags}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="planos" className="py-24 bg-transparent">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-widest mb-3">{t.pricing.eyebrow}</p>
            <h2 className={`text-4xl md:text-5xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.pricing.title}</h2>
            <p className={`text-lg ${isDark ? 'text-green-200' : 'text-gray-500'}`}>{t.pricing.subtitle}</p>
          </Reveal>
          <Reveal delay={100} className="max-w-sm mx-auto">
            <div className="relative bg-gradient-to-br from-green-700 to-blue-800 rounded-2xl p-8 text-white overflow-hidden">
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">{t.pricing.badge}</div>
              <p className="text-lg font-bold mb-1">{t.pricing.planName}</p>
              <p className="text-white/70 text-sm mb-6">{t.pricing.planDesc}</p>
              <p className="text-5xl font-extrabold mb-8">{t.pricing.price}<span className="text-lg font-normal text-white/70">{t.pricing.period}</span></p>
              {t.pricing.items.map((item) => (
                <div key={item} className="flex items-center gap-3 mb-3">
                  <CheckCircle2 size={18} className="text-green-300 flex-shrink-0" />
                  <span className="text-white/90 text-sm">{item}</span>
                </div>
              ))}
              <Link to="/register" className="mt-8 block text-center py-3 bg-white text-blue-800 rounded-xl font-bold hover:bg-green-50 transition-all shadow-lg">
                {t.pricing.cta}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className={`py-24 ${isDark ? 'bg-transparent' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
        <Reveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 className={`text-4xl md:text-5xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t.ctaFinal.title}
          </h2>
          <p className={`text-lg mb-10 ${isDark ? 'text-green-200' : 'text-gray-500'}`}>
            {t.ctaFinal.subtitle}
          </p>
          <Link to="/register"
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 text-white text-lg font-bold px-10 py-4 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
            {t.ctaFinal.cta}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-sm text-gray-400">{t.ctaFinal.disclaimer}</p>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
<footer className="mt-0" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
  {!isDark && <div className="h-1 w-full bg-gradient-to-r from-green-500 to-blue-600" />}
  <div className={isDark ? 'bg-gradient-to-r from-[#071f12] to-[#0a1e38] px-6 py-6 border-t border-white/10' : 'bg-gradient-to-r from-green-700 to-blue-800 px-6 py-6'}>
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div>
        <p className="text-white font-bold text-lg">Biztrivo</p>
        <p className="text-white/60 text-xs mt-0.5">CNPJ: 68.199.491/0001-85</p>
      </div>
      <div className="flex items-center gap-3">
        <a href="https://www.instagram.com/biztrivo/" target="_blank" rel="noopener noreferrer"
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <Instagram size={18} className="text-white" />
        </a>
        <a href="https://www.linkedin.com/company/biztrivo" target="_blank" rel="noopener noreferrer"
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <Linkedin size={18} className="text-white" />
        </a>
        <a href="mailto:biztrivo@outlook.com"
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <Mail size={18} className="text-white" />
        </a>
      </div>
    </div>
    <div className="max-w-6xl mx-auto border-t border-white/15 mt-4 pt-4 flex items-center justify-between text-xs text-white/60">
      <p>{t.footer.rights}</p>
      <div className="flex items-center gap-4">
        <Link to="/termos-de-uso" className="hover:text-white transition-colors">{t.footer.terms}</Link>
        <Link to="/politica-privacidade" className="hover:text-white transition-colors">{t.footer.privacy}</Link>
      </div>
    </div>
  </div>
</footer>
    </div>
  );
};

export default LandingPage;