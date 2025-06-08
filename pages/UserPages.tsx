
import React, { useState, useEffect, FormEvent } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useLocalization } from '../App';
import { ProtectedRoute, Button, Input, Card, Spinner, Textarea, LoadingOverlay } from '../components/CommonUI';
import * as DataService from '../services/dataService';
import { UserStats, SubscriptionPlan, SubscriptionStatus, PdfDocument, UserRole, ExternalResourceLink, ExternalResourceCategory } from '../types';
import { THEME_COLORS, ADMIN_EMAIL, COUNTRIES_LIST, EXTERNAL_RESOURCE_CATEGORIES } from '../constants';

const UserPages: React.FC = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="subscriptions" element={<ProtectedRoute><SubscriptionPlansPage /></ProtectedRoute>} />
    </Routes>
  );
};

// Dashboard Page
const DashboardPage: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const location = useLocation();
  const [pageMessage, setPageMessage] = useState(location.state?.message); 
  const [currentPlanDetails, setCurrentPlanDetails] = useState<SubscriptionPlan | null>(null);
  const [assignedPdfs, setAssignedPdfs] = useState<PdfDocument[]>([]);
  const [assignedResourceLinks, setAssignedResourceLinks] = useState<ExternalResourceLink[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
      setLoadingDashboard(true);
      if (currentUser) {
        await refreshUser(); 
      }
      if (location.state?.message) {
        setPageMessage(location.state.message);
        navigate(location.pathname, { replace: true, state: {} });
      }
      setLoadingDashboard(false);
    };
    initDashboard();
  }, [location.state, navigate, refreshUser, currentUser]); 
  
  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        setLoadingDashboard(true);
        try {
          if (currentUser.activeSubscriptionPlanId && currentUser.subscriptionStatus === SubscriptionStatus.ACTIVE) {
            const plans = await DataService.getSubscriptionPlans();
            const plan = plans.find(p => p.id === currentUser.activeSubscriptionPlanId);
            setCurrentPlanDetails(plan || null);
          } else {
            setCurrentPlanDetails(null);
          }
          const pdfs = await DataService.getPdfsForUser(currentUser.id);
          setAssignedPdfs(pdfs);
          const resourceLinks = await DataService.getExternalResourceLinksForUser(currentUser.id);
          setAssignedResourceLinks(resourceLinks);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoadingDashboard(false);
        }
      } else {
        setLoadingDashboard(false);
      }
    };
    fetchData();
  }, [currentUser]); 


  const handleDownloadPdf = (pdf: PdfDocument) => {
    const link = document.createElement('a');
    link.href = pdf.fileData; 
    link.download = pdf.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getResourceCategoryName = (categoryId: ExternalResourceCategory) => {
    const category = EXTERNAL_RESOURCE_CATEGORIES.find(c => c.id === categoryId);
    return category ? t(category.name_key, categoryId) : categoryId;
  };

  if (loadingDashboard) return <LoadingOverlay message={t('loading')} />;
  if (!currentUser) return <Spinner />; 

  return (
    <div className="space-y-6 sm:space-y-8">
      {pageMessage && <div className={`p-3 sm:p-4 mb-4 text-xs sm:text-sm rounded-lg bg-opacity-20 ${pageMessage.includes('محظور') || pageMessage.includes('denied') ? `bg-red-500 text-red-300` : `bg-yellow-500 text-yellow-300`}`}>{pageMessage}</div>}
      <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('dashboard')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <Card className="p-4 sm:p-6 lg:col-span-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-emerald-400 mb-3 sm:mb-4">{t('myStats')}</h2>
          <StatsTracker />
        </Card>

        <div className="space-y-4 sm:space-y-6 md:space-y-8 lg:col-span-1">
            <Card className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-sky-400 mb-3 sm:mb-4">{t('currentPlan')}</h2>
                {currentUser.subscriptionStatus === SubscriptionStatus.ACTIVE && currentPlanDetails && currentUser.subscriptionExpiry ? (
                <div>
                    <p className="text-md sm:text-lg"><strong className="font-semibold">{currentPlanDetails.name}</strong></p>
                    <p className="text-slate-300 text-xs sm:text-sm">{currentPlanDetails.description}</p>
                    <ul className="list-disc list-inside mt-2 text-slate-300 text-xs sm:text-sm space-y-0.5">
                        {currentPlanDetails.features.map(feature => <li key={feature.id}>{feature.text}</li>)}
                    </ul>
                    <p className="text-slate-300 text-xs sm:text-sm mt-2">{t('expiresOn')}: {new Date(currentUser.subscriptionExpiry).toLocaleDateString('ar-EG')}</p>
                </div>
                ) : currentUser.subscriptionStatus === SubscriptionStatus.PENDING ? (
                  <p className="text-yellow-400 text-sm sm:text-base">{t('pendingApproval')} {currentUser.activeSubscriptionPlanId && `- ${currentPlanDetails?.name || t('planLoading')}`}</p>
                ) : (
                <div className="text-center">
                    <p className="text-slate-400 text-sm sm:text-base mb-3 sm:mb-4">{t('noActivePlan')}</p>
                    <Button onClick={() => navigate('/user/subscriptions')} variant="secondary" size="md">{t('browsePlans')}</Button>
                </div>
                )}
            </Card>
            
            <Card className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-amber-400 mb-3 sm:mb-4">{t('myDocuments')}</h2>
                {assignedPdfs.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3 max-h-52 sm:max-h-60 overflow-y-auto">
                    {assignedPdfs.map(pdf => (
                        <div key={pdf.id} className="p-2 sm:p-3 bg-slate-700 rounded-md flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 xs:gap-0">
                        <div>
                            <h4 className="font-semibold text-white text-sm sm:text-base break-all">{pdf.fileName}</h4>
                            <p className="text-xs text-slate-400">{pdf.description}</p>
                        </div>
                        <Button onClick={() => handleDownloadPdf(pdf)} size="sm" variant="ghost" className="!text-xs !px-2 !py-1 self-end xs:self-center">
                            {t('downloadPdf')}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4 ms-1 sm:ms-2">
                            <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v9.546l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L5.22 11.886a.75.75 0 111.06-1.06l2.47 2.47V3.75A.75.75 0 0110 3zM3.75 14A1.75 1.75 0 012 15.75v.5A1.75 1.75 0 003.75 18h12.5A1.75 1.75 0 0018 16.25v-.5A1.75 1.75 0 0116.25 14h-3.563a.75.75 0 110-1.5h3.563A3.25 3.25 0 0020 15.75v.5A3.25 3.25 0 0116.25 19.5H3.75A3.25 3.25 0 010 16.25v-.5A3.25 3.25 0 003.75 12.5h3.563a.75.75 0 010 1.5H3.75z" clipRule="evenodd" />
                            </svg>
                        </Button>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm sm:text-base">{t('noPdfsAssigned')}</p>
                )}
            </Card>

            <Card className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-rose-400 mb-3 sm:mb-4">{t('myLearningResources')}</h2>
                {assignedResourceLinks.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3 max-h-52 sm:max-h-60 overflow-y-auto">
                    {assignedResourceLinks.map(link => (
                        <div key={link.id} className="p-2 sm:p-3 bg-slate-700 rounded-md">
                            <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2">
                                <div>
                                    <h4 className="font-semibold text-white text-sm sm:text-base break-all">{link.title}</h4>
                                    <p className="text-xs text-slate-400 mb-1">{link.description}</p>
                                    <span className={`px-1.5 py-0.5 text-xs bg-${THEME_COLORS.accent} bg-opacity-20 text-${THEME_COLORS.accent} rounded-full`}>
                                        {getResourceCategoryName(link.category)}
                                    </span>
                                </div>
                                <Button 
                                    onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')} 
                                    size="sm" 
                                    variant="ghost" 
                                    className="!text-xs !px-2 !py-1 self-start xs:self-center mt-1 xs:mt-0 flex-shrink-0"
                                >
                                    {t('openLink')}
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4 ms-1 sm:ms-2">
                                      <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5h-5.5zm0 3a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5zm0 3a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5h-5.5z" clipRule="evenodd" />
                                      <path d="M11.5 4.5a1.5 1.5 0 00-1.5 1.5v.256a.75.75 0 001.5 0V6a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.006a.75.75 0 001.5-.001V6A2.25 2.25 0 0012.25 3.75h-.01A2.25 2.25 0 0010 6.006V10a2.25 2.25 0 002.25 2.25h.01A2.25 2.25 0 0014.5 10v-.256a.75.75 0 00-1.5 0V10a.75.75 0 01-.75.75h-.01A.75.75 0 0111.5 10V4.5z" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm sm:text-base">{t('noResourcesAssigned')}</p>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
};

// Stats Tracker Component
const StatsTracker: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const { t } = useLocalization();
  const [stats, setStats] = useState<UserStats>(currentUser?.stats || {});
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false); 
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setStats(currentUser?.stats || {});
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStats(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      setStats(prev => ({
        ...prev,
        progressNotes: [...(prev.progressNotes || []), `${new Date().toLocaleDateString('ar-EG')}: ${newNote.trim()}`]
      }));
      setNewNote('');
    }
  };
  
  const handleSaveStats = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const updatedUser = await DataService.updateUserStats(currentUser.id, stats);
      if (updatedUser) {
        setCurrentUser(updatedUser); 
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving stats:", error);
      // Optionally show an error message to the user
    }
    setIsSaving(false);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-3 sm:space-y-4">
      {isEditing ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Input label={t('weightKg')} name="weight" type="number" step="0.1" value={stats.weight || ''} onChange={handleChange} />
            <Input label={t('heightCm')} name="height" type="number" step="0.1" value={stats.height || ''} onChange={handleChange} />
            <Input label={t('bodyFatPercentage')} name="bodyFatPercentage" type="number" step="0.1" value={stats.bodyFatPercentage || ''} onChange={handleChange} />
          </div>
           <h3 className="text-md sm:text-lg font-semibold mt-3 sm:mt-4 mb-1 sm:mb-2">{t('progressNotes')}</h3>
          <div className="space-y-1.5 sm:space-y-2">
            {(stats.progressNotes || []).map((note, index) => (
              <p key={index} className="text-xs sm:text-sm text-slate-300 bg-slate-700 p-1.5 sm:p-2 rounded">{note}</p>
            ))}
          </div>
          <div className="flex gap-1 sm:gap-2 mt-1.5 sm:mt-2">
            <Input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder={t('addNotePlaceholder', 'اكتب ملاحظة جديدة عن تقدمك...')} className="flex-grow"/>
            <Button onClick={handleAddNote} variant="secondary" size="sm">{t('addNote')}</Button>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-4">
            <Button onClick={handleSaveStats} isLoading={isSaving} size="md">{t('saveChanges')}</Button>
            <Button onClick={() => { setIsEditing(false); setStats(currentUser?.stats || {}); }} variant="ghost" size="md">{t('cancel')}</Button>
          </div>
        </>
      ) : (
         <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-slate-200 text-sm sm:text-base">
            <p><strong>{t('weightKg')}:</strong> {stats.weight || 'N/A'}</p>
            <p><strong>{t('heightCm')}:</strong> {stats.height || 'N/A'}</p>
            <p><strong>{t('bodyFatPercentage')}:</strong> {stats.bodyFatPercentage ? `${stats.bodyFatPercentage}%` : 'N/A'}</p>
          </div>
          <h3 className="text-md sm:text-lg font-semibold mt-3 sm:mt-4 mb-1 sm:mb-2">{t('progressNotes')}</h3>
          {stats.progressNotes && stats.progressNotes.length > 0 ? (
            <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto bg-slate-700 p-1.5 sm:p-2 rounded">
              {stats.progressNotes.map((note, index) => (
                <p key={index} className="text-xs sm:text-sm text-slate-300">{note}</p>
              ))}
            </div>
          ) : <p className="text-xs sm:text-sm text-slate-400">{t('noNotesYet', 'لا توجد ملاحظات تقدم بعد.')}</p>}
          <Button onClick={() => setIsEditing(true)} className="mt-3 sm:mt-4" size="md">{t('editStats', 'تعديل الإحصائيات')}</Button>
        </>
      )}
    </div>
  );
};


// Profile Page
const ProfilePage: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const { t } = useLocalization();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [country, setCountry] = useState(currentUser?.country || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { 
    if (currentUser) {
        setName(currentUser.name || '');
        setEmail(currentUser.email || '');
        setPhoneNumber(currentUser.phoneNumber || '');
        setCountry(currentUser.country || '');
    }
  }, [currentUser]);

  if (!currentUser) return <Spinner />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

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
    
    const updatedUserDetails = { 
        id: currentUser.id, 
        name, 
        email, 
        phoneNumber,
        country
    };
    try {
        const updatedUser = await DataService.updateUser(updatedUserDetails); 
        if (updatedUser) {
          setCurrentUser(updatedUser); 
          setMessage(t('profileUpdatedSuccess', 'تم تحديث الملف الشخصي بنجاح!'));
        } else {
          setError(t('errorOccurred'));
        }
    } catch (err: any) {
        setError(err.message || t('errorOccurred'));
    }
    setIsLoading(false);
     setTimeout(() => {setMessage(''); setError('');}, 3000);
  };

  return (
    <div className="max-w-lg sm:max-w-xl md:max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">{t('profile')}</h1>
      <Card className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <Input label={t('name')} id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
          <Input label={t('email')} id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                 disabled={currentUser.email === ADMIN_EMAIL} 
          />
          <div>
            <label htmlFor="country-profile" className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('country')}</label>
            <select 
                id="country-profile" 
                name="country" 
                value={country} 
                onChange={e => setCountry(e.target.value)} 
                required
                className={`block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} text-xs sm:text-sm text-${THEME_COLORS.textPrimary}`}
            >
                {COUNTRIES_LIST.map(c => (
                    <option key={c.code} value={c.code} disabled={c.code === ''}>{c.name}</option>
                ))}
            </select>
          </div>
          <Input label={t('phoneNumber')} id="phoneNumber" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
          {message && <p className="text-xs sm:text-sm text-green-400">{message}</p>}
          {error && <p className="text-xs sm:text-sm text-red-400">{error}</p>}
          <Button type="submit" isLoading={isLoading} size="md">{t('saveChanges')}</Button>
        </form>
      </Card>
    </div>
  );
};

// Subscription Plans Page
const SubscriptionPlansPage: React.FC = () => {
  const { currentUser, refreshUser, setCurrentUser } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoadingPlan, setIsLoadingPlan] = useState<string | null>(null); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pageMessage, setPageMessage] = useState(location.state?.message);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    const fetchPlansAndUser = async () => {
      setLoadingPage(true);
      try {
        const fetchedPlans = await DataService.getSubscriptionPlans();
        setPlans(fetchedPlans);
        if (currentUser) { 
          await refreshUser();
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError(t('errorOccurred'));
      }
      if (location.state?.message) {
        setPageMessage(location.state.message);
        navigate(location.pathname, { replace: true, state: {} }); 
      }
      setLoadingPage(false);
    };
    fetchPlansAndUser();
  }, [location.pathname, location.state, navigate, refreshUser, currentUser]); 

  const handleSubscribe = async (planId: string) => {
    if (!currentUser) return;
    setIsLoadingPlan(planId);
    setError('');
    setSuccess('');
    try {
      await DataService.requestSubscription(currentUser.id, currentUser.email, planId);
      const updatedUser = await DataService.getUserById(currentUser.id); 
      if(updatedUser) setCurrentUser(updatedUser); 
      setSuccess(t('subscriptionRequestedSuccess', 'تم إرسال طلب اشتراكك بنجاح. ستتم مراجعته قريبًا.'));
    } catch (err: any) {
      setError(err.message || t('errorOccurred'));
    }
    setIsLoadingPlan(null);
    setTimeout(() => {setError(''); setSuccess('');}, 4000);
  };

  if (loadingPage) return <LoadingOverlay message={t('loading')} />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center">{t('subscriptions')}</h1>
      {pageMessage && <div className={`p-3 sm:p-4 mb-4 text-xs sm:text-sm rounded-lg bg-opacity-20 bg-red-500 text-red-300`}>{pageMessage}</div>}
      {error && <p className="text-xs sm:text-sm text-red-400 text-center bg-red-900 bg-opacity-30 p-2 sm:p-3 rounded-md">{error}</p>}
      {success && <p className="text-xs sm:text-sm text-green-400 text-center bg-green-900 bg-opacity-30 p-2 sm:p-3 rounded-md">{success}</p>}
      
      {plans.length === 0 && !loadingPage && <p className="text-center text-slate-400 py-6 sm:py-8">{t('noPlansAvailable', 'لا توجد خطط اشتراك متاحة حاليًا.')}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className="p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <h2 className={`text-xl sm:text-2xl font-semibold text-${THEME_COLORS.primary} mb-1 sm:mb-2`}>{plan.name}</h2>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">{plan.price} <span className="text-xs sm:text-sm text-slate-400">{plan.currency}</span></p>
              <p className="text-slate-300 mb-3 sm:mb-4 text-xs sm:text-sm">{plan.description}</p>
              <ul className="space-y-1 mb-4 sm:mb-6">
                {plan.features.map((feature) => (
                  <li key={feature.id} className="flex items-center text-slate-200 text-xs sm:text-sm">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 me-1.5 sm:me-2 rtl:ms-1.5 sm:rtl:ms-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    {feature.text}
                  </li>
                ))}
              </ul>
            </div>
            {currentUser?.subscriptionStatus === SubscriptionStatus.PENDING && currentUser?.activeSubscriptionPlanId === plan.id ? (
               <Button disabled className="w-full mt-auto text-sm sm:text-base">{t('pendingApproval')}</Button>
            ) : currentUser?.subscriptionStatus === SubscriptionStatus.ACTIVE && currentUser?.activeSubscriptionPlanId === plan.id ? (
               <Button disabled variant="secondary" className="w-full mt-auto text-sm sm:text-base">{t('subscribed')}</Button>
            ) : (
               <Button 
                onClick={() => handleSubscribe(plan.id)} 
                isLoading={isLoadingPlan === plan.id}
                disabled={!!currentUser?.subscriptionStatus && currentUser?.subscriptionStatus !== SubscriptionStatus.EXPIRED && currentUser?.subscriptionStatus !== SubscriptionStatus.CANCELLED && currentUser?.subscriptionStatus !== SubscriptionStatus.REJECTED}
                className="w-full mt-auto text-sm sm:text-base"
                size="md"
               >
                {t('subscribe')}
               </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserPages;