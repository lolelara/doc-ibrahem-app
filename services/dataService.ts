
import { User, UserRole, WorkoutVideo, Recipe, SubscriptionRequest, SubscriptionStatus, UserStats, SubscriptionPlan, PdfDocument, SubscriptionPlanFeature, Notification } from '../types';
import { ADMIN_EMAIL, INITIAL_WORKOUT_VIDEOS, INITIAL_RECIPES, INITIAL_SUBSCRIPTION_PLANS, PDF_MAX_SIZE_BYTES, COUNTRIES_LIST } from '../constants';

const LS_USERS = 'fitzone_users';
const LS_WORKOUT_VIDEOS = 'fitzone_workout_videos';
const LS_RECIPES = 'fitzone_recipes';
const LS_SUBSCRIPTION_REQUESTS = 'fitzone_subscription_requests';
const LS_SUBSCRIPTION_PLANS = 'fitzone_subscription_plans';
const LS_PDF_DOCUMENTS = 'fitzone_pdf_documents';
const LS_GLOBAL_NOTIFICATIONS = 'fitzone_global_notifications';


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
    const userWithPhoneAndCountry = { 
        ...user, 
        phoneNumber: user.phoneNumber || '',
        country: user.country || COUNTRIES_LIST[0]?.code || '' // Default to first country or empty string
    };
    if (user.email === targetAdminEmail) {
      foundTargetAdmin = true;
      return {
        ...userWithPhoneAndCountry,
        role: UserRole.SITE_MANAGER, // Site Manager
        name: user.name || 'Site Manager', 
        password: user.password || 'adminpassword', 
      };
    }
    // Demote any other user who might have been SITE_MANAGER or ADMIN (if not ADMIN_EMAIL)
    if (user.role === UserRole.SITE_MANAGER || (user.role === UserRole.ADMIN && user.email !== targetAdminEmail)) {
      return { ...userWithPhoneAndCountry, role: UserRole.USER };
    }
    return userWithPhoneAndCountry;
  });

  if (!foundTargetAdmin) {
    const newAdmin: User = {
      id: `sitemanager_user_${Date.now()}`,
      email: targetAdminEmail,
      password: 'adminpassword', 
      name: 'Site Manager',
      phoneNumber: '', 
      country: COUNTRIES_LIST[0]?.code || '',
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
  if (getFromLocalStorage<Notification[]>(LS_GLOBAL_NOTIFICATIONS, []).length === 0) {
    saveToLocalStorage(LS_GLOBAL_NOTIFICATIONS, []);
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

  if (!user.phoneNumber) { // Phone number is now mandatory
    throw new Error("Phone number is required.");
  }

  const newUser: User = {
    ...user,
    id: `user_${Date.now()}`,
    role: role,
    phoneNumber: user.phoneNumber, // Already checked for presence
    country: user.country || COUNTRIES_LIST[0]?.code || '',
  };
  
  if (user.email === ADMIN_EMAIL && newUser.role !== UserRole.SITE_MANAGER) {
      throw new Error("Cannot create non-SiteManager user with the designated Site Manager email.");
  }
    
  users.push(newUser);
  saveToLocalStorage(LS_USERS, users);
  return newUser;
};

export const updateUser = (updatedUserPartial: Partial<User> & { id: string }, currentUserId?: string): User | undefined => {
  let users = getUsers();
  const index = users.findIndex(u => u.id === updatedUserPartial.id);
  if (index === -1) return undefined;

  const originalUser = users[index];
  const currentUserPerformingAction = currentUserId ? getUserById(currentUserId) : null;

  let finalUpdatedUser: User = { ...originalUser, ...updatedUserPartial };

  // Role change logic - only Site Manager can change roles
  if (updatedUserPartial.role && originalUser.role !== updatedUserPartial.role) {
    if (!currentUserPerformingAction || currentUserPerformingAction.role !== UserRole.SITE_MANAGER) {
      throw new Error("Only the Site Manager can change user roles.");
    }
    if (originalUser.email === ADMIN_EMAIL && updatedUserPartial.role !== UserRole.SITE_MANAGER) {
      // Prevent demoting the site manager account itself
      throw new Error("The Site Manager role cannot be changed or demoted by anyone, including themselves.");
    }
    if (updatedUserPartial.role === UserRole.SITE_MANAGER && originalUser.email !== ADMIN_EMAIL) {
      throw new Error("Only the designated email can be Site Manager.");
    }
    // Site Manager can promote USER to ADMIN or demote ADMIN to USER.
    // An ADMIN cannot be promoted to SITE_MANAGER this way.
    if (updatedUserPartial.role === UserRole.SITE_MANAGER && originalUser.role !== UserRole.SITE_MANAGER) {
        finalUpdatedUser.role = UserRole.ADMIN; // Correct accidental promotion attempt
    } else {
        finalUpdatedUser.role = updatedUserPartial.role;
    }
  } else {
    // Ensure role is not accidentally changed if not part of updatedUserPartial
    finalUpdatedUser.role = originalUser.role; 
  }

  // Site Manager editing other user's sensitive info (email, password)
  if (currentUserPerformingAction && currentUserPerformingAction.role === UserRole.SITE_MANAGER && originalUser.id !== currentUserPerformingAction.id) {
    // Email change
    if (updatedUserPartial.email && updatedUserPartial.email !== originalUser.email) {
      if (updatedUserPartial.email === ADMIN_EMAIL) {
        throw new Error("Cannot change another user's email to the Site Manager's email.");
      }
      const emailExists = users.some(u => u.email === updatedUserPartial.email && u.id !== originalUser.id);
      if (emailExists) {
        throw new Error("This email address is already in use by another user.");
      }
      finalUpdatedUser.email = updatedUserPartial.email;
    }

    // Password change by Site Manager for another user
    if (updatedUserPartial.password) { // password field in partial means intent to change
      finalUpdatedUser.password = updatedUserPartial.password;
    }
  } else if (originalUser.id === updatedUserPartial.id) { // User editing their own profile
      if (updatedUserPartial.email && updatedUserPartial.email !== originalUser.email && originalUser.email === ADMIN_EMAIL) {
         throw new Error("Site Manager cannot change their primary email address through profile edit.");
      }
       // If user is updating their own profile and they are the ADMIN_EMAIL, ensure their role remains SITE_MANAGER.
      if (originalUser.email === ADMIN_EMAIL) {
        finalUpdatedUser.role = UserRole.SITE_MANAGER;
      }
      // For self-update, password change should be handled via a separate "Change Password" form, not here directly.
      // If password property is present in updatedUserPartial for self-update, it's likely from the registration flow.
      // We preserve the original password if not explicitly changing via Site Manager action for another user.
      if (!updatedUserPartial.password && originalUser.password) {
        finalUpdatedUser.password = originalUser.password;
      }
  }


  users[index] = finalUpdatedUser;
  saveToLocalStorage(LS_USERS, users);
  return users[index];
};


export const deleteUser = (userIdToDelete: string, siteManagerId: string): boolean => {
  let users = getUsers();
  const siteManager = getUserById(siteManagerId);

  if (!siteManager || siteManager.role !== UserRole.SITE_MANAGER) {
    throw new Error("Only the Site Manager can delete users.");
  }

  if (userIdToDelete === siteManagerId) {
    throw new Error("Site Manager cannot delete their own account.");
  }

  const userIndex = users.findIndex(u => u.id === userIdToDelete);
  if (userIndex === -1) {
    return false; // User not found
  }

  users.splice(userIndex, 1);
  saveToLocalStorage(LS_USERS, users);

  // Clean up related data
  // 1. Subscription Requests
  let subRequests = getSubscriptionRequests();
  subRequests = subRequests.filter(req => req.userId !== userIdToDelete);
  saveToLocalStorage(LS_SUBSCRIPTION_REQUESTS, subRequests);

  // 2. PDF Assignments
  let pdfs = getPdfDocuments();
  pdfs.forEach(pdf => {
    const assignmentIndex = pdf.assignedUserIds.indexOf(userIdToDelete);
    if (assignmentIndex > -1) {
      pdf.assignedUserIds.splice(assignmentIndex, 1);
    }
  });
  saveToLocalStorage(LS_PDF_DOCUMENTS, pdfs);
  
  // 3. Global Notifications (remove user from readByUserIds)
  let globalNotifications = getFromLocalStorage<Notification[]>(LS_GLOBAL_NOTIFICATIONS, []);
  globalNotifications.forEach(notification => {
    const readIndex = notification.readByUserIds.indexOf(userIdToDelete);
    if (readIndex > -1) {
      notification.readByUserIds.splice(readIndex, 1);
    }
  });
  saveToLocalStorage(LS_GLOBAL_NOTIFICATIONS, globalNotifications);


  return true;
};


export const updateUserStats = (userId: string, stats: UserStats): User | undefined => {
  const user = getUserById(userId);
  if (user) {
    const updatedUser = { ...user, stats: { ...(user.stats || {}), ...stats } };
    // Pass undefined for currentUserId as this is self-update, not role change
    return updateUser(updatedUser, undefined); 
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
        id: user.id, // ensure id is passed for updateUser
        subscriptionId: request.id, 
        activeSubscriptionPlanId: request.planId,
        subscriptionExpiry: expiryDate, 
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionNotes: `Subscription approved by ${adminId}. Expires on ${expiryDate}.`
      }, adminId); // Pass adminId as currentUserId for context if needed
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
        updateUser({ 
            id: user.id, // ensure id is passed
            subscriptionStatus: SubscriptionStatus.REJECTED, 
            subscriptionId: undefined, 
            activeSubscriptionPlanId: undefined, 
            subscriptionExpiry: undefined, 
            subscriptionNotes: `Subscription rejected by ${adminId}. Notes: ${adminNotes}` 
        }, adminId); // Pass adminId for context
    }
    return requests[requestIndex];
  }
  return undefined;
};
export const checkUserSubscriptionStatus = (userId: string): User | undefined => {
  const user = getUserById(userId);
  if (user && user.subscriptionId && user.subscriptionExpiry && user.subscriptionStatus === SubscriptionStatus.ACTIVE) {
    if (new Date(user.subscriptionExpiry) < new Date()) {
      return updateUser({ id: user.id, subscriptionStatus: SubscriptionStatus.EXPIRED, subscriptionNotes: "Subscription expired." });
    }
    const planExists = getSubscriptionPlans().some(p => p.id === user.activeSubscriptionPlanId);
    if (!planExists) {
        return updateUser({ id: user.id, subscriptionStatus: SubscriptionStatus.CANCELLED, activeSubscriptionPlanId: undefined, subscriptionNotes: "Active subscription plan no longer available."});
    }
  } else if (user && user.subscriptionStatus === SubscriptionStatus.ACTIVE && !user.subscriptionExpiry) {
    return updateUser({ id: user.id, subscriptionStatus: SubscriptionStatus.EXPIRED, subscriptionNotes: "Subscription active but expiry date missing, marked as expired." });
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

// Global Notifications Management
export const addGlobalNotification = (message: string, siteManagerId: string): Notification => {
  const notifications = getFromLocalStorage<Notification[]>(LS_GLOBAL_NOTIFICATIONS, []);
  const newNotification: Notification = {
    id: `gnotify_${Date.now()}`,
    message,
    senderId: siteManagerId,
    timestamp: new Date().toISOString(),
    isGlobal: true,
    readByUserIds: [], // Initially unread by all
  };
  notifications.unshift(newNotification); // Add to the beginning for newest first
  saveToLocalStorage(LS_GLOBAL_NOTIFICATIONS, notifications);
  return newNotification;
};

export const getGlobalNotificationsForUser = (userId: string): Notification[] => {
  const allNotifications = getFromLocalStorage<Notification[]>(LS_GLOBAL_NOTIFICATIONS, []);
  return allNotifications.filter(n => !n.readByUserIds.includes(userId));
};

export const markGlobalNotificationAsReadForUser = (notificationId: string, userId: string): boolean => {
  let notifications = getFromLocalStorage<Notification[]>(LS_GLOBAL_NOTIFICATIONS, []);
  const notificationIndex = notifications.findIndex(n => n.id === notificationId);
  if (notificationIndex > -1) {
    if (!notifications[notificationIndex].readByUserIds.includes(userId)) {
      notifications[notificationIndex].readByUserIds.push(userId);
      saveToLocalStorage(LS_GLOBAL_NOTIFICATIONS, notifications);
      return true;
    }
  }
  return false;
};

export const markAllGlobalNotificationsAsReadForUser = (userId: string): void => {
  let notifications = getFromLocalStorage<Notification[]>(LS_GLOBAL_NOTIFICATIONS, []);
  let changed = false;
  notifications.forEach(notification => {
    if (!notification.readByUserIds.includes(userId)) {
      notification.readByUserIds.push(userId);
      changed = true;
    }
  });
  if (changed) {
    saveToLocalStorage(LS_GLOBAL_NOTIFICATIONS, notifications);
  }
};