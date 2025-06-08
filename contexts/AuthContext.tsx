
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole, AccountStatus, TrainingPlan, NotificationItem, TrainingVideo, NutritionFile, TraineeScheduleItem, Message, Rating } from '../types';

interface AuthContextType {
  user: User | null;
  users: User[];
  plans: TrainingPlan[];
  trainingVideos: TrainingVideo[];
  nutritionFiles: NutritionFile[];
  traineeSchedule: TraineeScheduleItem[];
  chatMessages: Message[];
  userNotifications: NotificationItem[];
  allRatings: Rating[]; // For admin
  
  loading: boolean; // General context initialization
  actionLoading: boolean; // Loading for specific actions

  login: (emailOrPhone: string, password?: string) => Promise<boolean>;
  signup: (userData: Omit<User, 'id' | 'role' | 'status' | 'createdAt' | 'updatedAt'> & {password: string, selectedPlanId: string}) => Promise<{success: boolean, message?: string}>;
  logout: () => void;
  
  fetchUsers: () => Promise<void>;
  updateUserStatus: (userId: string, status: AccountStatus) => Promise<boolean>;
  assignTrainerRole: (userId: string) => Promise<boolean>;
  updateUser: (userId: string, data: Partial<Omit<User, 'id' | 'role' | 'status' | 'password_hash'>>) => Promise<boolean>;
  
  fetchPlans: () => Promise<void>;
  addPlan: (plan: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TrainingPlan | null>;
  editPlan: (planId: string, data: Partial<Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<TrainingPlan | null>;
  deletePlan: (planId: string) => Promise<{success: boolean, message?: string}>;
  
  linkTraineeToTrainer: (traineeId: string, trainerId: string) => Promise<boolean>;
  
  fetchTrainingVideos: (uploadedById?: string) => Promise<void>;
  addTrainingVideo: (videoData: Omit<TrainingVideo, 'id' | 'uploadedBy' | 'createdAt' | 'updatedAt' | 'uploadedByName'>) => Promise<TrainingVideo | null>;
  deleteTrainingVideo: (videoId: string) => Promise<boolean>;

  fetchNutritionFiles: (options?: { uploadedById?: string; forTraineeId?: string }) => Promise<void>;
  addNutritionFile: (fileData: Omit<NutritionFile, 'id' | 'uploadedBy' | 'createdAt' | 'updatedAt' | 'uploadedByName' >) => Promise<NutritionFile | null>;
  deleteNutritionFile: (fileId: string) => Promise<boolean>;

  fetchTraineeSchedule: (traineeId: string) => Promise<void>;
  saveTraineeScheduleItem: (itemData: Omit<TraineeScheduleItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TraineeScheduleItem | null>;
  updateTraineeScheduleItem: (itemId: string, itemData: Partial<Omit<TraineeScheduleItem, 'id' | 'traineeId' | 'createdAt' | 'updatedAt'>>) => Promise<TraineeScheduleItem | null>;
  deleteTraineeScheduleItem: (itemId: string) => Promise<boolean>;

  fetchMessages: (chatPartnerId: string) => Promise<void>;
  sendMessage: (messageData: Omit<Message, 'id' | 'senderId'| 'sentAt' | 'read' | 'createdAt' | 'updatedAt'>) => Promise<Message | null>;
  
  fetchNotifications: () => Promise<void>;
  sendNotification: (notificationData: Omit<NotificationItem, 'id' | 'sentAt' | 'read' | 'createdAt' | 'updatedAt'>) => Promise<NotificationItem | null>;
  markNotificationAsRead: (notificationId: string) => Promise<boolean>;

  submitRating: (ratingData: Omit<Rating, 'id' | 'ratingTimestamp' | 'userId' | 'createdAt' | 'updatedAt' | 'userName'>) => Promise<Rating | null>;
  fetchAllRatings: () => Promise<void>; // For admin
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API helper
async function fetchApi(endpoint: string, options: RequestInit = {}, currentUserId?: string | null, currentUserRole?: UserRole | null) {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (currentUserId) {
    defaultHeaders['x-user-id'] = currentUserId;
  }
  if (currentUserRole) {
    defaultHeaders['x-user-role'] = currentUserRole;
  }
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`/api${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred on the API server.' }));
    console.error(`API Error (${response.status}) for ${endpoint}:`, errorData);
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  if (response.status === 204) return null; // No content
  return response.json();
}


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [trainingVideos, setTrainingVideos] = useState<TrainingVideo[]>([]);
  const [nutritionFiles, setNutritionFiles] = useState<NutritionFile[]>([]);
  const [traineeSchedule, setTraineeSchedule] = useState<TraineeScheduleItem[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [userNotifications, setUserNotifications] = useState<NotificationItem[]>([]);
  const [allRatings, setAllRatings] = useState<Rating[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const clearAllData = () => {
    setUser(null);
    setUsers([]);
    setPlans([]);
    setTrainingVideos([]);
    setNutritionFiles([]);
    setTraineeSchedule([]);
    setChatMessages([]);
    setUserNotifications([]);
    setAllRatings([]);
    localStorage.removeItem('currentUserId');
  };
  
  const login = async (emailOrPhone: string, password?: string): Promise<boolean> => {
    setActionLoading(true);
    try {
      const data = await fetchApi('/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrPhone, password }),
      });
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('currentUserId', data.user.id);
        await fetchInitialDataForUser(data.user);
        return true;
      }
      return false;
    } catch (error: any) {
      alert(`فشل تسجيل الدخول: ${error.message}`);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const signup = async (userData: Omit<User, 'id' | 'role' | 'status'| 'createdAt' | 'updatedAt'> & {password: string, selectedPlanId: string}) => {
    setActionLoading(true);
    try {
      const response = await fetchApi('/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      alert(response.message || "تم التسجيل بنجاح! حسابك قيد المراجعة.");
      return { success: true, message: response.message };
    } catch (error: any) {
      alert(`فشل إنشاء الحساب: ${error.message}`);
      return { success: false, message: error.message };
    } finally {
      setActionLoading(false);
    }
  };

  const logout = () => {
    clearAllData();
  };
  
  const fetchInitialDataForUser = useCallback(async (loggedInUser: User) => {
    if (!loggedInUser) return;
    setLoading(true);
    await fetchPlans(); // All users see plans
    await fetchNotifications(); // All users fetch their notifications

    if (loggedInUser.role === UserRole.ADMIN) {
        await fetchUsers();
        await fetchAllRatings();
        // Admin might also want to see all videos/files initially
        await fetchTrainingVideos(); 
        await fetchNutritionFiles();
    } else if (loggedInUser.role === UserRole.TRAINER) {
        await fetchUsers(); // Trainers see their trainees, fetched via all users then filtered.
        await fetchTrainingVideos(loggedInUser.id); // Trainer's own videos
        await fetchNutritionFiles({uploadedById: loggedInUser.id}); // Trainer's own files
        // Trainer might want to see schedules of their trainees, fetched on demand
    } else if (loggedInUser.role === UserRole.TRAINEE) {
        if (loggedInUser.trainerId) {
            await fetchTrainingVideos(loggedInUser.trainerId); // Videos from their trainer
             // Also fetch general admin videos (API needs to support this, or make two calls)
        } else {
             await fetchTrainingVideos(); // Fetch general videos if no trainer
        }
        await fetchNutritionFiles({forTraineeId: loggedInUser.id}); // Files for this trainee
        await fetchTraineeSchedule(loggedInUser.id);
        if (loggedInUser.trainerId) {
            await fetchMessages(loggedInUser.trainerId);
        }
    }
    setLoading(false);
  }, []); // Empty dependency array, but it uses functions defined below, ensure they are stable or add to deps.


  useEffect(() => {
    const attemptAutoLogin = async () => {
      setLoading(true); // Start loading true
      const storedUserId = localStorage.getItem('currentUserId');
      if (storedUserId) {
        try {
          setActionLoading(true);
          const data = await fetchApi(`/get-current-user?userId=${storedUserId}`);
          if (data && data.user) {
            setUser(data.user);
            await fetchInitialDataForUser(data.user);
          } else {
            clearAllData();
          }
        } catch (error) {
          console.error("Auto-login failed:", error);
          clearAllData();
        } finally {
          setActionLoading(false);
        }
      }
      setLoading(false); // End loading false
    };
    attemptAutoLogin();
  }, [fetchInitialDataForUser]); // Added fetchInitialDataForUser dependency

  // User Management
  const fetchUsers = async () => {
    if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.TRAINER) return;
    setActionLoading(true);
    try {
      const data = await fetchApi('/get-users', {}, user?.id, user?.role);
      if (data && data.users) setUsers(data.users);
    } catch (error: any) { console.error("Failed to fetch users:", error.message); } 
    finally { setActionLoading(false); }
  };
  
  const updateUserAdmin = async (userId: string, updateData: Partial<User>) => {
    if (user?.role !== UserRole.ADMIN) { alert("غير مصرح لك."); return false; }
    setActionLoading(true);
    try {
      const response = await fetchApi('/admin-manage-user', { method: 'PUT', body: JSON.stringify({ userId, ...updateData }) }, user.id, user.role);
      if (response && response.user) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...response.user } : u));
        if (user.id === userId) setUser(prev => prev ? { ...prev, ...response.user } : null);
        return true;
      } return false;
    } catch (error: any) { alert(`فشل تحديث المستخدم: ${error.message}`); return false; } 
    finally { setActionLoading(false); }
  };

  const updateUserStatus = async (userId: string, status: AccountStatus): Promise<boolean> => updateUserAdmin(userId, { status });
  const assignTrainerRole = async (userId: string): Promise<boolean> => updateUserAdmin(userId, { role: UserRole.TRAINER, status: AccountStatus.ACTIVE });
  const updateUser = async (userId: string, data: Partial<Omit<User, 'id' | 'role' | 'status' | 'password_hash'>>): Promise<boolean> => {
    if (!user || (user.id !== userId && user.role !== UserRole.ADMIN)) { alert("غير مصرح لك."); return false; }
    setActionLoading(true);
    try {
      const response = await fetchApi('/admin-manage-user', { method: 'PUT', body: JSON.stringify({ userId, ...data }) }, user.id, user.role);
      if (response && response.user) {
        if(user.role === UserRole.ADMIN) setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...response.user } : u));
        if (user.id === userId) setUser(prev => prev ? { ...prev, ...response.user } : null);
        return true;
      } return false;
    } catch (error: any) { alert(`فشل تحديث الملف الشخصي: ${error.message}`); return false; } 
    finally { setActionLoading(false); }
  };
  const linkTraineeToTrainer = async (traineeId: string, trainerId: string): Promise<boolean> => updateUserAdmin(traineeId, { trainerId });

  // Plan Management
  const fetchPlans = async () => {
    try {
      const data = await fetchApi('/get-plans', {}, user?.id, user?.role);
      if (data && data.plans) setPlans(data.plans);
    } catch (error: any) { console.error("Failed to fetch plans:", error.message); }
  };
  const addPlan = async (planData: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingPlan | null> => {
    if (user?.role !== UserRole.ADMIN) { alert("غير مصرح لك."); return null; }
    setActionLoading(true);
    try {
      const response = await fetchApi('/admin-manage-plan', { method: 'POST', body: JSON.stringify(planData) }, user.id, user.role);
      if (response && response.plan) { setPlans(prev => [...prev, response.plan]); return response.plan; } return null;
    } catch (error: any) { alert(`فشل إضافة الخطة: ${error.message}`); return null; } 
    finally { setActionLoading(false); }
  };
  const editPlan = async (planId: string, data: Partial<Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TrainingPlan | null> => {
    if (user?.role !== UserRole.ADMIN) { alert("غير مصرح لك."); return null; }
    setActionLoading(true);
    try {
      const response = await fetchApi('/admin-manage-plan', { method: 'PUT', body: JSON.stringify({ planId, ...data }) }, user.id, user.role);
      if (response && response.plan) { setPlans(prev => prev.map(p => p.id === planId ? response.plan : p)); return response.plan; } return null;
    } catch (error: any) { alert(`فشل تعديل الخطة: ${error.message}`); return null; } 
    finally { setActionLoading(false); }
  };
  const deletePlan = async (planId: string): Promise<{success: boolean, message?: string}> => {
    if (user?.role !== UserRole.ADMIN) { alert("غير مصرح لك."); return {success: false, message: "Unauthorized"}; }
    setActionLoading(true);
    try {
      await fetchApi('/admin-manage-plan', { method: 'DELETE', body: JSON.stringify({ planId }) }, user.id, user.role);
      setPlans(prev => prev.filter(p => p.id !== planId)); return {success: true, message: "تم حذف الخطة بنجاح."};
    } catch (error: any) { alert(`فشل حذف الخطة: ${error.message}`); return {success: false, message: error.message}; } 
    finally { setActionLoading(false); }
  };

  // Training Videos
  const fetchTrainingVideos = async (uploadedById?: string) => {
    setActionLoading(true);
    try {
      const endpoint = uploadedById ? `/training-videos?uploadedBy=${uploadedById}` : '/training-videos';
      const data = await fetchApi(endpoint, {}, user?.id, user?.role);
      if (data && data.videos) setTrainingVideos(data.videos);
    } catch (error: any) { console.error("Failed to fetch videos:", error.message); } 
    finally { setActionLoading(false); }
  };
  const addTrainingVideo = async (videoData: Omit<TrainingVideo, 'id' | 'uploadedBy'| 'createdAt' | 'updatedAt' | 'uploadedByName'>) => {
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.TRAINER)) { alert("غير مصرح لك."); return null; }
    setActionLoading(true);
    try {
      const payload = { ...videoData, uploadedBy: user.id };
      const data = await fetchApi('/training-videos', { method: 'POST', body: JSON.stringify(payload) }, user.id, user.role);
      if (data && data.video) { 
        setTrainingVideos(prev => [data.video, ...prev]); // Add to start for recent items
        return data.video; 
      } return null;
    } catch (error: any) { alert(`Failed to add video: ${error.message}`); return null; } 
    finally { setActionLoading(false); }
  };
  const deleteTrainingVideo = async (videoId: string) => {
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.TRAINER)) { alert("غير مصرح لك."); return false; }
    setActionLoading(true);
    try {
      await fetchApi(`/training-videos?videoId=${videoId}`, { method: 'DELETE' }, user.id, user.role);
      setTrainingVideos(prev => prev.filter(v => v.id !== videoId)); return true;
    } catch (error: any) { alert(`Failed to delete video: ${error.message}`); return false; } 
    finally { setActionLoading(false); }
  };

  // Nutrition Files
  const fetchNutritionFiles = async (options?: { uploadedById?: string; forTraineeId?: string }) => {
    setActionLoading(true);
    try {
      let endpoint = '/nutrition-files';
      if (options?.uploadedById) endpoint += `?uploadedBy=${options.uploadedById}`;
      else if (options?.forTraineeId) endpoint += `?forTraineeId=${options.forTraineeId}`;
      
      const data = await fetchApi(endpoint, {}, user?.id, user?.role);
      if (data && data.files) setNutritionFiles(data.files);
    } catch (error: any) { console.error("Failed to fetch nutrition files:", error.message); } 
    finally { setActionLoading(false); }
  };
  const addNutritionFile = async (fileData: Omit<NutritionFile, 'id' | 'uploadedBy' | 'createdAt' | 'updatedAt'| 'uploadedByName'>) => {
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.TRAINER)) { alert("غير مصرح لك."); return null; }
    setActionLoading(true);
    try {
      const payload = { ...fileData, uploadedBy: user.id };
      const data = await fetchApi('/nutrition-files', { method: 'POST', body: JSON.stringify(payload) }, user.id, user.role);
      if (data && data.file) { setNutritionFiles(prev => [data.file, ...prev]); return data.file; } return null;
    } catch (error: any) { alert(`Failed to add nutrition file: ${error.message}`); return null; } 
    finally { setActionLoading(false); }
  };
  const deleteNutritionFile = async (fileId: string) => {
     if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.TRAINER)) { alert("غير مصرح لك."); return false; }
    setActionLoading(true);
    try {
      await fetchApi(`/nutrition-files?fileId=${fileId}`, { method: 'DELETE' }, user.id, user.role);
      setNutritionFiles(prev => prev.filter(f => f.id !== fileId)); return true;
    } catch (error: any) { alert(`Failed to delete nutrition file: ${error.message}`); return false; } 
    finally { setActionLoading(false); }
  };

  // Trainee Schedules
  const fetchTraineeSchedule = async (traineeId: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const data = await fetchApi(`/trainee-schedules?traineeId=${traineeId}`, {}, user.id, user.role);
      if (data && data.schedule) setTraineeSchedule(data.schedule); else setTraineeSchedule([]);
    } catch (error: any) { console.error("Failed to fetch schedule:", error.message); setTraineeSchedule([]);} 
    finally { setActionLoading(false); }
  };
  const saveTraineeScheduleItem = async (itemData: Omit<TraineeScheduleItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (user?.role !== UserRole.TRAINER && user?.role !== UserRole.ADMIN) { alert("غير مصرح لك."); return null; }
    setActionLoading(true);
    try {
      const data = await fetchApi('/trainee-schedules', { method: 'POST', body: JSON.stringify(itemData) }, user.id, user.role);
      if (data && data.item) { fetchTraineeSchedule(itemData.traineeId); return data.item; } return null; // Refetch schedule
    } catch (error: any) { alert(`Failed to save schedule item: ${error.message}`); return null; } 
    finally { setActionLoading(false); }
  };
  const updateTraineeScheduleItem = async (itemId: string, itemData: Partial<Omit<TraineeScheduleItem, 'id' | 'traineeId' | 'createdAt' | 'updatedAt'>>) => {
    if (user?.role !== UserRole.TRAINER && user?.role !== UserRole.ADMIN) { alert("غير مصرح لك."); return null; }
    setActionLoading(true);
    try {
      const payload = {itemId, ...itemData}
      const data = await fetchApi('/trainee-schedules', { method: 'PUT', body: JSON.stringify(payload) }, user.id, user.role);
      if (data && data.item) { fetchTraineeSchedule(data.item.traineeId); return data.item; } return null; // Refetch
    } catch (error: any) { alert(`Failed to update schedule item: ${error.message}`); return null; }
    finally { setActionLoading(false); }
  };
  const deleteTraineeScheduleItem = async (itemId: string) => {
    // Need traineeId to refetch after delete. Could pass it or fetch item before deleting to get it.
    if (user?.role !== UserRole.TRAINER && user?.role !== UserRole.ADMIN) { alert("غير مصرح لك."); return false; }
    setActionLoading(true);
    try {
      const itemToDelete = traineeSchedule.find(i => i.id === itemId);
      await fetchApi(`/trainee-schedules?itemId=${itemId}`, { method: 'DELETE' }, user.id, user.role);
      if (itemToDelete) fetchTraineeSchedule(itemToDelete.traineeId); // Refetch
      return true;
    } catch (error: any) { alert(`Failed to delete schedule item: ${error.message}`); return false; } 
    finally { setActionLoading(false); }
  };
  
  // Messages
  const fetchMessages = async (chatPartnerId: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const data = await fetchApi(`/messages?chatPartnerId=${chatPartnerId}`, {}, user.id, user.role);
      if (data && data.messages) setChatMessages(data.messages); else setChatMessages([]);
    } catch (error: any) { console.error("Failed to fetch messages:", error.message); setChatMessages([]);} 
    finally { setActionLoading(false); }
  };
  const sendMessage = async (messageData: Omit<Message, 'id' | 'senderId' | 'sentAt' | 'read' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return null;
    setActionLoading(true);
    try {
      const payload = { ...messageData, senderId: user.id };
      const data = await fetchApi('/messages', { method: 'POST', body: JSON.stringify(payload) }, user.id, user.role);
      if (data && data.message) { 
        setChatMessages(prev => [...prev, data.message]); // Optimistically update
        return data.message; 
      } return null;
    } catch (error: any) { alert(`Failed to send message: ${error.message}`); return null; } 
    finally { setActionLoading(false); }
  };

  // Notifications
  const fetchNotifications = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const data = await fetchApi('/notifications-crud', {}, user.id, user.role);
      if (data && data.notifications) setUserNotifications(data.notifications); else setUserNotifications([]);
    } catch (error: any) { console.error("Failed to fetch notifications:", error.message); setUserNotifications([]);} 
    finally { setActionLoading(false); }
  };
  const sendNotification = async (notificationData: Omit<NotificationItem, 'id' | 'sentAt' | 'read'| 'createdAt' | 'updatedAt'>) => {
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.TRAINER)) { alert("غير مصرح لك."); return null; }
    setActionLoading(true);
    try {
      const data = await fetchApi('/notifications-crud', { method: 'POST', body: JSON.stringify(notificationData) }, user.id, user.role);
      if (data && data.notification) { 
        // If it's a general notification, it might appear in current user's list if they match specifier
        fetchNotifications(); // Refetch all for simplicity
        return data.notification; 
      } return null;
    } catch (error: any) { alert(`Failed to send notification: ${error.message}`); return null; } 
    finally { setActionLoading(false); }
  };
  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return false;
    setActionLoading(true);
    try {
      const data = await fetchApi(`/notifications-crud?notificationId=${notificationId}`, { method: 'PUT' }, user.id, user.role);
      if (data && data.notification) {
        setUserNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
        return true;
      } return false;
    } catch (error: any) { alert(`Failed to mark notification as read: ${error.message}`); return false; } 
    finally { setActionLoading(false); }
  };

  // Ratings
  const submitRating = async (ratingData: Omit<Rating, 'id' | 'ratingTimestamp' | 'userId' | 'createdAt' | 'updatedAt' | 'userName'>) => {
    if (!user || user.role !== UserRole.TRAINEE) { alert("فقط المتدربون يمكنهم التقييم."); return null; }
    setActionLoading(true);
    try {
      const payload = { ...ratingData, userId: user.id };
      const data = await fetchApi('/ratings', { method: 'POST', body: JSON.stringify(payload) }, user.id, user.role);
      if (data && data.rating) { 
        // Optionally refetch all ratings if admin is viewing, or add to a trainee's submitted ratings list
        return data.rating; 
      } return null;
    } catch (error: any) { alert(`Failed to submit rating: ${error.message}`); return null; } 
    finally { setActionLoading(false); }
  };
  const fetchAllRatings = async () => {
    if (user?.role !== UserRole.ADMIN) { return; }
    setActionLoading(true);
    try {
      const data = await fetchApi('/ratings', {}, user.id, user.role);
      if (data && data.ratings) setAllRatings(data.ratings); else setAllRatings([]);
    } catch (error: any) { console.error("Failed to fetch ratings:", error.message); setAllRatings([]);} 
    finally { setActionLoading(false); }
  };


  return (
    <AuthContext.Provider value={{ 
        user, users, plans, trainingVideos, nutritionFiles, traineeSchedule, chatMessages, userNotifications, allRatings,
        loading, actionLoading,
        login, signup, logout, 
        fetchUsers, updateUserStatus, assignTrainerRole, updateUser,
        fetchPlans, addPlan, editPlan, deletePlan,
        linkTraineeToTrainer,
        fetchTrainingVideos, addTrainingVideo, deleteTrainingVideo,
        fetchNutritionFiles, addNutritionFile, deleteNutritionFile,
        fetchTraineeSchedule, saveTraineeScheduleItem, updateTraineeScheduleItem, deleteTraineeScheduleItem,
        fetchMessages, sendMessage,
        fetchNotifications, sendNotification, markNotificationAsRead,
        submitRating, fetchAllRatings
      }}>
      {children}
    </AuthContext.Provider>
  );
};
