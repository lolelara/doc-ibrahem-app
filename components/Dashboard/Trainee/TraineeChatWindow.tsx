
import React, { useState, useEffect, useRef } from 'react';
import { ARABIC_STRINGS } from '../../../constants';
import Button from '../../Shared/Button';
import { useAuth } from '../../../hooks/useAuth';

const TraineeChatWindow: React.FC = () => {
  const { user, users, chatMessages, fetchMessages, sendMessage, actionLoading: contextActionLoading } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [componentLoading, setComponentLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const trainer = users.find(u => u.id === user?.trainerId);

  useEffect(() => {
    if (user && trainer) {
      setComponentLoading(true);
      fetchMessages(trainer.id).finally(() => setComponentLoading(false));
    }
  }, [user, trainer, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !trainer) return;
    setComponentLoading(true);
    await sendMessage({ receiverId: trainer.id, content: newMessage });
    setNewMessage('');
    setComponentLoading(false);
    // No need for mock reply, messages are fetched
  };

  if (!user) return <p className="text-gray-400">جاري تحميل المستخدم...</p>;

  if (!trainer) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-md text-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">{ARABIC_STRINGS.chatWithTrainer}</h2>
        <p className="text-gray-400">لم يتم تعيين مدرب لك بعد، أو لا يمكن العثور على معلومات المدرب.</p>
      </div>
    );
  }

  const isLoading = componentLoading || contextActionLoading;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md h-[70vh] flex flex-col text-gray-200">
      <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-gray-100">
        {ARABIC_STRINGS.chatWithTrainer}: {trainer?.name || 'المدرب'}
      </h2>
      <div className="flex-grow overflow-y-auto mb-4 space-y-3 p-2 bg-gray-750 rounded">
        {isLoading && chatMessages.length === 0 && <p className="text-gray-400 text-center py-4">جاري تحميل الرسائل...</p>}
        {!isLoading && chatMessages.length === 0 && <p className="text-gray-400 text-center py-4">ابدأ المحادثة...</p>}
        
        {chatMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                msg.senderId === user.id 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-gray-600 text-gray-100 rounded-bl-none'
            }`}>
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.senderId === user.id ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                {new Date(msg.sentAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center border-t border-gray-700 pt-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
          className="flex-grow p-2 border border-gray-600 rounded-s-md focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-200 placeholder-gray-400"
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
          disabled={isLoading}
        />
        <Button onClick={handleSendMessage} className="rounded-e-md rounded-s-none px-3" disabled={isLoading} isLoading={isLoading}>
            <i className="fas fa-paper-plane"></i>
        </Button>
      </div>
    </div>
  );
};

export default TraineeChatWindow;
