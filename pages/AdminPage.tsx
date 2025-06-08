
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Routes, Route, Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth, useLocalization } from '../App';
import { Button, Input, Card, Spinner, Modal, Textarea, LoadingOverlay } from '../components/CommonUI';
import * as DataService from '../services/dataService';
import { User, WorkoutVideo, Recipe, SubscriptionRequest, SubscriptionStatus, UserRole, SubscriptionPlan, PdfDocument, SubscriptionPlanFeature, TransformationPost, TransformationComment, ExternalResourceLink, ExternalResourceCategory } from '../types';
import { THEME_COLORS, ADMIN_EMAIL, PDF_MAX_SIZE_BYTES, COUNTRIES_LIST, EXTERNAL_RESOURCE_CATEGORIES, TRANSFORMATION_IMAGE_MAX_SIZE_BYTES } from '../constants';

enum AdminSection {
  Users = "users",
  Videos = "videos",
  Recipes = "recipes",
  Pdfs = "pdfs", 
  ResourceLinks = "resource_links",
  Subscriptions = "subscriptions",
  SubscriptionPlans = "subscription_plans",
  GlobalNotifications = "global_notifications",
  Transformations = "transformations",
}

const AdminPage: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser, isSiteManager } = useAuth(); 
  const [activeSection, setActiveSection] = useState<AdminSection>(AdminSection.Subscriptions);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SITE_MANAGER)) {
    return <p>{t('adminAccessOnly')}</p>; 
  }

  const NavItem: React.FC<{ section: AdminSection; label: string; icon?: JSX.Element; onClick?: () => void }> = ({ section, label, icon, onClick }) => (
    <button
      onClick={() => {
        setActiveSection(section);
        if (onClick) onClick();
        setIsSidebarOpen(false); // Close sidebar on item click for mobile
      }}
      className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 w-full text-right rtl:text-left
        ${activeSection === section ? `bg-${THEME_COLORS.primary} text-white shadow-lg` : `text-${THEME_COLORS.textSecondary} hover:bg-slate-700 hover:text-${THEME_COLORS.textPrimary}`}`}
    >
      {icon}
      {label}
    </button>
  );
  
  const NavIcons = {
    subscriptions: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h13.5A2.25 2.25 0 0019 13.75v-7.5A2.25 2.25 0 0016.75 4H3.25zM10 6.5a.75.75 0 01.75.75v2a.75.75 0 01-1.5 0v-2A.75.75 0 0110 6.5zM10 12a1 1 0 100-2 1 1 0 000 2z" /><path d="M5.992 8.332a.75.75 0 011.06-.008L9.25 10.511l2.205-2.195a.75.75 0 011.052 1.07l-2.75 2.727a.75.75 0 01-1.062 0L5.984 9.394a.75.75 0 01.008-1.062z" /></svg>,
    plans: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M10 3.75a2.25 2.25 0 00-2.25 2.25v9.75a.75.75 0 001.5 0V6A.75.75 0 0110 5.25h1.5a.75.75 0 01.75.75v3.75a.75.75 0 001.5 0V6A2.25 2.25 0 0010.75 3.75H10z" /><path d="M15.25 4.313A2.25 2.25 0 0117.5 6.563v3.187a.75.75 0 01-1.5 0V6.563a.75.75 0 00-.75-.75h-.75a.75.75 0 010-1.5h.75zM3.5 8.75A.75.75 0 014.25 8H5a.75.75 0 000-1.5H4.25A2.25 2.25 0 002 8.75v6.5A2.25 2.25 0 004.25 17.5h11.5A2.25 2.25 0 0018 15.25V12a.75.75 0 011.5 0v3.25A3.75 3.75 0 0115.75 19H4.25A3.75 3.75 0 01.5 15.25v-6.5A3.75 3.75 0 014.25 5H5a2.25 2.25 0 012.25 2.25v1.5A.75.75 0 016.5 9.5h-3a.75.75 0 01-.75-.75z" /></svg>,
    users: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.25 1.25 0 002.411-1.336C5.103 11.85 6.897 10.5 9.25 10.5h1.5c2.353 0 4.147 1.35 4.374 2.657a1.25 1.25 0 002.411 1.336A7.001 7.001 0 0010.75 12h-1.5a7.001 7.001 0 00-5.785 2.493z" /></svg>,
    pdfs: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm5.75 2.75a.75.75 0 01.75.75v2a.75.75 0 01-1.5 0V5.5a.75.75 0 01.75-.75zm-3.5.75a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM9 10.5a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5H9.75A.75.75 0 019 10.5zm5.25 2.25a.75.75 0 00-1.5 0v.25a.75.75 0 001.5 0v-.25zM7.5 12.75a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5H8.25A.75.75 0 017.5 12.75z" clipRule="evenodd" /></svg>,
    resourceLinks: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.665l3-3z" /><path d="M8.603 14.53a2.5 2.5 0 01-3.535-3.535l1.225-1.225a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 005.656 5.656l3-3a4 4 0 00-.225-5.865.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.665l-3 3z" /></svg>,
    videos: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M3.5 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0v-.75A2.25 2.25 0 015.75 16h8.5A2.25 2.25 0 0116.5 13.75V6.25A2.25 2.25 0 0114.25 4h-8.5A2.25 2.25 0 013.5 6.25V2.75zM6.5 5A.5.5 0 017 4.5h6a.5.5 0 01.5.5v10a.5.5 0 01-.5.5H7a.5.5 0 01-.5-.5V5z" /><path d="M9.027 7.532a.5.5 0 01.746-.43l3.002 1.716a.5.5 0 010 .859l-3.002 1.716a.5.5 0 01-.746-.43V7.532z" /></svg>,
    recipes: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M10 1a2.5 2.5 0 00-2.5 2.5V8a.5.5 0 00.5.5h4a.5.5 0 00.5-.5V3.5A2.5 2.5 0 0010 1zM8.5 3.5a1 1 0 011-1h1a1 1 0 011 1V4h-3V3.5z" /><path d="M10.22 8.906a1.502 1.502 0 00-.44 0C9.346 8.906 9 9.252 9 9.69V14.5a.5.5 0 00.5.5h1a.5.5 0 00.5-.5V9.69c0-.438-.346-.784-.78-.784z" /><path fillRule="evenodd" d="M15.5 10.25a.75.75 0 00-.75-.75H5.25a.75.75 0 000 1.5h3.12V14.5A1.5 1.5 0 009.87 16h.26a1.5 1.5 0 001.495-1.5V11h3.125a.75.75 0 00.75-.75zM10 11.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>,
    notifications: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>,
    transformations: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path fillRule="evenodd" d="M1.5 3A1.5 1.5 0 013 1.5h14A1.5 1.5 0 0118.5 3V17a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 17V3zm1.75 11.5a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5a.75.75 0 01-.75-.75zm.75-3.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zM5.25 6A.75.75 0 016 5.25h3A.75.75 0 019.75 6v.75H6A.75.75 0 015.25 6zM10.5 6V5.25A.75.75 0 0111.25 4.5h3A.75.75 0 0115 5.25V6h-.75A.75.75 0 0113.5 6.75v3A.75.75 0 0112.75 10.5H11.25A.75.75 0 0110.5 9.75v-3z" clipRule="evenodd" /></svg>,
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 sm:gap-6 lg:gap-8 min-h-[calc(100vh-12rem)]">
      <div className={`md:hidden p-2 sticky top-16 bg-${THEME_COLORS.surface} z-30 shadow-md`}>
        <Button onClick={() => setIsSidebarOpen(!isSidebarOpen)} variant="ghost" className="w-full">
          {isSidebarOpen ? t('hideMenu', 'إخفاء القائمة') : t('adminNavigation', 'لوحة التحكم')}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ms-2">
            <path strokeLinecap="round" strokeLinejoin="round" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
          </svg>
        </Button>
      </div>

      <aside className={`
        ${isSidebarOpen ? 'block' : 'hidden'} md:block 
        w-full md:w-60 lg:w-64 xl:w-72 
        bg-${THEME_COLORS.surface} p-3 sm:p-5 rounded-xl shadow-2xl space-y-2 sm:space-y-3 
        md:self-start md:sticky md:top-24 transition-all duration-300 ease-in-out mb-4 md:mb-0
      `}>
        <h2 className={`text-lg sm:text-xl font-bold text-${THEME_COLORS.textPrimary} mb-3 sm:mb-4 border-b border-slate-700 pb-2 sm:pb-3`}>{t('adminNavigation', 'لوحة التحكم')}</h2>
        <NavItem section={AdminSection.Subscriptions} label={t('approveSubscriptions')} icon={NavIcons.subscriptions} />
        <NavItem section={AdminSection.SubscriptionPlans} label={t('manageSubscriptionPlans')} icon={NavIcons.plans} />
        {isSiteManager && ( 
            <NavItem section={AdminSection.Users} label={t('manageUsers')} icon={NavIcons.users} />
        )}
        <NavItem section={AdminSection.Pdfs} label={t('managePdfs')} icon={NavIcons.pdfs} />
        <NavItem section={AdminSection.ResourceLinks} label={t('manageResourceLinks')} icon={NavIcons.resourceLinks} />
        <NavItem section={AdminSection.Videos} label={t('manageVideos')} icon={NavIcons.videos} />
        <NavItem section={AdminSection.Recipes} label={t('manageRecipes')} icon={NavIcons.recipes} />
        <NavItem section={AdminSection.Transformations} label={t('manageTransformations')} icon={NavIcons.transformations} />
        {isSiteManager && (
            <NavItem section={AdminSection.GlobalNotifications} label={t('globalNotifications')} icon={NavIcons.notifications} />
        )}
      </aside>

      <main className="flex-grow">
        <Card className="p-4 sm:p-6 md:p-8 min-h-full shadow-2xl">
            {activeSection === AdminSection.Users && isSiteManager && <ManageUsersSection />}
            {activeSection === AdminSection.Videos && <ManageVideosSection />}
            {activeSection === AdminSection.Recipes && <ManageRecipesSection />}
            {activeSection === AdminSection.Pdfs && <ManagePdfsSection />}
            {activeSection === AdminSection.ResourceLinks && <ManageResourceLinksSection />}
            {activeSection === AdminSection.Subscriptions && <ApproveSubscriptionsSection />}
            {activeSection === AdminSection.SubscriptionPlans && <ManageSubscriptionPlansSection />}
            {activeSection === AdminSection.GlobalNotifications && isSiteManager && <SendGlobalNotificationSection />}
            {activeSection === AdminSection.Transformations && <ManageTransformationsSection />}
        </Card>
      </main>
    </div>
  );
};
export default AdminPage; // Add default export

const ManageUsersSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser, isSiteManager } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userForRoleChange, setUserForRoleChange] = useState<User | null>(null);
  const [isRoleConfirmModalOpen, setIsRoleConfirmModalOpen] = useState(false);
  const [roleConfirmAction, setRoleConfirmAction] = useState<'promote' | 'demote' | null>(null);
  
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);

  const [feedback, setFeedback] = useState({type: '', message: ''});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await DataService.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      showFeedback('error', 'errorOccurred');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);
  
  const showFeedback = (type: 'success' | 'error', messageKey: string, interpolateParams?: Record<string, string>) => {
    let message = t(messageKey);
    if (interpolateParams) {
        Object.keys(interpolateParams).forEach(key => {
            message = message.replace(`{${key}}`, interpolateParams[key]);
        });
    }
    setFeedback({type, message});
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const handleRoleChange = async () => {
    if (!currentUser || !isSiteManager || !userForRoleChange || !roleConfirmAction) return;

    if (userForRoleChange.email === ADMIN_EMAIL && roleConfirmAction === 'demote') {
      showFeedback('error', 'cannotDemoteSelf');
      closeRoleConfirmModal();
      return;
    }
    const newRole = roleConfirmAction === 'promote' ? UserRole.ADMIN : UserRole.USER;
    try {
      await DataService.updateUser({ ...userForRoleChange, role: newRole }, currentUser.id);
      await fetchUsers();
      showFeedback('success', 'roleUpdatedSuccess');
    } catch (error: any) {
      showFeedback('error', error.message || 'errorOccurred');
    }
    closeRoleConfirmModal();
  };

  const openRoleConfirmModal = (user: User, action: 'promote' | 'demote') => {
    if (user.email === ADMIN_EMAIL && action === 'demote') {
      showFeedback('error', 'cannotDemoteSelf');
      return;
    }
    if ((action === 'promote' && user.role === UserRole.ADMIN) || 
        (user.role === UserRole.SITE_MANAGER && action === 'demote')) {
      showFeedback('error', 'actionNotAllowed');
      return;
    }
    setUserForRoleChange(user);
    setRoleConfirmAction(action);
    setIsRoleConfirmModalOpen(true);
  };
  const closeRoleConfirmModal = () => {
    setIsRoleConfirmModalOpen(false);
    setUserForRoleChange(null);
    setRoleConfirmAction(null);
  };

  const openEditUserModal = (user: User) => {
    if (user.id === currentUser?.id) {
        showFeedback('error', 'cannotEditSelfDetailsInThisModal');
        return;
    }
    setUserToEdit(user);
    setIsEditUserModalOpen(true);
  };
  const closeEditUserModal = () => {
    setIsEditUserModalOpen(false);
    setUserToEdit(null);
  };
  const handleSaveUserInfo = async (updatedUserData: Partial<User>) => {
    if (!currentUser || !isSiteManager || !userToEdit) return;
    try {
        await DataService.updateUser({ ...userToEdit, ...updatedUserData, id: userToEdit.id }, currentUser.id);
        await fetchUsers();
        showFeedback('success', 'userInfoUpdatedSuccess');
        closeEditUserModal();
    } catch (error: any) {
        showFeedback('error', error.message || 'errorOccurred');
    }
  };

  const openDeleteUserModal = (user: User) => {
    if (user.id === currentUser?.id) {
        showFeedback('error', 'cannotDeleteSelfAccount');
        return;
    }
    setUserToDelete(user);
    setIsDeleteUserModalOpen(true);
  };
  const closeDeleteUserModal = () => {
    setIsDeleteUserModalOpen(false);
    setUserToDelete(null);
  };
  const handleConfirmDeleteUser = async () => {
    if (!currentUser || !isSiteManager || !userToDelete) return;
    try {
      await DataService.deleteUser(userToDelete.id, currentUser.id);
      await fetchUsers();
      showFeedback('success', 'userDeletedSuccess');
    } catch (error: any) {
      showFeedback('error', error.message || 'errorOccurred');
    }
    closeDeleteUserModal();
  };

  const getRoleText = (role: UserRole) => {
    if (role === UserRole.SITE_MANAGER) return t('siteManager');
    if (role === UserRole.ADMIN) return t('adminPanel');
    return t('user');
  }
  
  const getCountryName = (countryCode?: string) => {
    if (!countryCode) return 'N/A';
    const country = COUNTRIES_LIST.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  if (loading) return <LoadingOverlay message={t('loading')} />;
  if (!isSiteManager) return <p>{t('adminAccessOnly')}</p>;

  return (
    <div>
      <h2 className={`text-xl sm:text-2xl font-semibold text-${THEME_COLORS.textPrimary} mb-4 sm:mb-6`}>{t('manageUsers')}</h2>
      {feedback.message && <p className={`mb-4 p-3 rounded text-sm ${feedback.type === 'success' ? `bg-${THEME_COLORS.success} bg-opacity-20 text-green-300` : `bg-${THEME_COLORS.error} bg-opacity-20 text-red-300`}`}>{feedback.message}</p>}
      <div className="overflow-x-auto shadow-md rounded-lg border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className={`bg-${THEME_COLORS.surface} bg-opacity-50`}>
            <tr>
              <th scope="col" className={`px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-${THEME_COLORS.textSecondary} uppercase tracking-wider`}>{t('name')}</th>
              <th scope="col" className={`px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-${THEME_COLORS.textSecondary} uppercase tracking-wider`}>{t('email')}</th>
              <th scope="col" className={`px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-${THEME_COLORS.textSecondary} uppercase tracking-wider hidden sm:table-cell`}>{t('phoneNumber')}</th>
              <th scope="col" className={`px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-${THEME_COLORS.textSecondary} uppercase tracking-wider hidden md:table-cell`}>{t('country')}</th>
              <th scope="col" className={`px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-${THEME_COLORS.textSecondary} uppercase tracking-wider`}>{t('role', 'الدور')}</th>
              <th scope="col" className={`px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-${THEME_COLORS.textSecondary} uppercase tracking-wider hidden sm:table-cell`}>{t('subscriptionStatus', 'حالة الاشتراك')}</th>
              <th scope="col" className={`px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-${THEME_COLORS.textSecondary} uppercase tracking-wider`}>{t('actions')}</th>
            </tr>
          </thead>
          <tbody className={`bg-${THEME_COLORS.surface} divide-y divide-slate-700`}>
            {users.map(user => {
              const isTargetSiteManager = user.email === ADMIN_EMAIL && user.role === UserRole.SITE_MANAGER;
              const isSelf = user.id === currentUser?.id;
              return (
                <tr key={user.id} className="hover:bg-slate-800 transition-colors"> {/* Changed hover bg */}
                  <td className={`px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 whitespace-nowrap text-${THEME_COLORS.textPrimary}`}>{user.name}</td>
                  <td className={`px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 whitespace-nowrap text-${THEME_COLORS.textSecondary}`}>{user.email}</td>
                  <td className={`px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 whitespace-nowrap text-${THEME_COLORS.textSecondary} hidden sm:table-cell`}>{user.phoneNumber || 'N/A'}</td>
                  <td className={`px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 whitespace-nowrap text-${THEME_COLORS.textSecondary} hidden md:table-cell`}>{getCountryName(user.country)}</td>
                  <td className={`px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 whitespace-nowrap text-${THEME_COLORS.textSecondary}`}>{getRoleText(user.role)}</td>
                  <td className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 whitespace-nowrap hidden sm:table-cell">
                    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.subscriptionStatus === SubscriptionStatus.ACTIVE ? `bg-green-500 bg-opacity-20 text-green-300` :
                        user.subscriptionStatus === SubscriptionStatus.PENDING ? `bg-yellow-500 bg-opacity-20 text-yellow-300` :
                        user.subscriptionStatus === SubscriptionStatus.EXPIRED ? `bg-red-500 bg-opacity-20 text-red-300` :
                        user.subscriptionStatus === SubscriptionStatus.REJECTED ? `bg-red-600 bg-opacity-20 text-red-200` :
                        user.subscriptionStatus === SubscriptionStatus.CANCELLED ? `bg-slate-500 bg-opacity-20 text-slate-300` :
                        `bg-slate-600 bg-opacity-20 text-slate-300`}`}>
                      {user.subscriptionStatus ? t(user.subscriptionStatus.toLowerCase(), user.subscriptionStatus) : t('notSubscribedYet', 'لم يشترك بعد')}
                    </span>
                  </td>
                   <td className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 whitespace-nowrap font-medium">
                     <div className="flex flex-col xs:flex-row gap-1 xs:gap-2">
                        {isSiteManager && !isSelf && (
                            <>
                                <Button onClick={() => openEditUserModal(user)} size="sm" variant="ghost" className="!text-xs !px-1.5 !py-0.5 sm:!text-sm sm:!px-2 sm:!py-1">{t('editUserInfo')}</Button>
                                {user.role === UserRole.USER && (
                                    <Button onClick={() => openRoleConfirmModal(user, 'promote')} size="sm" variant="secondary" className="!text-xs !px-1.5 !py-0.5 sm:!text-sm sm:!px-2 sm:!py-1">{t('promoteToAdmin')}</Button>
                                )}
                                {user.role === UserRole.ADMIN && (
                                    <Button onClick={() => openRoleConfirmModal(user, 'demote')} size="sm" variant="danger" className="!text-xs !px-1.5 !py-0.5 sm:!text-sm sm:!px-2 sm:!py-1">{t('demoteToUser')}</Button>
                                )}
                                {!isTargetSiteManager && ( 
                                    <Button onClick={() => openDeleteUserModal(user)} size="sm" variant="danger" className="!text-xs !px-1.5 !py-0.5 sm:!text-sm sm:!px-2 sm:!py-1">{t('deleteUser')}</Button>
                                )}
                            </>
                        )}
                        {isTargetSiteManager && <span className="text-xs text-slate-500">{t('cannotModifySiteManager')}</span>}
                        {isSelf && <span className="text-xs text-slate-500">{t('cannotEditSelfDetailsInThisModal')}</span>}
                     </div>
                   </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {isRoleConfirmModalOpen && userForRoleChange && roleConfirmAction && (
        <Modal isOpen={isRoleConfirmModalOpen} onClose={closeRoleConfirmModal} title={t('confirm', 'تأكيد الإجراء')} >
          <p className={`text-${THEME_COLORS.textSecondary} mb-6 text-sm sm:text-base`}>
            {roleConfirmAction === 'promote' ? t('confirmPromotion') : t('confirmDemotion')}
            <strong className="mx-1">{userForRoleChange.name} ({userForRoleChange.email})</strong>?
          </p>
          <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3">
            <Button variant="ghost" onClick={closeRoleConfirmModal} size="sm">{t('cancel')}</Button>
            <Button variant={roleConfirmAction === 'promote' ? 'primary' : 'danger'} onClick={handleRoleChange} size="sm" > {t('confirm')} </Button>
          </div>
        </Modal>
      )}
      {isEditUserModalOpen && userToEdit && ( <EditUserInfoModal isOpen={isEditUserModalOpen} onClose={closeEditUserModal} userToEdit={userToEdit} onSave={handleSaveUserInfo} t={t} /> )}
      {isDeleteUserModalOpen && userToDelete && (
        <Modal isOpen={isDeleteUserModalOpen} onClose={closeDeleteUserModal} title={t('deleteUser')} >
          <p className={`text-${THEME_COLORS.textSecondary} mb-6 text-sm sm:text-base`}> {t('confirmDeleteUser', 'هل أنت متأكد أنك تريد حذف المستخدم {userName}؟').replace('{userName}', userToDelete.name)} </p>
          <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3">
            <Button variant="ghost" onClick={closeDeleteUserModal} size="sm">{t('cancel')}</Button>
            <Button variant="danger" onClick={handleConfirmDeleteUser} size="sm">{t('confirm')}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

interface EditUserInfoModalProps { isOpen: boolean; onClose: () => void; userToEdit: User; onSave: (updatedData: Partial<User>) => Promise<void>; t: (key: string, subkey?: string) => string; }
const EditUserInfoModal: React.FC<EditUserInfoModalProps> = ({ isOpen, onClose, userToEdit, onSave, t}) => {
    const [name, setName] = useState(userToEdit.name);
    const [email, setEmail] = useState(userToEdit.email);
    const [phoneNumber, setPhoneNumber] = useState(userToEdit.phoneNumber || '');
    const [country, setCountry] = useState(userToEdit.country || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [modalError, setModalError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setModalError('');
        setIsSaving(true);
        if (!phoneNumber.trim()) { setModalError(t('fieldRequired') + ` (${t('phoneNumber')})`); setIsSaving(false); return; }
        if (!country) { setModalError(t('pleaseSelectCountry')); setIsSaving(false); return; }
        if (newPassword && newPassword !== confirmNewPassword) { setModalError(t('passwordsDoNotMatch')); setIsSaving(false); return; }
        
        const updatedData: Partial<User> = { name, email, phoneNumber, country };
        if (newPassword) updatedData.password = newPassword; 
        
        try {
            await onSave(updatedData);
        } catch (error: any) {
            setModalError(error.message || t('errorOccurred'));
        } finally {
            setIsSaving(false);
        }
    };
    
    useEffect(() => {
        setName(userToEdit.name); setEmail(userToEdit.email); setPhoneNumber(userToEdit.phoneNumber || ''); setCountry(userToEdit.country || '');
        setNewPassword(''); setConfirmNewPassword(''); setModalError('');
    }, [userToEdit]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('editUserInfo')} size="lg">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <Input label={t('name')} value={name} onChange={e => setName(e.target.value)} required />
                <Input label={t('email')} type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={userToEdit.email === ADMIN_EMAIL} />
                <div>
                    <label htmlFor="country-edit" className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('country')}</label>
                    <select id="country-edit" name="country" value={country} onChange={e => setCountry(e.target.value)} required
                        className={`block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} text-xs sm:text-sm text-${THEME_COLORS.textPrimary}`} >
                        {COUNTRIES_LIST.map(c => ( <option key={c.code} value={c.code} disabled={c.code === ''}>{c.name}</option> ))}
                    </select>
                </div>
                <Input label={t('phoneNumber')} type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required/>
                <Input label={t('newPassword') + ` (${t('optional')})`} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="اترك الحقل فارغًا لعدم التغيير" />
                <Input label={t('confirmNewPassword') + ` (${t('optional')})`} type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} disabled={!newPassword} />
                {modalError && <p className="text-xs sm:text-sm text-red-400">{modalError}</p>}
                <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-700">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} size="sm">{t('cancel')}</Button>
                    <Button type="submit" isLoading={isSaving} size="sm">{t('saveChanges')}</Button>
                </div>
            </form>
        </Modal>
    );
};

const ManageVideosSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<WorkoutVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Partial<WorkoutVideo> | null>(null); 

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const fetchedVideos = await DataService.getWorkoutVideos();
      setVideos(fetchedVideos);
    } catch (error) { console.error("Error fetching videos:", error); }
    setLoading(false);
  };
  useEffect(() => { fetchVideos(); }, []);

  const openModalForAdd = () => { setCurrentVideo({ title: '', description: '', videoUrl: '', durationMinutes: 10, category: 'Cardio' }); setIsModalOpen(true); };
  const openModalForEdit = (video: WorkoutVideo) => { setCurrentVideo(video); setIsModalOpen(true); };

  const handleDelete = async (videoId: string) => {
    if (window.confirm(t('confirmDeleteVideo', 'هل أنت متأكد أنك تريد حذف هذا الفيديو؟'))) {
      try {
        await DataService.deleteWorkoutVideo(videoId);
        await fetchVideos(); 
      } catch (error) { console.error("Error deleting video:", error); }
    }
  };
  
  const handleSaveVideo = async (videoData: Partial<WorkoutVideo>) => {
    if (!currentUser) return;
    try {
      if (videoData.id) { 
          await DataService.updateWorkoutVideo(videoData as WorkoutVideo);
      } else { 
          await DataService.addWorkoutVideo(videoData as Omit<WorkoutVideo, 'id' | 'uploadDate' | 'uploadedBy'>, currentUser.id);
      }
      await fetchVideos(); 
      setIsModalOpen(false);
      setCurrentVideo(null);
    } catch (error) { console.error("Error saving video:", error); }
  };

  if (loading && !isModalOpen) return <LoadingOverlay message={t('loading')} />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className={`text-xl sm:text-2xl font-semibold text-${THEME_COLORS.textPrimary}`}>{t('manageVideos')}</h2>
        <Button onClick={openModalForAdd} variant="primary" size="md"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 me-1 sm:me-2"> <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /> </svg> {t('addVideo')} </Button>
      </div>
      {videos.length === 0 && !loading && <p className={`text-${THEME_COLORS.textSecondary} text-center py-8`}>{t('noVideosFound')}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {videos.map(video => (
          <Card key={video.id} className="p-3 sm:p-4 flex flex-col">
            <img src={video.thumbnailUrl || `https://picsum.photos/seed/${video.id}/300/180`} alt={video.title} className="w-full h-32 sm:h-40 object-cover rounded-lg mb-2 sm:mb-3 shadow-md"/>
            <h3 className={`text-md sm:text-lg font-semibold text-${THEME_COLORS.primary}`}>{video.title}</h3>
            <p className={`text-xs sm:text-sm text-${THEME_COLORS.textSecondary} my-1 flex-grow`}>{video.description.substring(0, 70)}{video.description.length > 70 && '...'}</p>
            <div className={`text-xs text-${THEME_COLORS.textSecondary} opacity-80 mt-2`}> <span>{t('category')}: {t(video.category.toLowerCase(), video.category)}</span> | <span>{t('duration')}: {video.durationMinutes} {t('minutes')}</span> </div>
            <div className="mt-3 sm:mt-4 flex gap-1 sm:gap-2 border-t border-slate-700 pt-2 sm:pt-3">
                <Button onClick={() => openModalForEdit(video)} size="sm" variant="secondary" className="!text-xs !px-2 !py-1">{t('edit')}</Button>
                <Button onClick={() => handleDelete(video.id)} size="sm" variant="danger" className="!text-xs !px-2 !py-1">{t('delete')}</Button>
            </div>
          </Card>
        ))}
      </div>
      {isModalOpen && currentVideo && ( <VideoFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setCurrentVideo(null); }} videoData={currentVideo} onSave={handleSaveVideo} /> )}
    </div>
  );
};

interface VideoFormModalProps { isOpen: boolean; onClose: () => void; videoData: Partial<WorkoutVideo>; onSave: (data: Partial<WorkoutVideo>) => Promise<void>; }
const VideoFormModal: React.FC<VideoFormModalProps> = ({ isOpen, onClose, videoData, onSave }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState<Partial<WorkoutVideo>>(videoData);
    const [isSaving, setIsSaving] = useState(false);
    useEffect(() => setFormData(videoData), [videoData]);
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'durationMinutes' ? parseInt(value) : value }));
    };
    const handleSubmit = async (e: FormEvent) => { e.preventDefault(); setIsSaving(true); await onSave(formData); setIsSaving(false); };
    const videoCategories = ['Cardio', 'Strength', 'Flexibility', 'Yoga', 'HIIT'];
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? t('editVideo', 'تعديل الفيديو') : t('addVideo')}>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <Input label={t('videoTitle')} name="title" value={formData.title || ''} onChange={handleChange} required />
                <Textarea label={t('videoDescription')} name="description" value={formData.description || ''} onChange={handleChange} required />
                <Input label={t('videoURL')} name="videoUrl" value={formData.videoUrl || ''} onChange={handleChange} required placeholder="https://www.youtube.com/embed/..." />
                <Input label={t('videoThumbnailURL')} name="thumbnailUrl" value={formData.thumbnailUrl || ''} onChange={handleChange} placeholder="https://picsum.photos/..."/>
                <Input label={t('videoDuration')} name="durationMinutes" type="number" value={formData.durationMinutes || ''} onChange={handleChange} required />
                <div>
                    <label htmlFor="category" className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('videoCategory')}</label>
                    <select id="category" name="category" value={formData.category || 'Cardio'} onChange={handleChange} className={`w-full bg-slate-800 border border-slate-700 text-${THEME_COLORS.textPrimary} text-xs sm:text-sm rounded-lg focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} block p-2 sm:p-2.5`}>
                        {videoCategories.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase(), cat)}</option>)}
                    </select>
                </div>
                <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 border-t border-slate-700 mt-1 sm:mt-2">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} size="sm">{t('cancel')}</Button>
                    <Button type="submit" isLoading={isSaving} size="sm">{t('saveChanges')}</Button>
                </div>
            </form>
        </Modal>
    );
};

const ManageRecipesSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Partial<Recipe> | null>(null);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const fetchedRecipes = await DataService.getRecipes();
      setRecipes(fetchedRecipes);
    } catch (error) { console.error("Error fetching recipes:", error); }
    setLoading(false);
  };
  useEffect(() => { fetchRecipes(); }, []);
  
  const openModalForAdd = () => { setCurrentRecipe({ name: '', description: '', ingredients: [{item: '', quantity: ''}], instructions: [''], prepTimeMinutes: 10, cookTimeMinutes: 20, servings: 2, category: 'Breakfast' }); setIsModalOpen(true); };
  const openModalForEdit = (recipe: Recipe) => { setCurrentRecipe(recipe); setIsModalOpen(true); };
  
  const handleDelete = async (recipeId: string) => {
    if (window.confirm(t('confirmDeleteRecipe', 'هل أنت متأكد أنك تريد حذف هذه الوصفة؟'))) {
      try {
        await DataService.deleteRecipe(recipeId);
        await fetchRecipes();
      } catch (error) { console.error("Error deleting recipe:", error); }
    }
  };

  const handleSaveRecipe = async (recipeData: Partial<Recipe>) => {
    if (!currentUser) return;
    try {
      if (recipeData.id) {
          await DataService.updateRecipe(recipeData as Recipe);
      } else {
          await DataService.addRecipe(recipeData as Omit<Recipe, 'id' | 'uploadDate' | 'uploadedBy'>, currentUser.id);
      }
      await fetchRecipes();
      setIsModalOpen(false);
      setCurrentRecipe(null);
    } catch (error) { console.error("Error saving recipe:", error); }
  };

  if (loading && !isModalOpen) return <LoadingOverlay message={t('loading')} />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className={`text-xl sm:text-2xl font-semibold text-${THEME_COLORS.textPrimary}`}>{t('manageRecipes')}</h2>
         <Button onClick={openModalForAdd} variant="primary" size="md"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 me-1 sm:me-2"> <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /> </svg> {t('addRecipe')} </Button>
      </div>
      {recipes.length === 0 && !loading && <p className={`text-${THEME_COLORS.textSecondary} text-center py-8`}>{t('noRecipesFound')}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {recipes.map(recipe => (
          <Card key={recipe.id} className="p-3 sm:p-4 flex flex-col">
            <img src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/300/200`} alt={recipe.name} className="w-full h-32 sm:h-40 object-cover rounded-lg mb-2 sm:mb-3 shadow-md"/>
            <h3 className={`text-md sm:text-lg font-semibold text-${THEME_COLORS.primary}`}>{recipe.name}</h3>
            <p className={`text-xs sm:text-sm text-${THEME_COLORS.textSecondary} my-1 flex-grow`}>{recipe.description.substring(0, 70)}{recipe.description.length > 70 && '...'}</p>
             <div className={`text-xs text-${THEME_COLORS.textSecondary} opacity-80 mt-2`}> <span>{t('category')}: {t(recipe.category.toLowerCase(), recipe.category)}</span> | <span>{t('servings')}: {recipe.servings}</span> </div>
             <div className="mt-3 sm:mt-4 flex gap-1 sm:gap-2 border-t border-slate-700 pt-2 sm:pt-3">
                <Button onClick={() => openModalForEdit(recipe)} size="sm" variant="secondary" className="!text-xs !px-2 !py-1">{t('edit')}</Button>
                <Button onClick={() => handleDelete(recipe.id)} size="sm" variant="danger" className="!text-xs !px-2 !py-1">{t('delete')}</Button>
            </div>
          </Card>
        ))}
      </div>
      {isModalOpen && currentRecipe && ( <RecipeFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setCurrentRecipe(null); }} recipeData={currentRecipe} onSave={handleSaveRecipe} /> )}
    </div>
  );
};

interface RecipeFormModalProps { isOpen: boolean; onClose: () => void; recipeData: Partial<Recipe>; onSave: (data: Partial<Recipe>) => Promise<void>; }
const RecipeFormModal: React.FC<RecipeFormModalProps> = ({ isOpen, onClose, recipeData, onSave }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState<Partial<Recipe>>(recipeData);
    const [isSaving, setIsSaving] = useState(false);
    useEffect(() => setFormData(recipeData), [recipeData]);
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['prepTimeMinutes', 'cookTimeMinutes', 'servings', 'calories'];
        setFormData(prev => ({ ...prev, [name]: numericFields.includes(name) ? parseInt(value) || 0 : value }));
    };
    const handleIngredientChange = (index: number, field: 'item' | 'quantity', value: string) => { const newIngredients = [...(formData.ingredients || [])]; newIngredients[index] = { ...newIngredients[index], [field]: value }; setFormData(prev => ({ ...prev, ingredients: newIngredients })); };
    const addIngredientField = () => setFormData(prev => ({ ...prev, ingredients: [...(prev.ingredients || []), {item: '', quantity: ''}] }));
    const removeIngredientField = (index: number) => setFormData(prev => ({ ...prev, ingredients: (prev.ingredients || []).filter((_, i) => i !== index) }));
    const handleInstructionChange = (index: number, value: string) => { const newInstructions = [...(formData.instructions || [])]; newInstructions[index] = value; setFormData(prev => ({ ...prev, instructions: newInstructions })); };
    const addInstructionField = () => setFormData(prev => ({ ...prev, instructions: [...(prev.instructions || []), ''] }));
    const removeInstructionField = (index: number) => setFormData(prev => ({ ...prev, instructions: (prev.instructions || []).filter((_, i) => i !== index) }));
    const handleSubmit = async (e: FormEvent) => { e.preventDefault(); setIsSaving(true); await onSave(formData); setIsSaving(false); };
    const recipeCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Drinks'];
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? t('editRecipe', 'تعديل الوصفة') : t('addRecipe')} size="xl">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 max-h-[75vh] overflow-y-auto p-1 sm:p-2">
                <Input label={t('recipeName')} name="name" value={formData.name || ''} onChange={handleChange} required />
                <Textarea label={t('recipeDescription')} name="description" value={formData.description || ''} onChange={handleChange} required />
                <Input label={t('recipeImageURL')} name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} placeholder="https://picsum.photos/..."/>
                <div>
                    <h4 className="text-sm sm:text-md font-semibold mb-1">{t('ingredients')}</h4>
                    {(formData.ingredients || []).map((ing, index) => (
                        <div key={index} className="flex gap-1 sm:gap-2 mb-1 sm:mb-2 items-center">
                            <Input placeholder={t('item', 'العنصر')} value={ing.item} onChange={e => handleIngredientChange(index, 'item', e.target.value)} className="flex-grow !text-xs sm:!text-sm" />
                            <Input placeholder={t('quantity', 'الكمية')} value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', e.target.value)} className="w-1/3 sm:w-1/4 !text-xs sm:!text-sm" />
                            <Button type="button" variant="danger" size="sm" onClick={() => removeIngredientField(index)} disabled={(formData.ingredients?.length || 0) <=1} className="!px-2 !py-1">X</Button>
                        </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={addIngredientField} className="!text-xs !px-2 !py-1">{t('addIngredient')}</Button>
                </div>
                <div>
                    <h4 className="text-sm sm:text-md font-semibold mb-1">{t('instructions')}</h4>
                    {(formData.instructions || []).map((step, index) => (
                        <div key={index} className="flex gap-1 sm:gap-2 mb-1 sm:mb-2 items-center">
                            <Textarea placeholder={`${t('step', 'الخطوة')} ${index + 1}`} value={step} onChange={e => handleInstructionChange(index, e.target.value)} rows={1} className="flex-grow !text-xs sm:!text-sm !py-1.5" />
                             <Button type="button" variant="danger" size="sm" onClick={() => removeInstructionField(index)} disabled={(formData.instructions?.length || 0) <=1} className="!px-2 !py-1">X</Button>
                        </div>
                    ))}
                     <Button type="button" variant="ghost" size="sm" onClick={addInstructionField} className="!text-xs !px-2 !py-1">{t('addInstructionStep')}</Button>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <Input label={t('prepTime')} name="prepTimeMinutes" type="number" value={formData.prepTimeMinutes || 0} onChange={handleChange} />
                    <Input label={t('cookTime')} name="cookTimeMinutes" type="number" value={formData.cookTimeMinutes || 0} onChange={handleChange} />
                    <Input label={t('servings')} name="servings" type="number" value={formData.servings || 0} onChange={handleChange} />
                    <Input label={t('caloriesPerServing')} name="calories" type="number" value={formData.calories || ''} onChange={handleChange} placeholder={t("optional", "اختياري")} />
                </div>
                 <div>
                    <label htmlFor="recipeCategory" className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('recipeCategory')}</label>
                    <select id="recipeCategory" name="category" value={formData.category || 'Breakfast'} onChange={handleChange} className={`w-full bg-slate-800 border border-slate-700 text-${THEME_COLORS.textPrimary} text-xs sm:text-sm rounded-lg focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} block p-2 sm:p-2.5`}>
                        {recipeCategories.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase(), cat)}</option>)}
                    </select>
                </div>
                <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-700">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} size="sm">{t('cancel')}</Button>
                    <Button type="submit" isLoading={isSaving} size="sm">{t('saveChanges')}</Button>
                </div>
            </form>
        </Modal>
    );
};

const ManagePdfsSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser } = useAuth();
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPdf, setCurrentPdf] = useState<Partial<PdfDocument> & { file?: File } | null>(null);
  const [feedback, setFeedback] = useState({type: '', message: ''});
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const refreshPdfs = async () => {
    setLoading(true);
    try {
      const fetchedPdfs = await DataService.getPdfDocuments();
      setPdfs(fetchedPdfs);
      const fetchedUsers = await DataService.getUsers();
      setAllUsers(fetchedUsers.filter(u => u.role === UserRole.USER)); 
    } catch (error) { console.error("Error refreshing PDFs/Users:", error); }
    setLoading(false);
  };
  useEffect(() => { refreshPdfs(); }, []);

  const openModalForAdd = () => { setCurrentPdf({ description: '', assignedUserIds: [] }); setIsModalOpen(true); };
  const openModalForEdit = (pdf: PdfDocument) => { setCurrentPdf({ ...pdf }); setIsModalOpen(true); };

  const handleDelete = async (pdfId: string) => {
    if (window.confirm(t('confirmDeletePdf'))) {
      try {
        await DataService.deletePdfDocument(pdfId);
        await refreshPdfs();
        setFeedback({type: 'success', message: t('pdfDeletedSuccess')});
      } catch (error) { 
        console.error("Error deleting PDF:", error);
        setFeedback({type: 'error', message: (error as Error).message || t('errorOccurred')});
      }
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    }
  };
  
  const handleSavePdf = async (pdfData: Partial<PdfDocument> & { file?: File }) => {
    if (!currentUser) return;
    setLoading(true); 
    setFeedback({type: '', message: ''});
    try {
      if (pdfData.id) { 
        await DataService.updatePdfDocument(pdfData as PdfDocument); 
        setFeedback({type: 'success', message: t('pdfUpdatedSuccess')});
      } else if (pdfData.file) { 
        await DataService.addPdfDocument( { description: pdfData.description || '', assignedUserIds: pdfData.assignedUserIds || [] }, pdfData.file, currentUser.id );
        setFeedback({type: 'success', message: t('pdfUploadedSuccess')});
      } else { throw new Error("File is required for new PDF upload."); }
      await refreshPdfs();
      setIsModalOpen(false);
      setCurrentPdf(null);
    } catch (error: any) {
        console.error("Error saving PDF:", error);
        setFeedback({type: 'error', message: error.message || t('errorOccurred')});
    } finally {
        setLoading(false);
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    }
  };

  if (loading && !isModalOpen && pdfs.length === 0) return <LoadingOverlay message={t('loading')} />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className={`text-xl sm:text-2xl font-semibold text-${THEME_COLORS.textPrimary}`}>{t('managePdfs')}</h2>
        <Button onClick={openModalForAdd} isLoading={loading && isModalOpen} variant="primary" size="md"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 me-1 sm:me-2"> <path d="M9.25 3.25a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" /> </svg> {t('uploadPdf')} </Button>
      </div>
      {feedback.message && <p className={`mb-4 p-3 rounded text-sm ${feedback.type === 'success' ? `bg-${THEME_COLORS.success} bg-opacity-20 text-green-300` : `bg-${THEME_COLORS.error} bg-opacity-20 text-red-300`}`}>{feedback.message}</p>}
      
      {pdfs.length === 0 && !loading && <p className={`text-${THEME_COLORS.textSecondary} text-center py-8`}>{t('noPdfsUploaded')}</p>}
      <div className="space-y-3 sm:space-y-4">
        {pdfs.map(pdf => (
          <Card key={pdf.id} className="p-3 sm:p-4 hover:border-sky-500">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 md:gap-4">
                <div className="flex-grow">
                    <h3 className={`text-lg sm:text-xl font-semibold text-${THEME_COLORS.primary} break-all`}>{pdf.fileName}</h3>
                    <p className={`text-xs sm:text-sm text-${THEME_COLORS.textSecondary} mt-1`}>{pdf.description}</p>
                    <p className={`text-xs text-${THEME_COLORS.textSecondary} opacity-80 mt-1`}>{t('uploadDate')}: {new Date(pdf.uploadDate).toLocaleDateString('ar-EG')}</p>
                     {pdf.assignedUserIds.length > 0 && (
                        <div className="mt-1.5 sm:mt-2">
                            <p className={`text-xs font-semibold text-${THEME_COLORS.textPrimary}`}>{t('assignedUsers')}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                            {pdf.assignedUserIds.map(userId => { const user = allUsers.find(u => u.id === userId); return user ? <span key={userId} className={`text-xs bg-slate-700 text-${THEME_COLORS.textSecondary} px-1.5 py-0.5 sm:px-2 rounded-full`}>{user.name}</span> : null; })}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-1 sm:gap-2 mt-2 md:mt-0 self-start md:self-center flex-shrink-0">
                    <Button onClick={() => openModalForEdit(pdf)} size="sm" variant="secondary" className="!text-xs !px-2 !py-1">{t('edit')}</Button>
                    <Button onClick={() => handleDelete(pdf.id)} size="sm" variant="danger" className="!text-xs !px-2 !py-1">{t('delete')}</Button>
                </div>
            </div>
          </Card>
        ))}
      </div>
      {isModalOpen && currentPdf && ( <PdfFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setCurrentPdf(null); }} pdfData={currentPdf} onSave={handleSavePdf} allUsers={allUsers} isLoading={loading && isModalOpen} /> )}
    </div>
  );
};

interface PdfFormModalProps { isOpen: boolean; onClose: () => void; pdfData: Partial<PdfDocument> & { file?: File }; onSave: (data: Partial<PdfDocument> & { file?: File }) => Promise<void>; allUsers: User[]; isLoading: boolean; }
const PdfFormModal: React.FC<PdfFormModalProps> = ({ isOpen, onClose, pdfData, onSave, allUsers, isLoading }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState<Partial<PdfDocument> & { file?: File }>(pdfData);
    const [fileError, setFileError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => setFormData(pdfData), [pdfData]);
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFileError(''); const file = e.target.files?.[0];
        if (file) {
            if (file.size > PDF_MAX_SIZE_BYTES) { setFileError(`File is too large. Max size: ${PDF_MAX_SIZE_BYTES / (1024*1024)}MB`); setFormData(prev => ({ ...prev, file: undefined })); return; }
            if (file.type !== "application/pdf") { setFileError("Invalid file type. Only PDF files are allowed."); setFormData(prev => ({ ...prev, file: undefined })); return; }
            setFormData(prev => ({ ...prev, file }));
        }
    };
    const handleUserAssignmentChange = (userId: string) => { setFormData(prev => { const assignedUserIds = prev.assignedUserIds ? [...prev.assignedUserIds] : []; const userIndex = assignedUserIds.indexOf(userId); if (userIndex > -1) assignedUserIds.splice(userIndex, 1); else assignedUserIds.push(userId); return { ...prev, assignedUserIds }; }); };
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.id && !formData.file) { setFileError("Please select a PDF file to upload."); return; }
        if (fileError && formData.file) return; 
        setIsSubmitting(true);
        await onSave(formData);
        setIsSubmitting(false);
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? t('editPdfAssignments') : t('uploadPdf')} size="lg">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 max-h-[75vh] overflow-y-auto p-1">
                {!formData.id && ( <div> <label htmlFor="pdfFile" className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('selectPdfFile')}</label> <Input id="pdfFile" name="file" type="file" accept=".pdf" onChange={handleFileChange} required={!formData.id} /> {fileError && <p className="text-xs text-red-400 mt-1">{fileError}</p>} </div> )}
                {formData.id && formData.fileName && <p className={`text-${THEME_COLORS.textSecondary} text-sm sm:text-base`}><strong className={`text-${THEME_COLORS.textPrimary}`}>{t('pdfFileName')}:</strong> {formData.fileName}</p>}
                <Textarea label={t('pdfDescription')} name="description" value={formData.description || ''} onChange={handleChange} required />
                <div>
                    <h4 className={`text-sm sm:text-md font-semibold mb-1 sm:mb-2 text-${THEME_COLORS.textPrimary}`}>{t('selectUsersToAssign')}</h4>
                    {allUsers.length === 0 && <p className={`text-xs sm:text-sm text-${THEME_COLORS.textSecondary}`}>{t('manageUsers', 'لا يوجد مستخدمون لعرضهم. أضف مستخدمين أولاً.')}</p>}
                    <div className={`max-h-32 sm:max-h-40 overflow-y-auto space-y-1.5 sm:space-y-2 border border-slate-700 p-2 sm:p-3 rounded-md bg-${THEME_COLORS.background} bg-opacity-50`}>
                        {allUsers.map(user => (
                            <div key={user.id} className="flex items-center">
                                <input type="checkbox" id={`user-assign-${user.id}`} checked={formData.assignedUserIds?.includes(user.id) || false} onChange={() => handleUserAssignmentChange(user.id)}
                                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-${THEME_COLORS.primary} bg-slate-700 border-slate-600 rounded focus:ring-${THEME_COLORS.primary} focus:ring-2 focus:ring-offset-${THEME_COLORS.surface}`} />
                                <label htmlFor={`user-assign-${user.id}`} className={`ms-2 text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary}`}>{user.name} ({user.email})</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-700">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting || isLoading} size="sm">{t('cancel')}</Button>
                    <Button type="submit" isLoading={isSubmitting || isLoading} disabled={isSubmitting || isLoading || (fileError && !!formData.file) || (!formData.id && !formData.file)} size="sm"> {formData.id ? t('saveChanges') : t('uploadPdf')} </Button>
                </div>
            </form>
        </Modal>
    );
};


const ManageResourceLinksSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser } = useAuth();
  const [resourceLinks, setResourceLinks] = useState<ExternalResourceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState<Partial<ExternalResourceLink> | null>(null);
  const [feedback, setFeedback] = useState({type: '', message: ''});
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const refreshResourceLinks = async () => {
    setLoading(true);
    try {
      const [fetchedLinks, fetchedUsers] = await Promise.all([
        DataService.getExternalResourceLinks(),
        DataService.getUsers()
      ]);
      setResourceLinks(fetchedLinks);
      setAllUsers(fetchedUsers.filter(u => u.role === UserRole.USER)); 
    } catch (error) { console.error("Error refreshing resource links/users:", error); }
    setLoading(false);
  };
  useEffect(() => { refreshResourceLinks(); }, []);
  
  const showFeedback = (type: 'success' | 'error', messageKey: string) => {
    setFeedback({type, message: t(messageKey)});
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const openModalForAdd = () => { setCurrentLink({ title: '', url: '', description: '', category: ExternalResourceCategory.WORKOUT_PLAN, assignedUserIds: [] }); setIsModalOpen(true); };
  const openModalForEdit = (link: ExternalResourceLink) => { setCurrentLink({ ...link }); setIsModalOpen(true); };

  const handleDelete = async (linkId: string) => {
    if (window.confirm(t('confirmDeleteResourceLink'))) {
      try {
        await DataService.deleteExternalResourceLink(linkId);
        await refreshResourceLinks();
        showFeedback('success', 'resourceLinkDeletedSuccess');
      } catch (error) { 
        console.error("Error deleting resource link:", error);
        showFeedback('error', (error as Error).message || 'errorOccurred');
      }
    }
  };
  
  const handleSaveLink = async (linkData: Partial<ExternalResourceLink>) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      if (linkData.id) { 
        await DataService.updateExternalResourceLink(linkData as ExternalResourceLink);
        showFeedback('success', 'resourceLinkUpdatedSuccess');
      } else { 
        await DataService.addExternalResourceLink(linkData as Omit<ExternalResourceLink, 'id' | 'addedDate' | 'addedBy'>, currentUser.id );
        showFeedback('success', 'resourceLinkAddedSuccess');
      }
      await refreshResourceLinks();
      setIsModalOpen(false);
      setCurrentLink(null);
    } catch (error: any) {
        console.error("Error saving resource link:", error);
        showFeedback('error', error.message || 'errorOccurred');
    } finally {
        setLoading(false);
    }
  };

  const getResourceCategoryName = (categoryId: ExternalResourceCategory) => {
    const category = EXTERNAL_RESOURCE_CATEGORIES.find(c => c.id === categoryId);
    return category ? t(category.name_key, categoryId) : categoryId;
  };


  if (loading && !isModalOpen && resourceLinks.length === 0) return <LoadingOverlay message={t('loading')} />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className={`text-xl sm:text-2xl font-semibold text-${THEME_COLORS.textPrimary}`}>{t('manageResourceLinks')}</h2>
        <Button onClick={openModalForAdd} isLoading={loading && isModalOpen} variant="primary" size="md"> 
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 me-1 sm:me-2"> <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /> </svg> 
          {t('addResourceLink')} 
        </Button>
      </div>
      {feedback.message && <p className={`mb-4 p-3 rounded text-sm ${feedback.type === 'success' ? `bg-${THEME_COLORS.success} bg-opacity-20 text-green-300` : `bg-${THEME_COLORS.error} bg-opacity-20 text-red-300`}`}>{feedback.message}</p>}
      
      {resourceLinks.length === 0 && !loading && <p className={`text-${THEME_COLORS.textSecondary} text-center py-8`}>{t('noResourceLinksUploaded')}</p>}
      <div className="space-y-3 sm:space-y-4">
        {resourceLinks.map(link => (
          <Card key={link.id} className="p-3 sm:p-4 hover:border-sky-500">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 md:gap-4">
                <div className="flex-grow">
                    <h3 className={`text-lg sm:text-xl font-semibold text-${THEME_COLORS.primary} break-all`}>{link.title}</h3>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className={`text-xs sm:text-sm text-${THEME_COLORS.primaryHover} hover:text-${THEME_COLORS.primary} underline break-all`}>{link.url}</a> {/* Changed color */}
                    <p className={`text-xs sm:text-sm text-${THEME_COLORS.textSecondary} mt-1`}>{link.description}</p>
                    <p className={`text-xs text-${THEME_COLORS.textSecondary} opacity-80 mt-1`}>{t('resourceLinkCategory')}: {getResourceCategoryName(link.category)} | {t('uploadDate')}: {new Date(link.addedDate).toLocaleDateString('ar-EG')}</p>
                     {link.assignedUserIds.length > 0 && (
                        <div className="mt-1.5 sm:mt-2">
                            <p className={`text-xs font-semibold text-${THEME_COLORS.textPrimary}`}>{t('assignedUsers')}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                            {link.assignedUserIds.map(userId => { const user = allUsers.find(u => u.id === userId); return user ? <span key={userId} className={`text-xs bg-slate-700 text-${THEME_COLORS.textSecondary} px-1.5 py-0.5 sm:px-2 rounded-full`}>{user.name}</span> : null; })}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-1 sm:gap-2 mt-2 md:mt-0 self-start md:self-center flex-shrink-0">
                    <Button onClick={() => openModalForEdit(link)} size="sm" variant="secondary" className="!text-xs !px-2 !py-1">{t('edit')}</Button>
                    <Button onClick={() => handleDelete(link.id)} size="sm" variant="danger" className="!text-xs !px-2 !py-1">{t('delete')}</Button>
                </div>
            </div>
          </Card>
        ))}
      </div>
      {isModalOpen && currentLink && ( <ResourceLinkFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setCurrentLink(null); }} linkData={currentLink} onSave={handleSaveLink} allUsers={allUsers} isLoading={loading && isModalOpen} /> )}
    </div>
  );
};

interface ResourceLinkFormModalProps { isOpen: boolean; onClose: () => void; linkData: Partial<ExternalResourceLink>; onSave: (data: Partial<ExternalResourceLink>) => Promise<void>; allUsers: User[]; isLoading: boolean; }
const ResourceLinkFormModal: React.FC<ResourceLinkFormModalProps> = ({ isOpen, onClose, linkData, onSave, allUsers, isLoading }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState<Partial<ExternalResourceLink>>(linkData);
    const [urlError, setUrlError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => setFormData(linkData), [linkData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { 
        const { name, value } = e.target; 
        setFormData(prev => ({ ...prev, [name]: value })); 
        if (name === 'url') setUrlError('');
    };

    const handleUserAssignmentChange = (userId: string) => { 
        setFormData(prev => { 
            const assignedUserIds = prev.assignedUserIds ? [...prev.assignedUserIds] : []; 
            const userIndex = assignedUserIds.indexOf(userId); 
            if (userIndex > -1) assignedUserIds.splice(userIndex, 1); 
            else assignedUserIds.push(userId); 
            return { ...prev, assignedUserIds }; 
        }); 
    };
    
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return url.startsWith('http://') || url.startsWith('https://');
      } catch (_) {
        return false;
      }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setUrlError('');
        if (formData.url && !isValidUrl(formData.url)) {
            setUrlError(t('urlInvalid'));
            return;
        }
        setIsSubmitting(true);
        await onSave(formData);
        setIsSubmitting(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? t('editResourceLink') : t('addResourceLink')} size="lg">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 max-h-[75vh] overflow-y-auto p-1">
                <Input label={t('resourceLinkTitle')} name="title" value={formData.title || ''} onChange={handleChange} required />
                <Input label={t('resourceLinkURL')} name="url" type="url" value={formData.url || ''} onChange={handleChange} required placeholder="https://example.com/resource" error={urlError}/>
                <Textarea label={t('resourceLinkDescription')} name="description" value={formData.description || ''} onChange={handleChange} />
                <div>
                    <label htmlFor="resourceCategory" className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('resourceLinkCategory')}</label>
                    <select 
                        id="resourceCategory" 
                        name="category" 
                        value={formData.category || ExternalResourceCategory.WORKOUT_PLAN} 
                        onChange={handleChange}
                        className={`w-full bg-slate-800 border border-slate-700 text-${THEME_COLORS.textPrimary} text-xs sm:text-sm rounded-lg focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} block p-2 sm:p-2.5`}
                    >
                        {EXTERNAL_RESOURCE_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{t(cat.name_key, cat.id)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <h4 className={`text-sm sm:text-md font-semibold mb-1 sm:mb-2 text-${THEME_COLORS.textPrimary}`}>{t('selectUsersToAssign')}</h4>
                    {allUsers.length === 0 && <p className={`text-xs sm:text-sm text-${THEME_COLORS.textSecondary}`}>{t('manageUsers', 'لا يوجد مستخدمون لعرضهم. أضف مستخدمين أولاً.')}</p>}
                    <div className={`max-h-32 sm:max-h-40 overflow-y-auto space-y-1.5 sm:space-y-2 border border-slate-700 p-2 sm:p-3 rounded-md bg-${THEME_COLORS.background} bg-opacity-50`}>
                        {allUsers.map(user => (
                            <div key={user.id} className="flex items-center">
                                <input type="checkbox" id={`user-assign-link-${user.id}`} checked={formData.assignedUserIds?.includes(user.id) || false} onChange={() => handleUserAssignmentChange(user.id)}
                                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-${THEME_COLORS.primary} bg-slate-700 border-slate-600 rounded focus:ring-${THEME_COLORS.primary} focus:ring-2 focus:ring-offset-${THEME_COLORS.surface}`} />
                                <label htmlFor={`user-assign-link-${user.id}`} className={`ms-2 text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary}`}>{user.name} ({user.email})</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-700">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting || isLoading} size="sm">{t('cancel')}</Button>
                    <Button type="submit" isLoading={isSubmitting || isLoading} disabled={isSubmitting || isLoading || !!urlError} size="sm"> {formData.id ? t('saveChanges') : t('addResourceLink')} </Button>
                </div>
            </form>
        </Modal>
    );
};


const ManageSubscriptionPlansSection: React.FC = () => {
  const { t } = useLocalization();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<SubscriptionPlan> | null>(null);

  const refreshPlans = async () => {
    setLoading(true);
    try {
      const fetchedPlans = await DataService.getSubscriptionPlans();
      setPlans(fetchedPlans);
    } catch (error) { console.error("Error fetching plans:", error); }
    setLoading(false);
  };
  useEffect(() => { refreshPlans(); }, []);

  const openModalForAdd = () => { setCurrentPlan({ name: '', price: 0, currency: 'SAR', description: '', features: [{id: `temp_feat_${Date.now()}`, text: ''}] }); setIsModalOpen(true); };
  const openModalForEdit = (plan: SubscriptionPlan) => { setCurrentPlan(JSON.parse(JSON.stringify(plan))); setIsModalOpen(true); };

  const handleDelete = async (planId: string) => {
    if (window.confirm(t('confirmDeletePlan'))) {
      try {
        await DataService.deleteSubscriptionPlan(planId);
        await refreshPlans();
      } catch (error) { console.error("Error deleting plan:", error); }
    }
  };
  
  const handleSavePlan = async (planData: Partial<SubscriptionPlan>) => {
    const featuresToSave = (planData.features || []).filter(f => f.text.trim() !== '');
    try {
      if (planData.id) { 
          await DataService.updateSubscriptionPlan({...planData, features: featuresToSave} as SubscriptionPlan);
      } else { 
          await DataService.addSubscriptionPlan(planData as Omit<SubscriptionPlan, 'id'>);
      }
      await refreshPlans();
      setIsModalOpen(false);
      setCurrentPlan(null);
    } catch (error) { console.error("Error saving plan:", error); }
  };

  if (loading && !isModalOpen && plans.length === 0) return <LoadingOverlay message={t('loading')} />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className={`text-xl sm:text-2xl font-semibold text-${THEME_COLORS.textPrimary}`}>{t('manageSubscriptionPlans')}</h2>
        <Button onClick={openModalForAdd} variant="primary" size="md"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 me-1 sm:me-2"> <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /> </svg> {t('addSubscriptionPlan')} </Button>
      </div>
      {plans.length === 0 && !loading && <p className={`text-${THEME_COLORS.textSecondary} text-center py-8`}>{t('noPlansDefined', 'لا توجد خطط اشتراك معرفة حاليًا.')}</p>}
      <div className="space-y-3 sm:space-y-4">
        {plans.map(plan => (
          <Card key={plan.id} className="p-3 sm:p-4 hover:border-sky-500">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 md:gap-4">
                <div className="flex-grow">
                    <h3 className={`text-lg sm:text-xl font-semibold text-${THEME_COLORS.primary}`}>{plan.name}</h3>
                    <p className={`text-md sm:text-lg text-${THEME_COLORS.textPrimary}`}>{plan.price} {plan.currency}</p>
                    <p className={`text-xs sm:text-sm text-${THEME_COLORS.textSecondary} mt-1`}>{plan.description}</p>
                    <ul className={`list-disc list-inside mt-1.5 sm:mt-2 text-xs sm:text-sm text-${THEME_COLORS.textSecondary} space-y-1`}>
                        {plan.features.map(feature => <li key={feature.id} className="flex items-start"><svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-lime-400 me-1.5 sm:me-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>{feature.text}</li>)}
                    </ul>
                </div>
                <div className="flex gap-1 sm:gap-2 mt-2 md:mt-0 self-start md:self-center flex-shrink-0">
                    <Button onClick={() => openModalForEdit(plan)} size="sm" variant="secondary" className="!text-xs !px-2 !py-1">{t('edit')}</Button>
                    <Button onClick={() => handleDelete(plan.id)} size="sm" variant="danger" className="!text-xs !px-2 !py-1">{t('delete')}</Button>
                </div>
            </div>
          </Card>
        ))}
      </div>
      {isModalOpen && currentPlan && ( <SubscriptionPlanFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setCurrentPlan(null); }} planData={currentPlan} onSave={handleSavePlan} /> )}
    </div>
  );
};

interface SubscriptionPlanFormModalProps { isOpen: boolean; onClose: () => void; planData: Partial<SubscriptionPlan>; onSave: (data: Partial<SubscriptionPlan>) => Promise<void>; }
const SubscriptionPlanFormModal: React.FC<SubscriptionPlanFormModalProps> = ({ isOpen, onClose, planData, onSave }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState<Partial<SubscriptionPlan>>(planData);
    const [isSaving, setIsSaving] = useState(false);
    useEffect(() => setFormData(planData), [planData]);
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };
    const handleFeatureChange = (index: number, text: string) => {
        const newFeatures = [...(formData.features || [])];
        if (!newFeatures[index]) newFeatures[index] = { id: `new_feat_${Date.now()}_${index}`, text: ''};
        newFeatures[index].text = text;
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };
    const addFeatureField = () => setFormData(prev => ({ ...prev, features: [...(prev.features || []), { id: `new_feat_${Date.now()}_${(prev.features || []).length}`, text: ''}] }));
    const removeFeatureField = (index: number) => {
      setFormData(prev => {
        const updatedFeatures = (prev.features || []).filter((_, i) => i !== index);
        return { ...prev, features: updatedFeatures };
      });
    };
    const handleSubmit = async (e: FormEvent) => { e.preventDefault(); setIsSaving(true); await onSave(formData); setIsSaving(false); };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? t('editSubscriptionPlan') : t('addSubscriptionPlan')} size="lg">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 max-h-[75vh] overflow-y-auto p-1">
                <Input label={t('planName')} name="name" value={formData.name || ''} onChange={handleChange} required />
                <Input label={t('planPrice')} name="price" type="number" step="0.01" value={formData.price || ''} onChange={handleChange} required placeholder={t('pricePlaceholder')} />
                <Input label={t('planCurrency')} name="currency" value={formData.currency || ''} onChange={handleChange} required placeholder={t('currencyPlaceholder')} />
                <Textarea label={t('planDescription')} name="description" value={formData.description || ''} onChange={handleChange} required />
                <div>
                    <h4 className="text-sm sm:text-md font-semibold mb-1">{t('planFeatures')}</h4>
                    {(formData.features || []).map((feature, index) => (
                        <div key={feature.id || `temp_feat_${index}`} className="flex gap-1 sm:gap-2 mb-1 sm:mb-2 items-center">
                            <Input placeholder={t('featureText')} value={feature.text} onChange={e => handleFeatureChange(index, e.target.value)} className="flex-grow !text-xs sm:!text-sm" />
                            <Button type="button" variant="danger" size="sm" onClick={() => removeFeatureField(index)} disabled={(formData.features?.length || 0) <= 1} className="!px-2 !py-1">X</Button>
                        </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={addFeatureField} className="!text-xs !px-2 !py-1">{t('addFeature')}</Button>
                </div>
                 <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-700">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} size="sm">{t('cancel')}</Button>
                    <Button type="submit" isLoading={isSaving} size="sm">{t('saveChanges')}</Button>
                </div>
            </form>
        </Modal>
    );
};

// Approve Subscriptions Section
const ApproveSubscriptionsSection: React.FC = () => {
    const { t } = useLocalization();
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [durationDays, setDurationDays] = useState<{ [requestId: string]: string }>({});
    const [adminNotes, setAdminNotes] = useState<{ [requestId: string]: string }>({});
    const [processingRequest, setProcessingRequest] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        setFeedback({ type: '', message: '' });
        try {
            const fetchedRequests = await DataService.getSubscriptionRequests();
            setRequests(fetchedRequests.filter(req => req.status === SubscriptionStatus.PENDING));
        } catch (error) {
            console.error("Error fetching subscription requests:", error);
            showFeedback('error', 'errorOccurred');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const showFeedback = (type: 'success' | 'error', messageKey: string) => {
        setFeedback({ type, message: t(messageKey) });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    };

    const handleApprove = async (requestId: string) => {
        if (!currentUser) return;
        const duration = parseInt(durationDays[requestId] || '30', 10);
        if (isNaN(duration) || duration <= 0) {
            showFeedback('error', 'invalidDuration');
            return;
        }
        setProcessingRequest(requestId);
        try {
            await DataService.approveSubscription(requestId, currentUser.id, duration);
            showFeedback('success', 'subscriptionApprovedSuccess');
            await fetchRequests(); // Refresh list
        } catch (error: any) {
            console.error("Error approving subscription:", error);
            showFeedback('error', error.message || 'errorOccurred');
        }
        setProcessingRequest(null);
    };

    const handleReject = async (requestId: string) => {
        if (!currentUser) return;
        setProcessingRequest(requestId);
        try {
            await DataService.rejectSubscription(requestId, currentUser.id, adminNotes[requestId]);
            showFeedback('success', 'subscriptionRejectedSuccess');
            await fetchRequests(); // Refresh list
        } catch (error: any) {
            console.error("Error rejecting subscription:", error);
            showFeedback('error', error.message || 'errorOccurred');
        }
        setProcessingRequest(null);
    };
    
    if (loading) return <LoadingOverlay message={t('loading')} />;

    return (
        <div>
            <h2 className={`text-xl sm:text-2xl font-semibold text-${THEME_COLORS.textPrimary} mb-4 sm:mb-6`}>{t('pendingSubscriptions')}</h2>
            {feedback.message && <p className={`mb-4 p-3 rounded text-sm ${feedback.type === 'success' ? `bg-${THEME_COLORS.success} bg-opacity-20 text-green-300` : `bg-${THEME_COLORS.error} bg-opacity-20 text-red-300`}`}>{feedback.message}</p>}
            
            {requests.length === 0 ? (
                <p className={`text-${THEME_COLORS.textSecondary} text-center py-8`}>{t('noPendingSubscriptions')}</p>
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {requests.map(req => (
                        <Card key={req.id} className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                                <div className="flex-grow">
                                    <p className={`text-sm sm:text-base text-${THEME_COLORS.textPrimary}`}><strong className="font-semibold">{t('user')}:</strong> {req.userEmail}</p>
                                    <p className={`text-sm sm:text-base text-${THEME_COLORS.textPrimary}`}><strong className="font-semibold">{t('plan')}:</strong> {req.planNameSnapshot}</p>
                                    <p className={`text-xs text-${THEME_COLORS.textSecondary}`}>{t('requestedOn')}: {new Date(req.requestDate).toLocaleDateString('ar-EG')}</p>
                                </div>
                                <div className="flex flex-col gap-2 w-full sm:w-auto">
                                    <div className="flex gap-2">
                                        <Input
                                            label={t('setDuration')}
                                            type="number"
                                            value={durationDays[req.id] || '30'}
                                            onChange={e => setDurationDays(prev => ({ ...prev, [req.id]: e.target.value }))}
                                            placeholder={t('durationDaysPlaceholder')}
                                            min="1"
                                            className="!text-xs sm:!text-sm !py-1 sm:!py-1.5"
                                        />
                                        <Button onClick={() => handleApprove(req.id)} variant="primary" size="sm" isLoading={processingRequest === req.id} className="flex-shrink-0 !text-xs sm:!text-sm">{t('approve')}</Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder={t('adminNotesOptional')}
                                            value={adminNotes[req.id] || ''}
                                            onChange={e => setAdminNotes(prev => ({...prev, [req.id]: e.target.value}))}
                                            rows={1}
                                            className="flex-grow !text-xs sm:!text-sm !py-1 sm:!py-1.5"
                                        />
                                        <Button onClick={() => handleReject(req.id)} variant="danger" size="sm" isLoading={processingRequest === req.id} className="flex-shrink-0 !text-xs sm:!text-sm">{t('reject')}</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

// Send Global Notification Section
const SendGlobalNotificationSection: React.FC = () => {
    const { t } = useLocalization();
    const { currentUser, isSiteManager } = useAuth();
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const showFeedback = (type: 'success' | 'error', messageKey: string) => {
        setFeedback({ type, message: t(messageKey) });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentUser || !isSiteManager || !message.trim()) return;
        setIsLoading(true);
        try {
            await DataService.addGlobalNotification(message, currentUser.id);
            showFeedback('success', 'notificationSentSuccess');
            setMessage('');
        } catch (error) {
            console.error("Error sending notification:", error);
            showFeedback('error', 'errorOccurred');
        }
        setIsLoading(false);
    };

    if (!isSiteManager) return <p>{t('adminAccessOnly')}</p>;

    return (
        <div>
            <h2 className={`text-xl sm:text-2xl font-semibold text-${THEME_COLORS.textPrimary} mb-4 sm:mb-6`}>{t('sendGlobalNotification')}</h2>
            {feedback.message && <p className={`mb-4 p-3 rounded text-sm ${feedback.type === 'success' ? `bg-${THEME_COLORS.success} bg-opacity-20 text-green-300` : `bg-${THEME_COLORS.error} bg-opacity-20 text-red-300`}`}>{feedback.message}</p>}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <Textarea
                    label={t('notificationMessage')}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    rows={4}
                />
                <Button type="submit" isLoading={isLoading} size="md" variant="primary">
                    {t('sendToAllUsers')}
                </Button>
            </form>
        </div>
    );
};

// Manage Transformations Section
const ManageTransformationsSection: React.FC = () => {
    const { t } = useLocalization();
    const { currentUser } = useAuth();
    const [posts, setPosts] = useState<TransformationPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const fetchedPosts = await DataService.getTransformationPosts();
            setPosts(fetchedPosts.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            console.error("Error fetching transformation posts:", error);
            showFeedback('error', 'errorOccurred');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const showFeedback = (type: 'success' | 'error', messageKey: string) => {
        setFeedback({ type, message: t(messageKey) });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    };

    const handleDeletePost = async (postId: string) => {
        if (!currentUser) return;
        if (window.confirm(t('confirmDeletePost'))) {
            setLoading(true);
            try {
                await DataService.deleteTransformationPost(postId, currentUser.id);
                showFeedback('success', 'postDeletedSuccess');
                await fetchPosts(); // Refresh list
            } catch (error: any) {
                console.error("Error deleting post:", error);
                showFeedback('error', error.message || 'errorOccurred');
            }
            setLoading(false);
        }
    };
    
    if (loading) return <LoadingOverlay message={t('loading')} />;

    return (
        <div>
            <h2 className={`text-xl sm:text-2xl font-semibold text-${THEME_COLORS.textPrimary} mb-4 sm:mb-6`}>{t('manageTransformations')}</h2>
            {feedback.message && <p className={`mb-4 p-3 rounded text-sm ${feedback.type === 'success' ? `bg-${THEME_COLORS.success} bg-opacity-20 text-green-300` : `bg-${THEME_COLORS.error} bg-opacity-20 text-red-300`}`}>{feedback.message}</p>}

            {posts.length === 0 ? (
                <p className={`text-${THEME_COLORS.textSecondary} text-center py-8`}>{t('noTransformationsPosted')}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {posts.map(post => (
                        <Card key={post.id} className="p-0 overflow-hidden">
                            <div className="grid grid-cols-2">
                                <img src={post.beforeImageUrl} alt={t('beforePhoto')} className="w-full h-32 sm:h-48 object-cover"/>
                                <img src={post.afterImageUrl} alt={t('afterPhoto')} className="w-full h-32 sm:h-48 object-cover"/>
                            </div>
                            <div className="p-3 sm:p-4">
                                <h3 className={`text-md sm:text-lg font-semibold text-${THEME_COLORS.primary} mb-1`}>{post.title}</h3>
                                <p className="text-xs text-slate-400 mb-0.5">{t('user')}: {post.userName}</p>
                                <p className="text-xs text-slate-500 mb-2">{t('postedOn', 'نُشر في')}: {new Date(post.createdAt).toLocaleDateString('ar-EG')}</p>
                                <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
                                    <span>{t('likes')}: {post.likes?.length || 0}</span>
                                    <span>{t('comments')}: {post.commentsCount || 0}</span>
                                </div>
                                <Button onClick={() => handleDeletePost(post.id)} variant="danger" size="sm" className="w-full !text-xs sm:!text-sm">
                                    {t('deletePost')}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
