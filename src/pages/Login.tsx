import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
...
            <div className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
              Login com Google desativado no modo local
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Não tem uma conta?{' '}
                <Link to={`/register${tokenSearch}`} className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">Cadastre-se grátis</Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/80 text-sm mt-6">© 2026 Biztrivo. Todos os direitos reservados.</p>
      </div>

      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button onClick={() => { setShowRecoveryModal(false); setRecoveryEmail(''); setRecoverySuccess(false); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>

            {!recoverySuccess ? (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Lock className="text-blue-600" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Recuperar Senha</h2>
                  <p className="text-gray-600 mt-2">Digite seu email para receber as instruções de recuperação</p>
                </div>
                <form onSubmit={handleRecoverySubmit} className="space-y-5">
                  <div>
                    <label htmlFor="recoveryEmail" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input id="recoveryEmail" type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="seu@email.com" required />
                    </div>
                  </div>
                  <button type="submit"
                    className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-500 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl">
                    Enviar Instruções
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <AlertCircle className="text-green-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Enviado!</h2>
                <p className="text-gray-600">Verifique sua caixa de entrada e siga as instruções para recuperar sua senha.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
