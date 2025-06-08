
import React, { useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { ARABIC_STRINGS } from '../../../constants';
import StarRating from '../../Shared/StarRating'; // Re-using StarRating for display

const RatingViewer: React.FC = () => {
  const { user, allRatings, fetchAllRatings, actionLoading } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAllRatings();
    }
  }, [user, fetchAllRatings]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md text-gray-200">
      <h2 className="text-xl font-semibold mb-6 text-gray-100">مراجعة تقييمات العملاء</h2>

      {actionLoading && allRatings.length === 0 && <p className="text-blue-300">جاري تحميل التقييمات...</p>}
      {!actionLoading && allRatings.length === 0 && (
        <p className="text-gray-400">{ARABIC_STRINGS.noDataAvailable} لا توجد تقييمات لعرضها حاليًا.</p>
      )}

      {allRatings.length > 0 && (
        <div className="space-y-4">
          {allRatings.map(rating => (
            <div key={rating.id} className="bg-gray-700 p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-semibold text-blue-400">
                  تقييم لـ: {rating.ratedItemType === 'plan' ? 'خطة' : 'مدرب'} "{rating.ratedItemId}"
                </h3>
                <StarRating initialRating={rating.stars} readOnly size={20} />
              </div>
              <p className="text-sm text-gray-400 mb-1">
                بواسطة: {rating.userName || rating.userId} - بتاريخ: {new Date(rating.ratingTimestamp).toLocaleDateString('ar-SA')}
              </p>
              {rating.comment && (
                <p className="text-gray-300 bg-gray-600 p-2 rounded text-sm">التعليق: {rating.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingViewer;
