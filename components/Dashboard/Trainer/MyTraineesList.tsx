
import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { User, UserRole } from '../../../types';
import { ARABIC_STRINGS } from '../../../constants';
import Button from '../../Shared/Button';

const MyTraineesList: React.FC = () => {
  const { user, users } = useAuth();

  if (!user || user.role !== UserRole.TRAINER) {
    return <p className="text-red-400">غير مصرح لك بالدخول.</p>;
  }

  const myTrainees = users.filter(u => u.role === UserRole.TRAINEE && u.trainerId === user.id);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md text-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">{ARABIC_STRINGS.myTrainees}</h2>
      {myTrainees.length === 0 ? (
        <p className="text-gray-400">{ARABIC_STRINGS.noDataAvailable} حاليًا لا يوجد متدربون مرتبطون بك.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{ARABIC_STRINGS.name}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{ARABIC_STRINGS.email}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{ARABIC_STRINGS.phoneNumber}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{ARABIC_STRINGS.actions}</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {myTrainees.map(trainee => (
                <tr key={trainee.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{trainee.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{trainee.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{trainee.phoneNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="primary" size="sm" onClick={() => alert(`عرض تفاصيل ${trainee.name}`)}>
                        <i className="fas fa-eye me-1"></i> {ARABIC_STRINGS.viewDetails}
                    </Button>
                    {/* Add buttons for assigning schedule, files, or chat */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyTraineesList;