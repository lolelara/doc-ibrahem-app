
import { User, UserRole, WorkoutVideo, Recipe, SubscriptionRequest, SubscriptionStatus, UserStats, SubscriptionPlan, PdfDocument, Notification, TransformationPost, TransformationComment, ExternalResourceLink, ExternalResourceCategory } from '../types';
import { ADMIN_EMAIL, PDF_MAX_SIZE_BYTES, COUNTRIES_LIST, TRANSFORMATION_IMAGE_MAX_SIZE_BYTES } from '../constants';

// NOTE: All functions now simulate async API calls.
// A proper backend API interacting with the Netlify database is required.

// Helper function to simulate API delay and return a Promise
const simulateApiCall = <T>(data: T, delay = 100): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), delay));

// Helper for error simulation or handling
const handleApiError = (error: any, defaultMessage: string = 'An API error occurred') => {
  console.error("API Error:", error);
  // In a real app, you might throw a new error or return a specific error structure
  throw new Error(error.message || defaultMessage);
};


// User Management
export const getUsers = async (): Promise<User[]> => {
  // TODO: API call to GET /api/users
  console.warn("getUsers: API call not implemented. Returning empty array.");
  return simulateApiCall([]);
};

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  // TODO: API call to GET /api/users?email=${email}
  console.warn(`getUserByEmail: API call not implemented for ${email}.`);
  // This is a placeholder. In a real scenario, the backend handles admin creation.
  if (email === ADMIN_EMAIL) {
    return simulateApiCall({
      id: `sitemanager_user_placeholder`,
      email: ADMIN_EMAIL,
      password: 'adminpassword', // Password check would be backend-side
      name: 'Site Manager (Placeholder)',
      phoneNumber: '',
      country: COUNTRIES_LIST[0]?.code || '',
      role: UserRole.SITE_MANAGER,
    } as User);
  }
  return simulateApiCall(undefined);
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  // TODO: API call to GET /api/users/${id}
  console.warn(`getUserById: API call not implemented for ${id}.`);
  return simulateApiCall(undefined);
};

export const addUser = async (user: Omit<User, 'id' | 'role'> & { role?: UserRole }): Promise<User> => {
  let role = UserRole.USER;
  if (user.email === ADMIN_EMAIL) {
    role = UserRole.SITE_MANAGER;
  } else if (user.role) {
    role = user.role;
  }

  if (!user.phoneNumber) throw new Error("Phone number is required.");
  if (!user.country) throw new Error("Country is required.");

  const newUserPayload: Omit<User, 'id'> = {
    ...user,
    role: role,
  };
  // TODO: API call to POST /api/users with newUserPayload
  console.warn("addUser: API call not implemented. Simulating user creation.");
  const createdUser: User = { ...newUserPayload, id: `user_${Date.now()}` };
  return simulateApiCall(createdUser);
};

export const updateUser = async (updatedUserPartial: Partial<User> & { id: string }, currentUserId?: string): Promise<User | undefined> => {
  // TODO: API call to PUT /api/users/${updatedUserPartial.id} with updatedUserPartial
  // Backend should handle role change logic, email uniqueness, etc.
  console.warn(`updateUser: API call not implemented for user ${updatedUserPartial.id}. Simulating update.`);
  if (!updatedUserPartial.id) return undefined;

  // Placeholder: In a real app, this logic is more complex and mostly backend-driven.
  // We simulate fetching the user, then applying changes.
  // const existingUser = await getUserById(updatedUserPartial.id);
  // if (!existingUser) return undefined;
  // const updatedUser = { ...existingUser, ...updatedUserPartial };

  // For simulation, we'll just return the partial merged with an ID.
  // The actual merging and validation (like role changes) happens server-side.
  const simulatedUpdatedUser = { ...updatedUserPartial, name: updatedUserPartial.name || "Updated User" } as User;


  return simulateApiCall(simulatedUpdatedUser);
};

export const deleteUser = async (userIdToDelete: string, siteManagerId: string): Promise<boolean> => {
  // TODO: API call to DELETE /api/users/${userIdToDelete}
  // Backend must verify siteManagerId has permission.
  console.warn(`deleteUser: API call not implemented for user ${userIdToDelete}.`);
  // TODO: Backend should also handle cascading deletes of related data (subscriptions, PDF assignments, etc.)
  return simulateApiCall(true);
};

export const updateUserStats = async (userId: string, stats: UserStats): Promise<User | undefined> => {
  // TODO: API call to PUT /api/users/${userId}/stats with stats
  console.warn(`updateUserStats: API call not implemented for user ${userId}.`);
  const user = await getUserById(userId);
  if (user) {
    const updatedUser = { ...user, stats: { ...(user.stats || {}), ...stats } };
    return simulateApiCall(updatedUser);
  }
  return simulateApiCall(undefined);
};

// Workout Videos
export const getWorkoutVideos = async (): Promise<WorkoutVideo[]> => {
  // TODO: API call to GET /api/workout-videos
  console.warn("getWorkoutVideos: API call not implemented. Returning empty array.");
  return simulateApiCall([]);
};

export const addWorkoutVideo = async (video: Omit<WorkoutVideo, 'id' | 'uploadDate' | 'uploadedBy'>, adminId: string): Promise<WorkoutVideo> => {
  const newVideoPayload = { ...video, uploadedBy: adminId, uploadDate: new Date().toISOString() };
  // TODO: API call to POST /api/workout-videos with newVideoPayload
  console.warn("addWorkoutVideo: API call not implemented. Simulating video creation.");
  const createdVideo: WorkoutVideo = { ...newVideoPayload, id: `vid_${Date.now()}` };
  return simulateApiCall(createdVideo);
};

export const updateWorkoutVideo = async (updatedVideo: WorkoutVideo): Promise<WorkoutVideo | undefined> => {
  // TODO: API call to PUT /api/workout-videos/${updatedVideo.id} with updatedVideo
  console.warn(`updateWorkoutVideo: API call not implemented for video ${updatedVideo.id}.`);
  return simulateApiCall(updatedVideo);
};

export const deleteWorkoutVideo = async (videoId: string): Promise<boolean> => {
  // TODO: API call to DELETE /api/workout-videos/${videoId}
  console.warn(`deleteWorkoutVideo: API call not implemented for video ${videoId}.`);
  return simulateApiCall(true);
};

// Recipes
export const getRecipes = async (): Promise<Recipe[]> => {
  // TODO: API call to GET /api/recipes
  console.warn("getRecipes: API call not implemented. Returning empty array.");
  return simulateApiCall([]);
};

export const addRecipe = async (recipe: Omit<Recipe, 'id' | 'uploadDate' | 'uploadedBy'>, adminId: string): Promise<Recipe> => {
  const newRecipePayload = { ...recipe, uploadedBy: adminId, uploadDate: new Date().toISOString() };
  // TODO: API call to POST /api/recipes with newRecipePayload
  console.warn("addRecipe: API call not implemented. Simulating recipe creation.");
  const createdRecipe: Recipe = { ...newRecipePayload, id: `rec_${Date.now()}` };
  return simulateApiCall(createdRecipe);
};

export const updateRecipe = async (updatedRecipe: Recipe): Promise<Recipe | undefined> => {
  // TODO: API call to PUT /api/recipes/${updatedRecipe.id} with updatedRecipe
  console.warn(`updateRecipe: API call not implemented for recipe ${updatedRecipe.id}.`);
  return simulateApiCall(updatedRecipe);
};

export const deleteRecipe = async (recipeId: string): Promise<boolean> => {
  // TODO: API call to DELETE /api/recipes/${recipeId}
  console.warn(`deleteRecipe: API call not implemented for recipe ${recipeId}.`);
  return simulateApiCall(true);
};

// Subscription Plans
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  // TODO: API call to GET /api/subscription-plans
  console.warn("getSubscriptionPlans: API call not implemented. Returning empty array.");
  // Simulating initial plans for UI to work to some extent
  const { INITIAL_SUBSCRIPTION_PLANS } = await import('../constants');
  return simulateApiCall(INITIAL_SUBSCRIPTION_PLANS);
};

export const addSubscriptionPlan = async (plan: Omit<SubscriptionPlan, 'id'>): Promise<SubscriptionPlan> => {
  const newPlanPayload = { ...plan, features: plan.features.map((f, idx) => ({ ...f, id: `feat_${Date.now()}_${idx}`})) };
  // TODO: API call to POST /api/subscription-plans with newPlanPayload
  console.warn("addSubscriptionPlan: API call not implemented. Simulating plan creation.");
  const createdPlan: SubscriptionPlan = { ...newPlanPayload, id: `plan_${Date.now()}` };
  return simulateApiCall(createdPlan);
};

export const updateSubscriptionPlan = async (updatedPlan: SubscriptionPlan): Promise<SubscriptionPlan | undefined> => {
  // TODO: API call to PUT /api/subscription-plans/${updatedPlan.id} with updatedPlan
  console.warn(`updateSubscriptionPlan: API call not implemented for plan ${updatedPlan.id}.`);
  return simulateApiCall(updatedPlan);
};

export const deleteSubscriptionPlan = async (planId: string): Promise<boolean> => {
  // TODO: API call to DELETE /api/subscription-plans/${planId}
  // Backend should handle logic for existing subscribers (e.g., mark their plans as 'cancelled by admin').
  console.warn(`deleteSubscriptionPlan: API call not implemented for plan ${planId}.`);
  return simulateApiCall(true);
};

// Subscription Requests
export const getSubscriptionRequests = async (): Promise<SubscriptionRequest[]> => {
  // TODO: API call to GET /api/subscription-requests
  console.warn("getSubscriptionRequests: API call not implemented. Returning empty array.");
  return simulateApiCall([]);
};

export const requestSubscription = async (userId: string, userEmail: string, planId: string): Promise<SubscriptionRequest> => {
  const plans = await getSubscriptionPlans();
  const plan = plans.find(p => p.id === planId);
  if (!plan) throw new Error("Selected subscription plan is not available.");

  const newRequestPayload = {
    userId,
    userEmail,
    planId,
    planNameSnapshot: plan.name,
    requestDate: new Date().toISOString(),
    status: SubscriptionStatus.PENDING,
  };
  // TODO: API call to POST /api/subscription-requests with newRequestPayload
  // TODO: Backend might also update user's status to PENDING
  console.warn("requestSubscription: API call not implemented. Simulating request.");
  const createdRequest: SubscriptionRequest = { ...newRequestPayload, id: `subreq_${Date.now()}` };
  
  // Simulate user update locally for now
  const user = await getUserById(userId);
  if (user) {
    await updateUser({ ...user, subscriptionStatus: SubscriptionStatus.PENDING, activeSubscriptionPlanId: planId, subscriptionNotes: 'Subscription requested, pending approval.' });
  }
  return simulateApiCall(createdRequest);
};

export const approveSubscription = async (requestId: string, adminId: string, durationDays: number): Promise<SubscriptionRequest | undefined> => {
  // TODO: API call to POST /api/subscription-requests/${requestId}/approve with { adminId, durationDays }
  // Backend updates request status and user's subscription details (expiryDate, status: ACTIVE).
  console.warn(`approveSubscription: API call not implemented for request ${requestId}.`);
  
  // Simulating the update
  const requests = await getSubscriptionRequests(); // This would be a single request fetch in reality
  const request = requests.find(r => r.id === requestId);
  if (!request) return undefined;

  const user = await getUserById(request.userId);
  if (!user) return undefined;

  const now = new Date();
  const expiryDate = new Date(new Date().setDate(now.getDate() + durationDays)).toISOString();
  
  const updatedRequest = {
    ...request,
    status: SubscriptionStatus.ACTIVE,
    processedBy: adminId,
    processedDate: new Date().toISOString(),
    expiryDate: expiryDate,
  };
  await updateUser({ 
    id: user.id,
    subscriptionId: request.id, 
    activeSubscriptionPlanId: request.planId,
    subscriptionExpiry: expiryDate, 
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    subscriptionNotes: `Subscription approved by ${adminId}. Expires on ${expiryDate}.`
  }, adminId);

  return simulateApiCall(updatedRequest);
};

export const rejectSubscription = async (requestId: string, adminId: string, adminNotes?: string): Promise<SubscriptionRequest | undefined> => {
  // TODO: API call to POST /api/subscription-requests/${requestId}/reject with { adminId, adminNotes }
  // Backend updates request status and user's subscription details.
  console.warn(`rejectSubscription: API call not implemented for request ${requestId}.`);

  // Simulating the update
  const requests = await getSubscriptionRequests(); // Single request fetch
  const request = requests.find(r => r.id === requestId);
  if (!request) return undefined;

  const user = await getUserById(request.userId);
  if (!user) return undefined;

  const updatedRequest = {
    ...request,
    status: SubscriptionStatus.REJECTED,
    adminNotes,
    processedBy: adminId,
    processedDate: new Date().toISOString(),
  };
  await updateUser({ 
      id: user.id,
      subscriptionStatus: SubscriptionStatus.REJECTED, 
      subscriptionId: undefined, 
      activeSubscriptionPlanId: undefined, 
      subscriptionExpiry: undefined, 
      subscriptionNotes: `Subscription rejected by ${adminId}. Notes: ${adminNotes}` 
  }, adminId);

  return simulateApiCall(updatedRequest);
};

export const checkUserSubscriptionStatus = async (userId: string): Promise<User | undefined> => {
  // TODO: API call to GET /api/users/${userId}/subscription-status or user data includes this from backend
  // Backend should perform expiry checks and plan validity.
  console.warn(`checkUserSubscriptionStatus: API call not implemented for user ${userId}. Simulating local check.`);
  const user = await getUserById(userId);
  if (user && user.subscriptionId && user.subscriptionExpiry && user.subscriptionStatus === SubscriptionStatus.ACTIVE) {
    if (new Date(user.subscriptionExpiry) < new Date()) {
      return updateUser({ id: user.id, subscriptionStatus: SubscriptionStatus.EXPIRED, subscriptionNotes: "Subscription expired." });
    }
    const plans = await getSubscriptionPlans();
    const planExists = plans.some(p => p.id === user.activeSubscriptionPlanId);
    if (!planExists) {
        return updateUser({ id: user.id, subscriptionStatus: SubscriptionStatus.CANCELLED, activeSubscriptionPlanId: undefined, subscriptionNotes: "Active subscription plan no longer available."});
    }
  } else if (user && user.subscriptionStatus === SubscriptionStatus.ACTIVE && !user.subscriptionExpiry) {
    // This case suggests data inconsistency, usually handled by backend or robust data validation
    return updateUser({ id: user.id, subscriptionStatus: SubscriptionStatus.EXPIRED, subscriptionNotes: "Subscription active but expiry date missing, marked as expired." });
  }
  return simulateApiCall(user);
};


// PDF Document Management (File uploads typically involve multipart/form-data POST to backend)
export const getPdfDocuments = async (): Promise<PdfDocument[]> => {
  // TODO: API call to GET /api/pdfs
  console.warn("getPdfDocuments: API call not implemented. Returning empty array.");
  return simulateApiCall([]);
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string); // result is Data URL
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

  // const fileData = await fileToBase64(file); // For sending base64 to backend
  // For actual upload, use FormData:
  const formData = new FormData();
  formData.append('pdfFile', file);
  formData.append('description', pdfDetails.description);
  formData.append('assignedUserIds', JSON.stringify(pdfDetails.assignedUserIds));
  formData.append('uploadedBy', adminId);
  
  // TODO: API call to POST /api/pdfs with formData (multipart/form-data)
  console.warn("addPdfDocument: API call not implemented. Simulating PDF creation.");
  const createdDocument: PdfDocument = {
    ...pdfDetails,
    id: `pdf_${Date.now()}`,
    fileName: file.name,
    fileData: `data:application/pdf;base64, FAKEDATA...${file.name}`, // Placeholder
    uploadedBy: adminId,
    uploadDate: new Date().toISOString(),
  };
  return simulateApiCall(createdDocument);
};

export const updatePdfDocument = async (updatedPdf: Omit<PdfDocument, 'fileData' | 'fileName'> & { fileData?: string, fileName?: string }): Promise<PdfDocument | undefined> => {
  // If fileData is not being changed, backend may not require re-upload.
  // Send only metadata (description, assignedUserIds)
  // TODO: API call to PUT /api/pdfs/${updatedPdf.id} with metadata
  console.warn(`updatePdfDocument: API call not implemented for PDF ${updatedPdf.id}.`);
  return simulateApiCall(updatedPdf as PdfDocument); // Cast needed due to partial fileData/fileName
};

export const deletePdfDocument = async (pdfId: string): Promise<boolean> => {
  // TODO: API call to DELETE /api/pdfs/${pdfId}
  console.warn(`deletePdfDocument: API call not implemented for PDF ${pdfId}.`);
  return simulateApiCall(true);
};

export const getPdfsForUser = async (userId: string): Promise<PdfDocument[]> => {
  // TODO: API call to GET /api/pdfs?userId=${userId} or /api/users/${userId}/pdfs
  console.warn(`getPdfsForUser: API call not implemented for user ${userId}.`);
  return simulateApiCall([]);
};


// Global Notifications Management
export const addGlobalNotification = async (message: string, siteManagerId: string): Promise<Notification> => {
  const newNotificationPayload: Omit<Notification, 'id'> = {
    message,
    senderId: siteManagerId,
    timestamp: new Date().toISOString(),
    isGlobal: true, // This is now type-checked correctly against Notification['isGlobal']
    readByUserIds: [], // Backend might handle this differently
  };
  // TODO: API call to POST /api/notifications with newNotificationPayload
  console.warn("addGlobalNotification: API call not implemented.");
  const createdNotification: Notification = { ...newNotificationPayload, id: `gnotify_${Date.now()}` };
  return simulateApiCall(createdNotification);
};

export const getGlobalNotificationsForUser = async (userId: string): Promise<Notification[]> => {
  // TODO: API call to GET /api/notifications?userId=${userId} (backend filters for unread)
  console.warn(`getGlobalNotificationsForUser: API call not implemented for user ${userId}.`);
  return simulateApiCall([]);
};

export const markGlobalNotificationAsReadForUser = async (notificationId: string, userId: string): Promise<boolean> => {
  // TODO: API call to POST /api/notifications/${notificationId}/read with { userId }
  console.warn(`markGlobalNotificationAsReadForUser: API call not implemented for notification ${notificationId}.`);
  return simulateApiCall(true);
};

export const markAllGlobalNotificationsAsReadForUser = async (userId: string): Promise<void> => {
  // TODO: API call to POST /api/notifications/read-all with { userId }
  console.warn(`markAllGlobalNotificationsAsReadForUser: API call not implemented for user ${userId}.`);
  return simulateApiCall(undefined);
};

// Transformation Posts Management
const imageFileToBase64Service = (file: File): Promise<string> => { // Remains a utility
  return new Promise((resolve, reject) => {
    if (file.size > TRANSFORMATION_IMAGE_MAX_SIZE_BYTES) {
      reject(new Error(`File is too large. Max size: ${TRANSFORMATION_IMAGE_MAX_SIZE_BYTES / (1024 * 1024)}MB`));
      return;
    }
     if (!file.type.startsWith('image/')) {
        reject(new Error("Invalid file type. Only images are allowed."));
        return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const getTransformationPosts = async (): Promise<TransformationPost[]> => {
  // TODO: API call to GET /api/transformations
  console.warn("getTransformationPosts: API call not implemented. Returning empty array.");
  return simulateApiCall([]);
};

export const getTransformationPostById = async (postId: string): Promise<TransformationPost | undefined> => {
  // TODO: API call to GET /api/transformations/${postId}
  console.warn(`getTransformationPostById: API call not implemented for post ${postId}.`);
  return simulateApiCall(undefined);
};

export const addTransformationPost = async (
  postData: Omit<TransformationPost, 'id' | 'createdAt' | 'likes' | 'commentsCount' | 'userName' | 'userProfileImage' | 'beforeImageUrl' | 'afterImageUrl'>,
  beforeFile: File,
  afterFile: File,
  creator: User
): Promise<TransformationPost> => {
  // Images might be uploaded first to get URLs, or sent as multipart/form-data
  const beforeImageUrlBase64 = await imageFileToBase64Service(beforeFile); // for simulation
  const afterImageUrlBase64 = await imageFileToBase64Service(afterFile);   // for simulation

  const newPostPayload = {
    ...postData,
    userName: creator.name, // Snapshot
    userProfileImage: creator.profileImage, // Snapshot
    // In real API, you'd send files or URLs from an image storage service
  };
  // TODO: API call to POST /api/transformations (likely multipart/form-data with files)
  // Or: POST /api/transformations with metadata, after images are uploaded elsewhere and URLs are obtained.
  console.warn("addTransformationPost: API call not implemented. Simulating post creation.");
  const createdPost: TransformationPost = {
    ...newPostPayload,
    id: `tp_${Date.now()}`,
    beforeImageUrl: beforeImageUrlBase64, // Placeholder URL
    afterImageUrl: afterImageUrlBase64,   // Placeholder URL
    createdAt: new Date().toISOString(),
    likes: [],
    commentsCount: 0,
  };
  return simulateApiCall(createdPost);
};

export const deleteTransformationPost = async (postId: string, adminUserId: string): Promise<boolean> => {
  // TODO: API call to DELETE /api/transformations/${postId} (backend verifies adminUserId)
  console.warn(`deleteTransformationPost: API call not implemented for post ${postId}.`);
  // Backend also deletes associated comments.
  return simulateApiCall(true);
};

export const likeTransformationPost = async (postId: string, userId: string): Promise<TransformationPost | undefined> => {
  // TODO: API call to POST /api/transformations/${postId}/like with { userId }
  console.warn(`likeTransformationPost: API call not implemented for post ${postId}.`);
  // Simulate: fetch post, add like, return updated post
  // const post = await getTransformationPostById(postId);
  // if (post && !post.likes.includes(userId)) post.likes.push(userId);
  // return simulateApiCall(post);
  return simulateApiCall(undefined); // Simpler simulation
};

export const unlikeTransformationPost = async (postId: string, userId: string): Promise<TransformationPost | undefined> => {
  // TODO: API call to POST /api/transformations/${postId}/unlike with { userId }
  console.warn(`unlikeTransformationPost: API call not implemented for post ${postId}.`);
  // Simulate: fetch post, remove like, return updated post
  // const post = await getTransformationPostById(postId);
  // if (post) post.likes = post.likes.filter(uid => uid !== userId);
  // return simulateApiCall(post);
  return simulateApiCall(undefined); // Simpler simulation
};


// Transformation Comments Management
export const getCommentsForPost = async (postId: string): Promise<TransformationComment[]> => {
  // TODO: API call to GET /api/transformations/${postId}/comments
  console.warn(`getCommentsForPost: API call not implemented for post ${postId}.`);
  return simulateApiCall([]);
};

export const addTransformationComment = async (
  commentData: Omit<TransformationComment, 'id' | 'createdAt' | 'userName' | 'userProfileImage'>,
  commenter: User
): Promise<TransformationComment> => {
  const newCommentPayload = {
    ...commentData,
    userName: commenter.name, // Snapshot
    userProfileImage: commenter.profileImage, // Snapshot
    createdAt: new Date().toISOString(),
  };
  // TODO: API call to POST /api/transformations/${commentData.postId}/comments with newCommentPayload
  // Backend should also update commentsCount on the parent post.
  console.warn("addTransformationComment: API call not implemented. Simulating comment creation.");
  const createdComment: TransformationComment = { ...newCommentPayload, id: `tc_${Date.now()}` };
  return simulateApiCall(createdComment);
};

export const deleteTransformationComment = async (commentId: string, adminOrOwnerId: string): Promise<boolean> => {
  // TODO: API call to DELETE /api/comments/${commentId} (backend verifies adminOrOwnerId)
  // Backend should also update commentsCount on the parent post.
  console.warn(`deleteTransformationComment: API call not implemented for comment ${commentId}.`);
  return simulateApiCall(true);
};

// External Resource Links Management
export const getExternalResourceLinks = async (): Promise<ExternalResourceLink[]> => {
  // TODO: API call to GET /api/resource-links
  console.warn("getExternalResourceLinks: API call not implemented. Returning empty array.");
  return simulateApiCall([]);
};

export const addExternalResourceLink = async (
  linkDetails: Omit<ExternalResourceLink, 'id' | 'addedDate' | 'addedBy'>,
  adminId: string
): Promise<ExternalResourceLink> => {
  // TODO: API call to POST /api/resource-links with linkDetails & adminId
  console.warn("addExternalResourceLink: API call not implemented. Simulating link creation.");
  const newLink: ExternalResourceLink = {
    ...linkDetails,
    id: `reslink_${Date.now()}`,
    addedBy: adminId,
    addedDate: new Date().toISOString(),
  };
  return simulateApiCall(newLink);
};

export const updateExternalResourceLink = async (updatedLink: ExternalResourceLink): Promise<ExternalResourceLink | undefined> => {
  // TODO: API call to PUT /api/resource-links/${updatedLink.id} with updatedLink
  console.warn(`updateExternalResourceLink: API call not implemented for link ${updatedLink.id}.`);
  return simulateApiCall(updatedLink);
};

export const deleteExternalResourceLink = async (linkId: string): Promise<boolean> => {
  // TODO: API call to DELETE /api/resource-links/${linkId}
  console.warn(`deleteExternalResourceLink: API call not implemented for link ${linkId}.`);
  return simulateApiCall(true);
};

export const getExternalResourceLinksForUser = async (userId: string): Promise<ExternalResourceLink[]> => {
  // TODO: API call to GET /api/resource-links?userId=${userId} or /api/users/${userId}/resource-links
  // This simulation fetches all and filters, backend would be more efficient.
  console.warn(`getExternalResourceLinksForUser: API call not implemented for user ${userId}. Simulating.`);
  const allLinks = await getExternalResourceLinks();
  const userLinks = allLinks.filter(link => link.assignedUserIds.includes(userId));
  return simulateApiCall(userLinks);
};