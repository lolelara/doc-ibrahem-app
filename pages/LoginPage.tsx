
import React from 'react';
import LoginForm from '../components/Auth/LoginForm';
import { ARABIC_STRINGS } from '../constants';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-800 shadow-xl rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
            {ARABIC_STRINGS.login}
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;