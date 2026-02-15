import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Store, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    storeName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.storeName.trim()) {
      return 'Digite o nome da sua loja';
    }

    if (!formData.email.trim()) {
      return 'Digite seu email';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Digite um email válido';
    }

    if (!formData.password) {
      return 'Digite uma senha';
    }

    if (formData.password.length < 6) {
      return 'A senha deve ter no mínimo 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'As senhas não conferem';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const existingUser = localStorage.getItem('userData');
      if (existingUser) {
        const parsedUser = JSON.parse(existingUser);
        if (parsedUser.email === formData.email) {
          setError('Este email já está cadastrado');
          setLoading(false);
          return;
        }
      }

      const userData = {
        storeName: formData.storeName,
        email: formData.email,
        password: formData.password,
        profileImage: '',
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');

      navigate('/');
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };

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
      <div className="absolute inset-0 bg-black/20"></div>
      
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
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Loja
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="storeName"
                    name="storeName"
                    type="text"
                    value={formData.storeName}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Minha Loja Virtual"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Força da senha:</span>
                      <span className={`text-xs font-medium ${
                        strength.label === 'Fraca' ? 'text-red-600' :
                        strength.label === 'Média' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${strength.color}`}
                        style={{ width: `${(strength.strength / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Digite a senha novamente"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle size={16} />
                    <span>As senhas conferem</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  Eu concordo com os{' '}
                  <Link to="/termos-de-uso" className="text-blue-600 hover:text-blue-700 font-medium">
                    Termos de Uso
                  </Link>
                  {' '}e{' '}
                  <Link to="/politica-privacidade" className="text-blue-600 hover:text-blue-700 font-medium">
                    Política de Privacidade
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-500 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Criando conta...</span>
                  </>
                ) : (
                  <span>Criar Conta Grátis</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Já tem uma conta?{' '}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Fazer login
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/80 text-sm mt-6">
          © 2026 Biztrivo. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Register;