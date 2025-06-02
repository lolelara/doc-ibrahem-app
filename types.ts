
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SITE_MANAGER = 'SITE_MANAGER',
}

export interface User {
  id: string;
  email: string;
  password?: string; // Only present during registration, not stored as plain text
  name: string;
  phoneNumber?: string; // Added phone number
  role: UserRole;
  profileImage?: string;
  stats?: UserStats;
  subscriptionId?: string; // Corresponds to SubscriptionRequest.id
  activeSubscriptionPlanId?: string; // Corresponds to SubscriptionPlan.id
  subscriptionExpiry?: string; // ISO Date string
  subscriptionStatus?: SubscriptionStatus;
  subscriptionNotes?: string; // Notes related to subscription, e.g., reason for cancellation
}

export interface UserStats {
  weight?: number; // kg
  height?: number; // cm
  bodyFatPercentage?: number; // %
  progressNotes?: string[];
}

export enum DefaultSubscriptionPlanId { // Renamed to avoid conflict if admin creates plan with same ID string
  BASIC = 'basic_monthly',
  PREMIUM = 'premium_yearly',
  ULTIMATE = 'ultimate_lifetime',
}

export interface SubscriptionPlanFeature {
  id: string;
  text: string;
}
export interface SubscriptionPlan {
  id: string; // Can be from DefaultSubscriptionPlanId or newly generated for admin-added plans
  name: string;
  price: number; 
  currency: string;
  description: string;
  features: SubscriptionPlanFeature[]; // Changed from string[]
}

export enum SubscriptionStatus {
  PENDING = 'pending_approval',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled', // Can be due to rejection or user cancellation
  REJECTED = 'rejected', // Specifically for admin rejection
}

export interface SubscriptionRequest {
  id: string;
  userId: string;
  userEmail: string; // for display in admin panel
  planId: string; // Now string to accommodate dynamic plans
  planNameSnapshot: string; // Store plan name at time of request for history
  requestDate: string; // ISO Date string
  status: SubscriptionStatus;
  adminNotes?: string;
  processedBy?: string; // Admin user ID (for approval or rejection)
  processedDate?: string; // ISO Date string (approval or rejection date)
  expiryDate?: string; // ISO Date string, set by admin on approval
}

export interface WorkoutVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // e.g., YouTube embed URL
  thumbnailUrl?: string;
  durationMinutes: number;
  category: string; // e.g., Cardio, Strength, Flexibility
  uploadedBy: string; // Admin user ID
  uploadDate: string; // ISO Date string
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: { item: string; quantity: string }[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  imageUrl?: string;
  category: string; // e.g., Breakfast, Lunch, Dinner, Snack
  calories?: number; // per serving
  uploadedBy: string; // Admin user ID
  uploadDate: string; // ISO Date string
}

export interface CalorieIntakeItem {
  id: string;
  foodItem: string;
  calories: number;
  date: string; // ISO Date string
}

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO Date string
}

// For Localization
export interface Translations {
  [key: string]: string | Translations;
}

// PDF Library Types
export interface PdfDocument {
  id: string;
  fileName: string;
  fileData: string; // Base64 encoded string of the PDF file
  description: string;
  uploadedBy: string; // Admin user ID
  uploadDate: string; // ISO Date string
  assignedUserIds: string[]; // Array of user IDs this PDF is assigned to
}

// Macronutrient Calculator Types REMOVED
