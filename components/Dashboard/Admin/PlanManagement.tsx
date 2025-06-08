import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { TrainingPlan, UserRole } from '../../../types'; // Added UserRole import
import Button from '../../Shared/Button';
import Modal from '../../Shared/Modal';
import Input from '../../Shared/Input';
import { ARABIC_STRINGS } from '../../../constants';

const PlanManagement: React.FC = () => {
  // plans are now fetched into AuthContext
  const { plans, addPlan, editPlan, deletePlan, actionLoading, fetchPlans, user } = useAuth(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Ensure currentPlan fields match TrainingPlan, excluding id for creation
  const [currentPlan, setCurrentPlan] = useState<Partial<Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>> & {id?: string}>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Fetch plans if not already loaded or if user context changes (e.g., admin logs in)
    if (user?.role === UserRole.ADMIN) { 
        fetchPlans();
    }
  }, [user, fetchPlans]);


  const openModalForCreate = () => {
    setCurrentPlan({ name: '', description: '', price: 0, durationMonths: 1 });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openModalForEdit = (planToEdit: TrainingPlan) => {
    // Spread all properties from planToEdit, including its id
    setCurrentPlan({...planToEdit}); 
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentPlan({}); // Reset to empty object
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentPlan(prev => ({ ...prev, [name]: name === 'price' || name === 'durationMonths' ? Number(value) : value }));
  };

  const handleSubmit = async () => {
    if (!currentPlan.name || !currentPlan.description || currentPlan.price == null || currentPlan.durationMonths == null) {
      alert("يرجى ملء جميع الحقول.");
      return;
    }

    if (isEditing && currentPlan.id) {
      // For editing, ensure all required fields for update are present
      const { id, createdAt, updatedAt, ...planDataToEdit } = currentPlan as TrainingPlan; // Assert type if id is present
      await editPlan(id, planDataToEdit);
    } else {
      // For adding, currentPlan doesn't have id, createdAt, updatedAt
      await addPlan(currentPlan as Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>);
    }
    closeModal();
  };

  const handleDelete = async (planId: string) => {
    if (window.confirm(ARABIC_STRINGS.areYouSure + " " + ARABIC_STRINGS.deletePlan + "?")) {
      const result = await deletePlan(planId);
      if (!result.success) {
        // Error message is already handled by AuthContext alert
      }
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md text-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">{ARABIC_STRINGS.planManagement}</h2>
        <Button onClick={openModalForCreate} variant="success">
            <i className="fas fa-plus me-2"></i> {ARABIC_STRINGS.addPlan}
        </Button>
      </div>

      {actionLoading && plans.length === 0 && <p className="text-blue-300">جاري تحميل الخطط...</p>}
      {!plans.length && !actionLoading && <p className="text-gray-400">{ARABIC_STRINGS.noDataAvailable}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {plans.map(plan => (
          <div key={plan.id} className="bg-gray-700 p-4 rounded-lg shadow hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-blue-400">{plan.name}</h3>
            <p className="text-sm text-gray-300 mt-1 h-16 overflow-hidden">{plan.description}</p>
            <p className="text-md font-bold text-green-400 mt-2">{plan.price} ر.س</p>
            <p className="text-xs text-gray-400">{ARABIC_STRINGS.planDuration}: {plan.durationMonths} أشهر</p>
            <div className="mt-4 flex space-s-2">
              <Button variant="primary" size="sm" onClick={() => openModalForEdit(plan)} disabled={actionLoading}>
                <i className="fas fa-edit me-1"></i> {ARABIC_STRINGS.edit}
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(plan.id)} disabled={actionLoading}>
                 <i className="fas fa-trash me-1"></i> {ARABIC_STRINGS.delete}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? ARABIC_STRINGS.editPlan : ARABIC_STRINGS.addPlan}>
        { (
          <div className="space-y-4">
            <Input label={ARABIC_STRINGS.planName} name="name" value={currentPlan.name || ''} onChange={handleChange} required />
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">{ARABIC_STRINGS.planDescription}</label>
                <textarea 
                    id="description"
                    name="description" 
                    value={currentPlan.description || ''} 
                    onChange={handleChange} 
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-gray-200 placeholder-gray-400"
                    required 
                />
            </div>
            <Input label={ARABIC_STRINGS.planPrice} name="price" type="number" value={String(currentPlan.price || 0)} onChange={handleChange} required min="0"/>
            <Input label={ARABIC_STRINGS.planDuration} name="durationMonths" type="number" value={String(currentPlan.durationMonths || 1)} onChange={handleChange} required min="1"/>
          </div>
        )}
        <div className="mt-6 flex justify-end space-s-2">
            <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>{ARABIC_STRINGS.cancel}</Button>
            <Button onClick={handleSubmit} isLoading={actionLoading}>{ARABIC_STRINGS.save}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PlanManagement;