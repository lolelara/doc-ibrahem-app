
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { User, UserRole, TraineeScheduleItem } from '../../../types';
import Button from '../../Shared/Button';
import Input, { Select } from '../../Shared/Input';
import Modal from '../../Shared/Modal';
import { ARABIC_STRINGS } from '../../../constants';

const TraineeScheduleManagement: React.FC = () => {
  const { 
    user, 
    users, 
    traineeSchedule, 
    fetchTraineeSchedule, 
    saveTraineeScheduleItem,
    updateTraineeScheduleItem,
    deleteTraineeScheduleItem,
    actionLoading 
  } = useAuth();

  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Omit<TraineeScheduleItem, 'id' | 'createdAt' | 'updatedAt'>> & {id?: string}>({});
  const [isEditing, setIsEditing] = useState(false);

  const myTrainees = users.filter(u => u.role === UserRole.TRAINEE && u.trainerId === user?.id);

  useEffect(() => {
    if (selectedTraineeId) {
      fetchTraineeSchedule(selectedTraineeId);
    } else {
      // Clear schedule if no trainee is selected, or handle as needed
      // setTraineeSchedule([]); // Assuming AuthContext handles this or this component has its own local copy for display
    }
  }, [selectedTraineeId, fetchTraineeSchedule]);

  const traineeOptions = myTrainees.map(t => ({ value: t.id, label: t.name || t.email || `متدرب (${t.id.substring(0,6)})`}));

  const openModalForCreate = () => {
    if (!selectedTraineeId) {
        alert("يرجى اختيار متدرب أولاً.");
        return;
    }
    setCurrentItem({ traineeId: selectedTraineeId, day: '', exercises: '', notes: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openModalForEdit = (item: TraineeScheduleItem) => {
    setCurrentItem(item);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentItem(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!currentItem.traineeId || !currentItem.day || !currentItem.exercises) {
      alert("يرجى ملء جميع الحقول المطلوبة (اليوم، التمارين).");
      return;
    }

    if (isEditing && currentItem.id) {
        const { id, traineeId, createdAt, updatedAt, ...updateData } = currentItem as TraineeScheduleItem;
        await updateTraineeScheduleItem(id, updateData);
    } else {
        await saveTraineeScheduleItem(currentItem as Omit<TraineeScheduleItem, 'id'| 'createdAt' | 'updatedAt'>);
    }
    closeModal();
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm("هل أنت متأكد أنك تريد حذف هذا البند من الجدول؟")) {
      await deleteTraineeScheduleItem(itemId);
      // Schedule will refetch in useEffect if selectedTraineeId is still set
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md text-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">إدارة جداول المتدربين</h2>
      
      <Select
        label="اختر متدرب لعرض/تعديل جدوله"
        options={[{value: '', label: 'اختر متدرباً...'}, ...traineeOptions]}
        value={selectedTraineeId}
        onChange={(e) => setSelectedTraineeId(e.target.value)}
        className="mb-4"
      />

      {selectedTraineeId && (
        <Button onClick={openModalForCreate} variant="success" className="my-3" disabled={actionLoading}>
          <i className="fas fa-plus me-2"></i> إضافة بند جديد لجدول المتدرب
        </Button>
      )}

      {actionLoading && selectedTraineeId && <p className="text-blue-300">جاري تحميل الجدول...</p>}
      
      {selectedTraineeId && !actionLoading && traineeSchedule.length === 0 && (
        <p className="text-gray-400 mt-4">لا يوجد جدول لهذا المتدرب. قم بإضافة بنود جديدة.</p>
      )}

      {selectedTraineeId && traineeSchedule.length > 0 && (
        <div className="space-y-4 mt-4">
          {traineeSchedule.map(item => (
            <div key={item.id} className="bg-gray-700 p-4 rounded-lg border-s-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-semibold text-blue-400">{item.day}</h3>
                    <p className="text-gray-300 mt-1 whitespace-pre-line">{item.exercises}</p>
                    {item.notes && <p className="text-sm text-gray-400 mt-2"><em>ملاحظات: {item.notes}</em></p>}
                </div>
                <div className="flex flex-col space-y-2">
                    <Button variant="primary" size="sm" onClick={() => openModalForEdit(item)} disabled={actionLoading}>
                        <i className="fas fa-edit"></i>
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)} disabled={actionLoading}>
                        <i className="fas fa-trash"></i>
                    </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "تعديل بند في الجدول" : "إضافة بند جديد للجدول"}>
        <div className="space-y-4">
          <Input label="اليوم (مثال: اليوم الأول، يوم الصدر)" name="day" value={currentItem.day || ''} onChange={handleChange} required />
          <div>
            <label htmlFor="exercises" className="block text-sm font-medium text-gray-300 mb-1">التمارين</label>
            <textarea 
                id="exercises" name="exercises" value={currentItem.exercises || ''} onChange={handleChange} rows={4}
                className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-gray-200 placeholder-gray-400"
                required 
            />
          </div>
           <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">ملاحظات (اختياري)</label>
            <textarea 
                id="notes" name="notes" value={currentItem.notes || ''} onChange={handleChange} rows={2}
                className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-gray-200 placeholder-gray-400"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-s-2">
            <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>{ARABIC_STRINGS.cancel}</Button>
            <Button onClick={handleSubmit} isLoading={actionLoading}>{ARABIC_STRINGS.save}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default TraineeScheduleManagement;
