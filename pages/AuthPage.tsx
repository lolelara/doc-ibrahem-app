
import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useLocalization } from '../App';
import { Button, Input, Card } from '../components/CommonUI';
import * as DataService from '../services/dataService';
import { User, UserRole } from '../types';
import { THEME_COLORS, ADMIN_EMAIL } from '../constants';


const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const { setCurrentUser, currentUser } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SITE_MANAGER ? "/admin" : "/user/dashboard");

  useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const toggleView = () => setIsLoginView(!isLoginView);

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full p-8 space-y-8">
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold text-${THEME_COLORS.primary}`}>
            {isLoginView ? t('login') : t('register')}
          </h2>
        </div>
        {isLoginView ? <LoginForm /> : <RegisterForm />}
        <div className="text-sm text-center">
          <button onClick={toggleView} className={`font-medium text-${THEME_COLORS.secondary} hover:text-${THEME_COLORS.secondaryHover}`}>
            {isLoginView ? t('noAccountPrompt', 'ليس لديك حساب؟ سجل الآن') : t('hasAccountPrompt', 'لديك حساب بالفعل؟ سجل الدخول')}
          </button>
        </div>
      </Card>
    </div>
  );
};

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentUser } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/user/dashboard";


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const user = DataService.getUserByEmail(email);
    
    // Simulate password check (in real app, this is done by backend)
    if (user && (user.password === password || (user.email === ADMIN_EMAIL && password === 'adminpassword'))) { // Simplified password check
      const checkedUser = DataService.checkUserSubscriptionStatus(user.id);
      setCurrentUser(checkedUser || user);
      navigate(user.role === UserRole.ADMIN || user.role === UserRole.SITE_MANAGER ? '/admin' : from, { replace: true });
    } else {
      setError(t('loginFailed'));
    }
    setIsLoading(false);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Input id="email-login" label={t('email')} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
      <Input id="password-login" label={t('password')} type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      <Button type="submit" className="w-full" isLoading={isLoading}>{t('login')}</Button>
    </form>
  );
};

const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocalization();
  const { setCurrentUser } = useAuth(); // To potentially auto-login or navigate

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      setIsLoading(false);
      return;
    }

    if (DataService.getUserByEmail(email)) {
      setError(t('emailInUseError', 'هذا البريد الإلكتروني مستخدم بالفعل.'));
      setIsLoading(false);
      return;
    }

    const newUserBase: Omit<User, 'id' | 'role'> = {
      email,
      password, // Store password temporarily, real app would hash it
      name,
      phoneNumber,
      subscriptionStatus: undefined,
    };
    
    try {
      // Role will be assigned by addUser based on email or default
      const registeredUser = DataService.addUser(newUserBase); 
      setSuccess(t('registrationSuccessful'));
      setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setPhoneNumber('');
    } catch (err: any) {
      setError(err.message || t('errorOccurred'));
    }

    setIsLoading(false);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Input id="name-register" label={t('name')} type="text" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
      <Input id="email-register" label={t('email')} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
      <Input id="phone-register" label={t('phoneNumber') + ` (${t('optional')})`} type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} autoComplete="tel" />
      <Input id="password-register" label={t('password')} type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
      <Input id="confirm-password-register" label={t('confirmPassword')} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      {success && <p className="text-sm text-green-400 text-center">{success}</p>}
      <Button type="submit" className="w-full" isLoading={isLoading}>{t('register')}</Button>
    </form>
  );
};

export default AuthPage;
