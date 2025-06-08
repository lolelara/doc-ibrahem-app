
import React, { useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { ARABIC_STRINGS } from '../../../constants';

const TraineeNutritionViewer: React.FC = () => {
  const { user, nutritionFiles, fetchNutritionFiles, actionLoading } = useAuth();

  useEffect(() => {
    if (user) {
        // Fetch files assigned to this trainee, or from their trainer, or general admin files
        fetchNutritionFiles({ forTraineeId: user.id });
    }
  }, [user, fetchNutritionFiles]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md text-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">{ARABIC_STRINGS.nutritionFiles}</h2>

      {actionLoading && <p className="text-blue-300">جاري تحميل ملفات التغذية...</p>}
      {!actionLoading && nutritionFiles.length === 0 && (
        <p className="text-gray-400">{ARABIC_STRINGS.noDataAvailable} لا توجد ملفات تغذية متاحة لك حاليًا.</p>
      )}

      {nutritionFiles.length > 0 && (
        <ul className="space-y-3 mt-4">
          {nutritionFiles.map(file => (
            <li key={file.id} className="bg-gray-700 p-3 rounded-md shadow-sm flex justify-between items-center">
              <div>
                <i className="fas fa-file-pdf text-red-400 me-2"></i>
                <span className="text-gray-200">{file.name}</span>
                <p className="text-xs text-gray-400">بواسطة: {file.uploadedByName || 'مدرب'}</p>
              </div>
              <a 
                href={file.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="فتح الملف في تبويب جديد"
              >
                <i className="fas fa-external-link-alt me-1"></i> عرض الملف
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TraineeNutritionViewer;
