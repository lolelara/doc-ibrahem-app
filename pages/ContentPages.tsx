
import React, { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { useAuth, useLocalization } from '../App';
import { ProtectedRoute, Button, Input, Card, Spinner, Textarea, Modal } from '../components/CommonUI';
import * as DataService from '../services/dataService';
import { getNutritionAdvice } from '../services/geminiService';
import { WorkoutVideo, Recipe, CalorieIntakeItem, AIAssistantMessage } from '../types';
import { THEME_COLORS } from '../constants';

const ContentPages: React.FC = () => {
  return (
    <Routes>
      <Route path="workouts" element={<ProtectedRoute requireSubscription={true}><WorkoutsPage /></ProtectedRoute>} />
      <Route path="workouts/:videoId" element={<ProtectedRoute requireSubscription={true}><VideoDetailPage /></ProtectedRoute>} />
      <Route path="nutrition" element={<ProtectedRoute requireSubscription={true}><NutritionPage /></ProtectedRoute>} />
    </Routes>
  );
};

// Workouts Page
const WorkoutsPage: React.FC = () => {
  const { t } = useLocalization();
  const [videos, setVideos] = useState<WorkoutVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    setVideos(DataService.getWorkoutVideos());
    setLoading(false);
  }, []);

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(video => categoryFilter ? video.category === categoryFilter : true);

  const categories = [...new Set(videos.map(v => v.category))];

  if (loading) return <LoadingOverlay message={t('loadingWorkoutVideos', 'جاري تحميل التمارين...')} />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white text-center">{t('workoutVideos')}</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input 
          type="text" 
          placeholder={t('searchVideos', 'ابحث عن التمارين...')} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={`bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} block p-2.5`}
        >
          <option value="">{t('allCategories', 'جميع الفئات')}</option>
          {categories.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase(), cat)}</option>)}
        </select>
      </div>
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => (
            <WorkoutVideoCard key={video.id} video={video} onClick={() => navigate(`/content/workouts/${video.id}`)} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400">{t('noVideosFound', 'لم يتم العثور على فيديوهات تطابق بحثك.')}</p>
      )}
    </div>
  );
};

// Workout Video Card (Local Component)
interface WorkoutVideoCardProps {
  video: WorkoutVideo;
  onClick: () => void;
}
const WorkoutVideoCard: React.FC<WorkoutVideoCardProps> = ({ video, onClick }) => {
  const { t } = useLocalization();
  return (
    <Card className="flex flex-col" onClick={onClick}>
      <img src={video.thumbnailUrl || `https://picsum.photos/seed/${video.id}/400/225`} alt={video.title} className="w-full h-48 object-cover"/>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className={`text-xl font-semibold text-${THEME_COLORS.primary} mb-2`}>{video.title}</h3>
        <p className="text-gray-300 text-sm mb-2 flex-grow">{video.description.substring(0,100)}{video.description.length > 100 ? '...' : ''}</p>
        <div className="flex justify-between items-center text-xs text-gray-400 mt-auto">
          <span>{t('duration', 'المدة')}: {video.durationMinutes} {t('minutes', 'دقائق')}</span>
          <span className={`px-2 py-1 bg-${THEME_COLORS.accent} bg-opacity-20 text-${THEME_COLORS.accent} rounded-full`}>{t(video.category.toLowerCase(), video.category)}</span>
        </div>
      </div>
    </Card>
  );
};

const VideoDetailPage: React.FC = () => {
    const { videoId } = useParams<{ videoId: string }>();
    const { t } = useLocalization();
    const [video, setVideo] = useState<WorkoutVideo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (videoId) {
            const foundVideo = DataService.getWorkoutVideos().find(v => v.id === videoId);
            setVideo(foundVideo || null);
        }
        setLoading(false);
    }, [videoId]);

    if (loading) return <LoadingOverlay message={t('loadingVideo', 'جاري تحميل الفيديو...')} />;
    if (!video) return <p className="text-center text-red-500">{t('videoNotFound', 'الفيديو غير موجود.')}</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className={`text-3xl font-bold text-${THEME_COLORS.primary} mb-4`}>{video.title}</h1>
            <div className="aspect-w-16 aspect-h-9 mb-4">
                 <iframe 
                    className="w-full h-full rounded-lg shadow-lg"
                    src={video.videoUrl} 
                    title={video.title} 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen>
                </iframe>
            </div>
            <Card className="p-6">
                <p className="text-gray-300 mb-2"><strong className="font-semibold">{t('category', 'الفئة')}:</strong> {t(video.category.toLowerCase(), video.category)}</p>
                <p className="text-gray-300 mb-4"><strong className="font-semibold">{t('duration', 'المدة')}:</strong> {video.durationMinutes} {t('minutes', 'دقائق')}</p>
                <h2 className="text-xl font-semibold text-white mb-2">{t('description', 'الوصف')}:</h2>
                <p className="text-gray-300 whitespace-pre-line">{video.description}</p>
            </Card>
        </div>
    );
};


// Nutrition Page
const NutritionPage: React.FC = () => {
  const { t } = useLocalization();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);


  useEffect(() => {
    setRecipes(DataService.getRecipes());
    setLoadingRecipes(false);
  }, []);

  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(recipe => categoryFilter ? recipe.category === categoryFilter : true);

  const categories = [...new Set(recipes.map(r => r.category))];

  return (
    <div className="space-y-12">
      <h1 className="text-4xl font-bold text-white text-center mb-12">{t('nutrition')}</h1>
      
      {/* Recipes Section */}
      <section>
        <h2 className="text-3xl font-semibold text-emerald-400 mb-6">{t('recipes')}</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input 
            type="text" 
            placeholder={t('searchRecipes', 'ابحث عن الوصفات...')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
            />
            <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} block p-2.5`}
            >
            <option value="">{t('allCategories', 'جميع الفئات')}</option>
            {categories.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase(), cat)}</option>)}
            </select>
        </div>
        {loadingRecipes ? <Spinner /> : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} onSelectRecipe={setSelectedRecipe} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">{t('noRecipesFound', 'لم يتم العثور على وصفات تطابق بحثك.')}</p>
        )}
      </section>

      {/* Calorie Calculator Section */}
      <section>
        <h2 className="text-3xl font-semibold text-sky-400 mb-6">{t('calorieCalculator')}</h2>
        <CalorieCalculator />
      </section>

      {/* Nutrition AI Assistant Section */}
      <section>
        <h2 className="text-3xl font-semibold text-amber-400 mb-6">{t('nutritionAIAssistant')}</h2>
        <NutritionAIAssistant />
      </section>

      {selectedRecipe && (
        <Modal isOpen={!!selectedRecipe} onClose={() => setSelectedRecipe(null)} title={selectedRecipe.name} size="lg">
            <RecipeDetail recipe={selectedRecipe} />
        </Modal>
      )}
    </div>
  );
};

// Recipe Card (Local Component)
interface RecipeCardProps {
  recipe: Recipe;
  onSelectRecipe: (recipe: Recipe) => void;
}
const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelectRecipe }) => {
  const { t } = useLocalization();
  return (
    <Card className="flex flex-col" onClick={() => onSelectRecipe(recipe)}>
      <img src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/400/300`} alt={recipe.name} className="w-full h-56 object-cover"/>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className={`text-xl font-semibold text-${THEME_COLORS.primary} mb-2`}>{recipe.name}</h3>
        <p className="text-gray-300 text-sm mb-2 flex-grow">{recipe.description.substring(0,100)}{recipe.description.length > 100 ? '...' : ''}</p>
        <div className="mt-auto text-xs text-gray-400">
          <p>{t('prepTime', 'وقت التحضير')}: {recipe.prepTimeMinutes} {t('minutes', 'دقائق')}</p>
          <p>{t('cookTime', 'وقت الطهي')}: {recipe.cookTimeMinutes} {t('minutes', 'دقائق')}</p>
          <p>{t('servings', 'حصص')}: {recipe.servings}</p>
          {recipe.calories && <p>{t('calories', 'السعرات')}: {recipe.calories} {t('perServing', 'لكل حصة')}</p>}
        </div>
         <span className={`mt-2 px-2 py-1 text-xs bg-${THEME_COLORS.accent} bg-opacity-20 text-${THEME_COLORS.accent} rounded-full self-start`}>{t(recipe.category.toLowerCase(), recipe.category)}</span>
      </div>
    </Card>
  );
};

const RecipeDetail: React.FC<{recipe: Recipe}> = ({recipe}) => {
    const { t } = useLocalization();
    return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <img src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/600/400`} alt={recipe.name} className="w-full h-64 object-cover rounded-lg mb-4"/>
            <p className="text-gray-300">{recipe.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                <p><strong>{t('prepTime', 'وقت التحضير')}:</strong> {recipe.prepTimeMinutes} {t('minutes', 'دقائق')}</p>
                <p><strong>{t('cookTime', 'وقت الطهي')}:</strong> {recipe.cookTimeMinutes} {t('minutes', 'دقائق')}</p>
                <p><strong>{t('servings', 'حصص')}:</strong> {recipe.servings}</p>
                {recipe.calories && <p><strong>{t('calories', 'السعرات')}:</strong> {recipe.calories} {t('perServing', 'لكل حصة')}</p>}
            </div>

            <div>
                <h4 className="text-lg font-semibold text-white mt-4 mb-2">{t('ingredients')}</h4>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {recipe.ingredients.map((ing, index) => <li key={index}>{ing.quantity} {ing.item}</li>)}
                </ul>
            </div>
            <div>
                <h4 className="text-lg font-semibold text-white mt-4 mb-2">{t('instructions')}</h4>
                <ol className="list-decimal list-inside text-gray-300 space-y-1">
                    {recipe.instructions.map((step, index) => <li key={index}>{step}</li>)}
                </ol>
            </div>
        </div>
    );
};


// Calorie Calculator (Local Component)
const CalorieCalculator: React.FC = () => {
  const { t } = useLocalization();
  const [items, setItems] = useState<CalorieIntakeItem[]>([]);
  const [foodItem, setFoodItem] = useState('');
  const [calories, setCalories] = useState<number | ''>('');

  const handleAddItem = (e: FormEvent) => {
    e.preventDefault();
    if (foodItem && calories !== '') {
      const newItem: CalorieIntakeItem = {
        id: `cal_${Date.now()}`,
        foodItem,
        calories: Number(calories),
        date: new Date().toISOString()
      };
      setItems([...items, newItem]);
      setFoodItem('');
      setCalories('');
    }
  };
  
  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);

  return (
    <Card className="p-6">
      <form onSubmit={handleAddItem} className="flex flex-col md:flex-row gap-4 mb-6">
        <Input 
          type="text" 
          placeholder={t('foodItem')} 
          value={foodItem} 
          onChange={e => setFoodItem(e.target.value)} 
          required 
          className="flex-grow"
        />
        <Input 
          type="number" 
          placeholder={t('calories')} 
          value={calories} 
          onChange={e => setCalories(e.target.value === '' ? '' : parseFloat(e.target.value))} 
          required 
          className="md:w-32"
        />
        <Button type="submit" variant="secondary">{t('addItem')}</Button>
      </form>
      {items.length > 0 && (
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
              <span className="text-white">{item.foodItem}</span>
              <div className="flex items-center gap-2">
                <span className="text-amber-400">{item.calories} {t('calUnit', 'سعر حراري')}</span>
                <Button onClick={() => handleDeleteItem(item.id)} variant="danger" size="sm" className="p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094C7.071 5.838 7.5 6.255 7.5 6.75V7.5a.75.75 0 00.75.75h7.5a.75.75 0 00.75-.75V6.75c0-.495.429-.912.933-.962M10.5 7.5V18" />
                    </svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xl font-semibold text-white text-center">{t('totalCalories')}: <span className="text-amber-400">{totalCalories}</span> {t('calUnit', 'سعر حراري')}</p>
    </Card>
  );
};

// Nutrition AI Assistant (Local Component)
const NutritionAIAssistant: React.FC = () => {
  const { t } = useLocalization();
  const [messages, setMessages] = useState<AIAssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: AIAssistantMessage = { id: `msg_${Date.now()}_user`, role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getNutritionAdvice(input, messages); // Pass history
      const assistantMessage: AIAssistantMessage = { id: `msg_${Date.now()}_assistant`, role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error with AI Assistant:", error);
      const errorMessage: AIAssistantMessage = { id: `msg_${Date.now()}_system`, role: 'system', content: t('aiError', 'عذرًا، حدث خطأ أثناء التواصل مع المساعد.'), timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="h-96 overflow-y-auto mb-4 p-3 bg-gray-800 rounded-md space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-3 rounded-lg shadow ${
              msg.role === 'user' ? `bg-${THEME_COLORS.primary} text-white` : 
              msg.role === 'assistant' ? 'bg-gray-700 text-gray-200' : 
              'bg-red-700 text-red-200' // System/Error messages
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="max-w-[70%] p-3 rounded-lg shadow bg-gray-700 text-gray-200">
                    <Spinner size="sm" className="me-2 inline-block"/> {t('aiThinking')}
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-3">
        <Input 
          type="text" 
          placeholder={t('askNutritionQuestion')} 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          required 
          className="flex-grow"
          disabled={isLoading}
        />
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading || !input.trim()}>
          {t('submit')}
        </Button>
      </form>
    </Card>
  );
};


// Utility: LoadingOverlay (if not already in CommonUI, define here or import)
const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => {
  const { t } = useLocalization();
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900 bg-opacity-80">
      <Spinner size="lg" />
      {message && <p className="mt-4 text-lg text-white">{message}</p>}
      {!message && <p className="mt-4 text-lg text-white">{t('loading')}</p>}
    </div>
  );
};


export default ContentPages;
