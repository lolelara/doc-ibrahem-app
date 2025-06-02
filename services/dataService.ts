
import { User, UserRole, WorkoutVideo, Recipe, SubscriptionRequest, SubscriptionStatus, UserStats, SubscriptionPlan, PdfDocument, SubscriptionPlanFeature } from '../types';
import { ADMIN_EMAIL, INITIAL_WORKOUT_VIDEOS, INITIAL_RECIPES, INITIAL_SUBSCRIPTION_PLANS, PDF_MAX_SIZE_BYTES } from '../constants';

const LS_USERS = 'fitzone_users';
const LS_WORKOUT_VIDEOS = 'fitzone_workout_videos';
const LS_RECIPES = 'fitzone_recipes';
const LS_SUBSCRIPTION_REQUESTS = 'fitzone_subscription_requests';
const LS_SUBSCRIPTION_PLANS = 'fitzone_subscription_plans';
const LS_PDF_DOCUMENTS = 'fitzone_pdf_documents';


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
     if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert("LocalStorage is full. Cannot save more data. Please clear some space or contact support.");
     }
  }
};

// Initialize with default admin and data if not present
const initializeData = () => {
  let users = getFromLocalStorage<User[]>(LS_USERS, []);
  const targetAdminEmail = ADMIN_EMAIL; 

  let foundTargetAdmin = false;
  users = users.map(user => {
    const userWithPhone = { ...user, phoneNumber: user.phoneNumber || '' };
    if (user.email === targetAdminEmail) {
      foundTargetAdmin = true;
      return {
        ...userWithPhone,
        role: UserRole.SITE_MANAGER, // Site Manager
        name: user.name || 'Site Manager', 
        password: user.password || 'adminpassword', 
      };
    }
    // Demote any other user who might have been SITE_MANAGER or ADMIN (if not ADMIN_EMAIL)
    if (user.role === UserRole.SITE_MANAGER || (user.role === UserRole.ADMIN && user.email !== targetAdminEmail)) {
      return { ...userWithPhone, role: UserRole.USER };
    }
    return userWithPhone;
  });

  if (!foundTargetAdmin) {
    const newAdmin: User = {
      id: `sitemanager_user_${Date.now()}`,
      email: targetAdminEmail,
      password: 'adminpassword', 
      name: 'Site Manager',
      phoneNumber: '', 
      role: UserRole.SITE_MANAGER,
    };
    users.push(newAdmin);
  }
  saveToLocalStorage(LS_USERS, users);

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
  if (getFromLocalStorage<PdfDocument[]>(LS_PDF_DOCUMENTS, []).length === 0) {
    saveToLocalStorage(LS_PDF_DOCUMENTS, []);
  }
};


initializeData();

// User Management
export const getUsers = (): User[] => getFromLocalStorage<User[]>(LS_USERS, []);
export const getUserByEmail = (email: string): User | undefined => getUsers().find(u => u.email === email);
export const getUserById = (id: string): User | undefined => getUsers().find(u => u.id === id);

export const addUser = (user: Omit<User, 'id' | 'role'> & { role?: UserRole }): User => {
  const users = getUsers();
  let role = UserRole.USER;
  if (user.email === ADMIN_EMAIL) {
    role = UserRole.SITE_MANAGER;
  } else if (user.role) { // Allow role to be passed for testing, but override for ADMIN_EMAIL
    role = user.role;
  }

  const newUser: User = {
    ...user,
    id: `user_${Date.now()}`,
    role: role,
    phoneNumber: user.phoneNumber || '',
  };
  
  if (user.email === ADMIN_EMAIL && newUser.role !== UserRole.SITE_MANAGER) {
      throw new Error("Cannot create non-SiteManager user with the designated Site Manager email.");
  }
    
  users.push(newUser);
  saveToLocalStorage(LS_USERS, users);
  return newUser;
};

export const updateUser = (updatedUser: User, currentUserId?: string): User | undefined => {
  let users = getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index === -1) return undefined;

  const originalUser = users[index];
  const currentUserPerformingAction = currentUserId ? getUserById(currentUserId) : null;

  // Role change logic
  if (originalUser.role !== updatedUser.role) {
    if (!currentUserPerformingAction || currentUserPerformingAction.role !== UserRole.SITE_MANAGER) {
      throw new Error("Only the Site Manager can change user roles.");
    }
    if (originalUser.email === ADMIN_EMAIL && updatedUser.role !== UserRole.SITE_MANAGER) {
      throw new Error("The Site Manager role cannot be changed or demoted by anyone, including themselves.");
    }
    if (updatedUser.role === UserRole.SITE_MANAGER && originalUser.email !== ADMIN_EMAIL) {
      throw new Error("Only the designated email can be Site Manager.");
    }
    // Site Manager can promote USER to ADMIN or demote ADMIN to USER.
    // Cannot promote to SITE_MANAGER (this is fixed to ADMIN_EMAIL).
    if (updatedUser.role === UserRole.SITE_MANAGER) updatedUser.role = UserRole.ADMIN; // Prevent accidental promotion to Site Manager

  } else if (originalUser.role === UserRole.ADMIN && updatedUser.role === UserRole.ADMIN && originalUser.id !== updatedUser.id) {
    // This case implies an admin trying to edit another admin, which is fine for non-role properties.
    // Role change for admins is handled above by SiteManager only.
  } else if (originalUser.id === updatedUser.id && updatedUser.email === ADMIN_EMAIL && updatedUser.role !== UserRole.SITE_MANAGER) {
    // If user is updating their own profile and they are the ADMIN_EMAIL, ensure their role remains SITE_MANAGER.
     updatedUser.role = UserRole.SITE_MANAGER;
  }


  users[index] = { ...users[index], ...updatedUser };
  saveToLocalStorage(LS_USERS, users);
  return users[index];
};

export const updateUserStats = (userId: string, stats: UserStats): User | undefined => {
  const user = getUserById(userId);
  if (user) {
    const updatedUser = { ...user, stats: { ...(user.stats || {}), ...stats } };
    return updateUser(updatedUser, undefined); // currentUserId is undefined as this is self-update, not role change
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
    uploadedBy: adminId 
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
    uploadedBy: adminId 
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

// Subscription Plans
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
    updatedPlan.features = updatedPlan.features.map((f, idx) => ({
        id: f.id || `feat_${updatedPlan.id}_${idx}_${Date.now()}`, 
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
    let users = getUsers();
    users.forEach(user => {
        if (user.activeSubscriptionPlanId === planId) {
            updateUser({ ...user, activeSubscriptionPlanId: undefined, subscriptionStatus: SubscriptionStatus.CANCELLED, subscriptionExpiry: undefined, subscriptionId: undefined, subscriptionNotes: "The subscription plan was deleted by admin." });
        }
    });
    saveToLocalStorage(LS_USERS, users);
    
    let requests = getSubscriptionRequests();
    requests.forEach(req => {
        if (req.planId === planId && req.status === SubscriptionStatus.PENDING) {
            req.status = SubscriptionStatus.REJECTED;
            req.adminNotes = "The requested plan was deleted by admin.";
            req.processedDate = new Date().toISOString();
        }
    });
    saveToLocalStorage(LS_SUBSCRIPTION_REQUESTS, requests);
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
    planNameSnapshot: plan.name,
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
    if (user) { 
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
    const planExists = getSubscriptionPlans().some(p => p.id === user.activeSubscriptionPlanId);
    if (!planExists) {
        return updateUser({ ...user, subscriptionStatus: SubscriptionStatus.CANCELLED, activeSubscriptionPlanId: undefined, subscriptionNotes: "Active subscription plan no longer available."});
    }
  } else if (user && user.subscriptionStatus === SubscriptionStatus.ACTIVE && !user.subscriptionExpiry) {
    return updateUser({ ...user, subscriptionStatus: SubscriptionStatus.EXPIRED, subscriptionNotes: "Subscription active but expiry date missing, marked as expired." });
  }
  return user;
};

// PDF Document Management
export const getPdfDocuments = (): PdfDocument[] => getFromLocalStorage<PdfDocument[]>(LS_PDF_DOCUMENTS, []);

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const addPdfDocument = async (
  pdfDetails: Omit<PdfDocument, 'id' | 'uploadDate' | 'uploadedBy' | 'fileData' | 'fileName'>,
  file: File,
  adminId: string
): Promise<PdfDocument> => {
  if (file.size > PDF_MAX_SIZE_BYTES) {
    throw new Error(`File is too large. Maximum size is ${PDF_MAX_SIZE_BYTES / (1024 * 1024)}MB.`);
  }
  if (file.type !== "application/pdf") {
    throw new Error("Invalid file type. Only PDF files are allowed.");
  }

  const fileData = await fileToBase64(file);
  const documents = getPdfDocuments();
  const newDocument: PdfDocument = {
    ...pdfDetails,
    id: `pdf_${Date.now()}`,
    fileName: file.name,
    fileData,
    uploadedBy: adminId,
    uploadDate: new Date().toISOString(),
  };
  documents.push(newDocument);
  saveToLocalStorage(LS_PDF_DOCUMENTS, documents);
  return newDocument;
};

export const updatePdfDocument = (updatedPdf: PdfDocument): PdfDocument | undefined => {
  let documents = getPdfDocuments();
  const index = documents.findIndex(doc => doc.id === updatedPdf.id);
  if (index !== -1) {
    // Retain original fileData if not explicitly changed to avoid re-uploading or large data transfer
    if (!updatedPdf.fileData && documents[index].fileData) {
        updatedPdf.fileData = documents[index].fileData;
        updatedPdf.fileName = documents[index].fileName;
    }
    documents[index] = updatedPdf;
    saveToLocalStorage(LS_PDF_DOCUMENTS, documents);
    return documents[index];
  }
  return undefined;
};

export const deletePdfDocument = (pdfId: string): boolean => {
  let documents = getPdfDocuments();
  const initialLength = documents.length;
  documents = documents.filter(doc => doc.id !== pdfId);
  if (documents.length < initialLength) {
    saveToLocalStorage(LS_PDF_DOCUMENTS, documents);
    return true;
  }
  return false;
};

export const getPdfsForUser = (userId: string): PdfDocument[] => {
  const documents = getPdfDocuments();
  return documents.filter(doc => doc.assignedUserIds.includes(userId));
};
