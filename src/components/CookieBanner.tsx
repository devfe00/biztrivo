import { useState, useEffect } from 'react';
import { Cookie, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useT } from '@/lib/i18n';

const STORAGE_KEY = 'biztrivo_cookie_consent';

type ConsentState = 'pending' | 'accepted' | 'rejected';

function updateGtagConsent(granted: boolean) {
  if (typeof window === 'undefined' || !(window as any).gtag) return;
  const value = granted ? 'granted' : 'denied';
  (window as any).gtag('consent', 'update', {
    ad_storage: value,
    analytics_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
}

export default function CookieBanner() {
  const t = useT();
  const [state, setState] = useState<ConsentState>('pending');
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'accepted') {
      updateGtagConsent(true);
      setState('accepted');
    } else if (saved === 'rejected') {
      setState('rejected');
    } else {
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    updateGtagConsent(true);
    setState('accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    updateGtagConsent(false);
    setState('rejected');
    setVisible(false);
  };

  if (state !== 'pending' || !visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4"
      role="dialog"
      aria-label={t('cookies.accept')}
    >
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 p-2 bg-green-50 dark:bg-green-900/30 rounded-xl shrink-0">
            <Cookie size={18} className="text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
  {t('Cookies')}
</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              {t('cookies.message')}{' '}
              <Link to="/politica-privacidade" className="underline">{t('cookies.policy')}</Link>.
            </p>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-4 pt-1">
          <button
            onClick={reject}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={13} />
            {t('cookies.decline')}
          </button>
          <button
            onClick={accept}
            className="flex-[2] flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-xs font-semibold text-white transition-colors"
          >
            <Check size={13} />
            {t('cookies.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}