
import React, { useEffect } from 'react';
import { ARABIC_STRINGS } from '../../../constants';
import { useAuth } from '../../../hooks/useAuth';

const TraineeScheduleDisplay: React.FC = () => {
  const { user, traineeSchedule, fetchTraineeSchedule, actionLoading } = useAuth(); 

  useEffect(() => {
    if (user) {
      fetchTraineeSchedule(user.id);
    }
  }, [user, fetchTraineeSchedule]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md text-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">{ARABIC_STRINGS.mySchedule}</h2>
      
      {actionLoading && <p className="text-blue-300">جاري تحميل جدولك التدريبي...</p>}
      {!actionLoading && traineeSchedule.length === 0 && (
        <p className="text-gray-400">{ARABIC_STRINGS.noDataAvailable} لم يتم تعيين جدول تدريبي لك بعد.</p>
      )}

      {traineeSchedule.length > 0 && (
        <div className="space-y-4 mt-4">
          {traineeSchedule.map(item => (
            <div key={item.id} className="bg-gray-700 p-4 rounded-lg border-s-4 border-blue-500">
              <h3 className="text-lg font-semibold text-blue-400">{item.day}</h3>
              <p className="text-gray-300 mt-1 whitespace-pre-line">{item.exercises}</p>
              {item.notes && <p className="text-sm text-gray-400 mt-2"><em>ملاحظات: {item.notes}</em></p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TraineeScheduleDisplay;
