
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
        if (email !== userToEdit.email && window.confirm(t('confirmEmailChange'))) {
            // Proceed with email change
        } else if (email !== userToEdit.email) {
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
                {formData.id && formData.fileName && <p className="text-slate-300 text-sm sm:text-base"><strong>{t('pdfFileName')}:</strong> {formData.fileName}</p>}
                <Textarea label={t('pdfDescription')} name="description" value={formData.description || ''} onChange={handleChange} required />
                
                <div>
                    <h4 className="text-sm sm:text-md font-semibold mb-1 sm:mb-2 text-slate-200">{t('selectUsersToAssign')}</h4>
                    {allUsers.length === 0 && <p className="text-xs sm:text-sm text-slate-400">{t('manageUsers', 'لا يوجد مستخدمون لعرضهم. أضف مستخدمين أولاً.')}</p>}
                    <div className="max-h-32 sm:max-h-40 overflow-y-auto space-y-1.5 sm:space-y-2 border border-slate-700 p-2 sm:p-3 rounded-md bg-slate-900 bg-opacity-50">
                        {allUsers.map(user => (
                            <div key={user.id} className="flex items-center">
                                <input 
                                    type="checkbox"
                                    id={`user-assign-${user.id}`}
                                    checked={formData.assignedUserIds?.includes(user.id) || false}
                                    onChange={() => handleUserAssignmentChange(user.id)}
                                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-${THEME_COLORS.primary} bg-slate-700 border-slate-600 rounded focus:ring-${THEME_COLORS.primary} focus:ring-2 focus:ring-offset-slate-800`}
                                />
                                <label htmlFor={`user-assign-${user.id}`} className="ms-2 text-xs sm:text-sm font-medium text-slate-300">{user.name} ({user.email})</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-700">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} size="sm">{t('cancel')}</Button>
                    <Button type="submit" isLoading={isLoading} disabled={isLoading || (fileError && !!formData.file) || (!formData.id && !formData.file)} size="sm">
                        {formData.id ? t('saveChanges') : t('uploadPdf')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};


// Manage Subscription Plans Section
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

  const refreshPlans = () => {
    setPlans(DataService.getSubscriptionPlans());
  };

  const openModalForAdd = () => {
    setCurrentPlan({ 
        name: '', 
        price: 0, 
        currency: 'SAR', 
        description: '', 
        features: [{id: `temp_feat_${Date.now()}`, text: ''}] 
    });
    setIsModalOpen(true);
  };

  const openModalForEdit = (plan: SubscriptionPlan) => {
    setCurrentPlan(JSON.parse(JSON.stringify(plan))); 
    setIsModalOpen(true);
  };

  const handleDelete = (planId: string) => {
    if (window.confirm(t('confirmDeletePlan'))) {
      DataService.deleteSubscriptionPlan(planId);
      refreshPlans();
    }
  };
  
  const handleSavePlan = (planData: Partial<SubscriptionPlan>) => {
    const featuresToSave = (planData.features || []).filter(f => f.text.trim() !== '');

    if (planData.id) { 
        DataService.updateSubscriptionPlan({...planData, features: featuresToSave} as SubscriptionPlan);
    } else { 
        DataService.addSubscriptionPlan(planData as Omit<SubscriptionPlan, 'id'>);
    }
    refreshPlans();
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
      {plans.length === 0 && <p className="text-slate-400 text-center py-8">{t('noPlansDefined', 'لا توجد خطط اشتراك معرفة حاليًا.')}</p>}
      <div className="space-y-3 sm:space-y-4">
        {plans.map(plan => (
          <Card key={plan.id} className="p-3 sm:p-4 hover:border-sky-500">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 md:gap-4">
                <div className="flex-grow">
                    <h3 className={`text-lg sm:text-xl font-semibold text-${THEME_COLORS.primary}`}>{plan.name}</h3>
                    <p className="text-md sm:text-lg text-white">{plan.price} {plan.currency}</p>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">{plan.description}</p>
                    <ul className="list-disc list-inside mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-400 space-y-1">
                        {plan.features.map(feature => <li key={feature.id} className="flex items-start"><svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-lime-400 me-1.5 sm:me-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>{feature.text}</li>)}
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
    const [formData, setFormData] = useState<Partial<SubscriptionPlan>>(
        planData.id ? JSON.parse(JSON.stringify(planData)) : { ...planData, features: planData.features?.length ? planData.features : [{id: `new_feat_${Date.now()}`, text: ''}] }
    );
    
    useEffect(() => {
      setFormData(planData.id ? JSON.parse(JSON.stringify(planData)) : { ...planData, features: planData.features?.length ? planData.features : [{id: `new_feat_${Date.now()}`, text: ''}] });
    }, [planData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...(formData.features || [])];
        newFeatures[index] = { ...newFeatures[index], text: value }; 
        if (!newFeatures[index].id) newFeatures[index].id = `new_feat_edit_${Date.now()}_${index}`;
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeatureField = () => {
        setFormData(prev => ({ 
            ...prev, 
            features: [...(prev.features || []), {id: `new_feat_${Date.now()}_${(prev.features || []).length}`, text: ''}] 
        }));
    };

    const removeFeatureField = (idToRemove: string) => {
        setFormData(prev => ({ ...prev, features: (prev.features || []).filter(f => f.id !== idToRemove) }));
    };


    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? t('editSubscriptionPlan') : t('addSubscriptionPlan')} size="lg">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 max-h-[75vh] overflow-y-auto p-1">
                <Input label={t('planName')} name="name" value={formData.name || ''} onChange={handleChange} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Input label={t('planPrice')} name="price" type="number" step="0.01" value={formData.price || ''} onChange={handleChange} required placeholder={t('pricePlaceholder')} />
                    <Input label={t('planCurrency')} name="currency" value={formData.currency || 'SAR'} onChange={handleChange} required placeholder={t('currencyPlaceholder')} />
                </div>
                <Textarea label={t('planDescription')} name="description" value={formData.description || ''} onChange={handleChange} required />
                
                <div>
                    <h4 className="text-sm sm:text-md font-semibold mb-1">{t('planFeatures')}</h4>
                    {(formData.features || []).map((feature, index) => (
                        <div key={feature.id || `feature-${index}`} className="flex gap-1 sm:gap-2 mb-1 sm:mb-2 items-center">
                            <Input 
                                placeholder={t('featureText')} 
                                value={feature.text} 
                                onChange={e => handleFeatureChange(index, e.target.value)} 
                                className="flex-grow !text-xs sm:!text-sm"
                            />
                            <Button 
                                type="button" 
                                variant="danger" 
                                size="sm" 
                                onClick={() => removeFeatureField(feature.id)}
                                disabled={(formData.features?.length || 0) <= 1 && feature.text === ''}
                                className="!px-2 !py-1"
                            >X</Button>
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


const ApproveSubscriptionsSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [durationDays, setDurationDays] = useState<{ [requestId: string]: number }>({});
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);


  useEffect(() => {
    setLoading(true);
    setRequests(DataService.getSubscriptionRequests().filter(r => r.status === SubscriptionStatus.PENDING));
    setAllPlans(DataService.getSubscriptionPlans());
    setLoading(false);
  }, []);
  
  const refreshRequests = () => {
     setRequests(DataService.getSubscriptionRequests().filter(r => r.status === SubscriptionStatus.PENDING));
  }

  const handleApprove = (requestId: string) => {
    if (!currentUser) return;
    const days = durationDays[requestId] || 30; 
    DataService.approveSubscription(requestId, currentUser.id, days);
    refreshRequests();
  };

  const handleReject = (requestId: string) => {
     if (!currentUser) return;
    DataService.rejectSubscription(requestId, currentUser.id, t('rejectedByAdmin', 'تم الرفض بواسطة الإدارة'));
    refreshRequests();
  };
  
  const handleDurationChange = (requestId: string, value: string) => {
    setDurationDays(prev => ({...prev, [requestId]: parseInt(value) || 0 }));
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">{t('pendingSubscriptions')}</h2>
      {requests.length === 0 ? (
        <p className="text-slate-400 py-8 text-center">{t('noPendingSubscriptions')}</p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {requests.map(req => {
            return (
              <Card key={req.id} className="p-3 sm:p-4 hover:border-sky-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 items-end">
                    <div className="text-xs sm:text-sm"><strong className="text-slate-300">{t('user')}:</strong> <span className="text-white break-all">{req.userEmail}</span></div>
                    <div className="text-xs sm:text-sm"><strong className="text-slate-300">{t('plan')}:</strong> <span className="text-white">{req.planNameSnapshot}</span> (<span className="text-yellow-400">{t('requested', 'مطلوب')}</span>)</div>
                    <div className="flex-grow">
                        <Input 
                            type="number" 
                            label={t('setDuration')}
                            value={durationDays[req.id] || ''} 
                            onChange={(e) => handleDurationChange(req.id, e.target.value)}
                            min="1"
                            placeholder={t('durationDaysPlaceholder')}
                            aria-describedby={`duration-help-${req.id}`}
                            className="w-full" 
                        />
                         <small id={`duration-help-${req.id}`} className="text-xs text-slate-400 mt-1 hidden">{t('daysDurationHelp', 'أدخل عدد أيام صلاحية الاشتراك.')}</small>
                    </div>
                    <div className="flex flex-col xs:flex-row gap-1 sm:gap-2 xs:justify-end self-center sm:self-end">
                        <Button onClick={() => handleApprove(req.id)} size="sm" variant="primary" disabled={!durationDays[req.id] || durationDays[req.id] <=0 } className="!text-xs !px-2 !py-1 w-full xs:w-auto">{t('approve')}</Button>
                        <Button onClick={() => handleReject(req.id)} size="sm" variant="danger" className="!text-xs !px-2 !py-1 w-full xs:w-auto">{t('reject')}</Button>
                    </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};


const SendGlobalNotificationSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser, isSiteManager, refreshNotifications } = useAuth();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  if (!isSiteManager || !currentUser) {
    return <p>{t('adminAccessOnly')}</p>;
  }

  const handleSendNotification = () => {
    if (!message.trim()) {
      setFeedback({ type: 'error', message: t('fieldRequired') });
      return;
    }
    setIsLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      DataService.addGlobalNotification(message, currentUser.id);
      setFeedback({ type: 'success', message: t('notificationSentSuccess') });
      setMessage('');
      refreshNotifications(); 
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || t('errorOccurred') });
    }
    setIsLoading(false);
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">{t('sendGlobalNotification')}</h2>
      {feedback.message && (
        <p className={`mb-4 p-3 rounded text-sm ${feedback.type === 'success' ? `bg-${THEME_COLORS.success} bg-opacity-20 text-green-300` : `bg-${THEME_COLORS.error} bg-opacity-20 text-red-300`}`}>
          {feedback.message}
        </p>
      )}
      <div className="space-y-3 sm:space-y-4">
        <Textarea
          label={t('notificationMessage')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('enterYourMessage')}
          rows={5}
          required
        />
        <Button onClick={handleSendNotification} isLoading={isLoading} variant="primary" size="md">
          {t('sendToAllUsers')}
        </Button>
      </div>
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
    const [feedback, setFeedback] = useState({type: '', message: ''});

    const fetchPosts = () => {
        setPosts(DataService.getTransformationPosts().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    useEffect(() => {
        setLoading(true);
        fetchPosts();
        setLoading(false);
    }, []);

    const showFeedback = (type: 'success' | 'error', messageKey: string) => {
        setFeedback({type, message: t(messageKey)});
        setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    };

    const handleDeletePost = (postId: string) => {
        if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SITE_MANAGER)) return;
        if (window.confirm(t('confirmDeletePost'))) {
            try {
                DataService.deleteTransformationPost(postId, currentUser.id);
                fetchPosts();
                showFeedback('success', 'postDeletedSuccess');
            } catch (error: any) {
                showFeedback('error', error.message || 'errorOccurred');
            }
        }
    };
    
    const handleCommentAction = () => { // For refreshing post data (comment count)
        fetchPosts(); 
        if(viewingPost) { // if detail modal is open, refresh its content
            const updatedPost = DataService.getTransformationPostById(viewingPost.id);
            setViewingPost(updatedPost || null);
        }
    }

    if (loading && !viewingPost) return <Spinner />;

    return (
        <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">{t('manageTransformations')}</h2>
            {feedback.message && <p className={`mb-4 p-3 rounded text-sm ${feedback.type === 'success' ? `bg-${THEME_COLORS.success} bg-opacity-20 text-green-300` : `bg-${THEME_COLORS.error} bg-opacity-20 text-red-300`}`}>{feedback.message}</p>}
            
            {posts.length === 0 ? (
                <p className="text-slate-400 text-center py-8">{t('noTransformationsPosted')}</p>
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {posts.map(post => (
                        <Card key={post.id} className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <div className="flex-shrink-0 grid grid-cols-2 gap-1 sm:gap-2 w-full sm:w-40 md:w-48">
                                    <img src={post.beforeImageUrl} alt={t('beforePhoto')} className="w-full h-20 sm:h-24 object-cover rounded" />
                                    <img src={post.afterImageUrl} alt={t('afterPhoto')} className="w-full h-20 sm:h-24 object-cover rounded" />
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-md sm:text-lg font-semibold text-sky-400 break-all">{post.title}</h3>
                                    <p className="text-xs sm:text-sm text-slate-300">
                                        {t('user')}: {post.userName} ({post.userId.substring(0,8)}...)
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(post.createdAt).toLocaleDateString('ar-EG')} - {post.likes.length} {t('likes')} / {post.commentsCount} {t('comments')}
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-start sm:items-center mt-2 sm:mt-0">
                                    <Button onClick={() => setViewingPost(post)} variant="ghost" size="sm" className="!text-xs !px-2 !py-1">
                                        {t('viewPostDetails')}
                                    </Button>
                                    <Button onClick={() => handleDeletePost(post.id)} variant="danger" size="sm" className="!text-xs !px-2 !py-1">
                                        {t('deletePost')}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            {viewingPost && currentUser && (
                <AdminViewTransformationPostModal
                    isOpen={!!viewingPost}
                    onClose={() => setViewingPost(null)}
                    post={viewingPost}
                    currentAdminId={currentUser.id}
                    onCommentDeleted={handleCommentAction}
                />
            )}
        </div>
    );
};

interface AdminViewTransformationPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: TransformationPost;
    currentAdminId: string;
    onCommentDeleted: () => void;
}
const AdminViewTransformationPostModal: React.FC<AdminViewTransformationPostModalProps> = ({ isOpen, onClose, post, currentAdminId, onCommentDeleted }) => {
    const { t } = useLocalization();
    const [comments, setComments] = useState<TransformationComment[]>([]);

    useEffect(() => {
        if (isOpen) {
            setComments(DataService.getCommentsForPost(post.id));
        }
    }, [isOpen, post.id]);

    const handleDeleteComment = (commentId: string) => {
        if(window.confirm(t('confirmDeleteComment', 'هل أنت متأكد أنك تريد حذف هذا التعليق؟'))) {
            try {
                DataService.deleteTransformationComment(commentId, currentAdminId);
                setComments(DataService.getCommentsForPost(post.id)); // Refresh comments list
                onCommentDeleted(); // Trigger parent re-fetch for comment count
            } catch (error: any) {
                alert(error.message || t('errorOccurred'));
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('postDeletedSuccess', 'تفاصيل المنشور')}: ${post.title}`} size="2xl">
           <div className="max-h-[80vh] overflow-y-auto p-1">
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
                <p className="text-xs text-slate-400 mb-2"> {t('user')}: {post.userName} | {post.likes.length} {t('likes')} | {post.commentsCount} {t('comments')}</p>

                <h4 className="text-md sm:text-lg font-semibold text-white mb-2 sm:mb-3 border-t border-slate-700 pt-3">{t('comments', 'التعليقات')}</h4>
                <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 overflow-y-auto pr-1">
                    {comments.length === 0 && <p className="text-slate-400 text-xs sm:text-sm">{t('noCommentsYet', 'لا توجد تعليقات بعد.')}</p>}
                    {comments.map(comment => (
                        <div key={comment.id} className={`p-2 sm:p-2.5 rounded-lg bg-slate-700`}>
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
                                <Button onClick={() => handleDeleteComment(comment.id)} variant="danger" size="xs" className="!p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5"><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 000 1.5h.31l.421 8.424A2.25 2.25 0 005.731 16h4.538a2.25 2.25 0 002.25-2.076L12.941 5.5h.31a.75.75 0 000-1.5H11v-.75A2.25 2.25 0 008.75 1h-1.5A2.25 2.25 0 005 3.25zm2.25-.75c0-.414.336-.75.75-.75h1.5a.75.75 0 01.75.75V4h-3V2.5zM7.25 7a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 017.25 7zM10 7.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" /></svg>
                                </Button>
                            </div>
                            <p className="text-slate-300 text-xs sm:text-sm ps-8 sm:ps-9 whitespace-pre-line">{comment.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};


export default AdminPage;
