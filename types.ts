
export enum UserRole {
  ADMIN = 'admin',
  TRAINER = 'trainer',
  TRAINEE = 'trainee',
}

export enum AccountStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
}

export interface TrainingPlan {
  id: string; // UUID from DB
  name: string;
  description: string;
  price: number; // Stored as DECIMAL in DB, number in JS
  durationMonths: number;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

export interface User {
  id: string; // UUID from DB
  phoneNumber: string;
  country: string;
  name?: string;
  email?: string;
  role: UserRole;
  status: AccountStatus;
  trainerId?: string | null; // UUID from DB, can be null
  traineeIds?: string[]; // For trainers, IDs of their assigned trainees (consider if this is derived or stored)
  selectedPlanId?: string | null; // UUID from DB
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  // password_hash or password should NOT be in the frontend User object after login
}

export interface TrainingVideo {
  id: string; // UUID from DB
  title: string;
  youtubeUrl: string;
  uploadedBy: string; // User ID (trainer or admin)
  uploadedByName?: string; // Optional: name of uploader for display
  createdAt?: string;
  updatedAt?: string;
}

export interface NutritionFile {
  id: string; // UUID from DB
  name: string;
  fileUrl: string; // URL to the stored file (e.g., Google Drive)
  uploadedBy: string; // User ID (trainer or admin)
  uploadedByName?: string; // Optional: name of uploader for display
  traineeId?: string | null; // Optional: if specific to a trainee
  createdAt?: string;
  updatedAt?: string;
}

export interface TraineeScheduleItem {
  id: string; // UUID from DB
  traineeId: string; // User ID of the trainee
  day: string; // e.g., "Monday", "Day 1"
  exercises: string; // Description of exercises
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string; // UUID from DB
  senderId: string;
  receiverId: string;
  content: string;
  sentAt: string; // ISO date string (when message was sent)
  read: boolean;
  createdAt?: string; // DB record creation time
  updatedAt?: string; // DB record update time
}

export interface NotificationItem {
  id: string; // UUID from DB
  recipientSpecifier: string; // User ID, 'all', or a UserRole
  title: string;
  message: string;
  sentAt: string; // ISO date string (when notification was sent)
  read: boolean;
  link?: string;
  createdAt?: string; // DB record creation time
  updatedAt?: string; // DB record update time
}

export interface Rating {
  id:string; // UUID from DB
  ratedItemId: string; // Plan ID or Trainer ID
  ratedItemType: 'plan' | 'trainer';
  userId: string; // Trainee ID who made the rating
  userName?: string; // Name of the user who made the rating (for admin display)
  stars: number; // 1-5
  comment?: string;
  ratingTimestamp: string; // ISO date string (when rating was submitted)
  createdAt?: string; // DB record creation time
  updatedAt?: string; // DB record update time
}

export enum CalorieGoal {
  LOSE_WEIGHT = 'lose_weight',
  MAINTAIN_WEIGHT = 'maintain_weight',
  GAIN_WEIGHT = 'gain_weight',
}

export enum ActivityLevel {
  SEDENTARY = 'sedentary', // little or no exercise
  LIGHT = 'light', // light exercise/sports 1-3 days/week
  MODERATE = 'moderate', // moderate exercise/sports 3-5 days/week
  ACTIVE = 'active', // hard exercise/sports 6-7 days a week
  VERY_ACTIVE = 'very_active', // very hard exercise/sports & physical job
}

export interface CalorieFormData {
  age: number;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
  goal: CalorieGoal;
  gender: 'male' | 'female';
}
