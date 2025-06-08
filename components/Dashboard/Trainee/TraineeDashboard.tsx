
import React from 'react';
import { ARABIC_STRINGS } from '../../../constants';
import TraineeVideoViewer from './TraineeVideoViewer';
import TraineeNutritionViewer from './TraineeNutritionViewer';
import TraineeScheduleDisplay from './TraineeScheduleDisplay';
import TraineeChatWindow from './TraineeChatWindow';
import RateItemForm from './RateItemForm';

interface TraineeDashboardProps {
  activeTab?: 'videos' | 'nutrition' | 'schedule' | 'chat' | 'rate-plan' | 'rate-trainer' | 'overview';
}

const TraineeDashboard: React.FC<TraineeDashboardProps> = ({ activeTab = 'overview' }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'videos':
        return <TraineeVideoViewer />;
      case 'nutrition':
        return <TraineeNutritionViewer />;
      case 'schedule':
        return <TraineeScheduleDisplay />;
      case 'chat':
        return <TraineeChatWindow />;
      case 'rate-plan':
        return <RateItemForm itemType="plan" itemId="currentPlanId_placeholder" itemName="الخطة التدريبية الحالية"/>; 
      case 'rate-trainer':
        return <RateItemForm itemType="trainer" itemId="currentTrainerId_placeholder" itemName="المدرب الشخصي"/>; 
      case 'overview':
      default:
        return <TraineeOverview />;
    }
  };

  return (
    <div className="p-2 md:p-6">
      <h1 className="text-3xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-2">{ARABIC_STRINGS.traineeDashboard}</h1>
      {renderContent()}
    </div>
  );
};

const TraineeOverview: React.FC = () => {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md text-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-100">مرحباً بك في لوحة التحكم الخاصة بك!</h2>
            <p className="text-gray-300">
                من هنا يمكنك متابعة تقدمك، مشاهدة الفيديوهات التدريبية، الاطلاع على ملفات التغذية، والتواصل مع مدربك.
            </p>
            <div className="mt-4 rounded-md shadow-sm bg-gray-700 aspect-[16/7] flex items-center justify-center">
                 <p className="text-gray-500 text-lg">Fitness Motivation Placeholder</p>
            </div>
        </div>
    );
}

export default TraineeDashboard;