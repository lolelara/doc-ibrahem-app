
import React, { useState } from 'react';
import Input, { Select } from '../Shared/Input';
import Button from '../Shared/Button';
import { ARABIC_STRINGS } from '../../constants';
import { ActivityLevel, CalorieGoal, CalorieFormData } from '../../types';
import { calculateCaloriesWithGemini } from '../../services/geminiService';
import LoadingSpinner from '../Shared/LoadingSpinner';

const CalorieCalculator: React.FC = () => {
  const [formData, setFormData] = useState<CalorieFormData>({
    age: 30,
    weight: 70,
    height: 170,
    activityLevel: ActivityLevel.MODERATE,
    goal: CalorieGoal.MAINTAIN_WEIGHT,
    gender: 'male',
  });
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activityLevelOptions = Object.entries(ARABIC_STRINGS.activityLevels).map(([key, label]) => ({
    value: key as ActivityLevel,
    label,
  }));

  const goalOptions = Object.entries(ARABIC_STRINGS.calorieGoals).map(([key, label]) => ({
    value: key as CalorieGoal,
    label,
  }));

  const genderOptions = [
    { value: 'male', label: ARABIC_STRINGS.male },
    { value: 'female', label: ARABIC_STRINGS.female },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'weight' || name === 'height' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);
    try {
      const calculatedCalories = await calculateCaloriesWithGemini(formData);
      setResult(calculatedCalories);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 shadow-lg rounded-lg max-w-2xl mx-auto text-gray-200">
      <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">{ARABIC_STRINGS.calorieCalculator}</h2>
      <p className="text-gray-400 text-center mb-6">
        استخدم هذه الحاسبة المدعومة بالذكاء الاصطناعي لتقدير احتياجاتك اليومية من السعرات الحرارية.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={ARABIC_STRINGS.age}
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
            min="15"
            max="100"
          />
          <Input
            label={ARABIC_STRINGS.weight}
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            required
            min="30"
            max="300"
            step="0.1"
          />
          <Input
            label={ARABIC_STRINGS.height}
            type="number"
            name="height"
            value={formData.height}
            onChange={handleChange}
            required
            min="100"
            max="250"
          />
          <Select
            label={ARABIC_STRINGS.gender}
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            options={genderOptions}
          />
        </div>
        <Select
          label={ARABIC_STRINGS.activityLevel}
          name="activityLevel"
          value={formData.activityLevel}
          onChange={handleChange}
          options={activityLevelOptions}
        />
        <Select
          label={ARABIC_STRINGS.goal}
          name="goal"
          value={formData.goal}
          onChange={handleChange}
          options={goalOptions}
        />
        <Button type="submit" isLoading={isLoading} className="w-full">
          {ARABIC_STRINGS.calculate}
        </Button>
      </form>
      {isLoading && <div className="mt-6"><LoadingSpinner /></div>}
      {error && <p className="mt-6 text-center text-red-400 bg-red-900 bg-opacity-30 p-3 rounded-md">{error}</p>}
      {result && !isLoading && (
        <div className="mt-8 p-6 bg-green-700 bg-opacity-30 border-s-4 border-green-500 rounded-md shadow">
          <h3 className="text-xl font-semibold text-green-300">{ARABIC_STRINGS.dailyCalories}</h3>
          <p className="text-3xl font-bold text-green-200 mt-2">{result} سعرة حرارية/يوم</p>
        </div>
      )}
    </div>
  );
};

export default CalorieCalculator;