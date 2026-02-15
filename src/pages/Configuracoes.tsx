import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  LogOut,
  Camera,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

interface UserProfile {
  storeName: string;
  email: string;
  profileImage: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Configuracoes: React.FC = () => {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile>({
    storeName: '',
    email: '',
    profileImage: ''
  });
  
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  
  useEffect(() => {
    loadUserData();
  }, []);
  
  const loadUserData = () => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedData = JSON.parse(userData);
      setProfile({
        storeName: parsedData.storeName || '',
        email: parsedData.email || '',
        profileImage: parsedData.profileImage || ''
      });
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB' });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor, selecione uma imagem válida' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile.storeName.trim()) {
      setMessage({ type: 'error', text: 'O nome da loja é obrigatório' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
      const updatedUserData = {
        ...currentUserData,
        storeName: profile.storeName,
        profileImage: profile.profileImage
      };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };
  
  const validatePassword = (): string | null => {
    if (!passwordData.currentPassword) {
      return 'Digite sua senha atual';
    }
    
    if (!passwordData.newPassword) {
      return 'Digite a nova senha';
    }
    
    if (passwordData.newPassword.length < 6) {
      return 'A nova senha deve ter no mínimo 6 caracteres';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return 'As senhas não conferem';
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      return 'A nova senha deve ser diferente da atual';
    }
    
    return null;
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validatePassword();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.password !== passwordData.currentPassword) {
        setMessage({ type: 'error', text: 'Senha atual incorreta' });
        setLoading(false);
        return;
      }
      
      userData.password = passwordData.newPassword;
      localStorage.setItem('userData', JSON.stringify(userData));
      
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao alterar senha. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      localStorage.removeItem('isAuthenticated');
      navigate('/login');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Voltar ao Dashboard</span>
          </button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Configurações
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie seu perfil e preferências
          </p>
        </div>
        
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <User size={18} />
                <span>Perfil</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'password'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Lock size={18} />
                <span>Senha</span>
              </div>
            </button>
          </div>
          
          <div className="p-6 md:p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
                      {profile.profileImage ? (
                        <img
                          src={profile.profileImage}
                          alt="Perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={48} className="text-white" />
                      )}
                    </div>
                    
                    <label
                      htmlFor="profile-image"
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      <Camera size={20} />
                      <input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <p className="text-sm text-gray-500 text-center">
                    Clique no ícone para alterar a foto de perfil
                  </p>
                </div>
                
                <div>
                  <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Loja *
                  </label>
                  <input
                    id="storeName"
                    type="text"
                    value={profile.storeName}
                    onChange={(e) => setProfile(prev => ({ ...prev, storeName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Digite o nome da sua loja"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={profile.email}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O email não pode ser alterado
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </form>
            )}
            
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual *
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                      placeholder="Digite sua senha atual"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha *
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                      placeholder="Digite a nova senha (mín. 6 caracteres)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                      placeholder="Digite novamente a nova senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">Dicas para uma senha segura:</p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>Use no mínimo 6 caracteres</li>
                    <li>Combine letras maiúsculas e minúsculas</li>
                    <li>Inclua números e caracteres especiais</li>
                    <li>Evite informações pessoais óbvias</li>
                  </ul>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Alterando...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      <span>Alterar Senha</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-100 transition-all border border-red-200 flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;