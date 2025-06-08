
import React, { useState } from 'react';

interface StarRatingProps {
  count?: number;
  initialRating?: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: number; // size in pixels
}

const StarRating: React.FC<StarRatingProps> = ({
  count = 5,
  initialRating = 0,
  onRatingChange,
  readOnly = false,
  size = 24,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (index: number) => {
    if (readOnly) return;
    const newRating = index + 1;
    setRating(newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (readOnly) return;
    setHoverRating(index + 1);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };

  return (
    <div className="flex items-center">
      {[...Array(count)].map((_, index) => {
        const starValue = index + 1;
        return (
          <span
            key={index}
            style={{ fontSize: `${size}px`, color: (hoverRating || rating) >= starValue ? '#FFD700' : '#6b7280', cursor: readOnly ? 'default' : 'pointer' }} // #6b7280 is gray-500
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            className="transition-colors duration-150"
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;