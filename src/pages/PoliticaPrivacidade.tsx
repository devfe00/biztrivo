import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import pt from '@/i18n/locales/pt.json';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import fr from '@/i18n/locales/fr.json';

const dicts: Record<string, any> = { pt, en, es, fr };

type Node = string | string[] | Record<string, unknown>;

const Html = ({ as: As = 'p', html, className }: { as?: any; html: string; className?: string }) => (
  <As className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

const List = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-6 space-y-2 mt-3">
    {items.map((it, i) => (
      <li key={i} dangerouslySetInnerHTML={{ __html: it }} />
    ))}
  </ul>
);

const renderBlock = (obj: Record<string, Node>, level: number) =>
  Object.entries(obj).map(([key, value]) => {
    if (Array.isArray(value)) return <List key={key} items={value as string[]} />;
    if (typeof value === 'object' && value !== null)
      return (
        <div key={key} className="mt-4">
          {renderBlock(value as Record<string, Node>, level + 1)}
        </div>
      );
    const text = String(value);
    if (key === 'title')
      return <Html key={key} as="h2" html={text} className="text-2xl font-bold text-gray-900 mt-8 mb-4" />;
    if (key === 'h')
      return <Html key={key} as="h3" html={text} className="text-xl font-semibold text-gray-900 mt-6 mb-3" />;
    return <Html key={key} html={text} className="mt-3" />;
  });

const PoliticaPrivacidade: React.FC = () => {
  const { lang } = useI18n();
  const d = (dicts[lang] ?? dicts.pt).privacidade as Record<string, Node>;
  const { title, back, commitment, ...sections } = d as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{String(back)}</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="text-green-600" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{String(title)}</h1>
          </div>

          <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-gray-700">
            {Object.entries(sections as Record<string, Node>).map(([key, value]) => (
              <section key={key}>
                {typeof value === 'object' && !Array.isArray(value)
                  ? renderBlock(value as Record<string, Node>, 2)
                  : null}
              </section>
            ))}

            {commitment ? (
              <div className="mt-10 p-6 bg-green-50 rounded-xl border border-green-100">
                <p
                  className="text-sm text-gray-700"
                  dangerouslySetInnerHTML={{ __html: String(commitment) }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
