
import React from 'react';
import { ARABIC_STRINGS } from '../../../constants';
import UserManagement from './UserManagement';
import PlanManagement from './PlanManagement';
import NotificationSender from './NotificationSender';
import StatisticsOverview from './StatisticsOverview';
import RatingViewer from './RatingViewer'; // Import the new component

interface AdminDashboardProps {
  activeTab?: 'users' | 'plans' | 'send-notification' | 'stats' | 'ratings'; // Added 'ratings'
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab = 'stats' }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'plans':
        return <PlanManagement />;
      case 'send-notification':
        return <NotificationSender />;
      case 'ratings': // New case for ratings
        return <RatingViewer />;
      case 'stats':
      default:
        return <StatisticsOverview />;
    }
  };

  return (
    <div className="p-2 md:p-6">
      <h1 className="text-3xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-2">{ARABIC_STRINGS.adminDashboard}</h1>
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;
