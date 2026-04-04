import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Store, Mail, Lock, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signInWithGoogle, user } = useAuth();
  const [formData, setFormData] = useState({ storeName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const paymentRef = useRef<HTMLDivElement | null>(null);
  const tokenSearch = location.search || '';
  const homePath = `/${tokenSearch}`;

  useEffect(() => {
    if (user) navigate(homePath, { replace: true });
  }, [user, homePath, navigate]);

  useEffect(() => {
    if (success) paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [success]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = (): string | null => {
    if (!formData.storeName.trim()) return 'Digite o nome da sua loja';
    if (!formData.email.trim()) return 'Digite seu email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Digite um email válido';
    if (!formData.password) return 'Digite uma senha';
    if (formData.password.length < 6) return 'A senha deve ter no mínimo 6 caracteres';
    if (formData.password !== formData.confirmPassword) return 'As senhas não conferem';
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
      toast.success('Cadastro concluído!', { description: 'Agora finalize o pagamento para liberar o acesso.' });
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
    if (strength <= 2) return { strength, label: 'Fraca', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Média', color: 'bg-yellow-500' };
    return { strength, label: 'Forte', color: 'bg-green-500' };
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
            <h1 className="text-3xl font-bold text-white mb-2">Crie sua conta</h1>
            <p className="text-white/90">Comece a vender online agora</p>
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
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">Nome da Loja</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input id="storeName" name="storeName" type="text" value={formData.storeName} onChange={handleChange}
                    disabled={loading || success}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                    placeholder="Minha Loja Virtual" required />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                    disabled={loading || success}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                    placeholder="seu@email.com" required />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                    disabled={loading || success}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                    placeholder="Mínimo 6 caracteres" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Força da senha:</span>
                      <span className={`text-xs font-medium ${strength.label === 'Fraca' ? 'text-red-600' : strength.label === 'Média' ? 'text-yellow-600' : 'text-green-600'}`}>
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
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange}
                    disabled={loading || success}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                    placeholder="Digite novamente" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle size={16} /><span>As senhas conferem</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" id="terms" disabled={loading || success}
                  className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-60" required />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  Eu concordo com os{' '}
                  <Link to={`/termos-de-uso${tokenSearch}`} className="text-blue-600 hover:text-blue-700 font-medium">Termos de Uso</Link>
                  {' '}e{' '}
                  <Link to={`/politica-privacidade${tokenSearch}`} className="text-blue-600 hover:text-blue-700 font-medium">Política de Privacidade</Link>
                </label>
              </div>

              {!success && (
                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-500 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Criando conta...</span></>
                  ) : <span>Criar Conta</span>}
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
                    <p className="text-sm font-semibold text-green-900">Cadastro concluído ✅</p>
                    <p className="text-sm text-green-800 mt-1">Agora finalize o pagamento para liberar seu acesso.</p>
                  </div>
                </div>
                <button type="button" onClick={() => { window.location.href = `https://buy.stripe.com/test_aFadRa19XalV7n6fPab3q00?prefilled_email=${encodeURIComponent(formData.email)}`; }}
                  className="mt-4 w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-500 hover:to-blue-600 transition-all shadow-lg">
                  Ir para pagamento
                </button>
              </div>
            )}

            {!success && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                  <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-500">ou continue com</span></div>
                </div>

                <button onClick={async () => { const { error } = await signInWithGoogle(); if (error) setError(error); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <span className="text-gray-700 font-medium">Cadastrar com Google</span>
                </button>

                <div className="mt-6 text-center">
                  <p className="text-gray-600 text-sm">
                    Já tem uma conta?{' '}
                    <Link to={`/login${tokenSearch}`} className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">Fazer login</Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        <p className="text-center text-white/80 text-sm mt-6">© 2026 Biztrivo. Todos os direitos reservados.</p>
      </div>
    </div>
  );
};

export default Register;
