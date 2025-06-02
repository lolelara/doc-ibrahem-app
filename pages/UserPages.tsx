
import React, { useState, useEffect, FormEvent } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useLocalization } from '../App';
import { ProtectedRoute, Button, Input, Card, Spinner, Textarea } from '../components/CommonUI';
import * as DataService from '../services/dataService';
import { UserStats, SubscriptionPlan, SubscriptionStatus, PdfDocument, SubscriptionPlanFeature, UserRole } from '../types';
import { THEME_COLORS, ADMIN_EMAIL, COUNTRIES_LIST } from '../constants';

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
  const [message, setMessage] = useState(location.state?.message);
  const [currentPlanDetails, setCurrentPlanDetails] = useState<SubscriptionPlan | null>(null);
  const [assignedPdfs, setAssignedPdfs] = useState<PdfDocument[]>([]);

  useEffect(() => {
    refreshUser(); 
    if (location.state?.message) {
        navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, refreshUser]);
  
  useEffect(() => {
    if (currentUser) {
        if (currentUser.activeSubscriptionPlanId && currentUser.subscriptionStatus === SubscriptionStatus.ACTIVE) {
            const plan = DataService.getSubscriptionPlans().find(p => p.id === currentUser.activeSubscriptionPlanId);
            setCurrentPlanDetails(plan || null);
        } else {
            setCurrentPlanDetails(null);
        }
        setAssignedPdfs(DataService.getPdfsForUser(currentUser.id));
    }
  }, [currentUser]);

  const handleDownloadPdf = (pdf: PdfDocument) => {
    const link = document.createElement('a');
    link.href = pdf.fileData; // Base64 data URL
    link.download = pdf.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentUser) return <Spinner />;

  return (
    <div className="space-y-8">
      {message && <div className={`p-4 mb-4 text-sm rounded-lg bg-opacity-20 ${message.includes('محظور') || message.includes('denied') ? `bg-red-500 text-red-300` : `bg-yellow-500 text-yellow-300`}`}>{message}</div>}
      <h1 className="text-3xl font-bold text-white">{t('dashboard')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-emerald-400 mb-4">{t('myStats')}</h2>
          <StatsTracker />
        </Card>

        <div className="space-y-8">
            <Card className="p-6">
                <h2 className="text-2xl font-semibold text-sky-400 mb-4">{t('currentPlan')}</h2>
                {currentUser.subscriptionStatus === SubscriptionStatus.ACTIVE && currentPlanDetails && currentUser.subscriptionExpiry ? (
                <div>
                    <p className="text-lg"><strong className="font-semibold">{currentPlanDetails.name}</strong></p>
                    <p className="text-gray-300">{currentPlanDetails.description}</p>
                    <ul className="list-disc list-inside mt-2 text-gray-300">
                        {currentPlanDetails.features.map(feature => <li key={feature.id}>{feature.text}</li>)}
                    </ul>
                    <p className="text-gray-300 mt-2">{t('expiresOn')}: {new Date(currentUser.subscriptionExpiry).toLocaleDateString('ar-EG')}</p>
                </div>
                ) : currentUser.subscriptionStatus === SubscriptionStatus.PENDING ? (
                <p className="text-yellow-400">{t('pendingApproval')} - {DataService.getSubscriptionRequests().find(r => r.userId === currentUser.id && r.status === SubscriptionStatus.PENDING)?.planNameSnapshot}</p>
                ) : (
                <div className="text-center">
                    <p className="text-gray-400 mb-4">{t('noActivePlan')}</p>
                    <Button onClick={() => navigate('/user/subscriptions')} variant="secondary">{t('browsePlans')}</Button>
                </div>
                )}
            </Card>
            
            <Card className="p-6">
                <h2 className="text-2xl font-semibold text-amber-400 mb-4">{t('myDocuments')}</h2>
                {assignedPdfs.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                    {assignedPdfs.map(pdf => (
                        <div key={pdf.id} className="p-3 bg-gray-700 rounded-md flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-white">{pdf.fileName}</h4>
                            <p className="text-xs text-gray-400">{pdf.description}</p>
                        </div>
                        <Button onClick={() => handleDownloadPdf(pdf)} size="sm" variant="ghost">
                            {t('downloadPdf')}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ms-2">
                            <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v9.546l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L5.22 11.886a.75.75 0 111.06-1.06l2.47 2.47V3.75A.75.75 0 0110 3zM3.75 14A1.75 1.75 0 012 15.75v.5A1.75 1.75 0 003.75 18h12.5A1.75 1.75 0 0018 16.25v-.5A1.75 1.75 0 0116.25 14h-3.563a.75.75 0 110-1.5h3.563A3.25 3.25 0 0020 15.75v.5A3.25 3.25 0 0116.25 19.5H3.75A3.25 3.25 0 010 16.25v-.5A3.25 3.25 0 003.75 12.5h3.563a.75.75 0 010 1.5H3.75z" clipRule="evenodd" />
                            </svg>
                        </Button>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-gray-400">{t('noPdfsAssigned')}</p>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
};

// Stats Tracker Component (within Dashboard)
const StatsTracker: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const { t } = useLocalization();
  const [stats, setStats] = useState<UserStats>(currentUser?.stats || {});
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    const updatedUser = await DataService.updateUserStats(currentUser.id, stats);
    if (updatedUser) {
      setCurrentUser(updatedUser); 
      setIsEditing(false);
    }
    setIsLoading(false);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-4">
      {isEditing ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label={t('weightKg')} name="weight" type="number" step="0.1" value={stats.weight || ''} onChange={handleChange} />
            <Input label={t('heightCm')} name="height" type="number" step="0.1" value={stats.height || ''} onChange={handleChange} />
            <Input label={t('bodyFatPercentage')} name="bodyFatPercentage" type="number" step="0.1" value={stats.bodyFatPercentage || ''} onChange={handleChange} />
          </div>
           <h3 className="text-lg font-semibold mt-4 mb-2">{t('progressNotes')}</h3>
          <div className="space-y-2">
            {(stats.progressNotes || []).map((note, index) => (
              <p key={index} className="text-sm text-gray-300 bg-gray-700 p-2 rounded">{note}</p>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder={t('addNotePlaceholder', 'اكتب ملاحظة جديدة عن تقدمك...')} className="flex-grow"/>
            <Button onClick={handleAddNote} variant="secondary" size="sm">{t('addNote')}</Button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSaveStats} isLoading={isLoading}>{t('saveChanges')}</Button>
            <Button onClick={() => { setIsEditing(false); setStats(currentUser?.stats || {}); }} variant="ghost">{t('cancel')}</Button>
          </div>
        </>
      ) : (
         <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-200">
            <p><strong>{t('weightKg')}:</strong> {stats.weight || 'N/A'}</p>
            <p><strong>{t('heightCm')}:</strong> {stats.height || 'N/A'}</p>
            <p><strong>{t('bodyFatPercentage')}:</strong> {stats.bodyFatPercentage ? `${stats.bodyFatPercentage}%` : 'N/A'}</p>
          </div>
          <h3 className="text-lg font-semibold mt-4 mb-2">{t('progressNotes')}</h3>
          {stats.progressNotes && stats.progressNotes.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-700 p-2 rounded">
              {stats.progressNotes.map((note, index) => (
                <p key={index} className="text-sm text-gray-300">{note}</p>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">{t('noNotesYet', 'لا توجد ملاحظات تقدم بعد.')}</p>}
          <Button onClick={() => setIsEditing(true)} className="mt-4">{t('editStats', 'تعديل الإحصائيات')}</Button>
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
        ...currentUser, 
        name, 
        email, 
        phoneNumber,
        country
    };
    // Pass undefined for currentAdminId as this is a self-update, not a role change by admin
    try {
        const updatedUser = DataService.updateUser(updatedUserDetails, undefined); 
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">{t('profile')}</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label={t('name')} id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
          <Input label={t('email')} id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                 disabled={currentUser.email === ADMIN_EMAIL} // Site Manager cannot change their email
          />
          <div>
            <label htmlFor="country-profile" className={`block text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('country')}</label>
            <select 
                id="country-profile" 
                name="country" 
                value={country} 
                onChange={e => setCountry(e.target.value)} 
                required
                className={`block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} sm:text-sm text-white`}
            >
                {COUNTRIES_LIST.map(c => (
                    <option key={c.code} value={c.code} disabled={c.code === ''}>{c.name}</option>
                ))}
            </select>
          </div>
          <Input label={t('phoneNumber')} id="phoneNumber" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
          {message && <p className="text-sm text-green-400">{message}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" isLoading={isLoading}>{t('saveChanges')}</Button>
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
  const [isLoading, setIsLoading] = useState<string | null>(null); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pageMessage, setPageMessage] = useState(location.state?.message);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    setPlans(DataService.getSubscriptionPlans());
    refreshUser();
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: {} }); 
    }
  }, [location.pathname, location.state, navigate, refreshUser]);

  const handleSubscribe = async (planId: string) => {
    if (!currentUser) return;
    setIsLoading(planId);
    setError('');
    setSuccess('');
    try {
      DataService.requestSubscription(currentUser.id, currentUser.email, planId);
      const updatedUser = DataService.getUserById(currentUser.id); 
      if(updatedUser) setCurrentUser(updatedUser); 
      setSuccess(t('subscriptionRequestedSuccess', 'تم إرسال طلب اشتراكك بنجاح. ستتم مراجعته قريبًا.'));
    } catch (err: any) {
      setError(err.message || t('errorOccurred'));
    }
    setIsLoading(null);
    setTimeout(() => {setError(''); setSuccess('');}, 4000);
  };


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white text-center">{t('subscriptions')}</h1>
      {pageMessage && <div className={`p-4 mb-4 text-sm rounded-lg bg-opacity-20 bg-red-500 text-red-300`}>{pageMessage}</div>}
      {error && <p className="text-sm text-red-400 text-center bg-red-900 p-3 rounded-md">{error}</p>}
      {success && <p className="text-sm text-green-400 text-center bg-green-900 p-3 rounded-md">{success}</p>}
      
      {plans.length === 0 && <p className="text-center text-gray-400">{t('noPlansAvailable', 'لا توجد خطط اشتراك متاحة حاليًا.')}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className="p-6 flex flex-col justify-between">
            <div>
              <h2 className={`text-2xl font-semibold text-${THEME_COLORS.primary} mb-2`}>{plan.name}</h2>
              <p className="text-3xl font-bold mb-1">{plan.price} <span className="text-sm text-gray-400">{plan.currency}</span></p>
              <p className="text-gray-300 mb-4 text-sm">{plan.description}</p>
              <ul className="space-y-1 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature.id} className="flex items-center text-gray-200 text-sm">
                    <svg className="w-4 h-4 text-emerald-400 me-2 rtl:ms-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    {feature.text}
                  </li>
                ))}
              </ul>
            </div>
            {currentUser?.subscriptionStatus === SubscriptionStatus.PENDING && currentUser?.activeSubscriptionPlanId === plan.id ? (
               <Button disabled className="w-full mt-auto">{t('pendingApproval')}</Button>
            ) : currentUser?.subscriptionStatus === SubscriptionStatus.ACTIVE && currentUser?.activeSubscriptionPlanId === plan.id ? (
               <Button disabled variant="secondary" className="w-full mt-auto">{t('subscribed')}</Button>
            ) : (
               <Button 
                onClick={() => handleSubscribe(plan.id)} 
                isLoading={isLoading === plan.id}
                disabled={!!currentUser?.subscriptionStatus && currentUser?.subscriptionStatus !== SubscriptionStatus.EXPIRED && currentUser?.subscriptionStatus !== SubscriptionStatus.CANCELLED && currentUser?.subscriptionStatus !== SubscriptionStatus.REJECTED}
                className="w-full mt-auto"
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