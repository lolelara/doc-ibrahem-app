import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { UserRole, AccountStatus } from '../../../types';
import { ARABIC_STRINGS } from '../../../constants';

const StatisticsOverview: React.FC = () => {
  const { users, plans } = useAuth(); // Changed from getPlans to plans

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === AccountStatus.ACTIVE).length;
  const pendingUsers = users.filter(u => u.status === AccountStatus.PENDING).length;
  const trainers = users.filter(u => u.role === UserRole.TRAINER && u.status === AccountStatus.ACTIVE).length;
  const trainees = users.filter(u => u.role === UserRole.TRAINEE && u.status === AccountStatus.ACTIVE).length;
  const totalPlans = plans.length;

  const stats = [
    { label: "إجمالي المستخدمين", value: totalUsers, icon: "fas fa-users", color: "bg-blue-600" },
    { label: "المستخدمون النشطون", value: activeUsers, icon: "fas fa-user-check", color: "bg-green-600" },
    { label: "الحسابات المعلقة", value: pendingUsers, icon: "fas fa-user-clock", color: "bg-yellow-500" }, // Yellow might need text-black for contrast
    { label: "إجمالي المدربين", value: trainers, icon: "fas fa-chalkboard-teacher", color: "bg-indigo-600" },
    { label: "إجمالي المتدربين", value: trainees, icon: "fas fa-running", color: "bg-purple-600" },
    { label: "إجمالي الخطط التدريبية", value: totalPlans, icon: "fas fa-clipboard-list", color: "bg-pink-600" },
  ];

  return (
    <div className="p-4 text-gray-200">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">{ARABIC_STRINGS.statistics}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map(stat => (
          <div key={stat.label} className={`p-6 rounded-lg shadow-lg ${stat.color} ${stat.color === 'bg-yellow-500' ? 'text-black' : 'text-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold">{stat.value}</p>
                <p className="text-lg">{stat.label}</p>
              </div>
              <i className={`${stat.icon} text-4xl opacity-70`}></i>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">نظرة عامة على النشاط</h3>
        <p className="text-gray-400">سيتم عرض مخططات بيانية هنا قريباً توضح نمو المستخدمين، أشهر الخطط، وتقييمات المدربين.</p>
        <div className="mt-4 rounded-md shadow-sm bg-gray-700 aspect-[16/6] flex items-center justify-center">
            <p className="text-gray-500 text-lg">Placeholder Chart Area</p>
        </div>

      </div>
    </div>
  );
};

export default StatisticsOverview;