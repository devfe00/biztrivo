import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogOut, Camera, Save, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, CheckCircle2, CreditCard, Globe, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { auth, db, FUNCTIONS, callFunction } from '@/integrations/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { useT, useI18n } from '@/lib/i18n';

const Configuracoes: React.FC = () => {
  const t = useT();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { config, updateConfig } = useStore();

  const [storeName, setStoreName] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'subscription'>('profile');
  const [subscription, setSubscription] = useState<{ status: string; plan: string; current_period_end: string | null } | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [ajudaeStatus, setAjudaeStatus] = useState<{ plan: string; active: boolean; redeemed: boolean } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    setStoreName(config.storeName);
    setPixKey(config.pixKey ?? '');
    setProfileImage(config.profileImage);
  }, [config.storeName, config.pixKey, config.profileImage]);

  useEffect(() => {
    if (!user) return;

    getDoc(doc(db, 'subscriptions', user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSubscription({
          status: data.status,
          plan: data.plan,
          current_period_end: data.currentPeriodEnd?.toDate
            ? data.currentPeriodEnd.toDate().toISOString()
            : data.currentPeriodEnd ?? null,
        });
      }
    });

    //verifica se o email do usuário é assinante Ajudaê
    if (user.email) {
      const docId = user.email.toLowerCase().replace(/[.@]/g, '_');
      getDoc(doc(db, 'ajudaeSubscribers', docId)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setAjudaeStatus({
            plan: data.plan,
            active: data.active,
            redeemed: !!data.couponRedeemedAt,
          });
        }
      }).catch(() => {
  //doc não existe ou sem permissão, comportamento esperado para não assinantes da ajudae2
});
    }
  }, [user]);

  const handleApplyAjudaeCoupon = async () => {
    setApplyingCoupon(true);
    setMessage(null);
    try {
      if (!auth.currentUser) {
        setMessage({ type: 'error', text: 'Sessão expirada. Faça login novamente.' });
        return;
      }
      const data = await callFunction<{ error?: string; discountPct?: number }>(FUNCTIONS.applyAjudaeCoupon);
      if (data?.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: `Cupom aplicado! Você ganhou ${data.discountPct}% de desconto recorrente.` });
        setAjudaeStatus(prev => prev ? { ...prev, redeemed: true } : null);
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Erro inesperado.' });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMessage({ type: 'error', text: t('configuracoes.error_image_size') }); return; }
    if (!file.type.startsWith('image/')) { setMessage({ type: 'error', text: t('configuracoes.error_image_type') }); return; }
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) { setMessage({ type: 'error', text: t('configuracoes.error_store_name') }); return; }
    setLoading(true);
    setMessage(null);
    try {
      await updateConfig({ storeName, pixKey, profileImage });
      setMessage({ type: 'success', text: t('configuracoes.success_profile') });
    } catch {
      setMessage({ type: 'error', text: t('configuracoes.error_profile') });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setMessage({ type: 'error', text: t('configuracoes.error_password_short') }); return; }
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: t('configuracoes.error_password_match') }); return; }

    setLoading(true);
    setMessage(null);
    try {
      if (!auth.currentUser) throw new Error(t('auth.session_expired'));
      await updatePassword(auth.currentUser, newPassword);
      setMessage({ type: 'success', text: t('configuracoes.success_password') });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: t('configuracoes.error_password_relogin') });
      } else {
        setMessage({ type: 'error', text: err?.message || t('configuracoes.error_unexpected') });
      }
    }
    setLoading(false);
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm(t('configuracoes.cancel_confirm'))) return;

    setCancellingSubscription(true);
    setMessage(null);

    try {
      if (!auth.currentUser) {
        setMessage({ type: 'error', text: t('auth.session_expired') });
        return;
      }

      const data = await callFunction<{ grace_period_end: string }>(FUNCTIONS.cancelSubscription);

      setSubscription(prev => prev ? { ...prev, status: 'cancelled', current_period_end: data.grace_period_end } : null);
      setMessage({ type: 'success', text: t('configuracoes.success_cancelled') });
    } catch {
      setMessage({ type: 'error', text: t('configuracoes.error_cancel') });
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm(t('auth.logout_confirm'))) {
      await signOut();
      navigate('/login');
    }
  };

  const isGracePeriod = subscription?.status === 'cancelled' && subscription?.current_period_end && new Date(subscription.current_period_end) > new Date();
  const gracePeriodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString(lang) : '';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft size={20} /><span>{t('configuracoes.back')}</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t('configuracoes.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('configuracoes.subtitle')}</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30' : 'bg-destructive/10 text-destructive border border-destructive/30'}`}>
            {message.type === 'success' ? <CheckCircle size={20} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border">
          <div className="flex border-b border-border">
            <button onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'text-primary border-b-2 border-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              <div className="flex items-center justify-center gap-2"><User size={18} /><span>{t('configuracoes.tab_profile')}</span></div>
            </button>
            <button onClick={() => setActiveTab('password')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'password' ? 'text-primary border-b-2 border-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              <div className="flex items-center justify-center gap-2"><Lock size={18} /><span>{t('configuracoes.tab_password')}</span></div>
            </button>
            <button onClick={() => setActiveTab('subscription')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'subscription' ? 'text-primary border-b-2 border-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              <div className="flex items-center justify-center gap-2"><CreditCard size={18} /><span>{t('configuracoes.tab_subscription')}</span></div>
            </button>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
                      {profileImage ? <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" /> : <User size={48} className="text-white" />}
                    </div>
                    <label htmlFor="profile-image" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                      <Camera size={20} />
                      <input id="profile-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="storeName" className="block text-sm font-medium text-foreground mb-2">{t('configuracoes.store_name')}</label>
                  <input id="storeName" type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background text-foreground"
                    placeholder={t('configuracoes.store_name_placeholder')} required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background text-foreground"
                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                    maxLength={140}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Aparece pré-preenchida na mensagem do WhatsApp quando o cliente clicar em "Comprar" na sua vitrine.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('configuracoes.email')}</label>
                  <input type="email" value={user?.email || ''} className="w-full px-4 py-3 border border-input rounded-lg bg-muted text-muted-foreground cursor-not-allowed" disabled />
                  <p className="text-xs text-muted-foreground mt-1">{t('configuracoes.email_readonly')}</p>
                </div>

                <div>
  <label className="block text-sm font-medium text-foreground mb-2">{t('configuracoes.country')}</label>
  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
  {([
    { value: 'BR',     label: t('ext.cfg_country_br'),    icon: '🇧🇷' },
    { value: 'ES',     label: t('ext.cfg_country_es'),    icon: '🇪🇸' },
    { value: 'FR',     label: t('ext.cfg_country_fr'),    icon: '🇫🇷' },
    { value: 'US',     label: t('ext.cfg_country_us'),    icon: '🇺🇸' },
    { value: 'outros', label: t('ext.cfg_country_other'), icon: '🌍' },
  ] as { value: string; label: string; icon: string }[]).map(({ value, label, icon }) => (
    <button
      key={value}
      type="button"
      onClick={() => updateConfig({ paisBase: value as any })}
      className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border-2 transition-all text-xs font-medium ${
        config.paisBase === value
          ? 'border-primary bg-primary/5 text-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-muted'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  ))}
</div>
  <p className="text-xs text-muted-foreground mt-1">{t('configuracoes.country_hint')}</p>
</div>

                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{t('configuracoes.saving')}</span></> : <><Save size={20} /><span>{t('configuracoes.save')}</span></>}
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('configuracoes.new_password')}</label>
                  <div className="relative">
                    <input type={showNewPassword ? 'text' : 'password'} value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent pr-12 bg-background text-foreground"
                      placeholder={t('configuracoes.password_placeholder')} required />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('configuracoes.confirm_password')}</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                    placeholder={t('configuracoes.confirm_password_placeholder')} required />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{t('configuracoes.changing_password')}</span></> : <><Lock size={20} /><span>{t('configuracoes.change_password')}</span></>}
                </button>
              </form>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <div className="bg-muted rounded-lg p-6 border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('configuracoes.subscription_details')}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t('configuracoes.plan')}</span>
                      <span className="font-medium text-foreground capitalize">{subscription?.plan || 'Free'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t('configuracoes.status')}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        subscription?.status === 'active' ? 'bg-green-500/15 text-green-600 dark:text-green-400' :
                        isGracePeriod ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' :
                        'bg-destructive/15 text-destructive'
                      }`}>
                        {subscription?.status === 'active' ? t('configuracoes.status_active') :
                         isGracePeriod ? t('configuracoes.status_grace') :
                         t('configuracoes.status_inactive')}
                      </span>
                    </div>
                    {isGracePeriod && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t('configuracoes.access_until')}</span>
                        <span className="font-medium text-yellow-500">{gracePeriodEnd}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isGracePeriod && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                      {t('configuracoes.grace_notice', { date: gracePeriodEnd }).replace(/<\/?1>/g, '')}
                    </p>
                  </div>
                )}

                {subscription?.status === 'active' && subscription?.plan === 'pro' && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancellingSubscription}
                    className="w-full bg-destructive/10 text-destructive py-3 rounded-lg font-semibold hover:bg-destructive/20 transition-all border border-destructive/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {cancellingSubscription ? (
                      <><div className="w-5 h-5 border-2 border-destructive border-t-transparent rounded-full animate-spin" /><span>{t('configuracoes.cancelling')}</span></>
                    ) : (
                      <><CreditCard size={20} /><span>{t('configuracoes.cancel_sub')}</span></>
                    )}
                  </button>
                )}

                {ajudaeStatus && ajudaeStatus.active && subscription?.status === 'active' && subscription?.plan === 'pro' && (
                  <div className="bg-gradient-to-r from-green-500/10 to-primary/10 border border-green-500/30 rounded-lg p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Tag size={22} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground">{t('configuracoes.coupon_title')}</h4>
                       <p className="text-sm text-muted-foreground mt-1">
  {t('configuracoes.coupon_subscriber', { plan: ajudaeStatus.plan }).replace(/<\/?1>/g, '')}
  {ajudaeStatus.redeemed
    ? <span className="inline-flex items-center gap-1 ml-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 inline" /> {t('configuracoes.coupon_redeemed')}</span>
    : ` ${t('configuracoes.coupon_discount', { pct: ajudaeStatus.plan === 'premium' ? 30 : 15 })}`}
</p>
                      </div>
                    </div>
                    {!ajudaeStatus.redeemed && (
                      <button
                        onClick={handleApplyAjudaeCoupon}
                        disabled={applyingCoupon}
                        className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {applyingCoupon ? (
                          <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{t('configuracoes.coupon_applying')}</span></>
                        ) : (
                          <><Tag size={18} /><span>{t('configuracoes.coupon_apply')}</span></>
                        )}
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('configuracoes.coupon_warning')}
                    </p>
                  </div>
                )}

                {subscription?.status !== 'active' && !isGracePeriod && (
                  <button
                    onClick={() => {
                      const email = user?.email || '';
                      window.location.href = `https://buy.stripe.com/00w5kEbOLdj35OmfwpgEg00?prefilled_email=${encodeURIComponent(email)}`;
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <CreditCard size={20} /><span>{t('configuracoes.subscribe_pro')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button onClick={handleLogout}
            className="w-full bg-destructive/10 text-destructive py-3 rounded-lg font-semibold hover:bg-destructive/20 transition-all border border-destructive/30 flex items-center justify-center gap-2">
            <LogOut size={20} /><span>{t('configuracoes.logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;