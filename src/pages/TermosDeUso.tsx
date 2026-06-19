import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const TermosDeUso: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Termos de Uso</h1>
          </div>

          <p className="text-sm text-gray-600 mb-8">
            Última atualização: 15 de fevereiro de 2026
          </p>

          <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar a plataforma Biztrivo, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
              </p>
              <p>
                Estes termos constituem um acordo legal vinculativo entre você (usuário) e o Biztrivo. Recomendamos que 
                você leia atentamente todos os termos antes de utilizar a plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Descrição do Serviço</h2>
              <p>
                O Biztrivo é uma plataforma de gestão comercial que oferece ferramentas para controle financeiro, 
                gerenciamento de produtos, criação de vitrine online e relatórios de vendas para pequenos e médios comerciantes.
              </p>
              <p>
                A plataforma oferece planos gratuitos e pagos, cada um com funcionalidades específicas descritas em nossa 
                página de preços. Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer funcionalidade 
                do serviço a qualquer momento.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Cadastro e Conta de Usuário</h2>
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
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Uso Aceitável da Plataforma</h2>
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
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Conteúdo do Usuário</h2>
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
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Pagamentos e Assinaturas</h2>
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
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Política de Reembolso</h2>
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
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo da plataforma Biztrivo, incluindo mas não limitado a textos, gráficos, logos, ícones, 
                imagens, clipes de áudio, downloads digitais e software, é propriedade do Biztrivo ou de seus licenciadores 
                e está protegido pelas leis brasileiras e internacionais de direitos autorais.
              </p>
              <p className="mt-3">
                O nome Biztrivo, logotipo e todas as marcas relacionadas são marcas registradas ou marcas de serviço do 
                Biztrivo. Você não pode usar essas marcas sem nossa permissão prévia por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Limitação de Responsabilidade</h2>
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
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Indenização</h2>
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
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Proteção de Dados e Privacidade</h2>
              <p>
                Seu uso da plataforma também é regido por nossa Política de Privacidade, que descreve como coletamos, 
                usamos e protegemos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
              </p>
              <p className="mt-3">
                Ao usar nossos serviços, você concorda com as práticas de coleta e uso de informações descritas na 
                Política de Privacidade.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Modificações dos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Notificaremos você sobre 
                mudanças materiais através de email ou aviso na plataforma com pelo menos 15 dias de antecedência.
              </p>
              <p className="mt-3">
                Seu uso continuado da plataforma após a entrada em vigor das modificações constitui sua aceitação dos 
                novos termos. Se você não concordar com as modificações, deve descontinuar o uso da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Rescisão</h2>
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
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">14. Lei Aplicável e Jurisdição</h2>
              <p>
                Estes Termos de Uso são regidos e interpretados de acordo com as leis da República Federativa do Brasil, 
                especialmente a Lei 12.965/2014 (Marco Civil da Internet) e a Lei 13.709/2018 (LGPD).
              </p>
              <p className="mt-3">
                Qualquer disputa relacionada a estes termos será submetida exclusivamente à jurisdição dos tribunais 
                brasileiros, com foro na comarca de São Paulo, Estado de São Paulo, renunciando as partes a qualquer outro, por 
                mais privilegiado que seja.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">15. Disposições Gerais</h2>
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
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">16. Contato</h2>
              <p>
                Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através de:
              </p>
              <ul className="list-none pl-0 space-y-2 mt-3">
                <li><strong>Email:</strong> biztrivo@outlook.com.br</li>
                <li><strong>Endereço:</strong> Empresa 100% remota, sem sede física</li>
                <li><strong>CNPJ:</strong> 63.526.345/0001-01</li>
              </ul>
            </section>

            <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Importante:</strong> Ao utilizar a plataforma Biztrivo, você declara ter lido, compreendido 
                e concordado com todos os termos e condições descritos neste documento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermosDeUso;