
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../Shared/Input';
import Button from '../Shared/Button';
import { ARABIC_STRINGS } from '../../constants';
import { useNavigate } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailOrPhone || !password) {
      setError("يرجى ملء جميع الحقول.");
      return;
    }
    const success = await login(emailOrPhone, password);
    if (success) {
      navigate('/dashboard');
    } else {
      // Error message is handled by AuthContext, or set a generic one here
      // setError("فشل تسجيل الدخول. يرجى التحقق من بياناتك.");
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && <p className="text-red-400 text-sm text-center bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>}
      <Input
        id="emailOrPhone"
        label={ARABIC_STRINGS.email + " / " + ARABIC_STRINGS.phoneNumber}
        type="text"
        value={emailOrPhone}
        onChange={(e) => setEmailOrPhone(e.target.value)}
        required
        placeholder="example@example.com أو 05xxxxxxxx"
        icon={<i className="fas fa-user"></i>}
      />
      <Input
        id="password"
        label={ARABIC_STRINGS.password}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        placeholder="********"
        icon={<i className="fas fa-lock"></i>}
      />
      <div>
        <Button type="submit" isLoading={loading} className="w-full">
          {ARABIC_STRINGS.login}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;