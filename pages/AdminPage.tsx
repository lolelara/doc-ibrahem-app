
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Routes, Route, Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth, useLocalization } from '../App';
import { Button, Input, Card, Spinner, Modal, Textarea } from '../components/CommonUI';
import * as DataService from '../services/dataService';
import { User, WorkoutVideo, Recipe, SubscriptionRequest, SubscriptionStatus, UserRole, SubscriptionPlan, PdfDocument, SubscriptionPlanFeature, TransformationPost, TransformationComment } from '../types';
import { THEME_COLORS, ADMIN_EMAIL, PDF_MAX_SIZE_BYTES, COUNTRIES_LIST } from '../constants';

enum AdminSection {
  Users = "users",
  Videos = "videos",
  Recipes = "recipes",
  Pdfs = "pdfs", 
  Subscriptions = "subscriptions",
  SubscriptionPlans = "subscription_plans",
  GlobalNotifications = "global_notifications",
  Transformations = "transformations", // New section
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
        if (onClick) onClick(); // For closing mobile sidebar
      }}
      className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 w-full text-right rtl:text-left
        ${activeSection === section ? `bg-${THEME_COLORS.primary} text-white shadow-lg` : `text-slate-300 hover:bg-slate-700 hover:text-white`}`}
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
    videos: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M3.5 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0v-.75A2.25 2.25 0 015.75 16h8.5A2.25 2.25 0 0116.5 13.75V6.25A2.25 2.25 0 0114.25 4h-8.5A2.25 2.25 0 013.5 6.25V2.75zM6.5 5A.5.5 0 017 4.5h6a.5.5 0 01.5.5v10a.5.5 0 01-.5.5H7a.5.5 0 01-.5-.5V5z" /><path d="M9.027 7.532a.5.5 0 01.746-.43l3.002 1.716a.5.5 0 010 .859l-3.002 1.716a.5.5 0 01-.746-.43V7.532z" /></svg>,
    recipes: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M10 1a2.5 2.5 0 00-2.5 2.5V8a.5.5 0 00.5.5h4a.5.5 0 00.5-.5V3.5A2.5 2.5 0 0010 1zM8.5 3.5a1 1 0 011-1h1a1 1 0 011 1V4h-3V3.5z" /><path d="M10.22 8.906a1.502 1.502 0 00-.44 0C9.346 8.906 9 9.252 9 9.69V14.5a.5.5 0 00.5.5h1a.5.5 0 00.5-.5V9.69c0-.438-.346-.784-.78-.784z" /><path fillRule="evenodd" d="M15.5 10.25a.75.75 0 00-.75-.75H5.25a.75.75 0 000 1.5h3.12V14.5A1.5 1.5 0 009.87 16h.26a1.5 1.5 0 001.495-1.5V11h3.125a.75.75 0 00.75-.75zM10 11.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>,
    notifications: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>,
    transformations: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path fillRule="evenodd" d="M1.5 3A1.5 1.5 0 013 1.5h14A1.5 1.5 0 0118.5 3V17a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 17V3zm1.75 11.5a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5a.75.75 0 01-.75-.75zm.75-3.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zM5.25 6A.75.75 0 016 5.25h3A.75.75 0 019.75 6v.75H6A.75.75 0 015.25 6zM10.5 6V5.25A.75.75 0 0111.25 4.5h3A.75.75 0 0115 5.25V6h-.75A.75.75 0 0113.5 6.75v3A.75.75 0 0112.75 10.5H11.25A.75.75 0 0110.5 9.75v-3z" clipRule="evenodd" /></svg>,
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 sm:gap-6 lg:gap-8 min-h-[calc(100vh-12rem)]">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden p-2 sticky top-16 bg-slate-800 z-30 shadow-md">
        <Button onClick={() => setIsSidebarOpen(!isSidebarOpen)} variant="ghost" className="w-full">
          {isSidebarOpen ? 'إخفاء القائمة' : t('adminNavigation', 'لوحة التحكم')}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ms-2">
            <path strokeLinecap="round" strokeLinejoin="round" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
          </svg>
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'block' : 'hidden'} md:block 
        w-full md:w-60 lg:w-64 xl:w-72 
        bg-${THEME_COLORS.surface} p-3 sm:p-5 rounded-xl shadow-2xl space-y-2 sm:space-y-3 
        md:self-start md:sticky md:top-24 transition-all duration-300 ease-in-out mb-4 md:mb-0
      `}>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 border-b border-slate-700 pb-2 sm:pb-3">{t('adminNavigation', 'لوحة التحكم')}</h2>
        <NavItem section={AdminSection.Subscriptions} label={t('approveSubscriptions')} icon={NavIcons.subscriptions} onClick={() => setIsSidebarOpen(false)} />
        <NavItem section={AdminSection.SubscriptionPlans} label={t('manageSubscriptionPlans')} icon={NavIcons.plans} onClick={() => setIsSidebarOpen(false)} />
        {isSiteManager && ( 
            <NavItem section={AdminSection.Users} label={t('manageUsers')} icon={NavIcons.users} onClick={() => setIsSidebarOpen(false)} />
        )}
        <NavItem section={AdminSection.Pdfs} label={t('managePdfs')} icon={NavIcons.pdfs} onClick={() => setIsSidebarOpen(false)} />
        <NavItem section={AdminSection.Videos} label={t('manageVideos')} icon={NavIcons.videos} onClick={() => setIsSidebarOpen(false)} />
        <NavItem section={AdminSection.Recipes} label={t('manageRecipes')} icon={NavIcons.recipes} onClick={() => setIsSidebarOpen(false)} />
        <NavItem section={AdminSection.Transformations} label={t('manageTransformations')} icon={NavIcons.transformations} onClick={() => setIsSidebarOpen(false)} />
        {isSiteManager && (
            <NavItem section={AdminSection.GlobalNotifications} label={t('globalNotifications')} icon={NavIcons.notifications} onClick={() => setIsSidebarOpen(false)} />
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-grow">
        <Card className="p-4 sm:p-6 md:p-8 min-h-full shadow-2xl">
            {activeSection === AdminSection.Users && isSiteManager && <ManageUsersSection />}
            {activeSection === AdminSection.Videos && <ManageVideosSection />}
            {activeSection === AdminSection.Recipes && <ManageRecipesSection />}
            {activeSection === AdminSection.Pdfs && <ManagePdfsSection />}
            {activeSection === AdminSection.Subscriptions && <ApproveSubscriptionsSection />}
            {activeSection === AdminSection.SubscriptionPlans && <ManageSubscriptionPlansSection />}
            {activeSection === AdminSection.GlobalNotifications && isSiteManager && <SendGlobalNotificationSection />}
            {activeSection === AdminSection.Transformations && <ManageTransformationsSection />}
        </Card>
      </main>
    </div>
  );
};


// Sections (Local Components within AdminPage)

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

  const fetchUsers = () => {
    setUsers(DataService.getUsers());
  }

  useEffect(() => {
    fetchUsers();
    setLoading(false);
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

  // Role Change Handlers
  const handleRoleChange = () => {
    if (!currentUser || !isSiteManager || !userForRoleChange || !roleConfirmAction) return;

    if (userForRoleChange.email === ADMIN_EMAIL && roleConfirmAction === 'demote') {
      showFeedback('error', 'cannotDemoteSelf');
      closeRoleConfirmModal();
      return;
    }
    const newRole = roleConfirmAction === 'promote' ? UserRole.ADMIN : UserRole.USER;
    try {
      DataService.updateUser({ ...userForRoleChange, role: newRole }, currentUser.id);
      fetchUsers();
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

  // Edit User Info Handlers
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
  const handleSaveUserInfo = (updatedUserData: Partial<User>) => {
    if (!currentUser || !isSiteManager || !userToEdit) return;
    try {
        DataService.updateUser({ ...userToEdit, ...updatedUserData, id: userToEdit.id }, currentUser.id);
        fetchUsers();
        showFeedback('success', 'userInfoUpdatedSuccess');
        closeEditUserModal();
    } catch (error: any) {
        showFeedback('error', error.message || 'errorOccurred');
        // Keep modal open if error
    }
  };

  // Delete User Handlers
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
  const handleConfirmDeleteUser = () => {
    if (!currentUser || !isSiteManager || !userToDelete) return;
    try {
      DataService.deleteUser(userToDelete.id, currentUser.id);
      fetchUsers();
      showFeedback('success', 'userDeletedSuccess');
    } catch (error: any) {
      showFeedback('error', error.message || 'errorOccurred');
    }
    closeDeleteUserModal();
  };

  const getRoleText = (role: UserRole) => {
    if (role === UserRole.SITE_MANAGER) return t('siteManager');
    if (role === UserRole.ADMIN) return t('adminPanel'); // "Admin"
    return t('user'); // "User"
  }
  
  const getCountryName = (countryCode?: string) => {
    if (!countryCode) return 'N/A';
    const country = COUNTRIES_LIST.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  if (loading) return <Spinner />;
  if (!isSiteManager) {
      return <p>{t('adminAccessOnly')}</p>;
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">{t('manageUsers')}</h2>
      {feedback.message && <p className={`mb-4 p-3 rounded text-sm ${feedback.type === 'success' ? `bg-${THEME_COLORS.success} bg-opacity-20 text-green-300` : `bg-${THEME_COLORS.error} bg-opacity-20 text-red-300`}`}>{feedback.message}</p>}
      <div className="overflow-x-auto shadow-md rounded-lg border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className={`bg-${THEME_COLORS.surface} bg-opacity-50`}>
            <tr>
              <th scope="col" className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-slate-300 uppercase tracking-wider">{t('name')}</th>
              <th scope="col" className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-slate-300 uppercase tracking-wider">{t('email')}</th>
              <th scope="col" className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t('phoneNumber')}</th>
              <th scope="col" className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-slate-300 uppercase tracking-wider hidden md:table-cell">{t('country')}</th>
              <th scope="col" className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-slate-300 uppercase tracking-wider">{t('role', 'الدور')}</th>
              <th scope="col" className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t('subscriptionStatus', 'حالة الاشتراك')}</th>
              <th scope="col" className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 text-right font-medium text-slate-300 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className={`bg-${THEME_COLORS.surface} divide-y divide-slate-700`}>
            {users.map(user => {
              const isTargetSiteManager = user.email === ADMIN_EMAIL && user.role === UserRole.SITE_MANAGER;
              const isSelf = user.id === currentUser?.id;
              return (
                <tr key={user.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 whitespace-nowrap text-white">{user.name}</td>
                  <td className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 whitespace-nowrap text-slate-300">{user.email}</td>
                  <td className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 whitespace-nowrap text-slate-300 hidden sm:table-cell">{user.phoneNumber || 'N/A'}</td>
                  <td className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 whitespace-nowrap text-slate-300 hidden md:table-cell">{getCountryName(user.country)}</td>
                  <td className="px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3 whitespace-nowrap text-slate-300">{getRoleText(user.role)}</td>
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
        <Modal
          isOpen={isRoleConfirmModalOpen}
          onClose={closeRoleConfirmModal}
          title={t('confirm', 'تأكيد الإجراء')}
        >
          <p className="text-slate-300 mb-6 text-sm sm:text-base">
            {roleConfirmAction === 'promote' ? t('confirmPromotion') : t('confirmDemotion')}
            <strong className="mx-1">{userForRoleChange.name} ({userForRoleChange.email})</strong>?
          </p>
          <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3">
            <Button variant="ghost" onClick={closeRoleConfirmModal} size="sm">{t('cancel')}</Button>
            <Button
              variant={roleConfirmAction === 'promote' ? 'primary' : 'danger'}
              onClick={handleRoleChange}
              size="sm"
            >
              {t('confirm')}
            </Button>
          </div>
        </Modal>
      )}
      {isEditUserModalOpen && userToEdit && (
        <EditUserInfoModal
            isOpen={isEditUserModalOpen}
            onClose={closeEditUserModal}
            userToEdit={userToEdit}
            onSave={handleSaveUserInfo}
            t={t}
        />
      )}
      {isDeleteUserModalOpen && userToDelete && (
        <Modal
          isOpen={isDeleteUserModalOpen}
          onClose={closeDeleteUserModal}
          title={t('deleteUser')}
        >
          <p className="text-slate-300 mb-6 text-sm sm:text-base">
            {t('confirmDeleteUser', 'هل أنت متأكد أنك تريد حذف المستخدم {userName}؟').replace('{userName}', userToDelete.name)}
          </p>
          <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3">
            <Button variant="ghost" onClick={closeDeleteUserModal} size="sm">{t('cancel')}</Button>
            <Button variant="danger" onClick={handleConfirmDeleteUser} size="sm">{t('confirm')}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

interface EditUserInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToEdit: User;
    onSave: (updatedData: Partial<User>) => void;
    t: (key: string, subkey?: string) => string;
}

const EditUserInfoModal: React.FC<EditUserInfoModalProps> = ({ isOpen, onClose, userToEdit, onSave, t}) => {
    const [name, setName] = useState(userToEdit.name);
    const [email, setEmail] = useState(userToEdit.email);
    const [phoneNumber, setPhoneNumber] = useState(userToEdit.phoneNumber || '');
    const [country, setCountry] = useState(userToEdit.country || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [modalError, setModalError] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setModalError('');

        if (!phoneNumber.trim()) {
            setModalError(t('fieldRequired') + ` (${t('phoneNumber')})`);
            return;
        }
        if (!country) {
            setModalError(t('pleaseSelectCountry'));
            return;
        }

        if (newPassword && newPassword !== confirmNewPassword) {
            setModalError(t('passwordsDoNotMatch'));
            return;
        }
        if (email !== userToEdit.email && !window.confirm(t('confirmEmailChange'))) {
            // User cancelled email change prompt
            return;
        }
        
        const updatedData: Partial<User> = { name, email, phoneNumber, country };
        if (newPassword) {
            updatedData.password = newPassword; 
        }
        onSave(updatedData);
    };
    
    useEffect(() => {
        setName(userToEdit.name);
        setEmail(userToEdit.email);
        setPhoneNumber(userToEdit.phoneNumber || '');
        setCountry(userToEdit.country || '');
        setNewPassword('');
        setConfirmNewPassword('');
        setModalError('');
    }, [userToEdit]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('editUserInfo')} size="lg">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <Input label={t('name')} value={name} onChange={e => setName(e.target.value)} required />
                <Input label={t('email')} type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                       disabled={userToEdit.email === ADMIN_EMAIL} 
                />
                <div>
                    <label htmlFor="country-edit" className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('country')}</label>
                    <select 
                        id="country-edit" 
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
                <Input label={t('phoneNumber')} type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required/>
                <Input label={t('newPassword') + ` (${t('optional')})`} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="اترك الحقل فارغًا لعدم التغيير" />
                <Input label={t('confirmNewPassword') + ` (${t('optional')})`} type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} disabled={!newPassword} />
                
                {modalError && <p className="text-xs sm:text-sm text-red-400">{modalError}</p>}
                <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-700">
                    <Button type="button" variant="ghost" onClick={onClose} size="sm">{t('cancel')}</Button>
                    <Button type="submit" size="sm">{t('saveChanges')}</Button>
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

  useEffect(() => {
    setVideos(DataService.getWorkoutVideos());
    setLoading(false);
  }, []);

  const openModalForAdd = () => {
    setCurrentVideo({ title: '', description: '', videoUrl: '', durationMinutes: 10, category: 'Cardio' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (video: WorkoutVideo) => {
    setCurrentVideo(video);
    setIsModalOpen(true);
  };

  const handleDelete = (videoId: string) => {
    if (window.confirm(t('confirmDeleteVideo', 'هل أنت متأكد أنك تريد حذف هذا الفيديو؟'))) {
      DataService.deleteWorkoutVideo(videoId);
      setVideos(DataService.getWorkoutVideos()); 
    }
  };
  
  const handleSaveVideo = (videoData: Partial<WorkoutVideo>) => {
    if (!currentUser) return;
    if (videoData.id) { 
        DataService.updateWorkoutVideo(videoData as WorkoutVideo);
    } else { 
        DataService.addWorkoutVideo(videoData as Omit<WorkoutVideo, 'id' | 'uploadDate' | 'uploadedBy'>, currentUser.id);
    }
    setVideos(DataService.getWorkoutVideos()); 
    setIsModalOpen(false);
    setCurrentVideo(null);
  };


  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">{t('manageVideos')}</h2>
        <Button onClick={openModalForAdd} variant="primary" size="md">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 me-1 sm:me-2">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          {t('addVideo')}
        </Button>
      </div>
      {videos.length === 0 && <p className="text-slate-400 text-center py-8">{t('noVideosFound')}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {videos.map(video => (
          <Card key={video.id} className="p-3 sm:p-4 flex flex-col">
            <img src={video.thumbnailUrl || `https://picsum.photos/seed/${video.id}/300/180`} alt={video.title} className="w-full h-32 sm:h-40 object-cover rounded-lg mb-2 sm:mb-3 shadow-md"/>
            <h3 className={`text-md sm:text-lg font-semibold text-${THEME_COLORS.primary}`}>{video.title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 my-1 flex-grow">{video.description.substring(0, 70)}{video.description.length > 70 && '...'}</p>
            <div className="text-xs text-slate-400 mt-2">
                <span>{t('category')}: {t(video.category.toLowerCase(), video.category)}</span> | <span>{t('duration')}: {video.durationMinutes} {t('minutes')}</span>
            </div>
            <div className="mt-3 sm:mt-4 flex gap-1 sm:gap-2 border-t border-slate-700 pt-2 sm:pt-3">
                <Button onClick={() => openModalForEdit(video)} size="sm" variant="secondary" className="!text-xs !px-2 !py-1">{t('edit')}</Button>
                <Button onClick={() => handleDelete(video.id)} size="sm" variant="danger" className="!text-xs !px-2 !py-1">{t('delete')}</Button>
            </div>
          </Card>
        ))}
      </div>
      {isModalOpen && currentVideo && (
        <VideoFormModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setCurrentVideo(null); }}
            videoData={currentVideo}
            onSave={handleSaveVideo}
        />
      )}
    </div>
  );
};

interface VideoFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoData: Partial<WorkoutVideo>;
    onSave: (data: Partial<WorkoutVideo>) => void;
}
const VideoFormModal: React.FC<VideoFormModalProps> = ({ isOpen, onClose, videoData, onSave }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState<Partial<WorkoutVideo>>(videoData);
    
    useEffect(() => setFormData(videoData), [videoData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'durationMinutes' ? parseInt(value) : value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
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
                    <select id="category" name="category" value={formData.category || 'Cardio'} onChange={handleChange} className={`w-full bg-slate-700 border border-slate-600 text-white text-xs sm:text-sm rounded-lg focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} block p-2 sm:p-2.5`}>
                        {videoCategories.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase(), cat)}</option>)}
                    </select>
                </div>
                <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 border-t border-slate-700 mt-1 sm:mt-2">
                    <Button type="button" variant="ghost" onClick={onClose} size="sm">{t('cancel')}</Button>
                    <Button type="submit" size="sm">{t('saveChanges')}</Button>
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

  useEffect(() => {
    setRecipes(DataService.getRecipes());
    setLoading(false);
  }, []);
  
  const openModalForAdd = () => {
    setCurrentRecipe({ name: '', description: '', ingredients: [{item: '', quantity: ''}], instructions: [''], prepTimeMinutes: 10, cookTimeMinutes: 20, servings: 2, category: 'Breakfast' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    setIsModalOpen(true);
  };
  
  const handleDelete = (recipeId: string) => {
    if (window.confirm(t('confirmDeleteRecipe', 'هل أنت متأكد أنك تريد حذف هذه الوصفة؟'))) {
      DataService.deleteRecipe(recipeId);
      setRecipes(DataService.getRecipes());
    }
  };

  const handleSaveRecipe = (recipeData: Partial<Recipe>) => {
    if (!currentUser) return;
    if (recipeData.id) {
        DataService.updateRecipe(recipeData as Recipe);
    } else {
        DataService.addRecipe(recipeData as Omit<Recipe, 'id' | 'uploadDate' | 'uploadedBy'>, currentUser.id);
    }
    setRecipes(DataService.getRecipes());
    setIsModalOpen(false);
    setCurrentRecipe(null);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">{t('manageRecipes')}</h2>
         <Button onClick={openModalForAdd} variant="primary" size="md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 me-1 sm:me-2">
             <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            {t('addRecipe')}
        </Button>
      </div>
      {recipes.length === 0 && <p className="text-slate-400 text-center py-8">{t('noRecipesFound')}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {recipes.map(recipe => (
          <Card key={recipe.id} className="p-3 sm:p-4 flex flex-col">
            <img src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/300/200`} alt={recipe.name} className="w-full h-32 sm:h-40 object-cover rounded-lg mb-2 sm:mb-3 shadow-md"/>
            <h3 className={`text-md sm:text-lg font-semibold text-${THEME_COLORS.primary}`}>{recipe.name}</h3>
            <p className="text-xs sm:text-sm text-slate-300 my-1 flex-grow">{recipe.description.substring(0, 70)}{recipe.description.length > 70 && '...'}</p>
             <div className="text-xs text-slate-400 mt-2">
                <span>{t('category')}: {t(recipe.category.toLowerCase(), recipe.category)}</span> | <span>{t('servings')}: {recipe.servings}</span>
            </div>
             <div className="mt-3 sm:mt-4 flex gap-1 sm:gap-2 border-t border-slate-700 pt-2 sm:pt-3">
                <Button onClick={() => openModalForEdit(recipe)} size="sm" variant="secondary" className="!text-xs !px-2 !py-1">{t('edit')}</Button>
                <Button onClick={() => handleDelete(recipe.id)} size="sm" variant="danger" className="!text-xs !px-2 !py-1">{t('delete')}</Button>
            </div>
          </Card>
        ))}
      </div>
      {isModalOpen && currentRecipe && (
        <RecipeFormModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setCurrentRecipe(null); }}
            recipeData={currentRecipe}
            onSave={handleSaveRecipe}
        />
      )}
    </div>
  );
};


interface RecipeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipeData: Partial<Recipe>;
    onSave: (data: Partial<Recipe>) => void;
}

const RecipeFormModal: React.FC<RecipeFormModalProps> = ({ isOpen, onClose, recipeData, onSave }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState<Partial<Recipe>>(recipeData);
    
    useEffect(() => setFormData(recipeData), [recipeData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['prepTimeMinutes', 'cookTimeMinutes', 'servings', 'calories'];
        setFormData(prev => ({ ...prev, [name]: numericFields.includes(name) ? parseInt(value) || 0 : value }));
    };

    const handleIngredientChange = (index: number, field: 'item' | 'quantity', value: string) => {
        const newIngredients = [...(formData.ingredients || [])];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    };
    const addIngredientField = () => setFormData(prev => ({ ...prev, ingredients: [...(prev.ingredients || []), {item: '', quantity: ''}] }));
    const removeIngredientField = (index: number) => setFormData(prev => ({ ...prev, ingredients: (prev.ingredients || []).filter((_, i) => i !== index) }));
    
    const handleInstructionChange = (index: number, value: string) => {
        const newInstructions = [...(formData.instructions || [])];
        newInstructions[index] = value;
        setFormData(prev => ({ ...prev, instructions: newInstructions }));
    };
    const addInstructionField = () => setFormData(prev => ({ ...prev, instructions: [...(prev.instructions || []), ''] }));
    const removeInstructionField = (index: number) => setFormData(prev => ({ ...prev, instructions: (prev.instructions || []).filter((_, i) => i !== index) }));

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
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
                    <select id="recipeCategory" name="category" value={formData.category || 'Breakfast'} onChange={handleChange} className={`w-full bg-slate-700 border border-slate-600 text-white text-xs sm:text-sm rounded-lg focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} block p-2 sm:p-2.5`}>
                        {recipeCategories.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase(), cat)}</option>)}
                    </select>
                </div>

                <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-700">
                    <Button type="button" variant="ghost" onClick={onClose} size="sm">{t('cancel')}</Button>
                    <Button type="submit" size="sm">{t('saveChanges')}</Button>
                </div>
            </form>
        </Modal>
    );
};


// PDF Management Section
const ManagePdfsSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser } = useAuth();
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPdf, setCurrentPdf] = useState<Partial<PdfDocument> & { file?: File } | null>(null);
  const [feedback, setFeedback] = useState({type: '', message: ''});
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    setPdfs(DataService.getPdfDocuments());
    setAllUsers(DataService.getUsers().filter(u => u.role === UserRole.USER)); 
    setLoading(false);
  }, []);

  const refreshPdfs = () => {
    setPdfs(DataService.getPdfDocuments());
  };

  const openModalForAdd = () => {
    setCurrentPdf({ description: '', assignedUserIds: [] });
    setIsModalOpen(true);
  };

  const openModalForEdit = (pdf: PdfDocument) => {
    setCurrentPdf({ ...pdf }); 
    setIsModalOpen(true);
  };

  const handleDelete = (pdfId: string) => {
    if (window.confirm(t('confirmDeletePdf'))) {
      DataService.deletePdfDocument(pdfId);
      refreshPdfs();
      setFeedback({type: 'success', message: t('pdfDeletedSuccess')});
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    }
  };
  
  const handleSavePdf = async (pdfData: Partial<PdfDocument> & { file?: File }) => {
    if (!currentUser) return;
    setLoading(true);
    setFeedback({type: '', message: ''});

    try {
      if (pdfData.id) { 
        DataService.updatePdfDocument(pdfData as PdfDocument);
        setFeedback({type: 'success', message: t('pdfUpdatedSuccess')});
      } else if (pdfData.file) { 
        await DataService.addPdfDocument(
          { description: pdfData.description || '', assignedUserIds: pdfData.assignedUserIds || [] },
          pdfData.file,
          currentUser.id
        );
        setFeedback({type: 'success', message: t('pdfUploadedSuccess')});
      } else {
        throw new Error("File is required for new PDF upload.");
      }
      refreshPdfs();
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

  if (loading && !isModalOpen) return <Spinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">{t('managePdfs')}</h2>
        <Button onClick={openModalForAdd} isLoading={loading && isModalOpen} variant="primary" size="md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 me-1 sm:me-2">
                <path d="M9.25 3.25a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
            </svg>
            {t('uploadPdf')}
        </Button>
      </div>
      {feedback.message && <p className={`mb-4 p-3 rounded text-sm ${feedback.type === 'success' ? `bg-${THEME_COLORS.success} bg-opacity-20 text-green-300` : `bg-${THEME_COLORS.error} bg-opacity-20 text-red-300`}`}>{feedback.message}</p>}
      
      {pdfs.length === 0 && <p className="text-slate-400 text-center py-8">{t('noPdfsUploaded')}</p>}
      <div className="space-y-3 sm:space-y-4">
        {pdfs.map(pdf => (
          <Card key={pdf.id} className="p-3 sm:p-4 hover:border-sky-500">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 md:gap-4">
                <div className="flex-grow">
                    <h3 className={`text-lg sm:text-xl font-semibold text-${THEME_COLORS.primary} break-all`}>{pdf.fileName}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">{pdf.description}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('uploadDate')}: {new Date(pdf.uploadDate).toLocaleDateString('ar-EG')}</p>
                     {pdf.assignedUserIds.length > 0 && (
                        <div className="mt-1.5 sm:mt-2">
                            <p className="text-xs font-semibold text-slate-200">{t('assignedUsers')}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                            {pdf.assignedUserIds.map(userId => {
                                const user = allUsers.find(u => u.id === userId);
                                return user ? <span key={userId} className="text-xs bg-slate-600 text-slate-200 px-1.5 py-0.5 sm:px-2 rounded-full">{user.name}</span> : null;
                            })}
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
      {isModalOpen && currentPdf && (
        <PdfFormModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setCurrentPdf(null); }}
            pdfData={currentPdf}
            onSave={handleSavePdf}
            allUsers={allUsers}
            isLoading={loading && isModalOpen}
        />
      )}
    </div>
  );
};

interface PdfFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfData: Partial<PdfDocument> & { file?: File };
    onSave: (data: Partial<PdfDocument> & { file?: File }) => void;
    allUsers: User[];
    isLoading: boolean;
}
const PdfFormModal: React.FC<PdfFormModalProps> = ({ isOpen, onClose, pdfData, onSave, allUsers, isLoading }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState<Partial<PdfDocument> & { file?: File }>(pdfData);
    const [fileError, setFileError] = useState<string>('');
    
    useEffect(() => setFormData(pdfData), [pdfData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFileError('');
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > PDF_MAX_SIZE_BYTES) {
                setFileError(`File is too large. Max size: ${PDF_MAX_SIZE_BYTES / (1024*1024)}MB`);
                setFormData(prev => ({ ...prev, file: undefined }));
                return;
            }
            if (file.type !== "application/pdf") {
                setFileError("Invalid file type. Only PDF files are allowed.");
                setFormData(prev => ({ ...prev, file: undefined }));
                return;
            }
            setFormData(prev => ({ ...prev, file }));
        }
    };
    
    const handleUserAssignmentChange = (userId: string) => {
        setFormData(prev => {
            const assignedUserIds = prev.assignedUserIds ? [...prev.assignedUserIds] : [];
            const userIndex = assignedUserIds.indexOf(userId);
            if (userIndex > -1) {
                assignedUserIds.splice(userIndex, 1); 
            } else {
                assignedUserIds.push(userId); 
            }
            return { ...prev, assignedUserIds };
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!formData.id && !formData.file) { 
            setFileError("Please select a PDF file to upload.");
            return;
        }
        if (fileError && formData.file) return; 
        onSave(formData);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? t('editPdfAssignments') : t('uploadPdf')} size="lg">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 max-h-[75vh] overflow-y-auto p-1">
                {!formData.id && ( 
                    <div>
                        <label htmlFor="pdfFile" className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('selectPdfFile')}</label>
                        <Input id="pdfFile" name="file" type="file" accept=".pdf" onChange={handleFileChange} required={!formData.id} />
                        {fileError && <p className="text-xs text-red-400 mt-1">{fileError}</p>}
                    </div>
                )}
                {formData.id && formData.fileName && <p className="text-sm text-slate-300">{t('pdfFileName')}: {formData.fileName}</p>}
                <Textarea label={t('pdfDescription')} name="description" value={formData.description || ''} onChange={handleChange} required />
                
                {allUsers.length > 0 && (
                <div>
                    <h4 className="text-sm sm:text-md font-semibold mb-1.5 sm:mb-2 text-white">{t('selectUsersToAssign')}</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 sm:space-y-2 border border-slate-600 p-2 sm:p-3 rounded-md">
                        {allUsers.map(user => (
                            <label key={user.id} className="flex items-center gap-2 text-xs sm:text-sm text-slate-200 cursor-pointer hover:bg-slate-700 p-1 rounded">
                                <input 
                                    type="checkbox" 
                                    checked={formData.assignedUserIds?.includes(user.id) || false}
                                    onChange={() => handleUserAssignmentChange(user.id)}
                                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 bg-slate-600 border-slate-500 text-${THEME_COLORS.primary} focus:ring-${THEME_COLORS.primary} rounded`}
                                />
                                {user.name} ({user.email})
                            </label>
                        ))}
                    </div>
                </div>
                )}

                <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-700">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} size="sm">{t('cancel')}</Button>
                    <Button type="submit" isLoading={isLoading} disabled={isLoading} size="sm">{t('saveChanges')}</Button>
                </div>
            </form>
        </Modal>
    );
};



// Subscription Approval
const ApproveSubscriptionsSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [durations, setDurations] = useState<{[key: string]: string}>({});

  useEffect(() => {
    setRequests(DataService.getSubscriptionRequests().filter(r => r.status === SubscriptionStatus.PENDING));
    setLoading(false);
  }, []);
  
  const handleAction = (requestId: string, action: 'approve' | 'reject') => {
    if(!currentUser) return;
    const duration = parseInt(durations[requestId] || '0');
    if (action === 'approve' && (isNaN(duration) || duration <= 0)) {
      alert(t('daysDurationHelp', 'يرجى إدخال مدة صالحة بالأيام.'));
      return;
    }
    if (action === 'approve') {
      DataService.approveSubscription(requestId, currentUser.id, duration);
    } else {
      const notes = prompt(t('adminNotes', 'أدخل ملاحظات الرفض (اختياري):'));
      DataService.rejectSubscription(requestId, currentUser.id, notes || undefined);
    }
    setRequests(DataService.getSubscriptionRequests().filter(r => r.status === SubscriptionStatus.PENDING));
  };
  
  const handleDurationChange = (requestId: string, value: string) => {
    setDurations(prev => ({...prev, [requestId]: value}));
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">{t('pendingSubscriptions')}</h2>
      {requests.length === 0 ? (
        <p className="text-slate-400 text-center py-8">{t('noPendingSubscriptions')}</p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {requests.map(request => (
            <Card key={request.id} className="p-3 sm:p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-end gap-3 sm:gap-4">
                    <div className="text-xs sm:text-sm">
                        <p className="font-semibold text-white">{request.userEmail}</p>
                        <p className="text-slate-400">{t('plan')}: {request.planNameSnapshot}</p>
                        <p className="text-slate-400">{t('requested')}: {new Date(request.requestDate).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <Input
                        label={t('setDuration', 'تحديد المدة (أيام)')}
                        type="number"
                        placeholder={t('durationDaysPlaceholder', 'مثال: 30')}
                        value={durations[request.id] || ''}
                        onChange={(e) => handleDurationChange(request.id, e.target.value)}
                        className="w-full lg:w-auto !text-xs sm:!text-sm"
                    />
                     <div className="flex flex-col xs:flex-row gap-1 sm:gap-2 justify-end items-stretch lg:col-span-2 xl:col-span-2"> {/* Ensure buttons take full width on small, then adjust */}
                        <Button onClick={() => handleAction(request.id, 'approve')} variant="secondary" size="sm" className="w-full xs:w-auto !text-xs !px-2 !py-1">{t('approve')}</Button>
                        <Button onClick={() => handleAction(request.id, 'reject')} variant="danger" size="sm" className="w-full xs:w-auto !text-xs !px-2 !py-1">{t('reject')}</Button>
                    </div>
                </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Subscription Plan Management
const ManageSubscriptionPlansSection: React.FC = () => {
  const { t } = useLocalization();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<SubscriptionPlan> | null>(null);
  
  useEffect(() => {
    setPlans(DataService.getSubscriptionPlans());
    setLoading(false);
  }, []);

  const openModalForAdd = () => {
    setCurrentPlan({ name: '', price: 0, currency: 'USD', description: '', features: [{id: 'feat_new_1', text: ''}] });
    setIsModalOpen(true);
  };

  const openModalForEdit = (plan: SubscriptionPlan) => {
    setCurrentPlan(plan);
    setIsModalOpen(true);
  };

  const handleDelete = (planId: string) => {
    if (window.confirm(t('confirmDeletePlan', 'هل أنت متأكد أنك تريد حذف خطة الاشتراك هذه؟ قد يكون هناك مستخدمون مشتركون بها.'))) {
      DataService.deleteSubscriptionPlan(planId);
      setPlans(DataService.getSubscriptionPlans());
    }
  };
  
  const handleSavePlan = (planData: Partial<SubscriptionPlan>) => {
    if (planData.id) {
        DataService.updateSubscriptionPlan(planData as SubscriptionPlan);
    } else {
        DataService.addSubscriptionPlan(planData as Omit<SubscriptionPlan, 'id'>);
    }
    setPlans(DataService.getSubscriptionPlans());
    setIsModalOpen(false);
    setCurrentPlan(null);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">{t('manageSubscriptionPlans')}</h2>
        <Button onClick={openModalForAdd} variant="primary" size="md">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 me-1 sm:me-2">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
           </svg>
           {t('addSubscriptionPlan')}
        </Button>
      </div>
      {plans.length === 0 && <p className="text-slate-400 text-center py-8">{t('noPlansDefined')}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className="p-3 sm:p-4 flex flex-col">
            <h3 className={`text-md sm:text-lg font-semibold text-${THEME_COLORS.primary}`}>{plan.name}</h3>
            <p className="text-lg sm:text-xl font-bold my-1">{plan.price} <span className="text-xs text-slate-400">{plan.currency}</span></p>
            <p className="text-xs sm:text-sm text-slate-300 mb-2">{plan.description}</p>
            <ul className="list-disc list-inside text-slate-200 text-xs space-y-0.5 mb-3 flex-grow">
                {plan.features.map(f => <li key={f.id}>{f.text}</li>)}
            </ul>
            <div className="mt-3 sm:mt-4 flex gap-1 sm:gap-2 border-t border-slate-700 pt-2 sm:pt-3">
                <Button onClick={() => openModalForEdit(plan)} size="sm" variant="secondary" className="!text-xs !px-2 !py-1">{t('edit')}</Button>
                <Button onClick={() => handleDelete(plan.id)} size="sm" variant="danger" className="!text-xs !px-2 !py-1">{t('delete')}</Button>
            </div>
          </Card>
        ))}
      </div>
      {isModalOpen && currentPlan && (
        <SubscriptionPlanFormModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setCurrentPlan(null); }}
            planData={currentPlan}
            onSave={handleSavePlan}
        />
      )}
    </div>
  );
};

interface SubscriptionPlanFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    planData: Partial<SubscriptionPlan>;
    onSave: (data: Partial<SubscriptionPlan>) => void;
}

const SubscriptionPlanFormModal: React.FC<SubscriptionPlanFormModalProps> = ({ isOpen, onClose, planData, onSave }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState<Partial<SubscriptionPlan>>(planData);
    
    useEffect(() => setFormData(planData), [planData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };
    
    const handleFeatureChange = (index: number, text: string) => {
        const newFeatures = [...(formData.features || [])];
        newFeatures[index] = {...newFeatures[index], text};
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeatureField = () => {
        const newId = `feat_${Date.now()}_${(formData.features?.length || 0)}`;
        setFormData(prev => ({ ...prev, features: [...(prev.features || []), {id: newId, text: ''}] }));
    };
    
    const removeFeatureField = (index: number) => {
        setFormData(prev => ({ ...prev, features: (prev.features || []).filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? t('editSubscriptionPlan') : t('addSubscriptionPlan')} size="lg">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <Input label={t('planName')} name="name" value={formData.name || ''} onChange={handleChange} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Input label={t('planPrice')} name="price" type="number" step="0.01" value={formData.price || ''} onChange={handleChange} placeholder={t('pricePlaceholder', 'مثال: 29.99')} required />
                    <Input label={t('planCurrency')} name="currency" value={formData.currency || ''} onChange={handleChange} placeholder={t('currencyPlaceholder', 'مثال: USD أو SAR')} required />
                </div>
                <Textarea label={t('planDescription')} name="description" value={formData.description || ''} onChange={handleChange} required />
                
                <div>
                    <h4 className="text-sm sm:text-md font-semibold mb-1">{t('planFeatures')}</h4>
                    {(formData.features || []).map((feature, index) => (
                        <div key={feature.id || index} className="flex gap-1 sm:gap-2 mb-1 sm:mb-2 items-center">
                            <Input 
                                placeholder={t('featureText', 'نص الميزة')} 
                                value={feature.text} 
                                onChange={e => handleFeatureChange(index, e.target.value)} 
                                className="flex-grow !text-xs sm:!text-sm"
                            />
                            <Button type="button" variant="danger" size="sm" onClick={() => removeFeatureField(index)} disabled={(formData.features?.length || 0) <= 1} className="!px-2 !py-1">X</Button>
                        </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={addFeatureField} className="!text-xs !px-2 !py-1">{t('addFeature')}</Button>
                </div>

                <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-700">
                    <Button type="button" variant="ghost" onClick={onClose} size="sm">{t('cancel')}</Button>
                    <Button type="submit" size="sm">{t('saveChanges')}</Button>
                </div>
            </form>
        </Modal>
    );
};

// Send Global Notification Section
const SendGlobalNotificationSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser, isSiteManager } = useAuth();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({type: '', message: ''});

  const handleSendNotification = () => {
    if (!currentUser || !message.trim()) return;
    setIsLoading(true);
    setFeedback({type: '', message: ''});
    try {
      DataService.addGlobalNotification(message, currentUser.id);
      setMessage('');
      setFeedback({type: 'success', message: t('notificationSentSuccess')});
    } catch (error: any) {
      setFeedback({type: 'error', message: error.message || t('errorOccurred')});
    } finally {
      setIsLoading(false);
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    }
  };
  
  if (!isSiteManager) return <p>{t('adminAccessOnly')}</p>;

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">{t('sendGlobalNotification')}</h2>
      {feedback.message && <p className={`mb-4 p-3 rounded text-sm ${feedback.type === 'success' ? `bg-${THEME_COLORS.success} bg-opacity-20 text-green-300` : `bg-${THEME_COLORS.error} bg-opacity-20 text-red-300`}`}>{feedback.message}</p>}
      <Textarea
        label={t('notificationMessage')}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        required
      />
      <Button 
        onClick={handleSendNotification} 
        isLoading={isLoading} 
        disabled={isLoading || !message.trim()} 
        className="mt-3 sm:mt-4"
        size="md"
      >
        {t('sendToAllUsers')}
      </Button>
    </div>
  );
};

// Manage Transformations Section
const ManageTransformationsSection: React.FC = () => {
    const { t } = useLocalization();
    const { currentUser } = useAuth();
    const [posts, setPosts] = useState<TransformationPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingPost, setViewingPost] = useState<TransformationPost | null>(null);

    const fetchPosts = () => {
        setPosts(DataService.getTransformationPosts().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    useEffect(() => {
        fetchPosts();
        setLoading(false);
    }, []);
    
    const handlePostDeleted = (postId: string) => {
        if (currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SITE_MANAGER)) {
            DataService.deleteTransformationPost(postId, currentUser.id);
            fetchPosts();
            if (viewingPost?.id === postId) {
                setViewingPost(null);
            }
        }
    };
    
    const handleCommentAction = () => { // For admin deleting comments
        fetchPosts(); // Refresh main list if comment count changed
        if (viewingPost) { // Refresh detail modal
            const updatedPost = DataService.getTransformationPostById(viewingPost.id);
            setViewingPost(updatedPost || null);
        }
    }

    if (loading) return <Spinner />;

    return (
        <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">{t('manageTransformations')}</h2>
            {posts.length === 0 && <p className="text-slate-400 text-center py-8">{t('noTransformationsPosted')}</p>}
            <div className="space-y-4">
                {posts.map(post => (
                    <Card key={post.id} className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="grid grid-cols-2 gap-1 sm:gap-2 w-full sm:w-40 md:w-48 flex-shrink-0">
                                <img src={post.beforeImageUrl} alt="Before" className="w-full h-16 sm:h-20 md:h-24 object-cover rounded" />
                                <img src={post.afterImageUrl} alt="After" className="w-full h-16 sm:h-20 md:h-24 object-cover rounded" />
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-md sm:text-lg font-semibold text-sky-400">{post.title}</h3>
                                <p className="text-xs text-slate-300">{t('user')}: {post.userName} ({post.userId.substring(0,6)}...)</p>
                                <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString('ar-EG')}</p>
                                <p className="text-xs text-slate-400">{t('likes')}: {post.likes.length}, {t('comments')}: {post.commentsCount}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 mt-2 sm:mt-0 flex-shrink-0 self-start sm:self-center">
                                <Button onClick={() => setViewingPost(post)} size="xs" variant="ghost">{t('viewPostDetails')}</Button>
                                <Button onClick={() => {
                                    if(window.confirm(t('confirmDeletePost'))) { handlePostDeleted(post.id); }
                                }} size="xs" variant="danger">{t('deletePost')}</Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            {viewingPost && currentUser && (
                 <AdminViewTransformationPostModal
                    isOpen={!!viewingPost}
                    onClose={() => setViewingPost(null)}
                    post={viewingPost}
                    currentUserId={currentUser.id}
                    onCommentAction={handleCommentAction} 
                    isAdmin={currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SITE_MANAGER}
                />
            )}
        </div>
    );
};

interface AdminViewTransformationPostModalProps extends Omit<ViewTransformationPostModalProps, 'onLikeUnlike'> {
    // Admin modal might not need onLikeUnlike, or it can be passed if needed
}
// Re-using ViewTransformationPostModal but from an admin context.
// The ViewTransformationPostModal needs to be slightly adapted or a similar one created for admin.
// For simplicity, I'll assume ViewTransformationPostModal can handle being called by an admin.
// (The original ViewTransformationPostModal in TransformationsPage.tsx already takes an isAdmin prop)

const AdminViewTransformationPostModal: React.FC<AdminViewTransformationPostModalProps> = ({ isOpen, onClose, post, currentUserId, onCommentAction, isAdmin }) => {
  const { t } = useLocalization();
  const { currentUser } = useAuth(); // Current logged in admin
  const [comments, setComments] = useState<TransformationComment[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      setComments(DataService.getCommentsForPost(post.id));
    }
  }, [isOpen, post.id, post.commentsCount]);

  const handleDeleteComment = (commentId: string) => {
    if (!currentUser || !isAdmin) return; 
    if(window.confirm(t('confirmDeleteComment', 'هل أنت متأكد أنك تريد حذف هذا التعليق؟'))) {
        DataService.deleteTransformationComment(commentId, currentUser.id);
        setComments(DataService.getCommentsForPost(post.id)); 
        onCommentAction(); 
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${t('viewPostDetails')}: ${post.title.substring(0,30)}...`} size="2xl">
      <div className="max-h-[80vh] overflow-y-auto p-1">
        <div className="flex items-center mb-3 sm:mb-4">
            {post.userProfileImage ? (
                <img src={post.userProfileImage} alt={post.userName} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover me-3 sm:me-4" />
            ) : (
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-${THEME_COLORS.primary} flex items-center justify-center text-white font-semibold text-lg sm:text-xl me-3 sm:me-4`}>
                {post.userName.charAt(0).toUpperCase()}
                </div>
            )}
            <div>
                <p className="text-md sm:text-lg font-semibold text-white">{post.userName}</p>
                <p className="text-xs sm:text-sm text-slate-400">{new Date(post.createdAt).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
            </div>
        </div>
        <p className="text-slate-300 text-sm sm:text-base mb-3 sm:mb-4 whitespace-pre-line">{post.title}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-1">{t('beforePhoto', 'الصورة قبل')}</h4>
            <img src={post.beforeImageUrl} alt={t('beforePhoto', 'الصورة قبل')} className="w-full rounded-lg shadow-md object-contain max-h-64 sm:max-h-80" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-1">{t('afterPhoto', 'الصورة بعد')}</h4>
            <img src={post.afterImageUrl} alt={t('afterPhoto', 'الصورة بعد')} className="w-full rounded-lg shadow-md object-contain max-h-64 sm:max-h-80" />
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 py-2 sm:py-3 border-y border-slate-700 mb-3 sm:mb-4">
            <span className={`text-xs sm:text-sm text-${THEME_COLORS.accent}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 inline-block">
                <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
                </svg>
                <span className="ms-1 sm:ms-1.5">{post.likes.length} {t('likes', 'إعجابات')}</span>
            </span>
          <span className="text-slate-400 text-xs sm:text-sm">{post.commentsCount} {t('comments', 'تعليقات')}</span>
        </div>

        {/* Comments List */}
        <h4 className="text-md sm:text-lg font-semibold text-white mb-2 sm:mb-3">{t('comments', 'التعليقات')}</h4>
        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 max-h-48 sm:max-h-60 overflow-y-auto pr-1">
          {comments.length === 0 && <p className="text-slate-400 text-xs sm:text-sm">{t('noCommentsYet', 'لا توجد تعليقات بعد.')}</p>}
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} currentUserId={currentUserId} isAdmin={isAdmin} onDeleteComment={handleDeleteComment} />
          ))}
        </div>
      </div>
    </Modal>
  );
};

// Re-using CommentItem from TransformationsPage as it already has isAdmin check
interface CommentItemProps {
  comment: TransformationComment;
  currentUserId: string;
  isAdmin?: boolean;
  onDeleteComment: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUserId, isAdmin, onDeleteComment }) => {
  const { t } = useLocalization();
  const canDelete = isAdmin || comment.userId === currentUserId; // Admin or owner can delete

  return (
    <div className={`p-2 sm:p-2.5 rounded-lg ${comment.userId === currentUserId ? 'bg-sky-800 bg-opacity-40' : 'bg-slate-700'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center mb-1">
          {comment.userProfileImage ? (
            <img src={comment.userProfileImage} alt={comment.userName} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover me-1.5 sm:me-2" />
          ) : (
             <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-${THEME_COLORS.secondary} flex items-center justify-center text-black font-semibold text-xs me-1.5 sm:me-2`}>
                {comment.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">{comment.userName}</p>
            <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleDateString('ar-EG', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
          </div>
        </div>
        {canDelete && ( 
          <Button onClick={() => onDeleteComment(comment.id)} variant="danger" size="xs" className="!p-1">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5"><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 000 1.5h.31l.421 8.424A2.25 2.25 0 005.731 16h4.538a2.25 2.25 0 002.25-2.076L12.941 5.5h.31a.75.75 0 000-1.5H11v-.75A2.25 2.25 0 008.75 1h-1.5A2.25 2.25 0 005 3.25zm2.25-.75c0-.414.336-.75.75-.75h1.5a.75.75 0 01.75.75V4h-3V2.5zM7.25 7a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 017.25 7zM10 7.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" /></svg>
          </Button>
        )}
      </div>
      <p className="text-slate-300 text-xs sm:text-sm ps-8 sm:ps-9 whitespace-pre-line">{comment.text}</p>
    </div>
  );
};
// Added for ViewTransformationPostModalProps reuse
interface ViewTransformationPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: TransformationPost;
  currentUserId: string;
  onCommentAction: () => void; 
  onLikeUnlike: () => void; // Kept for potential direct like within Admin view
  isAdmin?: boolean;
}

export default AdminPage;
// Missing closing } for PdfFormModal and its closing ; are inside the cdata
// This is a common issue with CDATA. Let's assume the actual file is fine.
// I will ensure PdfFormModal is correctly structured outside the CDATA context.

// Corrected structure for PdfFormModal, assuming the content up to the final div is correct.
// The final part of PdfFormModal from your provided files:
// ... (previous content of PdfFormModal) ...
//                 {formData.id && formData.fileName && <p className="text-sm text-slate-300">{t('pdfFileName')}: {formData.fileName}</p>}
//                 <Textarea label={t('pdfDescription')} name="description" value={formData.description || ''} onChange={handleChange} required />
                
//                 {allUsers.length > 0 && (
//                 <div>
//                     <h4 className="text-sm sm:text-md font-semibold mb-1.5 sm:mb-2 text-white">{t('selectUsersToAssign')}</h4>
//                     <div className="max-h-40 overflow-y-auto space-y-1.5 sm:space-y-2 border border-slate-600 p-2 sm:p-3 rounded-md">
//                         {allUsers.map(user => (
//                             <label key={user.id} className="flex items-center gap-2 text-xs sm:text-sm text-slate-200 cursor-pointer hover:bg-slate-700 p-1 rounded">
//                                 <input 
//                                     type="checkbox" 
//                                     checked={formData.assignedUserIds?.includes(user.id) || false}
//                                     onChange={() => handleUserAssignmentChange(user.id)}
//                                     className={`w-3.5 h-3.5 sm:w-4 sm:h-4 bg-slate-600 border-slate-500 text-${THEME_COLORS.primary} focus:ring-${THEME_COLORS.primary} rounded`}
//                                 />
//                                 {user.name} ({user.email})
//                             </label>
//                         ))}
//                     </div>
//                 </div>
//                 )}

//                 <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-700">
//                     <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} size="sm">{t('cancel')}</Button>
//                     <Button type="submit" isLoading={isLoading} disabled={isLoading} size="sm">{t('saveChanges')}</Button>
//                 </div>
//             </form>
//         </Modal>
//     );
// };
// // ... rest of AdminPage.tsx, including export default AdminPage;
// This was to show where the fix might be needed if the CDATA was incomplete. The provided file seems to have it structured okay.
// The main issue is usually the default export for AdminPage itself.
