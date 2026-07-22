import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { getAuth, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/integrations/firebase/firebase';
import { useT } from '@/lib/i18n';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const t = useT();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError(t('register.error_weak_password')); return; }
    if (password !== confirmPassword) { setError(t('configuracoes.error_password_match')); return; }

    setLoading(true);
    // Firebase exige o "oobCode" vindo da URL (?oobCode=...), enviado no e-mail de reset
    const oobCode = new URLSearchParams(window.location.search).get('oobCode');
    if (!oobCode) { setError(t('reset_password.error')); setLoading(false); return; }
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(t('reset_password.error'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {success ? (
          <div className="text-center">
            <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('configuracoes.success_password')}</h2>
            <p className="text-gray-600">{t('auth_callback.redirect')}</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Lock className="text-blue-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('configuracoes.new_password')}</h2>
              <p className="text-gray-600 mt-2">{t('configuracoes.password_placeholder')}</p>
            </div>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('configuracoes.new_password')}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                    placeholder={t('configuracoes.password_placeholder')} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('configuracoes.confirm_password')}</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('configuracoes.confirm_password_placeholder')} required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{t('common.saving')}</span></> : <span>{t('common.save')}</span>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
