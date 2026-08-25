import { Instagram, Linkedin, Mail, FileText, Shield } from 'lucide-react';
import { useT } from '@/lib/i18n';

const Footer = () => {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 rounded-2xl overflow-hidden shadow-glow">
      <div className="h-1 w-full gradient-primary" />

      <div className="gradient-primary px-5 py-4 md:px-6 md:py-8">

        {/* Top row */}
        <div className="flex items-center justify-between md:mb-6">
          <div>
            <p className="text-primary-foreground font-heading font-bold text-sm md:text-xl tracking-tight">Biztrivo</p>
            <p className="text-primary-foreground/60 text-xs mt-0.5">CNPJ: 68.199.491/0001-85</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://www.instagram.com/biztrivo/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              title="Instagram"
            >
              <Instagram className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </a>
            <a
              href="mailto:biztrivo@outlook.com"
              className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              title="E-mail"
            >
              <Mail className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </a>
            <a
              href="https://www.linkedin.com/company/biztrivo"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/15 my-3 md:mb-5" />

        {/* Bottom row */}
        <div className="flex items-center justify-between text-xs text-primary-foreground/60">
          <p>© {year} Biztrivo<span className="hidden md:inline">. {t('footer.rights')}</span></p>

          <div className="flex items-center gap-3 md:gap-4">
            <a
              href="https://biztrivo.com/termos-de-uso"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 md:gap-1.5 hover:text-primary-foreground transition-colors"
            >
              <FileText className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span>{t('footer.terms')}</span>
            </a>
            <a
              href="https://biztrivo.com/politica-privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 md:gap-1.5 hover:text-primary-foreground transition-colors"
            >
              <Shield className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span>{t('footer.privacy')}</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;