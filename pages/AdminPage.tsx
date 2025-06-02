import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Routes, Route, Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth, useLocalization } from '../App';
import { Button, Input, Card, Spinner, Modal, Textarea } from '../components/CommonUI';
import * as DataService from '../services/dataService';
import { User, WorkoutVideo, Recipe, SubscriptionRequest, SubscriptionStatus, UserRole, SubscriptionPlan, SubscriptionPlanFeature } from '../types';
import { THEME_COLORS, INITIAL_SUBSCRIPTION_PLANS } from '../constants';

enum AdminSection {
  Users = "users",
  Videos = "videos",
  Recipes = "recipes",
  Subscriptions = "subscriptions",
  SubscriptionPlans = "subscription_plans", // New section
  Content = "content"
}

const AdminPage: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>(AdminSection.Subscriptions);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return <p>{t('adminAccessOnly')}</p>; 
  }

  const NavItem: React.FC<{ section: AdminSection; label: string }> = ({ section, label }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors w-full text-right
        ${activeSection === section ? `bg-${THEME_COLORS.primary} text-white` : `text-gray-300 hover:bg-gray-700 hover:text-white`}`}
    >
      {label}
    </button>
  );
  
  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-12rem)]">
      <aside className="md:w-72 bg-gray-800 p-4 rounded-lg space-y-2 self-start">
        <h2 className="text-xl font-semibold text-white mb-4">{t('adminNavigation', 'لوحة التحكم')}</h2>
        <NavItem section={AdminSection.Subscriptions} label={t('approveSubscriptions')} />
        <NavItem section={AdminSection.SubscriptionPlans} label={t('manageSubscriptionPlans')} />
        <NavItem section={AdminSection.Users} label={t('manageUsers')} />
        <NavItem section={AdminSection.Videos} label={t('manageVideos')} />
        <NavItem section={AdminSection.Recipes} label={t('manageRecipes')} />
        {/* <NavItem section={AdminSection.Content} label={t('manageContent')} /> */}
      </aside>
      <main className="flex-grow">
        <Card className="p-6 min-h-full">
            {activeSection === AdminSection.Users && <ManageUsersSection />}
            {activeSection === AdminSection.Videos && <ManageVideosSection />}
            {activeSection === AdminSection.Recipes && <ManageRecipesSection />}
            {activeSection === AdminSection.Subscriptions && <ApproveSubscriptionsSection />}
            {activeSection === AdminSection.SubscriptionPlans && <ManageSubscriptionPlansSection />}
            {/* {activeSection === AdminSection.Content && <ManageContentSection />} */}
        </Card>
      </main>
    </div>
  );
};


// Sections (Local Components within AdminPage)

const ManageUsersSection: React.FC = () => {
  const { t } = useLocalization();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setUsers(DataService.getUsers());
    setLoading(false);
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-4">{t('manageUsers')}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">{t('name')}</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">{t('email')}</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">{t('role', 'الدور')}</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">{t('subscriptionStatus', 'حالة الاشتراك')}</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">{t('plan', 'الخطة الحالية')}</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {users.map(user => {
              const plan = user.activeSubscriptionPlanId ? DataService.getSubscriptionPlans().find(p => p.id === user.activeSubscriptionPlanId) : null;
              return (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{t(user.role.toLowerCase(), user.role)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.subscriptionStatus === SubscriptionStatus.ACTIVE ? `bg-green-100 text-green-800` :
                        user.subscriptionStatus === SubscriptionStatus.PENDING ? `bg-yellow-100 text-yellow-800` :
                        user.subscriptionStatus === SubscriptionStatus.EXPIRED ? `bg-red-100 text-red-800` :
                        user.subscriptionStatus === SubscriptionStatus.REJECTED ? `bg-red-200 text-red-900` :
                        user.subscriptionStatus === SubscriptionStatus.CANCELLED ? `bg-gray-100 text-gray-800` :
                        `bg-gray-200 text-gray-800`}`}>
                      {user.subscriptionStatus ? t(user.subscriptionStatus.toLowerCase(), user.subscriptionStatus) : t('notSubscribedYet', 'لم يشترك بعد')}
                    </span>
                    {user.subscriptionExpiry && (user.subscriptionStatus === SubscriptionStatus.ACTIVE || user.subscriptionStatus === SubscriptionStatus.EXPIRED) && 
                      <span className="text-xs block text-gray-400"> ({t('expiresOn')} {new Date(user.subscriptionExpiry).toLocaleDateString('ar-EG')})</span>}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{plan ? plan.name : user.activeSubscriptionPlanId ? t('planNotFoundOrDeleted', 'خطة محذوفة') : 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const ManageVideosSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<WorkoutVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Partial<WorkoutVideo> | null>(null); 

  useEffect(() => {
    setVideos(DataService.getWorkoutVideos());
    setLoading(false);
  }, []);

  const openModalForAdd = () => {
    setCurrentVideo({ title: '', description: '', videoUrl: '', durationMinutes: 10, category: 'Cardio' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (video: WorkoutVideo) => {
    setCurrentVideo(video);
    setIsModalOpen(true);
  };

  const handleDelete = (videoId: string) => {
    if (window.confirm(t('confirmDeleteVideo', 'هل أنت متأكد أنك تريد حذف هذا الفيديو؟'))) {
      DataService.deleteWorkoutVideo(videoId);
      setVideos(DataService.getWorkoutVideos()); 
    }
  };
  
  const handleSaveVideo = (videoData: Partial<WorkoutVideo>) => {
    if (!currentUser) return;
    if (videoData.id) { 
        DataService.updateWorkoutVideo(videoData as WorkoutVideo);
    } else { 
        DataService.addWorkoutVideo(videoData as Omit<WorkoutVideo, 'id' | 'uploadDate' | 'uploadedBy'>, currentUser.id);
    }
    setVideos(DataService.getWorkoutVideos()); 
    setIsModalOpen(false);
    setCurrentVideo(null);
  };


  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white">{t('manageVideos')}</h2>
        <Button onClick={openModalForAdd}>{t('addVideo')}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map(video => (
          <Card key={video.id} className="p-4">
            <img src={video.thumbnailUrl || `https://picsum.photos/seed/${video.id}/300/180`} alt={video.title} className="w-full h-40 object-cover rounded mb-2"/>
            <h3 className="text-lg font-semibold text-emerald-400">{video.title}</h3>
            <p className="text-sm text-gray-300 truncate">{video.description}</p>
            <div className="mt-3 flex gap-2">
                <Button onClick={() => openModalForEdit(video)} size="sm" variant="secondary">{t('edit')}</Button>
                <Button onClick={() => handleDelete(video.id)} size="sm" variant="danger">{t('delete')}</Button>
            </div>
          </Card>
        ))}
      </div>
      {isModalOpen && currentVideo && (
        <VideoFormModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setCurrentVideo(null); }}
            videoData={currentVideo}
            onSave={handleSaveVideo}
        />
      )}
    </div>
  );
};

interface VideoFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoData: Partial<WorkoutVideo>;
    onSave: (data: Partial<WorkoutVideo>) => void;
}
const VideoFormModal: React.FC<VideoFormModalProps> = ({ isOpen, onClose, videoData, onSave }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState<Partial<WorkoutVideo>>(videoData);
    
    useEffect(() => setFormData(videoData), [videoData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'durationMinutes' ? parseInt(value) : value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const videoCategories = ['Cardio', 'Strength', 'Flexibility', 'Yoga', 'HIIT'];


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? t('editVideo', 'تعديل الفيديو') : t('addVideo')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label={t('videoTitle')} name="title" value={formData.title || ''} onChange={handleChange} required />
                <Textarea label={t('videoDescription')} name="description" value={formData.description || ''} onChange={handleChange} required />
                <Input label={t('videoURL')} name="videoUrl" value={formData.videoUrl || ''} onChange={handleChange} required placeholder="https://www.youtube.com/embed/..." />
                <Input label={t('videoThumbnailURL')} name="thumbnailUrl" value={formData.thumbnailUrl || ''} onChange={handleChange} placeholder="https://picsum.photos/..."/>
                <Input label={t('videoDuration')} name="durationMinutes" type="number" value={formData.durationMinutes || ''} onChange={handleChange} required />
                <div>
                    <label htmlFor="category" className={`block text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('videoCategory')}</label>
                    <select id="category" name="category" value={formData.category || 'Cardio'} onChange={handleChange} className={`w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} block p-2.5`}>
                        {videoCategories.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase(), cat)}</option>)}
                    </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="submit">{t('saveChanges')}</Button>
                </div>
            </form>
        </Modal>
    );
};


const ManageRecipesSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Partial<Recipe> | null>(null);

  useEffect(() => {
    setRecipes(DataService.getRecipes());
    setLoading(false);
  }, []);
  
  const openModalForAdd = () => {
    setCurrentRecipe({ name: '', description: '', ingredients: [{item: '', quantity: ''}], instructions: [''], prepTimeMinutes: 10, cookTimeMinutes: 20, servings: 2, category: 'Breakfast' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    setIsModalOpen(true);
  };
  
  const handleDelete = (recipeId: string) => {
    if (window.confirm(t('confirmDeleteRecipe', 'هل أنت متأكد أنك تريد حذف هذه الوصفة؟'))) {
      DataService.deleteRecipe(recipeId);
      setRecipes(DataService.getRecipes());
    }
  };

  const handleSaveRecipe = (recipeData: Partial<Recipe>) => {
    if (!currentUser) return;
    if (recipeData.id) {
        DataService.updateRecipe(recipeData as Recipe);
    } else {
        DataService.addRecipe(recipeData as Omit<Recipe, 'id' | 'uploadDate' | 'uploadedBy'>, currentUser.id);
    }
    setRecipes(DataService.getRecipes());
    setIsModalOpen(false);
    setCurrentRecipe(null);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white">{t('manageRecipes')}</h2>
        <Button onClick={openModalForAdd}>{t('addRecipe')}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map(recipe => (
          <Card key={recipe.id} className="p-4">
            <img src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/300/200`} alt={recipe.name} className="w-full h-40 object-cover rounded mb-2"/>
            <h3 className="text-lg font-semibold text-emerald-400">{recipe.name}</h3>
            <p className="text-sm text-gray-300 truncate">{recipe.description}</p>
             <div className="mt-3 flex gap-2">
                <Button onClick={() => openModalForEdit(recipe)} size="sm" variant="secondary">{t('edit')}</Button>
                <Button onClick={() => handleDelete(recipe.id)} size="sm" variant="danger">{t('delete')}</Button>
            </div>
          </Card>
        ))}
      </div>
      {isModalOpen && currentRecipe && (
        <RecipeFormModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setCurrentRecipe(null); }}
            recipeData={currentRecipe}
            onSave={handleSaveRecipe}
        />
      )}
    </div>
  );
};


interface RecipeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipeData: Partial<Recipe>;
    onSave: (data: Partial<Recipe>) => void;
}

const RecipeFormModal: React.FC<RecipeFormModalProps> = ({ isOpen, onClose, recipeData, onSave }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState<Partial<Recipe>>(recipeData);
    
    useEffect(() => setFormData(recipeData), [recipeData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['prepTimeMinutes', 'cookTimeMinutes', 'servings', 'calories'];
        setFormData(prev => ({ ...prev, [name]: numericFields.includes(name) ? parseInt(value) || 0 : value }));
    };

    const handleIngredientChange = (index: number, field: 'item' | 'quantity', value: string) => {
        const newIngredients = [...(formData.ingredients || [])];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    };
    const addIngredientField = () => setFormData(prev => ({ ...prev, ingredients: [...(prev.ingredients || []), {item: '', quantity: ''}] }));
    const removeIngredientField = (index: number) => setFormData(prev => ({ ...prev, ingredients: (prev.ingredients || []).filter((_, i) => i !== index) }));
    
    const handleInstructionChange = (index: number, value: string) => {
        const newInstructions = [...(formData.instructions || [])];
        newInstructions[index] = value;
        setFormData(prev => ({ ...prev, instructions: newInstructions }));
    };
    const addInstructionField = () => setFormData(prev => ({ ...prev, instructions: [...(prev.instructions || []), ''] }));
    const removeInstructionField = (index: number) => setFormData(prev => ({ ...prev, instructions: (prev.instructions || []).filter((_, i) => i !== index) }));

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const recipeCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Drinks'];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? t('editRecipe', 'تعديل الوصفة') : t('addRecipe')} size="xl">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto p-2">
                <Input label={t('recipeName')} name="name" value={formData.name || ''} onChange={handleChange} required />
                <Textarea label={t('recipeDescription')} name="description" value={formData.description || ''} onChange={handleChange} required />
                <Input label={t('recipeImageURL')} name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} placeholder="https://picsum.photos/..."/>
                
                <div>
                    <h4 className="text-md font-semibold mb-1">{t('ingredients')}</h4>
                    {(formData.ingredients || []).map((ing, index) => (
                        <div key={index} className="flex gap-2 mb-2 items-center">
                            <Input placeholder={t('item', 'العنصر')} value={ing.item} onChange={e => handleIngredientChange(index, 'item', e.target.value)} className="flex-grow" />
                            <Input placeholder={t('quantity', 'الكمية')} value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', e.target.value)} className="w-1/3" />
                            <Button type="button" variant="danger" size="sm" onClick={() => removeIngredientField(index)} disabled={(formData.ingredients?.length || 0) <=1}>X</Button>
                        </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={addIngredientField}>{t('addIngredient')}</Button>
                </div>

                <div>
                    <h4 className="text-md font-semibold mb-1">{t('instructions')}</h4>
                    {(formData.instructions || []).map((step, index) => (
                        <div key={index} className="flex gap-2 mb-2 items-center">
                            <Textarea placeholder={`${t('step', 'الخطوة')} ${index + 1}`} value={step} onChange={e => handleInstructionChange(index, e.target.value)} rows={2} className="flex-grow" />
                             <Button type="button" variant="danger" size="sm" onClick={() => removeInstructionField(index)} disabled={(formData.instructions?.length || 0) <=1}>X</Button>
                        </div>
                    ))}
                     <Button type="button" variant="ghost" size="sm" onClick={addInstructionField}>{t('addInstructionStep')}</Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input label={t('prepTime')} name="prepTimeMinutes" type="number" value={formData.prepTimeMinutes || 0} onChange={handleChange} />
                    <Input label={t('cookTime')} name="cookTimeMinutes" type="number" value={formData.cookTimeMinutes || 0} onChange={handleChange} />
                    <Input label={t('servings')} name="servings" type="number" value={formData.servings || 0} onChange={handleChange} />
                    <Input label={t('caloriesPerServing')} name="calories" type="number" value={formData.calories || ''} onChange={handleChange} placeholder={t("optional", "اختياري")} />
                </div>
                 <div>
                    <label htmlFor="recipeCategory" className={`block text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('recipeCategory')}</label>
                    <select id="recipeCategory" name="category" value={formData.category || 'Breakfast'} onChange={handleChange} className={`w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} block p-2.5`}>
                        {recipeCategories.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase(), cat)}</option>)}
                    </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="submit">{t('saveChanges')}</Button>
                </div>
            </form>
        </Modal>
    );
};

// Manage Subscription Plans Section
const ManageSubscriptionPlansSection: React.FC = () => {
  const { t } = useLocalization();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<SubscriptionPlan> | null>(null);

  useEffect(() => {
    setPlans(DataService.getSubscriptionPlans());
    setLoading(false);
  }, []);

  const refreshPlans = () => {
    setPlans(DataService.getSubscriptionPlans());
  };

  const openModalForAdd = () => {
    setCurrentPlan({ 
        name: '', 
        price: 0, 
        currency: 'SAR', 
        description: '', 
        features: [{id: `temp_feat_${Date.now()}`, text: ''}] 
    });
    setIsModalOpen(true);
  };

  const openModalForEdit = (plan: SubscriptionPlan) => {
    setCurrentPlan(JSON.parse(JSON.stringify(plan))); // Deep copy for editing
    setIsModalOpen(true);
  };

  const handleDelete = (planId: string) => {
    if (window.confirm(t('confirmDeletePlan'))) {
      DataService.deleteSubscriptionPlan(planId);
      refreshPlans();
    }
  };
  
  const handleSavePlan = (planData: Partial<SubscriptionPlan>) => {
    // Filter out empty features before saving
    const featuresToSave = (planData.features || []).filter(f => f.text.trim() !== '');

    if (planData.id) { // Editing existing
        DataService.updateSubscriptionPlan({...planData, features: featuresToSave} as SubscriptionPlan);
    } else { // Adding new
        DataService.addSubscriptionPlan(planData as Omit<SubscriptionPlan, 'id'>);
    }
    refreshPlans();
    setIsModalOpen(false);
    setCurrentPlan(null);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-white">{t('manageSubscriptionPlans')}</h2>
        <Button onClick={openModalForAdd}>{t('addSubscriptionPlan')}</Button>
      </div>
      {plans.length === 0 && <p className="text-gray-400 text-center">{t('noPlansDefined', 'لا توجد خطط اشتراك معرفة حاليًا.')}</p>}
      <div className="space-y-4">
        {plans.map(plan => (
          <Card key={plan.id} className="p-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center">
                <div>
                    <h3 className={`text-xl font-semibold text-${THEME_COLORS.primary}`}>{plan.name}</h3>
                    <p className="text-lg text-white">{plan.price} {plan.currency}</p>
                    <p className="text-sm text-gray-300 mt-1">{plan.description}</p>
                    <ul className="list-disc list-inside mt-2 text-sm text-gray-400">
                        {plan.features.map(feature => <li key={feature.id}>{feature.text}</li>)}
                    </ul>
                </div>
                <div className="flex gap-2 mt-3 md:mt-0 self-start md:self-center">
                    <Button onClick={() => openModalForEdit(plan)} size="sm" variant="secondary">{t('edit')}</Button>
                    <Button onClick={() => handleDelete(plan.id)} size="sm" variant="danger">{t('delete')}</Button>
                </div>
            </div>
          </Card>
        ))}
      </div>
      {isModalOpen && currentPlan && (
        <SubscriptionPlanFormModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setCurrentPlan(null); }}
            planData={currentPlan}
            onSave={handleSavePlan}
        />
      )}
    </div>
  );
};

interface SubscriptionPlanFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    planData: Partial<SubscriptionPlan>;
    onSave: (data: Partial<SubscriptionPlan>) => void;
}
const SubscriptionPlanFormModal: React.FC<SubscriptionPlanFormModalProps> = ({ isOpen, onClose, planData, onSave }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState<Partial<SubscriptionPlan>>(
        planData.id ? JSON.parse(JSON.stringify(planData)) : { ...planData, features: planData.features?.length ? planData.features : [{id: `new_feat_${Date.now()}`, text: ''}] }
    );
    
    useEffect(() => {
      setFormData(planData.id ? JSON.parse(JSON.stringify(planData)) : { ...planData, features: planData.features?.length ? planData.features : [{id: `new_feat_${Date.now()}`, text: ''}] });
    }, [planData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...(formData.features || [])];
        newFeatures[index] = { ...newFeatures[index], text: value };
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeatureField = () => {
        setFormData(prev => ({ 
            ...prev, 
            features: [...(prev.features || []), {id: `new_feat_${Date.now()}_${(prev.features || []).length}`, text: ''}] 
        }));
    };

    const removeFeatureField = (idToRemove: string) => {
        setFormData(prev => ({ ...prev, features: (prev.features || []).filter(f => f.id !== idToRemove) }));
    };


    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? t('editSubscriptionPlan') : t('addSubscriptionPlan')} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
                <Input label={t('planName')} name="name" value={formData.name || ''} onChange={handleChange} required />
                <div className="grid grid-cols-2 gap-4">
                    <Input label={t('planPrice')} name="price" type="number" step="0.01" value={formData.price || ''} onChange={handleChange} required placeholder={t('pricePlaceholder')} />
                    <Input label={t('planCurrency')} name="currency" value={formData.currency || 'SAR'} onChange={handleChange} required placeholder={t('currencyPlaceholder')} />
                </div>
                <Textarea label={t('planDescription')} name="description" value={formData.description || ''} onChange={handleChange} required />
                
                <div>
                    <h4 className="text-md font-semibold mb-1">{t('planFeatures')}</h4>
                    {(formData.features || []).map((feature, index) => (
                        <div key={feature.id || `feature-${index}`} className="flex gap-2 mb-2 items-center">
                            <Input 
                                placeholder={t('featureText')} 
                                value={feature.text} 
                                onChange={e => handleFeatureChange(index, e.target.value)} 
                                className="flex-grow"
                            />
                            <Button 
                                type="button" 
                                variant="danger" 
                                size="sm" 
                                onClick={() => removeFeatureField(feature.id)}
                                disabled={(formData.features?.length || 0) <= 1 && feature.text === ''}
                            >X</Button>
                        </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={addFeatureField}>{t('addFeature')}</Button>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                    <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="submit">{t('saveChanges')}</Button>
                </div>
            </form>
        </Modal>
    );
};


const ApproveSubscriptionsSection: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [durationDays, setDurationDays] = useState<{ [requestId: string]: number }>({});
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);


  useEffect(() => {
    setLoading(true);
    setRequests(DataService.getSubscriptionRequests().filter(r => r.status === SubscriptionStatus.PENDING));
    setAllPlans(DataService.getSubscriptionPlans()); // Load all plans for reference
    setLoading(false);
  }, []);
  
  const refreshRequests = () => {
     setRequests(DataService.getSubscriptionRequests().filter(r => r.status === SubscriptionStatus.PENDING));
  }

  const handleApprove = (requestId: string) => {
    if (!currentUser) return;
    // Use a default duration (e.g., 30 days) if not set or if plan has no default.
    // The specific plan's default duration is not directly used here anymore as it's removed from SubscriptionPlan type.
    const days = durationDays[requestId] || 30; 
    DataService.approveSubscription(requestId, currentUser.id, days);
    refreshRequests();
  };

  const handleReject = (requestId: string) => {
     if (!currentUser) return;
    DataService.rejectSubscription(requestId, currentUser.id, t('rejectedByAdmin', 'تم الرفض بواسطة الإدارة'));
    refreshRequests();
  };
  
  const handleDurationChange = (requestId: string, value: string) => {
    setDurationDays(prev => ({...prev, [requestId]: parseInt(value) || 0 }));
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-4">{t('pendingSubscriptions')}</h2>
      {requests.length === 0 ? (
        <p className="text-gray-400">{t('noPendingSubscriptions')}</p>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            // const planDetails = allPlans.find(p => p.id === req.planId); // Get current details of the plan
            return (
              <Card key={req.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div><strong className="text-gray-300">{t('user')}:</strong> {req.userEmail}</div>
                    <div><strong className="text-gray-300">{t('plan')}:</strong> {req.planNameSnapshot} ({t('requested', 'مطلوب')})</div>
                    <div className="flex gap-2">
                        <Input 
                            type="number" 
                            label={t('setDuration')}
                            value={durationDays[req.id] || ''} // Default to empty or a general default like 30
                            onChange={(e) => handleDurationChange(req.id, e.target.value)}
                            min="1"
                            placeholder={t('defaultDurationDays')}
                            aria-describedby={`duration-help-${req.id}`}
                        />
                         <small id={`duration-help-${req.id}`} className="text-xs text-gray-400 mt-1 hidden">{t('daysDurationHelp', 'أدخل عدد أيام صلاحية الاشتراك.')}</small>
                    </div>
                    <div className="flex gap-2 justify-end self-end"> {/* Ensure buttons align well */}
                        <Button onClick={() => handleApprove(req.id)} size="sm" variant="primary" disabled={!durationDays[req.id] || durationDays[req.id] <=0 }>{t('approve')}</Button>
                        <Button onClick={() => handleReject(req.id)} size="sm" variant="danger">{t('reject')}</Button>
                    </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};


export default AdminPage;