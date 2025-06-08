
import React, { useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { ARABIC_STRINGS } from '../../../constants';
import { Link as RouterLink } from 'react-router-dom'; // Import Link from react-router-dom

const NotificationsPage: React.FC = () => {
  const { user, userNotifications, fetchNotifications, markNotificationAsRead, actionLoading } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md max-w-3xl mx-auto text-gray-200">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">{ARABIC_STRINGS.notifications}</h2>
      
      {actionLoading && userNotifications.length === 0 && <p className="text-blue-300">جاري تحميل الإشعارات...</p>}
      {!actionLoading && userNotifications.length === 0 && (
        <p className="text-gray-400 text-center py-8">{ARABIC_STRINGS.noDataAvailable} لا توجد إشعارات جديدة.</p>
      )}

      {userNotifications.length > 0 && (
        <ul className="space-y-4">
          {userNotifications.map(notif => (
            <li 
              key={notif.id} 
              className={`p-4 rounded-lg border-s-4 ${
                notif.read ? 'bg-gray-750 border-gray-600' : 'bg-blue-700 bg-opacity-30 border-blue-500 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`text-lg font-semibold ${notif.read ? 'text-gray-300' : 'text-blue-300'}`}>{notif.title}</h3>
                  <p className={`text-sm mt-1 ${notif.read ? 'text-gray-400' : 'text-gray-200'}`}>{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notif.sentAt).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                {!notif.read && (
                  <button 
                    onClick={() => handleMarkAsRead(notif.id)} 
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    title="وضع علامة كمقروء"
                    disabled={actionLoading}
                  >
                    <i className="fas fa-check-circle me-1"></i> تمييز كمقروء
                  </button>
                )}
              </div>
              {notif.link && (
                <RouterLink to={notif.link} className="text-sm text-blue-400 hover:underline mt-2 inline-block">
                  <i className="fas fa-link me-1"></i> اذهب إلى الرابط
                </RouterLink>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;