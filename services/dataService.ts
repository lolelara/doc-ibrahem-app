import { User, UserRole, WorkoutVideo, Recipe, SubscriptionRequest, SubscriptionStatus, UserStats, SubscriptionPlan, DefaultSubscriptionPlanId, SubscriptionPlanFeature } from '../types';
import { ADMIN_EMAIL, INITIAL_WORKOUT_VIDEOS, INITIAL_RECIPES, INITIAL_SUBSCRIPTION_PLANS } from '../constants';

const LS_USERS = 'fitzone_users';
const LS_WORKOUT_VIDEOS = 'fitzone_workout_videos';
const LS_RECIPES = 'fitzone_recipes';
const LS_SUBSCRIPTION_REQUESTS = 'fitzone_subscription_requests'; // Renamed for clarity
const LS_SUBSCRIPTION_PLANS = 'fitzone_subscription_plans';


const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
};

// Initialize with default admin and data if not present
const initializeData = () => {
  let users = getFromLocalStorage<User[]>(LS_USERS, []);
  const targetAdminEmail = ADMIN_EMAIL; // This will be the new admin email from constants.ts

  let foundTargetAdmin = false;
  users = users.map(user => {
    if (user.email === targetAdminEmail) {
      foundTargetAdmin = true;
      // Ensure this user is admin and has a name/password
      return {
        ...user,
        role: UserRole.ADMIN,
        name: user.name || 'Admin', // Default name if none exists, or keeps existing
        // Password will be their existing one, or 'adminpassword' via login backdoor if new
        password: user.password || 'adminpassword', // Ensure admin has a default password if not set
      };
    }
    // If this user was an admin but not the target one, demote them.
    if (user.role === UserRole.ADMIN && user.email !== targetAdminEmail) {
      return { ...user, role: UserRole.USER };
    }
    return user;
  });

  if (!foundTargetAdmin) {
    // Target admin email was not found, create a new admin user.
    const newAdmin: User = {
      id: `admin_user_${Date.now()}`,
      email: targetAdminEmail,
      password: 'adminpassword', // Default password for new admin
      name: 'Admin', // Default name for a newly created admin
      role: UserRole.ADMIN,
    };
    users.push(newAdmin);
  }
  saveToLocalStorage(LS_USERS, users);

  // Initialize other data (videos, recipes, plans, requests)
  // These use ADMIN_EMAIL for 'uploadedBy' in initial data, so they'll reflect the new admin.
  if (getFromLocalStorage<WorkoutVideo[]>(LS_WORKOUT_VIDEOS, []).length === 0) {
    saveToLocalStorage(LS_WORKOUT_VIDEOS, INITIAL_WORKOUT_VIDEOS);
  }
  if (getFromLocalStorage<Recipe[]>(LS_RECIPES, []).length === 0) {
    saveToLocalStorage(LS_RECIPES, INITIAL_RECIPES);
  }
  if (getFromLocalStorage<SubscriptionRequest[]>(LS_SUBSCRIPTION_REQUESTS, []).length === 0) {
    saveToLocalStorage(LS_SUBSCRIPTION_REQUESTS, []);
  }
  if (getFromLocalStorage<SubscriptionPlan[]>(LS_SUBSCRIPTION_PLANS, []).length === 0) {
    saveToLocalStorage(LS_SUBSCRIPTION_PLANS, INITIAL_SUBSCRIPTION_PLANS);
  }
};


initializeData();

// User Management
export const getUsers = (): User[] => getFromLocalStorage<User[]>(LS_USERS, []);
export const getUserByEmail = (email: string): User | undefined => getUsers().find(u => u.email === email);
export const getUserById = (id: string): User | undefined => getUsers().find(u => u.id === id);
export const addUser = (user: User): User => {
  const users = getUsers();
  // Ensure new users are not accidentally admin unless explicitly set by admin functions
  const role = user.email === ADMIN_EMAIL ? UserRole.ADMIN : UserRole.USER;
  const newUser = { ...user, id: `user_${Date.now()}`, role: user.role || role };
  
  // Prevent adding another user with ADMIN_EMAIL if they are not the admin
  if (user.email === ADMIN_EMAIL && newUser.role !== UserRole.ADMIN) {
      console.warn(`Attempted to add user with ADMIN_EMAIL (${user.email}) but not as ADMIN. This is not allowed.`);
      throw new Error("Cannot create non-admin user with the designated admin email.");
  }
    
  users.push(newUser);
  saveToLocalStorage(LS_USERS, users);
  return newUser;
};
export const updateUser = (updatedUser: User): User | undefined => {
  let users = getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    // If trying to change email to ADMIN_EMAIL, ensure role is ADMIN
    if (updatedUser.email === ADMIN_EMAIL && updatedUser.role !== UserRole.ADMIN) {
        // This scenario should ideally be handled by making targetAdminEmail user admin in initializeData
        // Or prevent changing a user's email to ADMIN_EMAIL if they are not becoming admin.
        // For now, let's assume role is handled correctly by calling context or ensure it here.
        console.warn(`Updating user ${updatedUser.id} to ADMIN_EMAIL but role is ${updatedUser.role}. Setting to ADMIN.`);
        updatedUser.role = UserRole.ADMIN;
    }
    // If an admin is being demoted, or their email changed from ADMIN_EMAIL
    if (users[index].email === ADMIN_EMAIL && users[index].role === UserRole.ADMIN && updatedUser.email !== ADMIN_EMAIL) {
        console.warn(`Admin with email ${ADMIN_EMAIL} is having their email changed. This might affect admin access if not handled carefully.`);
        // This case should be rare if initializeData is the main source of admin truth.
    }

    users[index] = { ...users[index], ...updatedUser };
    saveToLocalStorage(LS_USERS, users);
    return users[index];
  }
  return undefined;
};
export const updateUserStats = (userId: string, stats: UserStats): User | undefined => {
  const user = getUserById(userId);
  if (user) {
    const updatedUser = { ...user, stats: { ...(user.stats || {}), ...stats } };
    return updateUser(updatedUser);
  }
  return undefined;
};


// Workout Videos
export const getWorkoutVideos = (): WorkoutVideo[] => getFromLocalStorage<WorkoutVideo[]>(LS_WORKOUT_VIDEOS, []);
export const addWorkoutVideo = (video: Omit<WorkoutVideo, 'id' | 'uploadDate' | 'uploadedBy'>, adminId: string): WorkoutVideo => {
  const videos = getWorkoutVideos();
  const newVideo: WorkoutVideo = { 
    ...video, 
    id: `vid_${Date.now()}`, 
    uploadDate: new Date().toISOString(),
    uploadedBy: adminId // Should be the current admin's ID or email
  };
  videos.push(newVideo);
  saveToLocalStorage(LS_WORKOUT_VIDEOS, videos);
  return newVideo;
};
export const updateWorkoutVideo = (updatedVideo: WorkoutVideo): WorkoutVideo | undefined => {
  let videos = getWorkoutVideos();
  const index = videos.findIndex(v => v.id === updatedVideo.id);
  if (index !== -1) {
    videos[index] = updatedVideo;
    saveToLocalStorage(LS_WORKOUT_VIDEOS, videos);
    return videos[index];
  }
  return undefined;
};
export const deleteWorkoutVideo = (videoId: string): boolean => {
  let videos = getWorkoutVideos();
  const initialLength = videos.length;
  videos = videos.filter(v => v.id !== videoId);
  if (videos.length < initialLength) {
    saveToLocalStorage(LS_WORKOUT_VIDEOS, videos);
    return true;
  }
  return false;
};

// Recipes
export const getRecipes = (): Recipe[] => getFromLocalStorage<Recipe[]>(LS_RECIPES, []);
export const addRecipe = (recipe: Omit<Recipe, 'id' | 'uploadDate' | 'uploadedBy'>, adminId: string): Recipe => {
  const recipes = getRecipes();
  const newRecipe: Recipe = { 
    ...recipe, 
    id: `rec_${Date.now()}`, 
    uploadDate: new Date().toISOString(),
    uploadedBy: adminId // Should be the current admin's ID or email
  };
  recipes.push(newRecipe);
  saveToLocalStorage(LS_RECIPES, recipes);
  return newRecipe;
};
export const updateRecipe = (updatedRecipe: Recipe): Recipe | undefined => {
  let recipes = getRecipes();
  const index = recipes.findIndex(r => r.id === updatedRecipe.id);
  if (index !== -1) {
    recipes[index] = updatedRecipe;
    saveToLocalStorage(LS_RECIPES, recipes);
    return recipes[index];
  }
  return undefined;
};
export const deleteRecipe = (recipeId: string): boolean => {
  let recipes = getRecipes();
  const initialLength = recipes.length;
  recipes = recipes.filter(r => r.id !== recipeId);
  if (recipes.length < initialLength) {
    saveToLocalStorage(LS_RECIPES, recipes);
    return true;
  }
  return false;
};

// Subscription Plans (Admin Editable)
export const getSubscriptionPlans = (): SubscriptionPlan[] => getFromLocalStorage<SubscriptionPlan[]>(LS_SUBSCRIPTION_PLANS, INITIAL_SUBSCRIPTION_PLANS);

export const addSubscriptionPlan = (plan: Omit<SubscriptionPlan, 'id'>): SubscriptionPlan => {
  const plans = getSubscriptionPlans();
  const newPlan: SubscriptionPlan = {
    ...plan,
    id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    features: plan.features.map((f, idx) => ({ ...f, id: `feat_${Date.now()}_${idx}`}))
  };
  plans.push(newPlan);
  saveToLocalStorage(LS_SUBSCRIPTION_PLANS, plans);
  return newPlan;
};

export const updateSubscriptionPlan = (updatedPlan: SubscriptionPlan): SubscriptionPlan | undefined => {
  let plans = getSubscriptionPlans();
  const index = plans.findIndex(p => p.id === updatedPlan.id);
  if (index !== -1) {
    // Ensure feature IDs are preserved or regenerated if necessary
    updatedPlan.features = updatedPlan.features.map((f, idx) => ({
        id: f.id || `feat_${updatedPlan.id}_${idx}_${Date.now()}`, // Assign new ID if missing
        text: f.text
    }));
    plans[index] = updatedPlan;
    saveToLocalStorage(LS_SUBSCRIPTION_PLANS, plans);
    return plans[index];
  }
  return undefined;
};

export const deleteSubscriptionPlan = (planId: string): boolean => {
  let plans = getSubscriptionPlans();
  const initialLength = plans.length;
  plans = plans.filter(p => p.id !== planId);
  if (plans.length < initialLength) {
    saveToLocalStorage(LS_SUBSCRIPTION_PLANS, plans);
    // Side effect: update users who might have this plan active
    let users = getUsers();
    users.forEach(user => {
        if (user.activeSubscriptionPlanId === planId) {
            updateUser({ ...user, activeSubscriptionPlanId: undefined, subscriptionStatus: SubscriptionStatus.CANCELLED, subscriptionExpiry: undefined, subscriptionId: undefined, subscriptionNotes: "The subscription plan was deleted by admin." });
        }
    });
    saveToLocalStorage(LS_USERS, users); // Save updated users
    
    // Side effect: update subscription requests linked to this plan
    let requests = getSubscriptionRequests();
    requests.forEach(req => {
        if (req.planId === planId && req.status === SubscriptionStatus.PENDING) {
            // Optionally, auto-reject or mark as invalid. For now, mark as rejected.
            req.status = SubscriptionStatus.REJECTED;
            req.adminNotes = "The requested plan was deleted by admin.";
            req.processedDate = new Date().toISOString();
            // req.processedBy could be 'system' or the current admin if available contextually
        }
    });
    saveToLocalStorage(LS_SUBSCRIPTION_REQUESTS, requests); // Save updated requests
    return true;
  }
  return false;
};


// Subscription Requests
export const getSubscriptionRequests = (): SubscriptionRequest[] => getFromLocalStorage<SubscriptionRequest[]>(LS_SUBSCRIPTION_REQUESTS, []);

export const requestSubscription = (userId: string, userEmail: string, planId: string): SubscriptionRequest => {
  const requests = getSubscriptionRequests();
  const existingPendingRequest = requests.find(r => r.userId === userId && r.status === SubscriptionStatus.PENDING);
  if (existingPendingRequest) {
    throw new Error("لديك بالفعل طلب اشتراك معلق.");
  }
  
  const plan = getSubscriptionPlans().find(p => p.id === planId);
  if (!plan) {
    throw new Error("خطة الاشتراك المحددة غير متوفرة.");
  }

  const newRequest: SubscriptionRequest = {
    id: `subreq_${Date.now()}`,
    userId,
    userEmail,
    planId,
    planNameSnapshot: plan.name, // Store plan name at time of request
    requestDate: new Date().toISOString(),
    status: SubscriptionStatus.PENDING,
  };
  requests.push(newRequest);
  saveToLocalStorage(LS_SUBSCRIPTION_REQUESTS, requests);

  const user = getUserById(userId);
  if (user) {
    updateUser({ ...user, subscriptionStatus: SubscriptionStatus.PENDING, activeSubscriptionPlanId: planId, subscriptionNotes: 'Subscription requested, pending approval.' });
  }

  return newRequest;
};

export const approveSubscription = (requestId: string, adminId: string, durationDays: number): SubscriptionRequest | undefined => {
  const requests = getSubscriptionRequests();
  const requestIndex = requests.findIndex(r => r.id === requestId);

  if (requestIndex !== -1) {
    const request = requests[requestIndex];
    const user = getUserById(request.userId);

    if (user) {
      const now = new Date();
      const expiryDate = new Date(new Date().setDate(now.getDate() + durationDays)).toISOString();
      
      request.status = SubscriptionStatus.ACTIVE;
      request.processedBy = adminId;
      request.processedDate = new Date().toISOString();
      request.expiryDate = expiryDate;
      
      saveToLocalStorage(LS_SUBSCRIPTION_REQUESTS, requests);
      
      updateUser({ 
        ...user, 
        subscriptionId: request.id, 
        activeSubscriptionPlanId: request.planId,
        subscriptionExpiry: expiryDate, 
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionNotes: `Subscription approved by ${adminId}. Expires on ${expiryDate}.`
      });
      return request;
    }
  }
  return undefined;
};

export const rejectSubscription = (requestId: string, adminId: string, adminNotes?: string): SubscriptionRequest | undefined => {
  const requests = getSubscriptionRequests();
  const requestIndex = requests.findIndex(r => r.id === requestId);

  if (requestIndex !== -1) {
    requests[requestIndex].status = SubscriptionStatus.REJECTED;
    requests[requestIndex].adminNotes = adminNotes;
    requests[requestIndex].processedBy = adminId; 
    requests[requestIndex].processedDate = new Date().toISOString();
    saveToLocalStorage(LS_SUBSCRIPTION_REQUESTS, requests);

    const user = getUserById(requests[requestIndex].userId);
    if (user) { // Clear related fields on user
        updateUser({ ...user, subscriptionStatus: SubscriptionStatus.REJECTED, subscriptionId: undefined, activeSubscriptionPlanId: undefined, subscriptionExpiry: undefined, subscriptionNotes: `Subscription rejected by ${adminId}. Notes: ${adminNotes}` });
    }
    return requests[requestIndex];
  }
  return undefined;
};

export const checkUserSubscriptionStatus = (userId: string): User | undefined => {
  const user = getUserById(userId);
  if (user && user.subscriptionId && user.subscriptionExpiry && user.subscriptionStatus === SubscriptionStatus.ACTIVE) {
    if (new Date(user.subscriptionExpiry) < new Date()) {
      return updateUser({ ...user, subscriptionStatus: SubscriptionStatus.EXPIRED, subscriptionNotes: "Subscription expired." });
    }
    // Check if the active plan still exists
    const planExists = getSubscriptionPlans().some(p => p.id === user.activeSubscriptionPlanId);
    if (!planExists) {
        // Plan was deleted, mark subscription as cancelled or expired
        return updateUser({ ...user, subscriptionStatus: SubscriptionStatus.CANCELLED, activeSubscriptionPlanId: undefined, subscriptionNotes: "Active subscription plan no longer available."});
    }

  } else if (user && user.subscriptionStatus === SubscriptionStatus.ACTIVE && !user.subscriptionExpiry) {
    // This case handles if somehow an active sub has no expiry, mark as expired.
    return updateUser({ ...user, subscriptionStatus: SubscriptionStatus.EXPIRED, subscriptionNotes: "Subscription active but expiry date missing, marked as expired." });
  }
  return user;
};
