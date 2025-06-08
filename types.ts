
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
  country?: string; // Added country field
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

// Global Notification Type
export interface Notification {
  id: string;
  message: string;
  senderId: string; // Site Manager's ID
  timestamp: string; // ISO Date string
  isGlobal: true; // True if sent to all users
  readByUserIds: string[]; // Tracks which users have read/dismissed this notification
}

// User Transformation Posts
export interface TransformationPost {
  id: string;
  userId: string;
  userName: string; // Snapshot of user's name at time of posting
  userProfileImage?: string; // Snapshot of user's profile image
  title: string;
  beforeImageUrl: string; // Base64 data URL
  afterImageUrl: string; // Base64 data URL
  createdAt: string; // ISO date string
  likes: string[]; // Array of user IDs who liked the post
  commentsCount: number;
}

export interface TransformationComment {
  id: string;
  postId: string;
  userId: string;
  userName: string; // Snapshot of commenter's name
  userProfileImage?: string; // Snapshot of commenter's profile image
  text: string;
  createdAt: string; // ISO date string
}

// External Resource Link
export enum ExternalResourceCategory {
  WORKOUT_PLAN = 'workout_plan',
  NUTRITION_GUIDE = 'nutrition_guide',
  INFORMATIONAL_ARTICLE = 'informational_article',
  OTHER = 'other',
}

export interface ExternalResourceLink {
  id: string;
  title: string;
  url: string; 
  description?: string;
  category: ExternalResourceCategory;
  addedBy: string; // Admin/SiteManager ID
  addedDate: string; // ISO Date string
  assignedUserIds: string[]; // Users this link is for
}