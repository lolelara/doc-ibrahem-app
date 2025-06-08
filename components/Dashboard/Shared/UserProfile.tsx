import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import Input, { Select } from '../../Shared/Input';
import Button from '../../Shared/Button';
import { ARABIC_STRINGS, DEFAULT_COUNTRY_OPTIONS } from '../../../constants'; // MOCKED_PLANS removed
import { User, UserRole, TrainingPlan } from '../../../types';

const UserProfile: React.FC = () => {
  const { user, updateUser, actionLoading, plans, fetchPlans } = useAuth(); // plans are now from context
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        country: user.country,
      });
    }
  }, [user]);

  useEffect(() => {
    // Fetch plans if not already loaded, needed to display user's selected plan name
    if (!plans.length) {
        fetchPlans();
    }
  }, [plans, fetchPlans]);


  if (!user) {
    return <p className="text-blue-300">جاري تحميل بيانات المستخدم...</p>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => { // Corrected: FAPImEvent to FormEvent
    e.preventDefault();
    setMessage('');
    if (!formData.phoneNumber || !formData.country) {
        setMessage("رقم الهاتف والدولة حقول إجبارية.");
        return;
    }

    // Prepare only the fields that are meant to be updated by the user for their own profile
    const updatePayload: Partial<Omit<User, 'id' | 'role' | 'status' | 'password_hash'>> = {};
    if (formData.name !== undefined) updatePayload.name = formData.name;
    if (formData.email !== undefined) updatePayload.email = formData.email;
    if (formData.phoneNumber !== undefined) updatePayload.phoneNumber = formData.phoneNumber;
    if (formData.country !== undefined) updatePayload.country = formData.country;
    // selectedPlanId could be updated here if UI allows for it

    const success = await updateUser(user.id, updatePayload); // updateUser now calls API
    if (success) {
      setMessage("تم تحديث الملف الشخصي بنجاح!");
      setIsEditing(false);
    } else {
      // Error message is typically handled by alert in AuthContext, or set one here if needed
      setMessage("فشل تحديث الملف الشخصي.");
    }
  };

  // Find the selected plan from the fetched plans list
  const selectedPlanDetails = plans.find(p => p.id === user.selectedPlanId);

  return (
    <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl max-w-2xl mx-auto text-gray-200">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-100">{ARABIC_STRINGS.viewProfile}</h2>
        {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="secondary">
                <i className="fas fa-edit me-2"></i>{ARABIC_STRINGS.edit}
            </Button>
        )}
      </div>

      {message && <p className={`mb-4 p-3 rounded text-sm ${message.includes("نجاح") ? 'bg-green-700 bg-opacity-40 text-green-300' : 'bg-red-700 bg-opacity-40 text-red-300'}`}>{message}</p>}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={ARABIC_STRINGS.name} name="name" value={formData.name || ''} onChange={handleChange} />
          <Input label={ARABIC_STRINGS.email} name="email" type="email" value={formData.email || ''} onChange={handleChange} />
          <Input label={ARABIC_STRINGS.phoneNumber} name="phoneNumber" type="tel" value={formData.phoneNumber || ''} onChange={handleChange} required />
          <Select label={ARABIC_STRINGS.country} name="country" value={formData.country || ''} onChange={handleChange} options={DEFAULT_COUNTRY_OPTIONS} required/>
          {/* Add select for plan if user can change their plan */}
          <div className="flex space-s-3 pt-4">
            <Button type="submit" isLoading={actionLoading} variant="primary">
                {ARABIC_STRINGS.save}
            </Button>
            <Button type="button" onClick={() => { setIsEditing(false); setMessage(''); }} variant="secondary" disabled={actionLoading}>
                {ARABIC_STRINGS.cancel}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <InfoItem label={ARABIC_STRINGS.name} value={user.name || 'غير محدد'} icon="fas fa-user" />
          <InfoItem label={ARABIC_STRINGS.email} value={user.email || 'غير محدد'} icon="fas fa-envelope" />
          <InfoItem label={ARABIC_STRINGS.phoneNumber} value={user.phoneNumber} icon="fas fa-phone" />
          <InfoItem label={ARABIC_STRINGS.country} value={DEFAULT_COUNTRY_OPTIONS.find(c => c.value === user.country)?.label || user.country} icon="fas fa-flag" />
          <InfoItem label="الدور" value={ARABIC_STRINGS[user.role] || user.role} icon="fas fa-user-tag" />
          <InfoItem label="حالة الحساب" value={ARABIC_STRINGS[user.status] || user.status} icon="fas fa-check-circle" />
          {selectedPlanDetails && <InfoItem label="الخطة التدريبية" value={`${selectedPlanDetails.name} (${selectedPlanDetails.price} ر.س)`} icon="fas fa-clipboard-list" />}
        </div>
      )}
    </div>
  );
};

interface InfoItemProps {
    label: string;
    value: string;
    icon?: string;
}
const InfoItem: React.FC<InfoItemProps> = ({label, value, icon}) => (
    <div className="flex items-start">
        {icon && <i className={`${icon} text-blue-400 w-6 text-center me-3 mt-1`}></i>}
        <div>
            <p className="text-sm font-medium text-gray-400">{label}</p>
            <p className="text-md text-gray-100">{value}</p>
        </div>
    </div>
);

export default UserProfile;