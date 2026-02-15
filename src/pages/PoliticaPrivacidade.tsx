import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PoliticaPrivacidade: React.FC = () => {
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
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="text-green-600" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Política de Privacidade</h1>
          </div>

          <p className="text-sm text-gray-600 mb-8">
            Última atualização: 15 de fevereiro de 2026
          </p>

          <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Introdução</h2>
              <p>
                A Biztrivo respeita sua privacidade e está comprometida em proteger seus dados pessoais. Esta Política 
                de Privacidade explica como coletamos, usamos, armazenamos e compartilhamos suas informações pessoais 
                em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018) e demais legislações 
                aplicáveis.
              </p>
              <p className="mt-3">
                Esta política se aplica a todos os usuários da plataforma Biztrivo, incluindo visitantes, usuários 
                cadastrados e assinantes de planos pagos.
              </p>
              <p className="mt-3">
                Ao utilizar nossos serviços, você concorda com as práticas descritas nesta Política de Privacidade. 
                Se você não concordar com qualquer parte desta política, não utilize nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Definições</h2>
              <p>Para fins desta Política de Privacidade:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Dados Pessoais:</strong> Qualquer informação relacionada a uma pessoa natural identificada ou identificável</li>
                <li><strong>Titular:</strong> Pessoa natural a quem se referem os dados pessoais</li>
                <li><strong>Controlador:</strong> Biztrivo, responsável pelas decisões sobre o tratamento de dados pessoais</li>
                <li><strong>Tratamento:</strong> Toda operação realizada com dados pessoais (coleta, armazenamento, uso, compartilhamento, etc.)</li>
                <li><strong>Cookies:</strong> Pequenos arquivos de texto armazenados no seu dispositivo para melhorar sua experiência</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Dados Coletados</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1. Dados Fornecidos Diretamente por Você</h3>
              <p>Coletamos as seguintes informações quando você cria uma conta ou usa nossos serviços:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Dados de Cadastro:</strong> Nome da loja, email, senha (criptografada), telefone</li>
                <li><strong>Dados de Perfil:</strong> Foto de perfil, preferências de configuração</li>
                <li><strong>Dados de Pagamento:</strong> Informações de cobrança (processadas por terceiros seguros)</li>
                <li><strong>Dados de Negócio:</strong> Produtos, preços, transações financeiras, estoque</li>
                <li><strong>Comunicações:</strong> Mensagens enviadas ao suporte, feedbacks, avaliações</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2. Dados Coletados Automaticamente</h3>
              <p>Quando você usa nossa plataforma, coletamos automaticamente:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Dados de Navegação:</strong> Endereço IP, tipo de navegador, sistema operacional, idioma</li>
                <li><strong>Dados de Uso:</strong> Páginas visitadas, tempo de uso, cliques, funcionalidades utilizadas</li>
                <li><strong>Dados de Dispositivo:</strong> Identificador único do dispositivo, modelo, resolução de tela</li>
                <li><strong>Dados de Localização:</strong> Localização aproximada baseada no IP (não coletamos GPS)</li>
                <li><strong>Cookies e Tecnologias Similares:</strong> Conforme descrito na seção 10</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3. Dados de Terceiros</h3>
              <p>
                Podemos receber informações sobre você de processadores de pagamento (como Mercado Pago) quando você 
                assina um plano pago, limitadas ao necessário para processar a transação.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Base Legal e Finalidades do Tratamento</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1. Execução de Contrato</h3>
              <p>Tratamos seus dados para:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Criar e gerenciar sua conta</li>
                <li>Fornecer os serviços da plataforma</li>
                <li>Processar pagamentos e gerenciar assinaturas</li>
                <li>Permitir a criação e gerenciamento de sua vitrine online</li>
                <li>Gerar relatórios e análises do seu negócio</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2. Legítimo Interesse</h3>
              <p>Com base em nosso legítimo interesse, usamos seus dados para:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Melhorar e personalizar nossos serviços</li>
                <li>Realizar análises estatísticas e pesquisas de mercado</li>
                <li>Prevenir fraudes e garantir segurança da plataforma</li>
                <li>Detectar e corrigir erros técnicos</li>
                <li>Enviar comunicações sobre atualizações importantes do serviço</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3. Consentimento</h3>
              <p>Com seu consentimento expresso, podemos:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Enviar emails promocionais e ofertas especiais</li>
                <li>Realizar marketing direto</li>
                <li>Utilizar cookies não essenciais</li>
                <li>Compartilhar informações para fins de publicidade direcionada</li>
              </ul>
              <p className="mt-3">
                Você pode retirar seu consentimento a qualquer momento através das configurações da conta ou links 
                de descadastramento em emails.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.4. Cumprimento de Obrigação Legal</h3>
              <p>Podemos tratar seus dados para:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Cumprir obrigações fiscais e contábeis</li>
                <li>Atender solicitações de autoridades competentes</li>
                <li>Exercer direitos em processos judiciais</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Compartilhamento de Dados</h2>
              
              <p>Não vendemos seus dados pessoais. Podemos compartilhar suas informações apenas nas seguintes situações:</p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1. Prestadores de Serviços</h3>
              <p>Compartilhamos dados com terceiros que nos auxiliam a fornecer nossos serviços:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Processadores de Pagamento:</strong> Mercado Pago (para processar transações)</li>
                <li><strong>Serviços de Hospedagem:</strong> Provedores de infraestrutura em nuvem</li>
                <li><strong>Ferramentas de Análise:</strong> Google Analytics (dados anonimizados)</li>
                <li><strong>Serviços de Email:</strong> Plataformas de envio de emails transacionais</li>
                <li><strong>Suporte ao Cliente:</strong> Ferramentas de atendimento e helpdesk</li>
              </ul>
              <p className="mt-3">
                Todos os prestadores de serviços são cuidadosamente selecionados e contratualmente obrigados a 
                proteger seus dados e usá-los apenas conforme nossas instruções.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2. Exigências Legais</h3>
              <p>Podemos divulgar seus dados quando exigido por lei ou em resposta a:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Ordens judiciais ou administrativas</li>
                <li>Investigações de autoridades competentes</li>
                <li>Proteção de nossos direitos legais</li>
                <li>Prevenção de fraudes ou atividades ilegais</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.3. Transferências Corporativas</h3>
              <p>
                Em caso de fusão, aquisição, venda de ativos ou falência, seus dados pessoais podem ser transferidos 
                para a entidade sucessora, que continuará vinculada a esta Política de Privacidade.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.4. Com Seu Consentimento</h3>
              <p>
                Podemos compartilhar seus dados com terceiros para outras finalidades mediante seu consentimento 
                expresso e específico.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Armazenamento e Segurança</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.1. Período de Armazenamento</h3>
              <p>Mantemos seus dados pessoais apenas pelo tempo necessário para as finalidades descritas, incluindo:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Dados de Conta Ativa:</strong> Durante toda a vigência da conta</li>
                <li><strong>Dados de Conta Encerrada:</strong> Por até 5 anos após o encerramento (obrigações legais)</li>
                <li><strong>Dados Fiscais/Contábeis:</strong> Pelo prazo legal exigido (geralmente 5 anos)</li>
                <li><strong>Dados de Marketing:</strong> Até você retirar o consentimento ou 2 anos de inatividade</li>
                <li><strong>Logs de Acesso:</strong> Por até 6 meses (conforme Marco Civil da Internet)</li>
              </ul>
              <p className="mt-3">
                Após esses períodos, seus dados são anonimizados ou deletados de forma segura e irreversível.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.2. Medidas de Segurança</h3>
              <p>Implementamos medidas técnicas e organizacionais apropriadas para proteger seus dados, incluindo:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Criptografia de dados em trânsito (HTTPS/TLS) e em repouso</li>
                <li>Controles de acesso rigorosos e autenticação de dois fatores para funcionários</li>
                <li>Monitoramento contínuo de segurança e detecção de intrusões</li>
                <li>Backups regulares e planos de recuperação de desastres</li>
                <li>Auditorias de segurança periódicas</li>
                <li>Treinamento regular de equipe sobre proteção de dados</li>
                <li>Senhas armazenadas com hash criptográfico (bcrypt)</li>
              </ul>
              <p className="mt-3">
                Apesar de nossos esforços, nenhum sistema é 100% seguro. Você também deve proteger suas credenciais 
                e nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.3. Localização dos Dados</h3>
              <p>
                Seus dados são armazenados em servidores localizados no Brasil. Caso haja necessidade de transferência 
                internacional, garantiremos que existam garantias adequadas de proteção conforme a LGPD.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Seus Direitos como Titular de Dados</h2>
              
              <p>Conforme a LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:</p>

              <ul className="list-disc pl-6 space-y-3 mt-3">
                <li>
                  <strong>Confirmação e Acesso:</strong> Confirmar se tratamos seus dados e acessar suas informações
                </li>
                <li>
                  <strong>Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados
                </li>
                <li>
                  <strong>Anonimização, Bloqueio ou Eliminação:</strong> Solicitar anonimização, bloqueio ou eliminação 
                  de dados desnecessários, excessivos ou tratados em desconformidade
                </li>
                <li>
                  <strong>Portabilidade:</strong> Solicitar a portabilidade de seus dados a outro fornecedor (formato estruturado)
                </li>
                <li>
                  <strong>Eliminação de Dados:</strong> Solicitar eliminação de dados tratados com base no consentimento
                </li>
                <li>
                  <strong>Informação sobre Compartilhamento:</strong> Saber com quais entidades compartilhamos seus dados
                </li>
                <li>
                  <strong>Informação sobre Possibilidade de Não Consentir:</strong> Ser informado sobre a possibilidade 
                  de não fornecer consentimento e suas consequências
                </li>
                <li>
                  <strong>Revogação do Consentimento:</strong> Revogar consentimento a qualquer momento
                </li>
                <li>
                  <strong>Oposição:</strong> Opor-se a tratamento realizado com base em legítimo interesse
                </li>
                <li>
                  <strong>Revisão de Decisões Automatizadas:</strong> Solicitar revisão de decisões tomadas 
                  unicamente com base em tratamento automatizado
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Como Exercer Seus Direitos</h3>
              <p>Para exercer qualquer destes direitos:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Acesse as configurações da sua conta na plataforma</li>
                <li>Entre em contato através do email: privacidade@biztrivo.com</li>
                <li>Envie solicitação por escrito para nosso endereço físico</li>
              </ul>
              <p className="mt-3">
                Responderemos sua solicitação em até 15 dias. Podemos solicitar informações adicionais para confirmar 
                sua identidade antes de processar solicitações.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Dados de Menores de Idade</h2>
              <p>
                Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente dados 
                pessoais de menores. Se tomarmos conhecimento que coletamos dados de um menor sem consentimento 
                parental apropriado, tomaremos medidas para deletar essas informações.
              </p>
              <p className="mt-3">
                Pais ou responsáveis que acreditam que seus filhos forneceram dados pessoais devem entrar em 
                contato conosco imediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Links para Sites de Terceiros</h2>
              <p>
                Nossa plataforma pode conter links para sites de terceiros. Não somos responsáveis pelas práticas 
                de privacidade desses sites. Recomendamos que você leia as políticas de privacidade de cada site 
                que visitar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Cookies e Tecnologias Similares</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10.1. O que são Cookies</h3>
              <p>
                Cookies são pequenos arquivos de texto armazenados no seu dispositivo que nos ajudam a melhorar 
                sua experiência, entender como você usa nossos serviços e personalizar conteúdo.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10.2. Tipos de Cookies que Usamos</h3>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong>Cookies Essenciais:</strong> Necessários para o funcionamento básico da plataforma 
                  (autenticação, segurança). Não podem ser desabilitados.
                </li>
                <li>
                  <strong>Cookies de Desempenho:</strong> Coletam informações anônimas sobre como você usa a 
                  plataforma para melhorias.
                </li>
                <li>
                  <strong>Cookies de Funcionalidade:</strong> Lembram suas preferências e configurações.
                </li>
                <li>
                  <strong>Cookies de Marketing:</strong> Rastreiam sua navegação para exibir anúncios relevantes 
                  (apenas com consentimento).
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10.3. Gerenciamento de Cookies</h3>
              <p>
                Você pode controlar e gerenciar cookies através das configurações do seu navegador. Note que 
                desabilitar cookies essenciais pode afetar a funcionalidade da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Incidentes de Segurança</h2>
              <p>
                Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares de dados:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Notificaremos a Autoridade Nacional de Proteção de Dados (ANPD) em prazo adequado</li>
                <li>Comunicaremos os titulares afetados sobre o incidente e medidas tomadas</li>
                <li>Tomaremos medidas imediatas para mitigar danos e prevenir novos incidentes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas 
                práticas ou por requisitos legais. Notificaremos você sobre alterações materiais através de:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Email enviado ao endereço cadastrado</li>
                <li>Aviso destacado na plataforma</li>
                <li>Notificação no login</li>
              </ul>
              <p className="mt-3">
                A data da última atualização será sempre indicada no topo desta política. Recomendamos que você 
                revise periodicamente esta página.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Encarregado de Proteção de Dados (DPO)</h2>
              <p>
                Nomeamos um Encarregado de Proteção de Dados (Data Protection Officer - DPO) conforme a LGPD. 
                Nosso DPO é responsável por aceitar reclamações e comunicações dos titulares, prestar esclarecimentos 
                e adotar providências.
              </p>
              <p className="mt-3">
                <strong>Contato do DPO:</strong>
              </p>
              <ul className="list-none pl-0 space-y-2 mt-3">
                <li><strong>Email:</strong> dpo@biztrivo.com</li>
                <li><strong>Endereço:</strong> [Seu endereço completo]</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">14. Autoridade de Proteção de Dados</h2>
              <p>
                Sem prejuízo de qualquer recurso administrativo ou judicial, você tem o direito de apresentar 
                reclamação à Autoridade Nacional de Proteção de Dados (ANPD):
              </p>
              <ul className="list-none pl-0 space-y-2 mt-3">
                <li><strong>Site:</strong> www.gov.br/anpd</li>
                <li><strong>Endereço:</strong> SAS, Quadra 6, Conjunto A, Bloco A, Ed. Órgãos Regionais, 1º Andar, Brasília-DF, CEP 70070-600</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">15. Informações de Contato</h2>
              <p>
                Para dúvidas, solicitações ou reclamações sobre esta Política de Privacidade ou sobre o tratamento 
                de seus dados pessoais:
              </p>
              <ul className="list-none pl-0 space-y-2 mt-3">
                <li><strong>Email Geral:</strong> biztrivo@outlook.com.br</li>
                <li><strong>Email Privacidade:</strong> biztrivo@outlook.com.br</li>
                <li><strong>Email DPO:</strong> biztrivo@outlook.com.br</li>
                <li><strong>Endereço:</strong> Empresa Remota</li>
                <li><strong>CNPJ:</strong> 63.526.345/0001-01</li>
              </ul>
            </section>

            <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                <strong>Compromisso com a Privacidade:</strong> O Biztrivo está comprometido em proteger sua 
                privacidade e tratar seus dados pessoais com total transparência, segurança e em conformidade 
                com a legislação brasileira de proteção de dados. Seus dados são seus, e você tem controle total 
                sobre eles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;