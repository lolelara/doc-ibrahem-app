import React, { useState, useEffect, FormEvent } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useLocalization } from '../App';
import { ProtectedRoute, Button, Input, Card, Spinner, Textarea } from '../components/CommonUI';
import * as DataService from '../services/dataService';
import { UserStats, SubscriptionPlan, SubscriptionStatus, SubscriptionPlanFeature } from '../types';
import { THEME_COLORS } from '../constants';

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

  useEffect(() => {
    refreshUser(); 
    if (location.state?.message) {
        navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, refreshUser]);
  
  useEffect(() => {
    if (currentUser?.activeSubscriptionPlanId && currentUser.subscriptionStatus === SubscriptionStatus.ACTIVE) {
        const plan = DataService.getSubscriptionPlans().find(p => p.id === currentUser.activeSubscriptionPlanId);
        setCurrentPlanDetails(plan || null);
    } else {
        setCurrentPlanDetails(null);
    }
  }, [currentUser]);


  if (!currentUser) return <Spinner />;

  return (
    <div className="space-y-8">
      {message && <div className={`p-4 mb-4 text-sm rounded-lg bg-opacity-20 ${message.includes('محظور') || message.includes('denied') ? `bg-red-500 text-red-300` : `bg-yellow-500 text-yellow-300`}`}>{message}</div>}
      <h1 className="text-3xl font-bold text-white">{t('dashboard')}</h1>
      
      <Card className="p-6">
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4">{t('myStats')}</h2>
        <StatsTracker />
      </Card>

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
      setCurrentUser(updatedUser); // This should trigger refresh in AuthContext
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
  // Password change functionality can be added here
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!currentUser) return <Spinner />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    const updatedUser = DataService.updateUser({ ...currentUser, name, email });
    if (updatedUser) {
      setCurrentUser(updatedUser);
      setMessage(t('profileUpdatedSuccess', 'تم تحديث الملف الشخصي بنجاح!'));
    } else {
      setMessage(t('errorOccurred'));
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">{t('profile')}</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label={t('name')} id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
          <Input label={t('email')} id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          {/* Add password change fields here if needed */}
          {message && <p className={`text-sm ${message.includes('نجاح') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
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
  const [isLoading, setIsLoading] = useState<string | null>(null); // plan.id is string
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
      if(updatedUser) setCurrentUser(updatedUser); // This triggers AuthContext update
      setSuccess(t('subscriptionRequestedSuccess', 'تم إرسال طلب اشتراكك بنجاح. ستتم مراجعته قريبًا.'));
    } catch (err: any) {
      setError(err.message || t('errorOccurred'));
    }
    setIsLoading(null);
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