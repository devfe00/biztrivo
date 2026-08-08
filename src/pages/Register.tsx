import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Store, Mail, Lock, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { redirectToCheckout } from '@/lib/billing';
import { useLang, type Lang } from '@/lib/useLang';

const T: Record<Lang, {
  title: string; subtitle: string;
  storeName: string; storeNamePh: string;
  email: string; emailPh: string;
  password: string; passwordPh: string;
  confirm: string; confirmPh: string;
  strength: string; weak: string; medium: string; strong: string;
  match: string;
  terms1: string; terms: string; and: string; privacy: string;
  submit: string; submitting: string;
  or: string; google: string;
  hasAccount: string; login: string;
  successTitle: string; successBody: string; goPay: string;
  errors: { storeName: string; email: string; emailInvalid: string; password: string; passwordShort: string; passwordMismatch: string };
  toastTitle: string; toastBody: string;
  copyright: string;
}> = {
  pt: {
    title: 'Crie sua conta', subtitle: 'Comece a vender online agora',
    storeName: 'Nome da Loja', storeNamePh: 'Minha Loja Virtual',
    email: 'Email', emailPh: 'seu@email.com',
    password: 'Senha', passwordPh: 'Mínimo 6 caracteres',
    confirm: 'Confirmar Senha', confirmPh: 'Digite novamente',
    strength: 'Força da senha:', weak: 'Fraca', medium: 'Média', strong: 'Forte',
    match: 'As senhas conferem',
    terms1: 'Eu concordo com os', terms: 'Termos de Uso', and: 'e', privacy: 'Política de Privacidade',
    submit: 'Criar Conta', submitting: 'Criando conta...',
    or: 'ou continue com', google: 'Cadastrar com Google',
    hasAccount: 'Já tem uma conta?', login: 'Fazer login',
    successTitle: 'Cadastro concluído ✅', successBody: 'Agora finalize o pagamento para liberar seu acesso.', goPay: 'Ir para pagamento',
    errors: {
      storeName: 'Digite o nome da sua loja', email: 'Digite seu email', emailInvalid: 'Digite um email válido',
      password: 'Digite uma senha', passwordShort: 'A senha deve ter no mínimo 6 caracteres', passwordMismatch: 'As senhas não conferem',
    },
    toastTitle: 'Cadastro concluído!', toastBody: 'Agora finalize o pagamento para liberar o acesso.',
    copyright: '© 2026 Biztrivo. Todos os direitos reservados.',
  },
  en: {
    title: 'Create your account', subtitle: 'Start selling online now',
    storeName: 'Store Name', storeNamePh: 'My Online Store',
    email: 'Email', emailPh: 'you@email.com',
    password: 'Password', passwordPh: 'At least 6 characters',
    confirm: 'Confirm Password', confirmPh: 'Type it again',
    strength: 'Password strength:', weak: 'Weak', medium: 'Medium', strong: 'Strong',
    match: 'Passwords match',
    terms1: 'I agree to the', terms: 'Terms of Use', and: 'and', privacy: 'Privacy Policy',
    submit: 'Create Account', submitting: 'Creating account...',
    or: 'or continue with', google: 'Sign up with Google',
    hasAccount: 'Already have an account?', login: 'Sign in',
    successTitle: 'Account created ✅', successBody: 'Now complete the payment to unlock access.', goPay: 'Go to payment',
    errors: {
      storeName: 'Enter your store name', email: 'Enter your email', emailInvalid: 'Enter a valid email',
      password: 'Enter a password', passwordShort: 'Password must be at least 6 characters', passwordMismatch: 'Passwords do not match',
    },
    toastTitle: 'Account created!', toastBody: 'Now complete the payment to unlock access.',
    copyright: '© 2026 Biztrivo. All rights reserved.',
  },
  es: {
    title: 'Crea tu cuenta', subtitle: 'Empieza a vender en línea ahora',
    storeName: 'Nombre de la Tienda', storeNamePh: 'Mi Tienda Online',
    email: 'Correo', emailPh: 'tu@correo.com',
    password: 'Contraseña', passwordPh: 'Mínimo 6 caracteres',
    confirm: 'Confirmar Contraseña', confirmPh: 'Escríbela de nuevo',
    strength: 'Seguridad de la contraseña:', weak: 'Débil', medium: 'Media', strong: 'Fuerte',
    match: 'Las contraseñas coinciden',
    terms1: 'Acepto los', terms: 'Términos de Uso', and: 'y', privacy: 'Política de Privacidad',
    submit: 'Crear Cuenta', submitting: 'Creando cuenta...',
    or: 'o continúa con', google: 'Registrarse con Google',
    hasAccount: '¿Ya tienes una cuenta?', login: 'Iniciar sesión',
    successTitle: 'Cuenta creada ✅', successBody: 'Ahora completa el pago para liberar el acceso.', goPay: 'Ir al pago',
    errors: {
      storeName: 'Escribe el nombre de tu tienda', email: 'Escribe tu correo', emailInvalid: 'Escribe un correo válido',
      password: 'Escribe una contraseña', passwordShort: 'La contraseña debe tener al menos 6 caracteres', passwordMismatch: 'Las contraseñas no coinciden',
    },
    toastTitle: '¡Cuenta creada!', toastBody: 'Ahora completa el pago para liberar el acceso.',
    copyright: '© 2026 Biztrivo. Todos los derechos reservados.',
  },
  fr: {
    title: 'Créez votre compte', subtitle: 'Commencez à vendre en ligne maintenant',
    storeName: 'Nom de la Boutique', storeNamePh: 'Ma Boutique en Ligne',
    email: 'E-mail', emailPh: 'vous@email.com',
    password: 'Mot de passe', passwordPh: '6 caractères minimum',
    confirm: 'Confirmer le mot de passe', confirmPh: 'Retapez-le',
    strength: 'Force du mot de passe :', weak: 'Faible', medium: 'Moyen', strong: 'Fort',
    match: 'Les mots de passe correspondent',
    terms1: "J'accepte les", terms: "Conditions d'utilisation", and: 'et', privacy: 'Politique de Confidentialité',
    submit: 'Créer un compte', submitting: 'Création du compte...',
    or: 'ou continuez avec', google: "S'inscrire avec Google",
    hasAccount: 'Vous avez déjà un compte ?', login: 'Se connecter',
    successTitle: 'Compte créé ✅', successBody: 'Finalisez maintenant le paiement pour débloquer votre accès.', goPay: 'Aller au paiement',
    errors: {
      storeName: 'Saisissez le nom de votre boutique', email: 'Saisissez votre e-mail', emailInvalid: 'Saisissez un e-mail valide',
      password: 'Saisissez un mot de passe', passwordShort: 'Le mot de passe doit contenir au moins 6 caractères', passwordMismatch: 'Les mots de passe ne correspondent pas',
    },
    toastTitle: 'Compte créé !', toastBody: 'Finalisez maintenant le paiement pour débloquer votre accès.',
    copyright: '© 2026 Biztrivo. Tous droits réservés.',
  },
};

const LANG_FLAGS: Record<Lang, string> = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷' };

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signInWithGoogle, user } = useAuth();
  const { lang, setLang } = useLang();
  const t = T[lang];
  const [formData, setFormData] = useState({ storeName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const paymentRef = useRef<HTMLDivElement | null>(null);
  const tokenSearch = location.search || '';
  const homePath = `/dashboard${tokenSearch}`;

  useEffect(() => {
    if (user && !success) redirectToCheckout(user.email);
  }, [user, homePath, navigate]);

  useEffect(() => {
    if (success) paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [success]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = (): string | null => {
    if (!formData.storeName.trim()) return t.errors.storeName;
    if (!formData.email.trim()) return t.errors.email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return t.errors.emailInvalid;
    if (!formData.password) return t.errors.password;
    if (formData.password.length < 6) return t.errors.passwordShort;
    if (formData.password !== formData.confirmPassword) return t.errors.passwordMismatch;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    const { error: signUpError } = await signUp(formData.email, formData.password, formData.storeName);
    if (signUpError) {
      setError(signUpError);
    } else {
      setSuccess(true);
      toast.success(t.toastTitle, { description: t.toastBody });
      redirectToCheckout(formData.email);
    }
    setLoading(false);
  };

  const passwordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: 'bg-gray-200' };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    if (strength <= 2) return { strength, label: t.weak, color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: t.medium, color: 'bg-yellow-500' };
    return { strength, label: t.strong, color: 'bg-green-500' };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-700 to-blue-800 p-8 text-center">
            <div className="inline-flex items-center justify-center mb-4">
              <img src="/logo.png" alt="Biztrivo" className="h-16 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
            <p className="text-white/90">{t.subtitle}</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              {(Object.keys(LANG_FLAGS) as Lang[]).map((l) => (
                <button key={l} type="button" onClick={() => setLang(l)}
                  aria-label={l}
                  className={`text-xl leading-none rounded-full w-8 h-8 flex items-center justify-center transition-all ${l === lang ? 'ring-2 ring-white bg-white/20' : 'opacity-70 hover:opacity-100'}`}>
                  {LANG_FLAGS[l]}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">{t.storeName}</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input id="storeName" name="storeName" type="text" value={formData.storeName} onChange={handleChange}
                    disabled={loading || success}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                    placeholder={t.storeNamePh} required />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">{t.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                    disabled={loading || success}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                    placeholder={t.emailPh} required />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">{t.password}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                    disabled={loading || success}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                    placeholder={t.passwordPh} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">{t.strength}</span>
                      <span className={`text-xs font-medium ${strength.label === t.weak ? 'text-red-600' : strength.label === t.medium ? 'text-yellow-600' : 'text-green-600'}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${strength.color}`} style={{ width: `${(strength.strength / 5) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">{t.confirm}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange}
                    disabled={loading || success}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                    placeholder={t.confirmPh} required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle size={16} /><span>{t.match}</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" id="terms" disabled={loading || success}
                  className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-60" required />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  {t.terms1}{' '}
                  <Link to={`/termos-de-uso${tokenSearch}`} className="text-blue-600 hover:text-blue-700 font-medium">{t.terms}</Link>
                  {' '}{t.and}{' '}
                  <Link to={`/politica-privacidade${tokenSearch}`} className="text-blue-600 hover:text-blue-700 font-medium">{t.privacy}</Link>
                </label>
              </div>

              {!success && (
                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-500 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{t.submitting}</span></>
                  ) : <span>{t.submit}</span>}
                </button>
              )}
            </form>

            {success && (
              <div ref={paymentRef} className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CreditCard size={18} className="text-green-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900">{t.successTitle}</p>
                    <p className="text-sm text-green-800 mt-1">{t.successBody}</p>
                  </div>
                </div>
               <button type="button" onClick={() => {
  const isBrazil = navigator.language?.startsWith('pt-BR') ||
    Intl.DateTimeFormat().resolvedOptions().timeZone === 'America/Sao_Paulo';
  const paymentLink = isBrazil
? 'https://buy.stripe.com/dRm9AT25ccwKejpdkp00002'
: 'https://buy.stripe.com/cNi5kD11854idfldkp00003'
  window.location.href = `${paymentLink}?prefilled_email=${encodeURIComponent(formData.email)}`;
}}
  className="mt-4 w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-500 hover:to-blue-600 transition-all shadow-lg">
  {t.goPay}
</button>
              </div>
            )}

            {!success && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                  <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-500">{t.or}</span></div>
                </div>

                <button onClick={async () => { const { error } = await signInWithGoogle(); if (error) setError(error); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <span className="text-gray-700 font-medium">{t.google}</span>
                </button>

                <div className="mt-6 text-center">
                  <p className="text-gray-600 text-sm">
                    {t.hasAccount}{' '}
                    <Link to={`/login${tokenSearch}`} className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">{t.login}</Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        <p className="text-center text-white/80 text-sm mt-6">{t.copyright}</p>
      </div>
    </div>
  );
};

export default Register;
