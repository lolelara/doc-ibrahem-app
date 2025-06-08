
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { NutritionFile, User } from '../../../types';
import Button from '../../Shared/Button';
import Input, {Select} from '../../Shared/Input';
import Modal from '../../Shared/Modal';
import { ARABIC_STRINGS } from '../../../constants';

const NutritionFileManagement: React.FC = () => {
  const { user, users, nutritionFiles, addNutritionFile, deleteNutritionFile, fetchNutritionFiles, actionLoading } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState(''); // Stores the external URL (e.g., Google Drive)
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | undefined>(undefined); // For assigning file to specific trainee


  useEffect(() => {
    if (user) {
      // Fetch files uploaded by this trainer
      fetchNutritionFiles({ uploadedById: user.id });
    }
  }, [user, fetchNutritionFiles]);

  const myTrainees = users.filter(u => u.trainerId === user?.id);
  const traineeOptions = [
    { value: '', label: "عام (لجميع متدربيك)"},
    ...myTrainees.map(t => ({ value: t.id, label: t.name || t.email || t.phoneNumber }))
  ];


  const handleAddFileSubmit = async () => {
    if (!newFileName || !newFileUrl || !user) {
      alert("يرجى إدخال اسم للملف ورابط الملف.");
      return;
    }
    // Basic URL validation (optional, can be more robust)
    try {
        new URL(newFileUrl);
    } catch (_) {
        alert("الرجاء إدخال رابط URL صالح.");
        return;
    }

    const fileData: Omit<NutritionFile, 'id' | 'uploadedBy' | 'createdAt' | 'updatedAt' | 'uploadedByName'> = {
        name: newFileName,
        fileUrl: newFileUrl,
        traineeId: selectedTraineeId || null, // Ensure it's null if empty string
    };

    const result = await addNutritionFile(fileData);
    if (result) {
        setIsModalOpen(false);
        setNewFileName('');
        setNewFileUrl('');
        setSelectedTraineeId(undefined);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if(window.confirm("هل أنت متأكد أنك تريد حذف هذا الملف؟")) {
        await deleteNutritionFile(fileId);
    }
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md text-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">{ARABIC_STRINGS.nutritionFiles}</h2>
        <Button onClick={() => setIsModalOpen(true)} variant="success" disabled={actionLoading}>
             <i className="fas fa-plus me-2"></i> إضافة ملف تغذية
        </Button>
      </div>
      
      {actionLoading && nutritionFiles.length === 0 && <p className="text-blue-300">جاري تحميل الملفات...</p>}
      {!actionLoading && nutritionFiles.length === 0 && (
        <p className="text-gray-400">{ARABIC_STRINGS.noDataAvailable} لم تقم بإضافة أي ملفات تغذية بعد.</p>
      )}

      {nutritionFiles.length > 0 && (
        <ul className="space-y-3 mt-4">
          {nutritionFiles.map(file => (
            <li key={file.id} className="bg-gray-700 p-3 rounded-md shadow-sm flex justify-between items-center">
              <div>
                <i className="fas fa-file-alt text-blue-400 me-2"></i>
                <span className="text-gray-200">{file.name}</span>
                {file.traineeId && <span className="text-xs text-gray-400 ms-2">(خاص بـ: {users.find(u=>u.id === file.traineeId)?.name || 'متدرب'})</span>}
              </div>
              <div className="flex items-center space-s-2">
                <a 
                  href={file.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="فتح الملف في تبويب جديد"
                >
                  <i className="fas fa-external-link-alt"></i>
                </a>
                <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleDeleteFile(file.id)}
                    disabled={actionLoading}
                    aria-label="Delete file"
                >
                    <i className="fas fa-trash"></i>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة ملف تغذية جديد">
        <div className="space-y-4">
          <Input 
            label={ARABIC_STRINGS.fileName} 
            value={newFileName} 
            onChange={(e) => setNewFileName(e.target.value)} 
            required 
          />
          <Input 
            label="رابط الملف (مثل Google Drive, Dropbox)" 
            type="url"
            value={newFileUrl} 
            onChange={(e) => setNewFileUrl(e.target.value)} 
            placeholder="https://docs.google.com/document/d/..."
            required 
          />
          <Select
            label="تخصيص لمتدرب (اختياري)"
            value={selectedTraineeId || ''}
            onChange={(e) => setSelectedTraineeId(e.target.value || undefined)}
            options={traineeOptions}
          />
        </div>
         <div className="mt-6 flex justify-end space-s-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>{ARABIC_STRINGS.cancel}</Button>
            <Button onClick={handleAddFileSubmit} isLoading={actionLoading}>إضافة الملف</Button>
        </div>
      </Modal>
    </div>
  );
};

export default NutritionFileManagement;
