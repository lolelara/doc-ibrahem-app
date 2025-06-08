
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
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const fetchedVideos = await DataService.getWorkoutVideos();
        setVideos(fetchedVideos);
      } catch (error) {
        console.error("Error fetching workout videos:", error);
        setVideos([]); // Set to empty on error
      }
      setLoading(false);
    };
    fetchVideos();
  }, []);

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(video => categoryFilter ? video.category === categoryFilter : true);

  const categories = [...new Set(videos.map(v => v.category))]; // Recalculate if videos change

  if (loading) return <LoadingOverlay message={t('loadingWorkoutVideos', 'جاري تحميل التمارين...')} />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className={`text-2xl sm:text-3xl font-bold text-${THEME_COLORS.textPrimary} text-center`}>{t('workoutVideos')}</h1>
      <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 mb-4 sm:mb-6">
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
          className={`bg-slate-800 border border-slate-700 text-${THEME_COLORS.textPrimary} text-xs sm:text-sm rounded-lg focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} block p-2 sm:p-2.5 w-full sm:w-auto`}
        >
          <option value="">{t('allCategories', 'جميع الفئات')}</option>
          {categories.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase(), cat)}</option>)}
        </select>
      </div>
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredVideos.map(video => (
            <WorkoutVideoCard key={video.id} video={video} onClick={() => navigate(`/content/workouts/${video.id}`)} />
          ))}
        </div>
      ) : (
        <p className={`text-center text-${THEME_COLORS.textSecondary} py-6 sm:py-8`}>{t('noVideosFound', 'لم يتم العثور على فيديوهات تطابق بحثك.')}</p>
      )}
    </div>
  );
};

interface WorkoutVideoCardProps {
  video: WorkoutVideo;
  onClick: () => void;
}
const WorkoutVideoCard: React.FC<WorkoutVideoCardProps> = ({ video, onClick }) => {
  const { t } = useLocalization();
  return (
    <Card className="flex flex-col p-0" onClick={onClick}>
      <img src={video.thumbnailUrl || `https://picsum.photos/seed/${video.id}/400/225`} alt={video.title} className="w-full h-40 sm:h-48 object-cover rounded-t-xl"/>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className={`text-md sm:text-lg font-semibold text-${THEME_COLORS.primary} mb-1 sm:mb-2`}>{video.title}</h3>
        <p className={`text-${THEME_COLORS.textSecondary} text-xs sm:text-sm mb-2 flex-grow`}>{video.description.substring(0,100)}{video.description.length > 100 ? '...' : ''}</p>
        <div className={`flex justify-between items-center text-xs text-${THEME_COLORS.textSecondary} opacity-80 mt-auto`}> {/* Slightly more muted text for meta */}
          <span>{t('duration', 'المدة')}: {video.durationMinutes} {t('minutes', 'دقائق')}</span>
          <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 bg-${THEME_COLORS.accent} bg-opacity-20 text-${THEME_COLORS.accent} rounded-full text-xs`}>{t(video.category.toLowerCase(), video.category)}</span>
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
        const fetchVideo = async () => {
            setLoading(true);
            if (videoId) {
                try {
                    // Assuming getWorkoutVideos still fetches all; in a real API, fetch by ID
                    const allVideos = await DataService.getWorkoutVideos();
                    const foundVideo = allVideos.find(v => v.id === videoId);
                    setVideo(foundVideo || null);
                } catch (error) {
                    console.error(`Error fetching video ${videoId}:`, error);
                    setVideo(null);
                }
            }
            setLoading(false);
        };
        fetchVideo();
    }, [videoId]);

    if (loading) return <LoadingOverlay message={t('loadingVideo', 'جاري تحميل الفيديو...')} />;
    if (!video) return <p className="text-center text-red-500 py-10">{t('videoNotFound', 'الفيديو غير موجود.')}</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className={`text-2xl sm:text-3xl font-bold text-${THEME_COLORS.primary} mb-3 sm:mb-4`}>{video.title}</h1>
            <div className="w-full aspect-video rounded-lg shadow-lg mb-3 sm:mb-4 bg-black">
                 <iframe 
                    className="w-full h-full rounded-lg"
                    src={video.videoUrl} 
                    title={video.title} 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen>
                </iframe>
            </div>
            <Card className="p-3 sm:p-4 md:p-6">
                <p className={`text-${THEME_COLORS.textSecondary} text-sm sm:text-base mb-1 sm:mb-2`}><strong className={`font-semibold text-${THEME_COLORS.textPrimary}`}>{t('category', 'الفئة')}:</strong> {t(video.category.toLowerCase(), video.category)}</p>
                <p className={`text-${THEME_COLORS.textSecondary} text-sm sm:text-base mb-2 sm:mb-4`}><strong className={`font-semibold text-${THEME_COLORS.textPrimary}`}>{t('duration', 'المدة')}:</strong> {video.durationMinutes} {t('minutes', 'دقائق')}</p>
                <h2 className={`text-lg sm:text-xl font-semibold text-${THEME_COLORS.textPrimary} mb-1 sm:mb-2`}>{t('videoDisplayDescriptionLabel', 'الوصف')}:</h2>
                <p className={`text-${THEME_COLORS.textSecondary} text-sm sm:text-base whitespace-pre-line`}>{video.description}</p>
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
    const fetchRecipes = async () => {
      setLoadingRecipes(true);
      try {
        const fetchedRecipes = await DataService.getRecipes();
        setRecipes(fetchedRecipes);
      } catch (error) {
        console.error("Error fetching recipes:", error);
        setRecipes([]);
      }
      setLoadingRecipes(false);
    };
    fetchRecipes();
  }, []);

  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(recipe => categoryFilter ? recipe.category === categoryFilter : true);

  const categories = [...new Set(recipes.map(r => r.category))];

  return (
    <div className="space-y-8 sm:space-y-12">
      <h1 className={`text-3xl sm:text-4xl font-bold text-${THEME_COLORS.textPrimary} text-center mb-8 sm:mb-12`}>{t('nutrition')}</h1>
      
      <section>
        <h2 className="text-2xl sm:text-3xl font-semibold text-emerald-400 mb-4 sm:mb-6">{t('recipes')}</h2>
        <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 mb-4 sm:mb-6">
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
            className={`bg-slate-800 border border-slate-700 text-${THEME_COLORS.textPrimary} text-xs sm:text-sm rounded-lg focus:ring-${THEME_COLORS.primary} focus:border-${THEME_COLORS.primary} block p-2 sm:p-2.5 w-full sm:w-auto`}
            >
            <option value="">{t('allCategories', 'جميع الفئات')}</option>
            {categories.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase(), cat)}</option>)}
            </select>
        </div>
        {loadingRecipes ? <Spinner className="mx-auto"/> : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} onSelectRecipe={setSelectedRecipe} />
            ))}
          </div>
        ) : (
          <p className={`text-center text-${THEME_COLORS.textSecondary} py-6 sm:py-8`}>{t('noRecipesFound', 'لم يتم العثور على وصفات تطابق بحثك.')}</p>
        )}
      </section>

      <section>
        <h2 className={`text-2xl sm:text-3xl font-semibold text-${THEME_COLORS.primary} mb-4 sm:mb-6`}>{t('calorieCalculator')}</h2> {/* Changed color */}
        <CalorieTracker /> 
      </section>

      <section>
        <h2 className="text-2xl sm:text-3xl font-semibold text-amber-400 mb-4 sm:mb-6">{t('nutritionAIAssistant')}</h2>
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

interface RecipeCardProps {
  recipe: Recipe;
  onSelectRecipe: (recipe: Recipe) => void;
}
const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelectRecipe }) => {
  const { t } = useLocalization();
  return (
    <Card className="flex flex-col p-0" onClick={() => onSelectRecipe(recipe)}>
      <img src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/400/300`} alt={recipe.name} className="w-full h-40 sm:h-56 object-cover rounded-t-xl"/>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className={`text-md sm:text-lg font-semibold text-${THEME_COLORS.primary} mb-1 sm:mb-2`}>{recipe.name}</h3>
        <p className={`text-${THEME_COLORS.textSecondary} text-xs sm:text-sm mb-2 flex-grow`}>{recipe.description.substring(0,100)}{recipe.description.length > 100 ? '...' : ''}</p>
        <div className={`mt-auto text-xs text-${THEME_COLORS.textSecondary} opacity-80`}> {/* Slightly more muted meta */}
          <p>{t('prepTime', 'وقت التحضير')}: {recipe.prepTimeMinutes} {t('minutes', 'دقائق')}</p>
          <p>{t('cookTime', 'وقت الطهي')}: {recipe.cookTimeMinutes} {t('minutes', 'دقائق')}</p>
          <p>{t('servings', 'حصص')}: {recipe.servings}</p>
          {recipe.calories && <p>{t('calories', 'السعرات')}: {recipe.calories} {t('perServing', 'لكل حصة')}</p>}
        </div>
         <span className={`mt-2 px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs bg-${THEME_COLORS.accent} bg-opacity-20 text-${THEME_COLORS.accent} rounded-full self-start`}>{t(recipe.category.toLowerCase(), recipe.category)}</span>
      </div>
    </Card>
  );
};

const RecipeDetail: React.FC<{recipe: Recipe}> = ({recipe}) => {
    const { t } = useLocalization();
    return (
        <div className="space-y-3 sm:space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <img src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/600/400`} alt={recipe.name} className="w-full h-48 sm:h-64 object-cover rounded-lg mb-3 sm:mb-4"/>
            <p className={`text-${THEME_COLORS.textSecondary} text-sm sm:text-base`}>{recipe.description}</p>
            
            <div className={`grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-${THEME_COLORS.textSecondary}`}>
                <p><strong className={`text-${THEME_COLORS.textPrimary}`}>{t('prepTime', 'وقت التحضير')}:</strong> {recipe.prepTimeMinutes} {t('minutes', 'دقائق')}</p>
                <p><strong className={`text-${THEME_COLORS.textPrimary}`}>{t('cookTime', 'وقت الطهي')}:</strong> {recipe.cookTimeMinutes} {t('minutes', 'دقائق')}</p>
                <p><strong className={`text-${THEME_COLORS.textPrimary}`}>{t('servings', 'حصص')}:</strong> {recipe.servings}</p>
                {recipe.calories && <p><strong className={`text-${THEME_COLORS.textPrimary}`}>{t('calories', 'السعرات')}:</strong> {recipe.calories} {t('perServing', 'لكل حصة')}</p>}
            </div>

            <div>
                <h4 className={`text-md sm:text-lg font-semibold text-${THEME_COLORS.textPrimary} mt-3 sm:mt-4 mb-1 sm:mb-2`}>{t('ingredients')}</h4>
                <ul className={`list-disc list-inside text-${THEME_COLORS.textSecondary} space-y-1 text-xs sm:text-sm`}>
                    {recipe.ingredients.map((ing, index) => <li key={index}>{ing.quantity} {ing.item}</li>)}
                </ul>
            </div>
            <div>
                <h4 className={`text-md sm:text-lg font-semibold text-${THEME_COLORS.textPrimary} mt-3 sm:mt-4 mb-1 sm:mb-2`}>{t('instructions')}</h4>
                <ol className={`list-decimal list-inside text-${THEME_COLORS.textSecondary} space-y-1 text-xs sm:text-sm`}>
                    {recipe.instructions.map((step, index) => <li key={index}>{step}</li>)}
                </ol>
            </div>
        </div>
    );
};

const CalorieTracker: React.FC = () => {
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
    <Card className="p-4 sm:p-6">
      <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 mb-4 sm:mb-6">
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
          className="sm:w-28 md:w-32"
        />
        <Button type="submit" variant="secondary" size="md">{t('addItem')}</Button>
      </form>
      {items.length > 0 && (
        <div className="space-y-1.5 sm:space-y-2 mb-4 max-h-52 sm:max-h-60 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-center p-1.5 sm:p-2 bg-slate-800 rounded"> {/* Changed background */}
              <span className={`text-${THEME_COLORS.textPrimary} text-xs sm:text-sm`}>{item.foodItem}</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className={`text-amber-400 text-xs sm:text-sm`}>{item.calories} {t('calUnit', 'سعر حراري')}</span>
                <Button onClick={() => handleDeleteItem(item.id)} variant="danger" size="sm" className="!p-1 !text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094C7.071 5.838 7.5 6.255 7.5 6.75V7.5a.75.75 0 00.75.75h7.5a.75.75 0 00.75-.75V6.75c0-.495.429-.912.933-.962M10.5 7.5V18" />
                    </svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className={`text-lg sm:text-xl font-semibold text-${THEME_COLORS.textPrimary} text-center`}>{t('totalCalories')}: <span className="text-amber-400">{totalCalories}</span> {t('calUnit', 'سعر حراري')}</p>
    </Card>
  );
};

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
      const aiResponse = await getNutritionAdvice(input, messages); 
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
    <Card className="p-4 sm:p-6">
      <div className="h-72 sm:h-80 md:h-96 overflow-y-auto mb-3 sm:mb-4 p-2 sm:p-3 bg-slate-800 rounded-md space-y-2 sm:space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-2 sm:p-3 rounded-lg shadow ${
              msg.role === 'user' ? `bg-${THEME_COLORS.primary} text-white` : 
              msg.role === 'assistant' ? 'bg-slate-700 text-slate-100' : // Assistant text brighter
              'bg-red-700 text-red-100' // System error text brighter
            }`}>
              <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="max-w-[70%] p-2 sm:p-3 rounded-lg shadow bg-slate-700 text-slate-100"> {/* Assistant text brighter */}
                    <Spinner size="sm" className="me-2 inline-block"/> {t('aiThinking')}
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
        <Input 
          type="text" 
          placeholder={t('askNutritionQuestion')} 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          required 
          className="flex-grow"
          disabled={isLoading}
        />
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading || !input.trim()} size="md">
          {t('submit')}
        </Button>
      </form>
    </Card>
  );
};


const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => { 
  const { t } = useLocalization();
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-${THEME_COLORS.background} bg-opacity-80`}>
      <Spinner size="lg" />
      {message && <p className={`mt-4 text-md sm:text-lg text-${THEME_COLORS.textPrimary}`}>{message}</p>}
      {!message && <p className={`mt-4 text-md sm:text-lg text-${THEME_COLORS.textPrimary}`}>{t('loading')}</p>}
    </div>
  );
};


export default ContentPages;
