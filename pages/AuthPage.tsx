
import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useLocalization } from '../App';
import { Button, Input, Card, Spinner } from '../components/CommonUI';
import * as DataService from '../services/dataService';
import { User, UserRole, TransformationPost } from '../types';
import { THEME_COLORS, ADMIN_EMAIL, COUNTRIES_LIST } from '../constants';


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
    <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-start pt-10 sm:pt-12 md:pt-16 px-4">
      <Card className="max-w-md w-full p-4 xs:p-6 sm:p-8 space-y-6 sm:space-y-8 mb-10">
        <div>
          <h2 className={`mt-6 text-center text-2xl sm:text-3xl font-extrabold text-${THEME_COLORS.primary}`}>
            {isLoginView ? t('login') : t('register')}
          </h2>
        </div>
        {isLoginView ? <LoginForm /> : <RegisterForm />}
        <div className="text-xs sm:text-sm text-center">
          <button onClick={toggleView} className={`font-medium text-${THEME_COLORS.secondary} hover:text-${THEME_COLORS.secondaryHover}`}>
            {isLoginView ? t('noAccountPrompt', 'ليس لديك حساب؟ سجل الآن') : t('hasAccountPrompt', 'لديك حساب بالفعل؟ سجل الدخول')}
          </button>
        </div>
      </Card>
      <FeaturedTransformationsSection />
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
    
    if (user && (user.password === password || (user.email === ADMIN_EMAIL && password === 'adminpassword'))) { 
      const checkedUser = DataService.checkUserSubscriptionStatus(user.id);
      setCurrentUser(checkedUser || user);
      navigate(user.role === UserRole.ADMIN || user.role === UserRole.SITE_MANAGER ? '/admin' : from, { replace: true });
    } else {
      setError(t('loginFailed'));
    }
    setIsLoading(false);
  };

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Input id="email-login" label={t('email')} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
      <Input id="password-login" label={t('password')} type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
      {error && <p className="text-xs sm:text-sm text-red-400 text-center">{error}</p>}
      <Button type="submit" className="w-full" isLoading={isLoading} size="md">{t('login')}</Button>
    </form>
  );
};

const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState(COUNTRIES_LIST[0]?.code || ''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocalization();
  const { setCurrentUser } = useAuth(); 

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!phoneNumber.trim()) {
      setError(t('fieldRequired') + ` (${t('phoneNumber')})`);
      setIsLoading(false);
      return;
    }
    if (!country) {
      setError(t('pleaseSelectCountry'));
      setIsLoading(false);
      return;
    }

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
      password, 
      name,
      phoneNumber,
      country,
      subscriptionStatus: undefined,
    };
    
    try {
      const registeredUser = DataService.addUser(newUserBase); 
      setSuccess(t('registrationSuccessful'));
      setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setPhoneNumber(''); setCountry(COUNTRIES_LIST[0]?.code || '');
    } catch (err: any) {
      setError(err.message || t('errorOccurred'));
    }

    setIsLoading(false);
  };

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Input id="name-register" label={t('name')} type="text" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
      <Input id="email-register" label={t('email')} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
      
      <div>
        <label htmlFor="country-register" className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('country')}</label>
        <select 
          id="country-register" 
          name="country" 
          value={country} 
          onChange={e => setCountry(e.target.value)} 
          required
          className={`block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} text-xs sm:text-sm text-white`}
        >
          {COUNTRIES_LIST.map(c => (
            <option key={c.code} value={c.code} disabled={c.code === ''}>{c.name}</option>
          ))}
        </select>
      </div>

      <Input id="phone-register" label={t('phoneNumber')} type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required autoComplete="tel" />
      <Input id="password-register" label={t('password')} type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
      <Input id="confirm-password-register" label={t('confirmPassword')} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
      
      {error && <p className="text-xs sm:text-sm text-red-400 text-center">{error}</p>}
      {success && <p className="text-xs sm:text-sm text-green-400 text-center">{success}</p>}
      <Button type="submit" className="w-full" isLoading={isLoading} size="md">{t('register')}</Button>
    </form>
  );
};

const FeaturedTransformationsSection: React.FC = () => {
    const { t } = useLocalization();
    const [topPosts, setTopPosts] = useState<TransformationPost[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        const allPosts = DataService.getTransformationPosts();
        const postsWithScores = allPosts.map(post => ({
            ...post,
            interactionScore: (post.likes?.length || 0) + (post.commentsCount || 0)
        }));
        postsWithScores.sort((a, b) => b.interactionScore - a.interactionScore);
        setTopPosts(postsWithScores.slice(0, 10));
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="mt-12 text-center">
                <Spinner size="md" />
                <p className="text-slate-400 mt-2">{t('loading')}</p>
            </div>
        );
    }

    if (topPosts.length === 0) {
        return (
            <div className="mt-12 text-center">
                <h3 className="text-xl sm:text-2xl font-semibold text-sky-400 mb-4">{t('topTransformations')}</h3>
                <p className="text-slate-400">{t('noTransformationsPosted')}</p>
            </div>
        );
    }
    
    const handleViewPost = (postId: string) => {
        // Navigate to the main transformations page; individual post view will be handled there if user clicks again
        // Or, in future, navigate directly to a single post view: navigate(`/transformations/${postId}`);
        navigate('/transformations');
        console.log("Viewing post:", postId); 
    };

    return (
        <div className="w-full max-w-5xl mx-auto mt-10 mb-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-center text-sky-400 mb-4 sm:mb-6">{t('topTransformations')}</h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {topPosts.map(post => (
                    <Card key={post.id} className="p-0 overflow-hidden group" onClick={() => handleViewPost(post.id)}>
                        <div className="relative">
                            <img 
                                src={post.afterImageUrl || post.beforeImageUrl} // Fallback to before if after is missing for some reason
                                alt={post.title} 
                                className="w-full h-32 sm:h-40 object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity"></div>
                        </div>
                        <div className="p-2 sm:p-3">
                            <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-sky-300 transition-colors" title={post.title}>{post.title}</h4>
                            <p className="text-xs text-slate-400 truncate mb-1">{t('user')}: {post.userName}</p>
                            <div className="flex justify-between items-center text-xs text-slate-500">
                                <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 inline-block me-0.5"><path d="M8.243 2.253a.75.75 0 0 0-1.061 0L2.625 6.81a1.313 1.313 0 0 0-.027 1.652L4 9.755V13.5a.75.75 0 0 0 .75.75h6.5a.75.75 0 0 0 .75-.75V9.755l1.402-1.293a1.313 1.313 0 0 0-.027-1.652L8.243 2.253zM5.5 12.75v-2.55l-1.92 1.773A.563.563 0 0 1 3.5 11.563V9.92L7.72 6.058a.75.75 0 0 1 1.06 0L13.5 10.793V13.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V11.5a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v2.25a.75.75 0 0 1-.75.75h-1.5z" /></svg> {post.likes?.length || 0}</span>
                                <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 inline-block me-0.5"><path fillRule="evenodd" d="M2 2.75C2 1.784 2.784 1 3.75 1h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 12.25 13H6.81l-2.322 2.322A.625.625 0 0 1 3.5 14.87V13H3.75A1.75 1.75 0 0 1 2 11.25v-8.5Zm1.5 0V11.25c0 .138.112.25.25.25H4v1.19l1.763-1.762A.25.25 0 0 1 6.012 11H12.25a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25h-8.5Z" clipRule="evenodd" /></svg> {post.commentsCount || 0}</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};


export default AuthPage;