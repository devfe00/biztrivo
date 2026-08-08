import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface Section {
  heading: string;
  body: React.ReactNode;
}

const SECTIONS_PT: Section[] = [
  {
    heading: '1. Aceitação dos Termos',
    body: (
      <>
        <p>
          Ao acessar e usar a plataforma Biztrivo, você concorda em cumprir e estar vinculado a estes Termos de Uso.
          Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
        </p>
        <p>
          Estes termos constituem um acordo legal vinculativo entre você (usuário) e o Biztrivo. Recomendamos que
          você leia atentamente todos os termos antes de utilizar a plataforma.
        </p>
      </>
    ),
  },
  {
    heading: '2. Descrição do Serviço',
    body: (
      <>
        <p>
          O Biztrivo é uma plataforma de gestão comercial que oferece ferramentas para controle financeiro,
          gerenciamento de produtos, criação de vitrine online e relatórios de vendas para pequenos e médios comerciantes.
        </p>
        <p>
          A plataforma oferece planos gratuitos e pagos, cada um com funcionalidades específicas descritas em nossa
          página de preços. Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer funcionalidade
          do serviço a qualquer momento.
        </p>
      </>
    ),
  },
  {
    heading: '3. Cadastro e Conta de Usuário',
    body: (
      <>
        <p>
          Para utilizar determinados recursos da plataforma, você deve criar uma conta fornecendo informações
          verdadeiras, completas e atualizadas. Você é responsável por:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Manter a confidencialidade de sua senha e credenciais de acesso</li>
          <li>Todas as atividades que ocorram sob sua conta</li>
          <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
          <li>Garantir que você possui idade legal (18 anos ou mais) para aceitar estes termos</li>
        </ul>
        <p className="mt-3">
          Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos ou que permaneçam
          inativas por período superior a 12 meses.
        </p>
      </>
    ),
  },
  {
    heading: '4. Uso Aceitável da Plataforma',
    body: (
      <>
        <p>Você concorda em usar o Biztrivo apenas para fins legais e de acordo com estes Termos. Você não deve:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Usar a plataforma para atividades ilegais, fraudulentas ou não autorizadas</li>
          <li>Violar direitos de propriedade intelectual de terceiros</li>
          <li>Transmitir vírus, malware ou qualquer código malicioso</li>
          <li>Tentar obter acesso não autorizado a sistemas ou redes conectadas à plataforma</li>
          <li>Fazer engenharia reversa, descompilar ou desmontar qualquer parte do software</li>
          <li>Usar a plataforma para enviar spam ou comunicações não solicitadas</li>
          <li>Coletar ou armazenar dados pessoais de outros usuários sem consentimento</li>
          <li>Representar falsamente sua afiliação com qualquer pessoa ou entidade</li>
        </ul>
      </>
    ),
  },
  {
    heading: '5. Conteúdo do Usuário',
    body: (
      <>
        <p>
          Você mantém todos os direitos sobre o conteúdo que carrega na plataforma (produtos, imagens, descrições, etc.).
          No entanto, ao enviar conteúdo, você nos concede uma licença mundial, não exclusiva, isenta de royalties
          para usar, armazenar, exibir e processar esse conteúdo apenas na medida necessária para fornecer nossos serviços.
        </p>
        <p className="mt-3">
          Você garante que possui todos os direitos necessários sobre o conteúdo enviado e que este não viola direitos
          de terceiros. Você é o único responsável pelo conteúdo que publica na plataforma.
        </p>
        <p className="mt-3">
          Reservamo-nos o direito de remover qualquer conteúdo que viole estes termos ou que seja considerado
          inadequado, a nosso exclusivo critério.
        </p>
      </>
    ),
  },
  {
    heading: '6. Pagamentos e Assinaturas',
    body: (
      <>
        <p>
          Planos pagos são cobrados de acordo com o ciclo de faturamento escolhido (mensal ou anual). Ao assinar
          um plano pago, você autoriza a cobrança recorrente no método de pagamento fornecido.
        </p>
        <p className="mt-3">
          Os pagamentos são processados através de processadores terceirizados seguros (como Stripe, Inc.). Não
          armazenamos informações completas de cartão de crédito em nossos servidores.
        </p>
        <p className="mt-3">
          Você pode cancelar sua assinatura a qualquer momento através das configurações da conta. O cancelamento
          terá efeito no final do período de faturamento atual. Não oferecemos reembolsos proporcionais por
          cancelamentos antecipados.
        </p>
        <p className="mt-3">
          Reservamo-nos o direito de modificar os preços dos planos mediante notificação prévia de 30 dias.
          Alterações de preço não afetarão assinaturas em vigor durante o período já pago.
        </p>
      </>
    ),
  },
  {
    heading: '7. Política de Reembolso',
    body: (
      <>
        <p>
          Oferecemos garantia de reembolso de 7 dias para novas assinaturas de planos pagos. Se você não estiver
          satisfeito com o serviço, pode solicitar reembolso total dentro de 7 dias após a primeira cobrança.
        </p>
        <p className="mt-3">
          Após o período de garantia, cobranças são consideradas finais e não reembolsáveis, exceto em casos de
          erro de cobrança comprovado ou conforme exigido por lei.
        </p>
        <p className="mt-3">
          Solicitações de reembolso devem ser enviadas através de nossos canais oficiais de suporte.
        </p>
      </>
    ),
  },
  {
    heading: '8. Propriedade Intelectual',
    body: (
      <>
        <p>
          Todo o conteúdo da plataforma Biztrivo, incluindo mas não limitado a textos, gráficos, logos, ícones,
          imagens, clipes de áudio, downloads digitais e software, é propriedade do Biztrivo ou de seus licenciadores
          e está protegido pelas leis brasileiras e internacionais de direitos autorais.
        </p>
        <p className="mt-3">
          O nome Biztrivo, logotipo e todas as marcas relacionadas são marcas registradas ou marcas de serviço do
          Biztrivo. Você não pode usar essas marcas sem nossa permissão prévia por escrito.
        </p>
      </>
    ),
  },
  {
    heading: '9. Limitação de Responsabilidade',
    body: (
      <>
        <p>
          O Biztrivo fornece a plataforma "como está" e "conforme disponível". Não garantimos que o serviço será
          ininterrupto, livre de erros ou completamente seguro.
        </p>
        <p className="mt-3">
          Na máxima extensão permitida pela lei aplicável, o Biztrivo não será responsável por quaisquer danos
          indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo perda de lucros, dados, uso
          ou outras perdas intangíveis, resultantes de:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Seu acesso ou uso (ou incapacidade de acessar ou usar) do serviço</li>
          <li>Qualquer conduta ou conteúdo de terceiros no serviço</li>
          <li>Acesso não autorizado, uso ou alteração de suas transmissões ou conteúdo</li>
          <li>Falhas técnicas ou interrupções do serviço</li>
        </ul>
        <p className="mt-3">
          Nossa responsabilidade total, em qualquer caso, não excederá o valor pago por você nos 12 meses anteriores
          ao evento que deu origem à reclamação.
        </p>
      </>
    ),
  },
  {
    heading: '10. Indenização',
    body: (
      <>
        <p>
          Você concorda em indenizar, defender e isentar o Biztrivo, seus diretores, funcionários, agentes e
          parceiros de quaisquer reclamações, perdas, responsabilidades, danos, custos ou despesas (incluindo
          honorários advocatícios razoáveis) decorrentes de:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Seu uso da plataforma ou violação destes Termos</li>
          <li>Violação de direitos de terceiros, incluindo direitos de propriedade intelectual</li>
          <li>Qualquer conteúdo que você enviar ou publicar na plataforma</li>
        </ul>
      </>
    ),
  },
  {
    heading: '11. Proteção de Dados e Privacidade',
    body: (
      <>
        <p>
          Seu uso da plataforma também é regido por nossa Política de Privacidade, que descreve como coletamos,
          usamos e protegemos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
        </p>
        <p className="mt-3">
          Ao usar nossos serviços, você concorda com as práticas de coleta e uso de informações descritas na
          Política de Privacidade.
        </p>
      </>
    ),
  },
  {
    heading: '12. Modificações dos Termos',
    body: (
      <>
        <p>
          Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Notificaremos você sobre
          mudanças materiais através de email ou aviso na plataforma com pelo menos 15 dias de antecedência.
        </p>
        <p className="mt-3">
          Seu uso continuado da plataforma após a entrada em vigor das modificações constitui sua aceitação dos
          novos termos. Se você não concordar com as modificações, deve descontinuar o uso da plataforma.
        </p>
      </>
    ),
  },
  {
    heading: '13. Rescisão',
    body: (
      <>
        <p>
          Podemos suspender ou encerrar seu acesso à plataforma imediatamente, sem aviso prévio ou responsabilidade,
          por qualquer motivo, incluindo violação destes Termos.
        </p>
        <p className="mt-3">
          Você pode encerrar sua conta a qualquer momento através das configurações da plataforma ou entrando em
          contato com nosso suporte.
        </p>
        <p className="mt-3">
          Após o encerramento, seu direito de usar a plataforma cessará imediatamente. As disposições que por sua
          natureza devam sobreviver ao encerramento permanecerão em vigor, incluindo propriedade intelectual,
          limitações de responsabilidade e resolução de disputas.
        </p>
      </>
    ),
  },
  {
    heading: '14. Lei Aplicável e Jurisdição',
    body: (
      <>
        <p>
          Estes Termos de Uso são regidos e interpretados de acordo com as leis da República Federativa do Brasil,
          especialmente a Lei 12.965/2014 (Marco Civil da Internet) e a Lei 13.709/2018 (LGPD).
        </p>
        <p className="mt-3">
          Qualquer disputa relacionada a estes termos será submetida exclusivamente à jurisdição dos tribunais
          brasileiros, com foro na comarca de São Paulo, Estado de São Paulo, renunciando as partes a qualquer outro, por
          mais privilegiado que seja.
        </p>
      </>
    ),
  },
  {
    heading: '15. Disposições Gerais',
    body: (
      <>
        <p>
          <strong>Integridade do Acordo:</strong> Estes Termos constituem o acordo integral entre você e o Biztrivo
          sobre o uso da plataforma.
        </p>
        <p className="mt-3">
          <strong>Renúncia:</strong> A falha em fazer cumprir qualquer direito ou disposição destes Termos não
          constituirá renúncia a tal direito ou disposição.
        </p>
        <p className="mt-3">
          <strong>Divisibilidade:</strong> Se qualquer disposição destes Termos for considerada inválida ou
          inexequível, as demais disposições permanecerão em pleno vigor e efeito.
        </p>
        <p className="mt-3">
          <strong>Cessão:</strong> Você não pode ceder ou transferir estes Termos sem nosso consentimento prévio
          por escrito. Podemos ceder nossos direitos a qualquer afiliada ou sucessora.
        </p>
      </>
    ),
  },
  {
    heading: '16. Contato',
    body: (
      <>
        <p>
          Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através de:
        </p>
        <ul className="list-none pl-0 space-y-2 mt-3">
          <li><strong>Email:</strong> biztrivo@outlook.com.br</li>
          <li><strong>Endereço:</strong> Empresa 100% remota, sem sede física</li>
          <li><strong>CNPJ:</strong> 63.526.345/0001-01</li>
        </ul>
      </>
    ),
  },
];

const SECTIONS_EN: Section[] = [
  {
    heading: '1. Acceptance of Terms',
    body: (
      <>
        <p>
          By accessing and using the Biztrivo platform, you agree to comply with and be bound by these Terms of Use.
          If you do not agree with any part of these terms, you must not use our services.
        </p>
        <p>
          These terms constitute a legally binding agreement between you (the user) and Biztrivo. We recommend that
          you carefully read all the terms before using the platform.
        </p>
      </>
    ),
  },
  {
    heading: '2. Service Description',
    body: (
      <>
        <p>
          Biztrivo is a business management platform that offers tools for financial control, product management,
          creation of an online storefront, and sales reports for small and medium-sized merchants.
        </p>
        <p>
          The platform offers free and paid plans, each with specific features described on our pricing page. We
          reserve the right to modify, suspend or discontinue any feature of the service at any time.
        </p>
      </>
    ),
  },
  {
    heading: '3. Registration and User Account',
    body: (
      <>
        <p>
          To use certain features of the platform, you must create an account providing true, complete and up-to-date
          information. You are responsible for:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Maintaining the confidentiality of your password and access credentials</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized use of your account</li>
          <li>Ensuring you are of legal age (18 years or older) to accept these terms</li>
        </ul>
        <p className="mt-3">
          We reserve the right to suspend or terminate accounts that violate these terms or that remain inactive for
          a period exceeding 12 months.
        </p>
      </>
    ),
  },
  {
    heading: '4. Acceptable Use of the Platform',
    body: (
      <>
        <p>You agree to use Biztrivo only for lawful purposes and in accordance with these Terms. You must not:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Use the platform for illegal, fraudulent or unauthorized activities</li>
          <li>Violate third-party intellectual property rights</li>
          <li>Transmit viruses, malware or any malicious code</li>
          <li>Attempt to gain unauthorized access to systems or networks connected to the platform</li>
          <li>Reverse engineer, decompile or disassemble any part of the software</li>
          <li>Use the platform to send spam or unsolicited communications</li>
          <li>Collect or store other users' personal data without consent</li>
          <li>Falsely represent your affiliation with any person or entity</li>
        </ul>
      </>
    ),
  },
  {
    heading: '5. User Content',
    body: (
      <>
        <p>
          You retain all rights to the content you upload to the platform (products, images, descriptions, etc.).
          However, by submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use,
          store, display and process such content solely to the extent necessary to provide our services.
        </p>
        <p className="mt-3">
          You warrant that you hold all necessary rights to the submitted content and that it does not infringe
          third-party rights. You are solely responsible for the content you publish on the platform.
        </p>
        <p className="mt-3">
          We reserve the right to remove any content that violates these terms or that is deemed inappropriate, at
          our sole discretion.
        </p>
      </>
    ),
  },
  {
    heading: '6. Payments and Subscriptions',
    body: (
      <>
        <p>
          Paid plans are billed according to the chosen billing cycle (monthly or annual). By subscribing to a paid
          plan, you authorize recurring charges to the payment method provided.
        </p>
        <p className="mt-3">
          Payments are processed through secure third-party processors (such as Stripe, Inc.). We do not store
          complete credit card information on our servers.
        </p>
        <p className="mt-3">
          You may cancel your subscription at any time through your account settings. Cancellation will take effect
          at the end of the current billing period. We do not offer prorated refunds for early cancellations.
        </p>
        <p className="mt-3">
          We reserve the right to modify plan prices with 30 days' prior notice. Price changes will not affect
          subscriptions in effect during the already-paid period.
        </p>
      </>
    ),
  },
  {
    heading: '7. Refund Policy',
    body: (
      <>
        <p>
          We offer a 7-day money-back guarantee for new paid plan subscriptions. If you are not satisfied with the
          service, you may request a full refund within 7 days after the first charge.
        </p>
        <p className="mt-3">
          After the guarantee period, charges are considered final and non-refundable, except in cases of proven
          billing error or as required by law.
        </p>
        <p className="mt-3">
          Refund requests must be submitted through our official support channels.
        </p>
      </>
    ),
  },
  {
    heading: '8. Intellectual Property',
    body: (
      <>
        <p>
          All content on the Biztrivo platform, including but not limited to text, graphics, logos, icons, images,
          audio clips, digital downloads and software, is the property of Biztrivo or its licensors and is protected
          by Brazilian and international copyright laws.
        </p>
        <p className="mt-3">
          The Biztrivo name, logo and all related marks are trademarks or service marks of Biztrivo. You may not use
          these marks without our prior written permission.
        </p>
      </>
    ),
  },
  {
    heading: '9. Limitation of Liability',
    body: (
      <>
        <p>
          Biztrivo provides the platform "as is" and "as available". We do not guarantee that the service will be
          uninterrupted, error-free or completely secure.
        </p>
        <p className="mt-3">
          To the maximum extent permitted by applicable law, Biztrivo will not be liable for any indirect,
          incidental, special, consequential or punitive damages, including loss of profits, data, use or other
          intangible losses, resulting from:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Your access to or use of (or inability to access or use) the service</li>
          <li>Any conduct or content of third parties on the service</li>
          <li>Unauthorized access, use or alteration of your transmissions or content</li>
          <li>Technical failures or service interruptions</li>
        </ul>
        <p className="mt-3">
          Our total liability, in any case, will not exceed the amount you paid in the 12 months prior to the event
          giving rise to the claim.
        </p>
      </>
    ),
  },
  {
    heading: '10. Indemnification',
    body: (
      <>
        <p>
          You agree to indemnify, defend and hold harmless Biztrivo, its directors, employees, agents and partners
          from any claims, losses, liabilities, damages, costs or expenses (including reasonable attorneys' fees)
          arising from:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Your use of the platform or violation of these Terms</li>
          <li>Violation of third-party rights, including intellectual property rights</li>
          <li>Any content you submit or publish on the platform</li>
        </ul>
      </>
    ),
  },
  {
    heading: '11. Data Protection and Privacy',
    body: (
      <>
        <p>
          Your use of the platform is also governed by our Privacy Policy, which describes how we collect, use and
          protect your personal data in compliance with the Brazilian General Data Protection Law (LGPD - Law 13.709/2018).
        </p>
        <p className="mt-3">
          By using our services, you agree to the information collection and use practices described in the
          Privacy Policy.
        </p>
      </>
    ),
  },
  {
    heading: '12. Modifications to the Terms',
    body: (
      <>
        <p>
          We reserve the right to modify these Terms of Use at any time. We will notify you of material changes via
          email or a notice on the platform at least 15 days in advance.
        </p>
        <p className="mt-3">
          Your continued use of the platform after the modifications take effect constitutes your acceptance of the
          new terms. If you do not agree with the modifications, you must discontinue using the platform.
        </p>
      </>
    ),
  },
  {
    heading: '13. Termination',
    body: (
      <>
        <p>
          We may suspend or terminate your access to the platform immediately, without prior notice or liability,
          for any reason, including violation of these Terms.
        </p>
        <p className="mt-3">
          You may terminate your account at any time through the platform settings or by contacting our support.
        </p>
        <p className="mt-3">
          Upon termination, your right to use the platform will cease immediately. Provisions that by their nature
          should survive termination will remain in effect, including intellectual property, limitations of
          liability and dispute resolution.
        </p>
      </>
    ),
  },
  {
    heading: '14. Governing Law and Jurisdiction',
    body: (
      <>
        <p>
          These Terms of Use are governed by and construed in accordance with the laws of the Federative Republic of
          Brazil, especially Law 12.965/2014 (Brazilian Civil Rights Framework for the Internet) and Law 13.709/2018
          (LGPD).
        </p>
        <p className="mt-3">
          Any dispute related to these terms will be submitted exclusively to the jurisdiction of Brazilian courts,
          with venue in the judicial district of São Paulo, State of São Paulo, the parties waiving any other, no
          matter how privileged.
        </p>
      </>
    ),
  },
  {
    heading: '15. General Provisions',
    body: (
      <>
        <p>
          <strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and Biztrivo
          regarding the use of the platform.
        </p>
        <p className="mt-3">
          <strong>Waiver:</strong> The failure to enforce any right or provision of these Terms will not constitute
          a waiver of such right or provision.
        </p>
        <p className="mt-3">
          <strong>Severability:</strong> If any provision of these Terms is deemed invalid or unenforceable, the
          remaining provisions will remain in full force and effect.
        </p>
        <p className="mt-3">
          <strong>Assignment:</strong> You may not assign or transfer these Terms without our prior written consent.
          We may assign our rights to any affiliate or successor.
        </p>
      </>
    ),
  },
  {
    heading: '16. Contact',
    body: (
      <>
        <p>
          If you have questions about these Terms of Use, please contact us at:
        </p>
        <ul className="list-none pl-0 space-y-2 mt-3">
          <li><strong>Email:</strong> biztrivo@outlook.com.br</li>
          <li><strong>Address:</strong> 100% remote company, no physical headquarters</li>
          <li><strong>CNPJ:</strong> 63.526.345/0001-01</li>
        </ul>
      </>
    ),
  },
];

const TermosDeUso: React.FC = () => {
  const { lang } = useI18n();
  const isPt = lang === 'pt';
  const sections = isPt ? SECTIONS_PT : SECTIONS_EN;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{isPt ? 'Voltar' : 'Back'}</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{isPt ? 'Termos de Uso' : 'Terms of Use'}</h1>
          </div>

          <p className="text-sm text-gray-600 mb-8">
            {isPt ? 'Última atualização: 15 de fevereiro de 2026' : 'Last updated: February 15, 2026'}
          </p>

          <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-gray-700">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{section.heading}</h2>
                {section.body}
              </section>
            ))}

            <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                {isPt ? (
                  <>
                    <strong>Importante:</strong> Ao utilizar a plataforma Biztrivo, você declara ter lido, compreendido
                    e concordado com todos os termos e condições descritos neste documento.
                  </>
                ) : (
                  <>
                    <strong>Important:</strong> By using the Biztrivo platform, you declare that you have read,
                    understood and agreed to all the terms and conditions described in this document.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermosDeUso;
