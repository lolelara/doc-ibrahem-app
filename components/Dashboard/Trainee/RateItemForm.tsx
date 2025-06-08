
import React, { useState } from 'react';
import StarRating from '../../Shared/StarRating';
import Button from '../../Shared/Button';
import { ARABIC_STRINGS } from '../../../constants';
import { useAuth } from '../../../hooks/useAuth';

interface RateItemFormProps {
  itemType: 'plan' | 'trainer';
  itemId: string; 
  itemName: string; 
}

const RateItemForm: React.FC<RateItemFormProps> = ({ itemType, itemId, itemName }) => {
  const { user, submitRating, actionLoading } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (rating === 0) {
      setError("يرجى اختيار تقييم بالنجوم.");
      return;
    }
    if (!user) {
        setError("يجب أن تكون مسجلاً الدخول لتقديم تقييم.");
        return;
    }
    if (user.role !== 'trainee') {
        setError("فقط المتدربون يمكنهم تقديم التقييمات.");
        return;
    }

    const result = await submitRating({
        ratedItemId: itemId,
        ratedItemType: itemType,
        stars: rating,
        comment,
    });
    
    if (result) {
        setIsSubmitted(true);
    } else {
        // Error message should be handled by AuthContext alert, or set a generic one here
        setError("فشل إرسال التقييم. حاول مرة أخرى.");
    }
  };

  if (isSubmitted) {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md max-w-md mx-auto text-center text-gray-200">
            <i className="fas fa-check-circle text-green-400 text-5xl mb-4"></i>
            <h2 className="text-xl font-semibold mb-2 text-gray-100">شكراً لتقييمك!</h2>
            <p className="text-gray-300">تقديرك يساعدنا على التحسين.</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md max-w-md mx-auto text-gray-200">
      <h2 className="text-xl font-semibold mb-1 text-gray-100">
        {itemType === 'plan' ? ARABIC_STRINGS.ratePlan : ARABIC_STRINGS.rateTrainer}: <span className="text-blue-400">{itemName}</span>
      </h2>
      <p className="text-sm text-gray-400 mb-4">شاركنا رأيك لمساعدتنا على تقديم خدمة أفضل.</p>
      
      {error && <p className="text-red-400 text-sm bg-red-900 bg-opacity-30 p-2 rounded mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">{ARABIC_STRINGS.stars} (1-5)</label>
          <StarRating initialRating={rating} onRatingChange={setRating} size={32} />
        </div>
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-1">
            {ARABIC_STRINGS.comments}
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-gray-200 placeholder-gray-400"
            placeholder="أخبرنا المزيد عن تجربتك..."
          />
        </div>
        <Button type="submit" isLoading={actionLoading} className="w-full">
            <i className="fas fa-paper-plane me-2"></i> {ARABIC_STRINGS.submitRating}
        </Button>
      </form>
    </div>
  );
};

export default RateItemForm;
