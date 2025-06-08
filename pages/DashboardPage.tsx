
import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import AdminDashboard from '../components/Dashboard/Admin/AdminDashboard';
import TrainerDashboard from '../components/Dashboard/Trainer/TrainerDashboard';
import TraineeDashboard from '../components/Dashboard/Trainee/TraineeDashboard';
import CalorieCalculator from '../components/CalorieCalculator/CalorieCalculator';
import { ARABIC_STRINGS } from '../constants';
import UserProfile from '../components/Dashboard/Shared/UserProfile';
import NotificationsPage from '../components/Dashboard/Shared/NotificationsPage';
// Import new components for routing
import RatingViewer from '../components/Dashboard/Admin/RatingViewer';
import TraineeScheduleManagement from '../components/Dashboard/Trainer/TraineeScheduleManagement';


const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" />;
  }
  
  const commonLinks = [
    { path: 'profile', label: ARABIC_STRINGS.viewProfile, icon: 'fas fa-user-circle' },
    { path: 'calculator', label: ARABIC_STRINGS.calorieCalculator, icon: 'fas fa-calculator' },
    { path: 'notifications', label: ARABIC_STRINGS.notifications, icon: 'fas fa-bell' },
  ];

  let roleSpecificLinks: { path: string; label: string, icon: string }[] = [];
  switch (user.role) {
    case UserRole.ADMIN:
      roleSpecificLinks = [
        { path: 'admin', label: ARABIC_STRINGS.adminDashboard, icon: 'fas fa-tachometer-alt' },
        { path: 'admin/users', label: ARABIC_STRINGS.userManagement, icon: 'fas fa-users-cog' },
        { path: 'admin/plans', label: ARABIC_STRINGS.planManagement, icon: 'fas fa-clipboard-list' },
        { path: 'admin/send-notification', label: ARABIC_STRINGS.sendNotification, icon: 'fas fa-paper-plane' },
        { path: 'admin/ratings', label: "مراجعة التقييمات", icon: 'fas fa-star-half-alt' },
      ];
      break;
    case UserRole.TRAINER:
      roleSpecificLinks = [
        { path: 'trainer', label: ARABIC_STRINGS.trainerDashboard, icon: 'fas fa-chalkboard-teacher' },
        { path: 'trainer/my-trainees', label: ARABIC_STRINGS.myTrainees, icon: 'fas fa-users' },
        { path: 'trainer/videos', label: ARABIC_STRINGS.trainingVideos, icon: 'fas fa-video' },
        { path: 'trainer/nutrition', label: ARABIC_STRINGS.nutritionFiles, icon: 'fas fa-apple-alt' },
        { path: 'trainer/manage-schedules', label: "إدارة جداول المتدربين", icon: 'fas fa-calendar-check' },
      ];
      break;
    case UserRole.TRAINEE:
      roleSpecificLinks = [
        { path: 'trainee', label: ARABIC_STRINGS.traineeDashboard, icon: 'fas fa-dumbbell' },
        { path: 'trainee/videos', label: ARABIC_STRINGS.trainingVideos, icon: 'fas fa-video' },
        { path: 'trainee/nutrition', label: ARABIC_STRINGS.nutritionFiles, icon: 'fas fa-apple-alt' },
        { path: 'trainee/schedule', label: ARABIC_STRINGS.mySchedule, icon: 'fas fa-calendar-alt' },
        { path: 'trainee/chat', label: ARABIC_STRINGS.chatWithTrainer, icon: 'fas fa-comments' },
        { path: 'trainee/rate-plan', label: ARABIC_STRINGS.ratePlan, icon: 'fas fa-star' },
        { path: 'trainee/rate-trainer', label: ARABIC_STRINGS.rateTrainer, icon: 'fas fa-user-check' },
      ];
      break;
  }

  const allLinks = [...roleSpecificLinks, ...commonLinks];
  const currentBasePath = location.pathname.split('/')[2]; // e.g., 'admin', 'trainer', 'profile'


  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-150px)]">
      <aside className="w-full md:w-64 bg-gray-800 text-gray-300 p-4 space-y-2 md:sticky md:top-0 md:h-screen overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-gray-100">{ARABIC_STRINGS.dashboard}</h3>
        {allLinks.map(link => {
          const isActive = location.pathname === `/dashboard/${link.path}` || 
                           (currentBasePath && link.path.startsWith(currentBasePath) && location.pathname.startsWith(`/dashboard/${currentBasePath}`));
          return (
            <Link
              key={link.path}
              to={`/dashboard/${link.path}`}
              className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white ${
                isActive ? 'bg-blue-500 text-white' : 'text-gray-300'
              }`}
            >
              <i className={`${link.icon} me-2 w-5 text-center`}></i>{link.label}
            </Link>
          );
        })}
      </aside>
      <div className="flex-1 p-6 bg-gray-900 shadow-lg md:ms-4"> {/* Main content area background */}
        <Routes>
          {user.role === UserRole.ADMIN && (
            <>
              <Route index element={<Navigate to="admin" />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/users" element={<AdminDashboard activeTab="users"/>} />
              <Route path="admin/plans" element={<AdminDashboard activeTab="plans"/>} />
              <Route path="admin/send-notification" element={<AdminDashboard activeTab="send-notification"/>} />
              <Route path="admin/ratings" element={<AdminDashboard activeTab="ratings"/>} />
            </>
          )}
          {user.role === UserRole.TRAINER && (
            <>
              <Route index element={<Navigate to="trainer" />} />
              <Route path="trainer" element={<TrainerDashboard />} />
              <Route path="trainer/my-trainees" element={<TrainerDashboard activeTab="my-trainees"/>} />
              <Route path="trainer/videos" element={<TrainerDashboard activeTab="videos"/>} />
              <Route path="trainer/nutrition" element={<TrainerDashboard activeTab="nutrition"/>} />
              <Route path="trainer/manage-schedules" element={<TrainerDashboard activeTab="manage-schedules"/>} />
            </>
          )}
          {user.role === UserRole.TRAINEE && (
            <>
              <Route index element={<Navigate to="trainee" />} />
              <Route path="trainee" element={<TraineeDashboard />} />
              <Route path="trainee/videos" element={<TraineeDashboard activeTab="videos"/>} />
              <Route path="trainee/nutrition" element={<TraineeDashboard activeTab="nutrition"/>} />
              <Route path="trainee/schedule" element={<TraineeDashboard activeTab="schedule"/>} />
              <Route path="trainee/chat" element={<TraineeDashboard activeTab="chat"/>} />
              <Route path="trainee/rate-plan" element={<TraineeDashboard activeTab="rate-plan"/>} />
              <Route path="trainee/rate-trainer" element={<TraineeDashboard activeTab="rate-trainer"/>} />
            </>
          )}
          <Route path="profile" element={<UserProfile />} />
          <Route path="calculator" element={<CalorieCalculator />} />
          <Route path="notifications" element={<NotificationsPage />} />
           <Route path="*" element={<Navigate to={user.role} />} /> {/* Default to role's main dashboard */}
        </Routes>
      </div>
    </div>
  );
};

export default DashboardPage;
