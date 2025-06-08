
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
      <h1 className="text-9xl font-bold text-blue-500">404</h1>
      <h2 className="text-3xl font-semibold text-gray-100 mt-4 mb-2">الصفحة غير موجودة</h2>
      <p className="text-gray-400 mb-6">
        عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
      >
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
};

export default NotFoundPage;