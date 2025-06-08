
import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../Shared/Button';
import Input, { Select } from '../../Shared/Input';
import { ARABIC_STRINGS } from '../../../constants';
import { UserRole } from '../../../types';

const NotificationSender: React.FC = () => {
  const { users, sendNotification, actionLoading: contextActionLoading } = useAuth();
  const [recipientSpecifier, setRecipientSpecifier] = useState<string>('all'); // Changed from recipientId
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  // const [isLoading, setIsLoading] = useState(false); // Use contextActionLoading

  const recipientOptions = [
    { value: 'all', label: ARABIC_STRINGS.allUsers },
    { value: UserRole.TRAINER, label: ARABIC_STRINGS.allTrainers },
    { value: UserRole.TRAINEE, label: ARABIC_STRINGS.allTrainees },
    ...users.map(u => ({ value: u.id, label: `${u.name || u.email} (${ARABIC_STRINGS[u.role] || u.role})`}))
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      alert("يرجى ملء العنوان والرسالة.");
      return;
    }
    // setIsLoading(true); // No longer needed
    const result = await sendNotification({ recipientSpecifier, title, message });
    // setIsLoading(false); // No longer needed
    if (result) {
        setTitle('');
        setMessage('');
        alert("تم إرسال الإشعار بنجاح!");
    }
    // Error handling is within AuthContext sendNotification via alert
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md max-w-lg mx-auto text-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-center text-gray-100">{ARABIC_STRINGS.sendNotification}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label={ARABIC_STRINGS.recipient}
          options={recipientOptions}
          value={recipientSpecifier}
          onChange={(e) => setRecipientSpecifier(e.target.value)}
        />
        <Input
          label={ARABIC_STRINGS.title}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">{ARABIC_STRINGS.message}</label>
            <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-gray-200 placeholder-gray-400"
                required
            />
        </div>
        <Button type="submit" isLoading={contextActionLoading} className="w-full">
            <i className="fas fa-paper-plane me-2"></i>{ARABIC_STRINGS.send}
        </Button>
      </form>
    </div>
  );
};

export default NotificationSender;
