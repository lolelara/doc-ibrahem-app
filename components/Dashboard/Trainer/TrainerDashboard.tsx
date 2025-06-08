
import React from 'react';
import { ARABIC_STRINGS } from '../../../constants';
import MyTraineesList from './MyTraineesList';
import TrainingVideoManagement from './TrainingVideoManagement';
import NutritionFileManagement from './NutritionFileManagement';
import TraineeScheduleManagement from './TraineeScheduleManagement'; // Import new component
// import ChatWithTrainees from './ChatWithTrainees'; // If implementing chat

interface TrainerDashboardProps {
  activeTab?: 'my-trainees' | 'videos' | 'nutrition' | 'manage-schedules' | 'chat'; // Added 'manage-schedules'
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ activeTab = 'my-trainees' }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'videos':
        return <TrainingVideoManagement />;
      case 'nutrition':
        return <NutritionFileManagement />;
      case 'manage-schedules': // New case for managing schedules
        return <TraineeScheduleManagement />;
      // case 'chat':
      //   return <ChatWithTrainees />;
      case 'my-trainees':
      default:
        return <MyTraineesList />;
    }
  };

  return (
    <div className="p-2 md:p-6">
      <h1 className="text-3xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-2">{ARABIC_STRINGS.trainerDashboard}</h1>
      {renderContent()}
    </div>
  );
};

export default TrainerDashboard;
