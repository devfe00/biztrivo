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
  Zap,
  Store,
  Download,
  Instagram,
  Linkedin,
  Mail,
  FileSpreadsheet,
  Briefcase,
  Sparkles,
} from 'lucide-react';

type Lang = 'pt' | 'en' | 'es' | 'fr';

const translations = {
  pt: {
    nav: {
      features: 'Funcionalidades',
      testimonials: 'Depoimentos',
      pricing: 'Planos',
      login: 'Entrar',
      register: 'Começar grátis',
      registerMobile: 'Cadastrar',
    },
    hero: {
      h1a: 'Venda mais.',
      h1b: 'Controle tudo.',
      subtitle:
        'Caixa diário, vitrine no WhatsApp ou na Web, relatórios, calculadora de preço e materiais para vender mais. Feito para lojistas que querem crescer de verdade.',
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
    // Stats
    stats: [
      { value: '40+', label: 'Lojistas ativos' },
      { value: 'R$ 38k+', label: 'Em vendas controladas' },
      { value: '99.6%', label: 'Uptime garantido' },
      { value: '4.8★', label: 'Avaliação média' },
    ],
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
    // Testimonials
    testimonialsSection: {
      eyebrow: 'Depoimentos',
      title: 'O que nossos lojistas dizem',
    },
    testimonials: [
      {
        name: 'Ana Souza',
        role: 'Dona de boutique em SP',
        text: 'Antes eu perdia horas em planilhas. Hoje registro tudo no Caixa Diário e a vitrine trouxe clientes novos que nem conhecia minha loja.',
      },
      {
        name: 'Carlos Mendes',
        role: 'Loja de eletrônicos, RJ',
        text: 'A calculadora de preço me salvou. Eu achava que estava lucrando e estava vendendo quase no prejuízo. Agora sei exatamente minha margem.',
      },
      {
        name: 'Fernanda Lima',
        role: 'Revendedora, BH',
        text: 'O link da vitrine é incrível. Mando pro grupo do WhatsApp e os pedidos chegam sozinhos. Muito mais profissional que mandar foto por foto.',
      },
    ],
    // Pricing
    pricing: {
      eyebrow: 'Planos',
      title: 'Simples e sem surpresas',
      subtitle: 'Comece grátis e assine quando quiser desbloquear tudo.',
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
      disclaimer: ' Sem compromisso.',
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
      testimonials: 'Testimonials',
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
        'Daily cash register, WhatsApp & web storefront, reports, price calculator and growth resources. Built for retailers who are serious about growing.',
      cta: 'Create my free account',
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
    testimonialsSection: {
      eyebrow: 'Testimonials',
      title: 'What our retailers say',
    },
    testimonials: [
      {
        name: 'Ana Souza',
        role: 'Boutique owner in São Paulo',
        text: 'I used to waste hours on spreadsheets. Now I log everything in the Daily Cash Register and the storefront brought in new customers who never knew my store existed.',
      },
      {
        name: 'Carlos Mendes',
        role: 'Electronics store, Rio de Janeiro',
        text: 'The price calculator saved me. I thought I was making money and I was barely breaking even. Now I know my margin exactly.',
      },
      {
        name: 'Fernanda Lima',
        role: 'Reseller, Belo Horizonte',
        text: "The storefront link is incredible. I share it in my WhatsApp group and orders come in on their own. So much more professional than sending photos one by one.",
      },
    ],
    pricing: {
      eyebrow: 'Pricing',
      title: 'Simple and no surprises',
      subtitle: 'Start free and subscribe when you want to unlock everything.',
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
      disclaimer: ' No commitment.',
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
      testimonials: 'Testimonios',
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
        'Caja diaria, vitrina en WhatsApp o en la Web, informes, calculadora de precios y materiales para vender más. Hecho para comerciantes que quieren crecer de verdad.',
      cta: 'Crear mi cuenta gratis',
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
    testimonialsSection: {
      eyebrow: 'Testimonios',
      title: 'Lo que dicen nuestros comerciantes',
    },
    testimonials: [
      {
        name: 'Ana Souza',
        role: 'Dueña de boutique en SP',
        text: 'Antes perdía horas en hojas de cálculo. Hoy registro todo en la Caja Diaria y la vitrina trajo nuevos clientes que ni conocían mi tienda.',
      },
      {
        name: 'Carlos Mendes',
        role: 'Tienda de electrónica, RJ',
        text: 'La calculadora de precios me salvó. Creía que ganaba y casi estaba vendiendo a pérdida. Ahora sé exactamente mi margen.',
      },
      {
        name: 'Fernanda Lima',
        role: 'Revendedora, BH',
        text: 'El enlace de la vitrina es increíble. Lo mando al grupo de WhatsApp y los pedidos llegan solos. Mucho más profesional que mandar foto por foto.',
      },
    ],
    pricing: {
      eyebrow: 'Planes',
      title: 'Simple y sin sorpresas',
      subtitle: 'Comienza gratis y suscríbete cuando quieras desbloquear todo.',
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
      disclaimer: ' Sin compromiso.',
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
      testimonials: 'Témoignages',
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
        'Caisse journalière, vitrine sur WhatsApp ou le Web, rapports, calculateur de prix et ressources pour vendre plus. Conçu pour les commerçants qui veulent vraiment croître.',
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
    testimonialsSection: {
      eyebrow: 'Témoignages',
      title: 'Ce que disent nos commerçants',
    },
    testimonials: [
      {
        name: 'Ana Souza',
        role: 'Propriétaire de boutique à SP',
        text: 'Avant, je perdais des heures sur des tableurs. Maintenant, j\'enregistre tout dans la Caisse Journalière et la vitrine a attiré de nouveaux clients.',
      },
      {
        name: 'Carlos Mendes',
        role: 'Boutique électronique, RJ',
        text: 'Le calculateur de prix m\'a sauvé. Je croyais gagner de l\'argent et je vendais presque à perte. Maintenant je connais exactement ma marge.',
      },
      {
        name: 'Fernanda Lima',
        role: 'Revendeuse, BH',
        text: 'Le lien vitrine est incroyable. Je l\'envoie dans mon groupe WhatsApp et les commandes arrivent toutes seules. Bien plus professionnel qu\'envoyer des photos une par une.',
      },
    ],
    pricing: {
      eyebrow: 'Tarifs',
      title: 'Simple et sans surprises',
      subtitle: 'Commencez gratuitement et abonnez-vous quand vous voulez tout débloquer.',
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
      disclaimer: ' Sans engagement.',
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

const LangSwitcher: React.FC<{ lang: Lang; setLang: (l: Lang) => void }> = ({ lang, setLang }) => {
  const [open, setOpen] = useState(false);
  const langs: Lang[] = ['pt', 'en', 'es', 'fr'];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all border border-gray-200"
      >
        {langLabels[lang]}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
          {langs.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              className={`block w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors ${l === lang ? 'text-green-600' : 'text-gray-700'}`}
            >
              {langLabels[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const { lang, setLang } = useGlobalLang();
  const t = translations[lang];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);

  const statsRef = useRef<HTMLDivElement>(null);
  const [statsActive, setStatsActive] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setParallaxY(window.scrollY * 0.35);
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
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── HEADER ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src="/logo.png" alt="Biztrivo" className="h-9 w-auto object-contain" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#funcionalidades" className="hover:text-gray-900 transition-colors">{t.nav.features}</a>
            <a href="#depoimentos" className="hover:text-gray-900 transition-colors">{t.nav.testimonials}</a>
            <a href="#planos" className="hover:text-gray-900 transition-colors">{t.nav.pricing}</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LangSwitcher lang={lang} setLang={setLang} />
            <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all">
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
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
            <a href="#funcionalidades" className="text-gray-700 font-medium" onClick={() => setMobileMenuOpen(false)}>{t.nav.features}</a>
            <a href="#depoimentos" className="text-gray-700 font-medium" onClick={() => setMobileMenuOpen(false)}>{t.nav.testimonials}</a>
            <a href="#planos" className="text-gray-700 font-medium" onClick={() => setMobileMenuOpen(false)}>{t.nav.pricing}</a>
            <div className="flex gap-3 pt-2 items-center">
              <LangSwitcher lang={lang} setLang={setLang} />
              <Link to="/login" className="flex-1 text-center py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700">{t.nav.login}</Link>
              <Link to="/register" className="flex-1 text-center py-2.5 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg text-sm font-semibold text-white">{t.nav.registerMobile}</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div
          className="absolute top-20 -left-32 w-96 h-96 bg-green-300/30 rounded-full blur-3xl will-change-transform"
          style={{ transform: `translateY(${parallaxY * 0.6}px)` }}
        />
        <div
          className="absolute bottom-20 -right-32 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl will-change-transform"
          style={{ transform: `translateY(${-parallaxY * 0.4}px)` }}
        />

        <div className="relative max-w-5xl mx-auto px-6 text-center pt-28 pb-20">
          

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
            {t.hero.h1a}{' '}
            <span className="bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">
              {t.hero.h1b}
            </span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="group flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 text-white text-lg font-bold px-8 py-4 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
              {t.hero.cta}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-lg font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all">
              {t.hero.login}
              <ChevronRight size={18} />
            </Link>
          </div>

          {/* Dashboard mockup */}
          <div className="mt-16 relative mx-auto max-w-4xl">
            <div className="bg-gradient-to-br from-green-700 to-blue-800 rounded-2xl shadow-2xl p-1">
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-gray-500 text-xs">{t.dashboard.url}</span>
                </div>
                <div className="p-6 grid grid-cols-3 gap-4">
                  {t.dashboard.cards.map((card) => (
                    <div
                      key={card.label}
                      className="group/card bg-gray-700/60 rounded-xl p-4 text-left cursor-pointer transition-all duration-300 hover:bg-gray-600/80 hover:scale-[1.03] hover:shadow-lg relative overflow-hidden"
                    >
                      <div className="transition-all duration-300 group-hover/card:opacity-0 group-hover/card:-translate-y-2">
                        <p className="text-gray-400 text-xs mb-1">{card.label}</p>
                        <p className="text-white text-2xl font-bold">{card.value}</p>
                        <p className="text-xs font-medium mt-1 text-green-400">{card.trend}</p>
                      </div>
                      <div className="absolute inset-0 p-4 flex flex-col justify-center opacity-0 translate-y-2 transition-all duration-300 group-hover/card:opacity-100 group-hover/card:translate-y-0">
                        <p className="text-gray-400 text-xs mb-2">{card.label}</p>
                        <p className="text-lg font-extrabold mb-1 text-green-400">{card.value}</p>
                        <div className="w-full bg-gray-600 rounded-full h-1.5 mb-2">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500" style={{ width: '70%' }} />
                        </div>
                        <p className="text-white text-xs font-medium">{card.detail}</p>
                        <p className="text-xs mt-0.5 text-green-400">{card.detail2}</p>
                      </div>
                    </div>
                  ))}
                  <div className="col-span-3 bg-gray-700/40 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-300 text-sm font-medium">{t.dashboard.chartLabel}</span>
                      <TrendingUp size={16} className="text-green-400" />
                    </div>
                    <div className="flex items-end gap-2 h-16">
                      {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-green-500 to-blue-500 rounded-t opacity-80" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80 rounded-2xl pointer-events-none" style={{ top: '65%' }} />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-gradient-to-r from-green-700 to-blue-800 py-16">
        <div ref={statsRef} className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {t.stats.map((s) => (
            <StatCard key={s.label} value={s.value} label={s.label} active={statsActive} />
          ))}
        </div>
      </section>

      <section id="funcionalidades" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-widest mb-3">{t.featuresSection.eyebrow}</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">{t.featuresSection.title}</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">{t.featuresSection.subtitle}</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="group bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${featureColors[i]} text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    {featureIcons[i]}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── STOREFRONT HIGHLIGHT ── */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
          <Reveal className="flex-1">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-widest mb-3">{t.storefront.eyebrow}</p>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-5">{t.storefront.title}</h2>
            <p className="text-gray-500 text-lg mb-6 leading-relaxed">{t.storefront.subtitle}</p>
            <ul className="space-y-3 mb-8">
              {t.storefront.bullets.map(item => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold px-7 py-3.5 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all shadow-lg">
              {t.storefront.cta} <ArrowRight size={18} />
            </Link>
          </Reveal>

          <Reveal delay={150} className="flex-1 max-w-sm w-full">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
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
                    <div className="bg-gray-100 h-24 flex items-center justify-center">
                      <Package size={28} className="text-gray-300" />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
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

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <Reveal>
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">{t.academy.eyebrow}</p>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">{t.academy.title}</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">{t.academy.subtitle}</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.academy.guides.map((title, i) => (
              <Reveal key={title} delay={i * 70}>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left hover:shadow-md transition-shadow h-full">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center mb-3">
                    <BookOpen size={18} className="text-white" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
                  <div className="flex items-center gap-1 text-green-600 text-xs font-medium mt-3">
                    <Download size={12} /> {t.academy.download}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="depoimentos" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">{t.testimonialsSection.eyebrow}</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">{t.testimonialsSection.title}</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.testimonials.map((testimonial, i) => (
              <Reveal key={testimonial.name} delay={i * 100}>
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={16} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6">"{testimonial.text}"</p>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-widest mb-3">{t.pricing.eyebrow}</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">{t.pricing.title}</h2>
            <p className="text-gray-500 text-lg">{t.pricing.subtitle}</p>
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

      <section className="py-24 bg-gradient-to-br from-green-50 to-blue-50">
        <Reveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            {t.ctaFinal.title}
          </h2>
          <p className="text-gray-500 text-lg mb-10">
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
<footer className="mt-0">
  <div className="h-1 w-full bg-gradient-to-r from-green-500 to-blue-600" />
  <div className="bg-gradient-to-r from-green-700 to-blue-800 px-6 py-6">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div>
        <p className="text-white font-bold text-lg">Biztrivo</p>
        <p className="text-white/60 text-xs mt-0.5">CNPJ: 65.321.369/0001-41</p>
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