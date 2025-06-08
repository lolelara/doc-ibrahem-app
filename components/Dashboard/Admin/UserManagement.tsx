
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { User, UserRole, AccountStatus } from '../../../types';
import Button from '../../Shared/Button';
import Modal from '../../Shared/Modal';
import Input, { Select } from '../../Shared/Input';
import { ARABIC_STRINGS, DEFAULT_COUNTRY_OPTIONS } from '../../../constants';

const UserManagement: React.FC = () => {
  // users are now fetched into AuthContext
  const { users, updateUserStatus, assignTrainerRole, updateUser, actionLoading, fetchUsers, user: adminUser } = useAuth();
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'all'>('all');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignTrainerModalOpen, setIsAssignTrainerModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  useEffect(() => {
    // Fetch users if not already loaded or if adminUser changes
    if (adminUser?.role === UserRole.ADMIN) {
        fetchUsers();
    }
  }, [adminUser, fetchUsers]);


  const handleApprove = async (userId: string) => {
    await updateUserStatus(userId, AccountStatus.ACTIVE);
  };

  const handleReject = async (userId: string) => {
    await updateUserStatus(userId, AccountStatus.REJECTED);
  };

  const handleOpenEditModal = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setEditFormData({ 
        name: userToEdit.name, 
        email: userToEdit.email, 
        phoneNumber: userToEdit.phoneNumber, 
        country: userToEdit.country 
        // Do not load role/status here for edit, they are managed by specific actions
    });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    if (selectedUser && editFormData) {
      // Remove undefined fields from editFormData to avoid sending them if not changed
      const updatePayload: Partial<User> = {};
      if (editFormData.name !== undefined) updatePayload.name = editFormData.name;
      if (editFormData.email !== undefined) updatePayload.email = editFormData.email;
      if (editFormData.phoneNumber !== undefined) updatePayload.phoneNumber = editFormData.phoneNumber;
      if (editFormData.country !== undefined) updatePayload.country = editFormData.country;

      if (Object.keys(updatePayload).length > 0) {
        await updateUser(selectedUser.id, updatePayload); // updateUser now handles API call
      }
      setIsEditModalOpen(false);
      setSelectedUser(null);
    }
  };
  
  const handleOpenAssignTrainerModal = (userToAssign: User) => {
    if (userToAssign.role === UserRole.TRAINER) {
      alert("هذا المستخدم مدرب بالفعل.");
      return;
    }
    setSelectedUser(userToAssign);
    setIsAssignTrainerModalOpen(true);
  };

  const handleConfirmAssignTrainer = async () => {
    if (selectedUser) {
      await assignTrainerRole(selectedUser.id); // assignTrainerRole now handles API call
      setIsAssignTrainerModalOpen(false);
      setSelectedUser(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const statusMatch = filterStatus === 'all' || u.status === filterStatus;
      const roleMatch = filterRole === 'all' || u.role === filterRole;
      // Admins cannot manage the permanent admin (lolelarap@gmail.com) directly through this UI for critical fields
      // This is now more robustly handled on the backend as well.
      if (u.email === 'lolelarap@gmail.com' && u.role === UserRole.ADMIN) return false; 
      return statusMatch && roleMatch;
    });
  }, [users, filterStatus, filterRole]);

  const statusOptions = [
    { value: 'all', label: 'الكل' },
    { value: AccountStatus.PENDING, label: ARABIC_STRINGS.pending },
    { value: AccountStatus.ACTIVE, label: ARABIC_STRINGS.active },
    { value: AccountStatus.REJECTED, label: ARABIC_STRINGS.rejected },
  ];

  const roleOptions = [
    { value: 'all', label: 'الكل' },
    { value: UserRole.TRAINEE, label: ARABIC_STRINGS.trainee },
    { value: UserRole.TRAINER, label: ARABIC_STRINGS.trainer },
    // Admins are not typically managed this way from the UI for role changes
    // { value: UserRole.ADMIN, label: ARABIC_STRINGS.admin }, 
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md text-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">{ARABIC_STRINGS.userManagement}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select
            label={ARABIC_STRINGS.filterByStatus}
            options={statusOptions}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AccountStatus | 'all')}
        />
        <Select
            label="فلترة حسب الدور"
            options={roleOptions}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
        />
      </div>

      {actionLoading && users.length === 0 && <p className="text-blue-300">جاري تحميل المستخدمين...</p>}
      
      {!filteredUsers.length && !actionLoading && <p className="text-gray-400">{ARABIC_STRINGS.noDataAvailable}</p>}

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{ARABIC_STRINGS.name}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{ARABIC_STRINGS.email}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{ARABIC_STRINGS.phoneNumber}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">الدور</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{ARABIC_STRINGS.status}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{ARABIC_STRINGS.actions}</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredUsers.map(userToDisplay => (
              <tr key={userToDisplay.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{userToDisplay.name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{userToDisplay.email || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{userToDisplay.phoneNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {ARABIC_STRINGS[userToDisplay.role] || userToDisplay.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    userToDisplay.status === AccountStatus.ACTIVE ? 'bg-green-700 text-green-100' :
                    userToDisplay.status === AccountStatus.PENDING ? 'bg-yellow-700 text-yellow-100' :
                    'bg-red-700 text-red-100'
                  }`}>
                    {ARABIC_STRINGS[userToDisplay.status] || userToDisplay.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-s-2">
                  {userToDisplay.status === AccountStatus.PENDING && (
                    <>
                      <Button variant="success" size="sm" onClick={() => handleApprove(userToDisplay.id)} disabled={actionLoading}>
                        <i className="fas fa-check me-1"></i> {ARABIC_STRINGS.approve}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleReject(userToDisplay.id)} disabled={actionLoading}>
                        <i className="fas fa-times me-1"></i> {ARABIC_STRINGS.reject}
                      </Button>
                    </>
                  )}
                   {userToDisplay.status !== AccountStatus.PENDING && ( // Allow edit for active/rejected users too
                     <Button variant="secondary" size="sm" onClick={() => handleOpenEditModal(userToDisplay)} disabled={actionLoading}>
                        <i className="fas fa-edit me-1"></i> {ARABIC_STRINGS.edit}
                      </Button>
                  )}
                  {userToDisplay.status === AccountStatus.ACTIVE && userToDisplay.role === UserRole.TRAINEE && (
                    <Button variant="primary" size="sm" onClick={() => handleOpenAssignTrainerModal(userToDisplay)} disabled={actionLoading} className="ms-2">
                      <i className="fas fa-user-plus me-1"></i> {ARABIC_STRINGS.assignAsTrainer}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`تعديل بيانات: ${selectedUser?.name || ''}`}>
        <Input label={ARABIC_STRINGS.name} name="name" value={editFormData?.name || ''} onChange={handleEditFormChange} />
        <Input label={ARABIC_STRINGS.email} name="email" type="email" value={editFormData?.email || ''} onChange={handleEditFormChange} />
        <Input label={ARABIC_STRINGS.phoneNumber} name="phoneNumber" type="tel" value={editFormData?.phoneNumber || ''} onChange={handleEditFormChange} />
        <Select label={ARABIC_STRINGS.country} name="country" value={editFormData?.country || ''} onChange={handleEditFormChange} options={DEFAULT_COUNTRY_OPTIONS} />
        {/* Password is not changed here. Role/Status are changed via dedicated actions. */}
        <div className="mt-4 flex justify-end space-s-2">
          <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>{ARABIC_STRINGS.cancel}</Button>
          <Button onClick={handleSaveChanges} isLoading={actionLoading}>{ARABIC_STRINGS.save}</Button>
        </div>
      </Modal>

      <Modal isOpen={isAssignTrainerModalOpen} onClose={() => setIsAssignTrainerModalOpen(false)} title={`${ARABIC_STRINGS.assignAsTrainer}: ${selectedUser?.name || ''}`}>
        <p className="text-gray-300">هل أنت متأكد أنك تريد تعيين {selectedUser?.name} كمدرب؟ سيتم تفعيل حسابه كمدرب.</p>
        <div className="mt-4 flex justify-end space-s-2">
          <Button variant="secondary" onClick={() => setIsAssignTrainerModalOpen(false)}>{ARABIC_STRINGS.no}</Button>
          <Button onClick={handleConfirmAssignTrainer} isLoading={actionLoading}>{ARABIC_STRINGS.yes}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
