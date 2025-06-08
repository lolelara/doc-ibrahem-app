
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Input, { Select } from '../Shared/Input';
import Button from '../Shared/Button';
import { ARABIC_STRINGS, DEFAULT_COUNTRY_OPTIONS } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { User, TrainingPlan } from '../../types'; // TrainingPlan import for plan options

const SignupForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY_OPTIONS[0]?.value || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [error, setError] = useState('');
  
  // plans are now fetched in AuthContext and available globally
  const { signup, actionLoading, plans: availablePlans, fetchPlans } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch plans if not already loaded, or if they might change
    if (!availablePlans.length) {
        fetchPlans();
    }
  }, [availablePlans, fetchPlans]);
  
  useEffect(() => {
    // Set default selected plan once plans are loaded
    if (availablePlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(availablePlans[0].id);
    }
  }, [availablePlans, selectedPlanId]);


  const planOptions = availablePlans.map(plan => ({ value: plan.id, label: `${plan.name} (${plan.price} ر.س)` }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phoneNumber || !country || !selectedPlanId || !password) {
      setError("رقم الهاتف، الدولة، كلمة المرور والخطة التدريبية حقول إجبارية.");
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    
    // UserData type should align with what the signup function in AuthContext expects
    // which then aligns with what the backend Netlify Function expects.
    // 'id', 'role', 'status' are set by the backend.
    const userData: Omit<User, 'id' | 'role' | 'status' | 'createdAt' | 'updatedAt'> & {password: string, selectedPlanId: string} = {
        phoneNumber,
        country,
        password,
        selectedPlanId
    };
    if (name) userData.name = name;
    if (email) userData.email = email;

    const result = await signup(userData);
    if (result.success) {
      // Message is handled by AuthContext now via alert
      navigate('/login'); 
    } else {
      setError(result.message || "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.");
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && <p className="text-red-400 text-sm text-center bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>}
      <Input
        id="name"
        label={ARABIC_STRINGS.name + " (اختياري)"}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="اسمك الكامل"
        icon={<i className="fas fa-id-card"></i>}
      />
      <Input
        id="email"
        label={ARABIC_STRINGS.email + " (اختياري)"}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="example@example.com"
        icon={<i className="fas fa-envelope"></i>}
      />
      <Input
        id="phoneNumber"
        label={ARABIC_STRINGS.phoneNumber + " (إجباري)"}
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        required
        placeholder="05xxxxxxxx"
        icon={<i className="fas fa-phone"></i>}
      />
       <Select
        id="country"
        label={ARABIC_STRINGS.country + " (إجباري)"}
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        options={DEFAULT_COUNTRY_OPTIONS}
        required
      />
      <Input
        id="password"
        label={ARABIC_STRINGS.password + " (إجباري)"}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        placeholder="********"
        icon={<i className="fas fa-lock"></i>}
      />
      <Input
        id="confirmPassword"
        label={"تأكيد " + ARABIC_STRINGS.password + " (إجباري)"}
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        placeholder="********"
        icon={<i className="fas fa-lock"></i>}
      />
      {planOptions.length > 0 ? (
        <Select
            id="plan"
            label={ARABIC_STRINGS.selectPlan + " (إجباري)"}
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            options={planOptions}
            required
        />
      ) : (
        <p className="text-gray-400 text-sm">جاري تحميل الخطط التدريبية...</p>
      )}
      <div>
        <Button type="submit" isLoading={actionLoading} className="w-full">
          {ARABIC_STRINGS.signup}
        </Button>
      </div>
    </form>
  );
};

export default SignupForm;
