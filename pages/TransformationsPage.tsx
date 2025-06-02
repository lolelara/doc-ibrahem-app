
import React, { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { useAuth, useLocalization } from '../App';
import { Button, Input, Card, Spinner, Modal, Textarea } from '../components/CommonUI';
import * as DataService from '../services/dataService';
import { TransformationPost, TransformationComment, User, UserRole } from '../types';
import { THEME_COLORS, TRANSFORMATION_IMAGE_MAX_SIZE_BYTES } from '../constants';

// Helper for image file to base64
const imageFileToBase64 = (file: File): Promise<string> => {
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

// Main Page Component
export const TransformationsPage: React.FC = () => {
  const { currentUser, isSubscribed } = useAuth();
  const { t } = useLocalization();
  const [posts, setPosts] = useState<TransformationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPost, setViewingPost] = useState<TransformationPost | null>(null);

  const fetchPosts = () => {
    setLoading(true);
    setPosts(DataService.getTransformationPosts().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = () => {
    fetchPosts();
    setIsCreateModalOpen(false);
  };

  const handlePostUpdated = () => { // For likes/comments
    fetchPosts(); // Re-fetch to get updated like/comment counts
    if (viewingPost) { // If detail modal is open, refresh its content
        const updatedPost = DataService.getTransformationPostById(viewingPost.id);
        setViewingPost(updatedPost || null); // Update the viewingPost state
    }
  }
  
  const handlePostDeleted = (postId: string) => {
      if(currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SITE_MANAGER)) {
        if(window.confirm(t('confirmDeletePost', 'هل أنت متأكد أنك تريد حذف هذا المنشور؟'))) {
            DataService.deleteTransformationPost(postId, currentUser.id);
            fetchPosts();
            if (viewingPost?.id === postId) {
            setViewingPost(null); // Close detail modal if the viewed post is deleted
            }
        }
      }
  };


  if (loading && !isCreateModalOpen && !viewingPost) return <Spinner size="lg" className="mx-auto mt-10" />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('transformations', 'التحولات')}</h1>
        {currentUser && isSubscribed && (
          <Button onClick={() => setIsCreateModalOpen(true)} variant="primary" size="md">
            {t('shareYourProgress', 'شارك تقدمك')}
          </Button>
        )}
      </div>

      {posts.length === 0 && !loading && (
        <p className="text-center text-slate-400 py-10">{t('noTransformationsPosted', 'لم يتم نشر أي تحولات بعد. كن أول من يشارك!')}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {posts.map(post => (
          <TransformationPostCard 
            key={post.id} 
            post={post} 
            onViewDetails={() => setViewingPost(post)}
            onLikeUnlike={handlePostUpdated}
            onDeletePost={handlePostDeleted}
            currentUserId={currentUser?.id}
            isAdmin={currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SITE_MANAGER}
          />
        ))}
      </div>

      {isCreateModalOpen && currentUser && (
        <CreateTransformationPostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onPostCreated={handlePostCreated}
          currentUser={currentUser}
        />
      )}

      {viewingPost && currentUser && (
        <ViewTransformationPostModal
          isOpen={!!viewingPost}
          onClose={() => setViewingPost(null)}
          post={viewingPost}
          currentUserId={currentUser.id}
          onCommentAction={handlePostUpdated} // Renamed for clarity
          onLikeUnlike={handlePostUpdated}
          isAdmin={currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SITE_MANAGER}
        />
      )}
    </div>
  );
};

// --- Sub-components for TransformationsPage ---

interface TransformationPostCardProps {
  post: TransformationPost;
  onViewDetails: () => void;
  onLikeUnlike: () => void;
  onDeletePost: (postId: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const TransformationPostCard: React.FC<TransformationPostCardProps> = ({ post, onViewDetails, onLikeUnlike, onDeletePost, currentUserId, isAdmin }) => {
  const { t } = useLocalization();
  const hasLiked = currentUserId ? post.likes.includes(currentUserId) : false;

  const handleLike = () => {
    if (!currentUserId) return; 
    if (hasLiked) {
      DataService.unlikeTransformationPost(post.id, currentUserId);
    } else {
      DataService.likeTransformationPost(post.id, currentUserId);
    }
    onLikeUnlike();
  };
  
  const confirmDeletePost = () => {
      if(window.confirm(t('confirmDeletePost', 'هل أنت متأكد أنك تريد حذف هذا المنشور؟'))) {
          onDeletePost(post.id);
      }
  }

  return (
    <Card className="flex flex-col">
      <div className="p-3 sm:p-4">
        <div className="flex items-center mb-2 sm:mb-3">
          {post.userProfileImage ? (
            <img src={post.userProfileImage} alt={post.userName} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover me-2 sm:me-3" />
          ) : (
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-${THEME_COLORS.primary} flex items-center justify-center text-white font-semibold text-sm sm:text-md me-2 sm:me-3`}>
              {post.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm sm:text-md font-semibold text-white">{post.userName}</p>
            <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
        <h3 className="text-md sm:text-lg font-semibold text-sky-400 mb-2 cursor-pointer hover:text-sky-300 truncate" title={post.title} onClick={onViewDetails}>{post.title}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-0.5 sm:gap-1 cursor-pointer" onClick={onViewDetails}>
        <img src={post.beforeImageUrl} alt={t('beforePhoto', 'الصورة قبل')} className="w-full h-32 sm:h-48 object-cover" />
        <img src={post.afterImageUrl} alt={t('afterPhoto', 'الصورة بعد')} className="w-full h-32 sm:h-48 object-cover" />
      </div>

      <div className="p-3 sm:p-4 border-t border-slate-700">
        <div className="flex justify-between items-center text-slate-400 text-xs sm:text-sm">
          <Button onClick={handleLike} variant="ghost" size="sm" className={`!p-1 sm:!p-1.5 ${hasLiked ? `text-${THEME_COLORS.accent}` : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
            </svg>
            <span className="ms-1">{post.likes.length} {t('likes', 'إعجابات')}</span>
          </Button>
          <button onClick={onViewDetails} className="hover:text-white">
            {post.commentsCount} {t('comments', 'تعليقات')}
          </button>
        </div>
        {isAdmin && (
            <Button onClick={confirmDeletePost} variant="danger" size="xs" className="w-full mt-2 sm:mt-3 !text-xs !py-1">
                {t('deletePost', 'حذف المنشور')}
            </Button>
        )}
      </div>
    </Card>
  );
};


interface CreateTransformationPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  currentUser: User;
}

const CreateTransformationPostModal: React.FC<CreateTransformationPostModalProps> = ({ isOpen, onClose, onPostCreated, currentUser }) => {
  const { t } = useLocalization();
  const [title, setTitle] = useState('');
  const [beforeImageFile, setBeforeImageFile] = useState<File | null>(null);
  const [afterImageFile, setAfterImageFile] = useState<File | null>(null);
  const [beforeImagePreview, setBeforeImagePreview] = useState<string | null>(null);
  const [afterImagePreview, setAfterImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    setError('');
    if (file) {
      if (file.size > TRANSFORMATION_IMAGE_MAX_SIZE_BYTES) {
        setError(`${t('imageTooLarge', 'الصورة كبيرة جدًا.')} (Max ${TRANSFORMATION_IMAGE_MAX_SIZE_BYTES / (1024 * 1024)}MB)`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError(t('invalidImageType', 'نوع الملف غير صالح. يرجى رفع صورة.'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'before') {
          setBeforeImageFile(file);
          setBeforeImagePreview(reader.result as string);
        } else {
          setAfterImageFile(file);
          setAfterImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !beforeImageFile || !afterImageFile) {
      setError(t('allFieldsAndImagesRequired', 'يرجى ملء العنوان ورفع الصورتين.'));
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await DataService.addTransformationPost(
        { userId: currentUser.id, title },
        beforeImageFile,
        afterImageFile,
        currentUser
      );
      onPostCreated();
      // Reset form
      setTitle(''); setBeforeImageFile(null); setAfterImageFile(null); setBeforeImagePreview(null); setAfterImagePreview(null);
    } catch (err: any) {
      setError(err.message || t('errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('shareYourProgress', 'شارك تقدمك')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <Textarea
          label={t('titleOrCaption', 'العنوان أو الوصف')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          rows={2}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('beforePhoto', 'الصورة قبل')}</label>
            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'before')} required />
            {beforeImagePreview && <img src={beforeImagePreview} alt="Before Preview" className="mt-2 rounded-md max-h-32 sm:max-h-40 object-contain mx-auto" />}
          </div>
          <div>
            <label className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('afterPhoto', 'الصورة بعد')}</label>
            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'after')} required />
            {afterImagePreview && <img src={afterImagePreview} alt="After Preview" className="mt-2 rounded-md max-h-32 sm:max-h-40 object-contain mx-auto" />}
          </div>
        </div>
        {error && <p className="text-xs sm:text-sm text-red-400 text-center">{error}</p>}
        <div className="flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3 pt-2 sm:pt-3 border-t border-slate-700">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} size="sm">{t('cancel')}</Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading} size="sm">{t('publishPost', 'نشر المنشور')}</Button>
        </div>
      </form>
    </Modal>
  );
};


interface ViewTransformationPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: TransformationPost;
  currentUserId: string;
  onCommentAction: () => void; // To refresh parent when comment added/deleted
  onLikeUnlike: () => void;
  isAdmin?: boolean;
}

const ViewTransformationPostModal: React.FC<ViewTransformationPostModalProps> = ({ isOpen, onClose, post, currentUserId, onCommentAction, onLikeUnlike, isAdmin }) => {
  const { t } = useLocalization();
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<TransformationComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const hasLiked = post.likes.includes(currentUserId);

  useEffect(() => {
    if (isOpen) {
      setComments(DataService.getCommentsForPost(post.id));
    }
  }, [isOpen, post.id, post.commentsCount]); // Depend on commentsCount to refetch when it changes

  const handleLike = () => {
    if (hasLiked) {
      DataService.unlikeTransformationPost(post.id, currentUserId);
    } else {
      DataService.likeTransformationPost(post.id, currentUserId);
    }
    onLikeUnlike(); 
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    setCommentLoading(true);
    try {
      DataService.addTransformationComment(
        { postId: post.id, userId: currentUser.id, text: newComment },
        currentUser
      );
      setNewComment('');
      setComments(DataService.getCommentsForPost(post.id)); 
      onCommentAction(); 
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setCommentLoading(false);
    }
  };
  
  const handleDeleteComment = (commentId: string) => {
      if (!currentUser || !isAdmin ) return; // Only admin can delete comments via this admin-context modal for now
      if(window.confirm(t('confirmDeleteComment', 'هل أنت متأكد أنك تريد حذف هذا التعليق؟'))) {
          DataService.deleteTransformationComment(commentId, currentUser.id);
          setComments(DataService.getCommentsForPost(post.id)); 
          onCommentAction(); 
      }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={post.title} size="2xl">
      <div className="max-h-[80vh] overflow-y-auto p-1">
        <div className="flex items-center mb-3 sm:mb-4">
            {post.userProfileImage ? (
                <img src={post.userProfileImage} alt={post.userName} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover me-3 sm:me-4" />
            ) : (
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-${THEME_COLORS.primary} flex items-center justify-center text-white font-semibold text-lg sm:text-xl me-3 sm:me-4`}>
                {post.userName.charAt(0).toUpperCase()}
                </div>
            )}
            <div>
                <p className="text-md sm:text-lg font-semibold text-white">{post.userName}</p>
                <p className="text-xs sm:text-sm text-slate-400">{new Date(post.createdAt).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
            </div>
        </div>
        <p className="text-slate-300 text-sm sm:text-base mb-3 sm:mb-4 whitespace-pre-line">{post.title}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-1">{t('beforePhoto', 'الصورة قبل')}</h4>
            <img src={post.beforeImageUrl} alt={t('beforePhoto', 'الصورة قبل')} className="w-full rounded-lg shadow-md object-contain max-h-64 sm:max-h-80" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-1">{t('afterPhoto', 'الصورة بعد')}</h4>
            <img src={post.afterImageUrl} alt={t('afterPhoto', 'الصورة بعد')} className="w-full rounded-lg shadow-md object-contain max-h-64 sm:max-h-80" />
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 py-2 sm:py-3 border-y border-slate-700 mb-3 sm:mb-4">
          <Button onClick={handleLike} variant="ghost" size="sm" className={`!py-1 ${hasLiked ? `text-${THEME_COLORS.accent}` : ''}`}>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
            </svg>
            <span className="ms-1 sm:ms-1.5 text-xs sm:text-sm">{post.likes.length} {t('likes', 'إعجابات')}</span>
          </Button>
          <span className="text-slate-400 text-xs sm:text-sm">{post.commentsCount} {t('comments', 'تعليقات')}</span>
        </div>

        {/* Comments List */}
        <h4 className="text-md sm:text-lg font-semibold text-white mb-2 sm:mb-3">{t('comments', 'التعليقات')}</h4>
        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 max-h-48 sm:max-h-60 overflow-y-auto pr-1">
          {comments.length === 0 && <p className="text-slate-400 text-xs sm:text-sm">{t('noCommentsYet', 'لا توجد تعليقات بعد.')}</p>}
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} currentUserId={currentUserId} isAdmin={isAdmin} onDeleteComment={handleDeleteComment} />
          ))}
        </div>

        {/* Add Comment Form */}
        {currentUser && (
        <form onSubmit={handleAddComment} className="mt-2 sm:mt-3">
          <Textarea
            placeholder={t('addYourComment', 'أضف تعليقك...')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
            rows={2}
            className="text-xs sm:text-sm"
          />
          <Button type="submit" variant="secondary" size="sm" isLoading={commentLoading} disabled={commentLoading || !newComment.trim()} className="mt-1.5 sm:mt-2 !text-xs !py-1">
            {t('addComment', 'إضافة تعليق')}
          </Button>
        </form>
        )}
      </div>
    </Modal>
  );
};

interface CommentItemProps {
  comment: TransformationComment;
  currentUserId: string;
  isAdmin?: boolean;
  onDeleteComment: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUserId, isAdmin, onDeleteComment }) => {
  const { t } = useLocalization();
  const canDelete = isAdmin || comment.userId === currentUserId; // Admin or owner can delete

  return (
    <div className={`p-2 sm:p-2.5 rounded-lg ${comment.userId === currentUserId ? 'bg-sky-800 bg-opacity-40' : 'bg-slate-700'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center mb-1">
          {comment.userProfileImage ? (
            <img src={comment.userProfileImage} alt={comment.userName} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover me-1.5 sm:me-2" />
          ) : (
             <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-${THEME_COLORS.secondary} flex items-center justify-center text-black font-semibold text-xs me-1.5 sm:me-2`}>
                {comment.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">{comment.userName}</p>
            <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleDateString('ar-EG', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
          </div>
        </div>
        {canDelete && ( 
          <Button onClick={() => onDeleteComment(comment.id)} variant="danger" size="xs" className="!p-1">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5"><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 000 1.5h.31l.421 8.424A2.25 2.25 0 005.731 16h4.538a2.25 2.25 0 002.25-2.076L12.941 5.5h.31a.75.75 0 000-1.5H11v-.75A2.25 2.25 0 008.75 1h-1.5A2.25 2.25 0 005 3.25zm2.25-.75c0-.414.336-.75.75-.75h1.5a.75.75 0 01.75.75V4h-3V2.5zM7.25 7a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 017.25 7zM10 7.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" /></svg>
          </Button>
        )}
      </div>
      <p className="text-slate-300 text-xs sm:text-sm ps-8 sm:ps-9 whitespace-pre-line">{comment.text}</p>
    </div>
  );
};

export default TransformationsPage;
