
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { APP_NAME, ARABIC_STRINGS } from '../../constants';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-gray-200 shadow-lg">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
          {APP_NAME}
        </Link>
        <div className="flex items-center space-s-4">
          {user ? (
            <>
              <span className="text-sm hidden md:inline text-gray-300">مرحباً, {user.name || user.email || user.phoneNumber}</span>
              {user.role === UserRole.ADMIN && (
                <Link to="/dashboard/admin" className="px-3 py-2 rounded hover:bg-gray-700 transition-colors">{ARABIC_STRINGS.adminDashboard}</Link>
              )}
              {user.role === UserRole.TRAINER && (
                <Link to="/dashboard/trainer" className="px-3 py-2 rounded hover:bg-gray-700 transition-colors">{ARABIC_STRINGS.trainerDashboard}</Link>
              )}
              {user.role === UserRole.TRAINEE && (
                <Link to="/dashboard/trainee" className="px-3 py-2 rounded hover:bg-gray-700 transition-colors">{ARABIC_STRINGS.traineeDashboard}</Link>
              )}
               <Link to="/dashboard/calculator" className="px-3 py-2 rounded hover:bg-gray-700 transition-colors">{ARABIC_STRINGS.calorieCalculator}</Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                {ARABIC_STRINGS.logout}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 rounded hover:bg-gray-700 transition-colors">{ARABIC_STRINGS.login}</Link>
              <Link to="/signup" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors">{ARABIC_STRINGS.signup}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;