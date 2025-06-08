
import React, { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { useAuth, useLocalization } from '../App';
import { Button, Input, Card, Spinner, Modal, Textarea, LoadingOverlay } from '../components/CommonUI';
import * as DataService from '../services/dataService';
import { TransformationPost, TransformationComment, User, UserRole } from '../types';
import { THEME_COLORS, TRANSFORMATION_IMAGE_MAX_SIZE_BYTES } from '../constants';

// Utility function (can be moved to a helper file if used elsewhere)
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

export const TransformationsPage: React.FC = () => {
  const { currentUser } = useAuth(); // Assuming isSubscribed might not be needed directly here
  const { t } = useLocalization();
  const [posts, setPosts] = useState<TransformationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPost, setViewingPost] = useState<TransformationPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState({type: '', message: ''});


  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedPosts = await DataService.getTransformationPosts();
      setPosts(fetchedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error("Error fetching transformation posts:", err);
      setError(t('errorOccurred'));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [t]);
  
  const showFeedback = (type: 'success' | 'error', messageKey: string) => {
    setFeedback({type, message: t(messageKey)});
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const handlePostCreated = async () => {
    setIsCreateModalOpen(false);
    await fetchPosts(); // Refresh posts list
    showFeedback('success', 'postPublishedSuccess'); // Assuming you'll add this translation
  };

  const handleLikeToggle = async (postId: string) => {
    if (!currentUser) return;
    try {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        let updatedPost;
        if (post.likes.includes(currentUser.id)) {
            updatedPost = await DataService.unlikeTransformationPost(postId, currentUser.id);
        } else {
            updatedPost = await DataService.likeTransformationPost(postId, currentUser.id);
        }
        if (updatedPost) {
            setPosts(prevPosts => prevPosts.map(p => p.id === postId ? updatedPost! : p));
        } else { // Fallback if API doesn't return updated post, refetch all
            await fetchPosts();
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        showFeedback('error', 'errorOccurred');
    }
  };
  
  const handleCommentAction = async () => {
    await fetchPosts(); // Refresh post list (for comment counts)
    if (viewingPost) { // If a post modal is open, refresh its data too
        const refreshedViewingPost = await DataService.getTransformationPostById(viewingPost.id);
        setViewingPost(refreshedViewingPost || null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    // Basic check for admin or owner, more robust checks might be backend-side
    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete) return;
    
    const canDelete = currentUser.role === UserRole.ADMIN || 
                      currentUser.role === UserRole.SITE_MANAGER || 
                      currentUser.id === postToDelete.userId;

    if (!canDelete) {
        showFeedback('error', 'actionNotAllowed');
        return;
    }

    if (window.confirm(t('confirmDeletePost'))) {
        try {
            await DataService.deleteTransformationPost(postId, currentUser.id);
            await fetchPosts();
            showFeedback('success', 'postDeletedSuccess');
            if (viewingPost && viewingPost.id === postId) {
                setViewingPost(null); // Close modal if deleted post was open
            }
        } catch (error: any) {
            showFeedback('error', error.message || 'errorOccurred');
        }
    }
  };


  if (loading) return <LoadingOverlay message={t('loading')} />;
  if (error) return <p className="text-center text-red-500 py-10">{error}</p>;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('transformations')}</h1>
        {currentUser && (
          <Button onClick={() => setIsCreateModalOpen(true)} variant="primary" size="md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 me-2"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
            {t('shareYourProgress')}
          </Button>
        )}
      </div>
      
      {feedback.message && <p className={`mb-4 p-3 rounded text-sm ${feedback.type === 'success' ? `bg-${THEME_COLORS.success} bg-opacity-20 text-green-300` : `bg-${THEME_COLORS.error} bg-opacity-20 text-red-300`}`}>{feedback.message}</p>}

      {posts.length === 0 ? (
        <p className="text-slate-400 text-center py-10">{t('noTransformationsPosted')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {posts.map(post => (
            <TransformationPostCard 
                key={post.id} 
                post={post} 
                currentUser={currentUser}
                onViewDetails={() => setViewingPost(post)}
                onLikeToggle={() => handleLikeToggle(post.id)}
                onDelete={() => handleDeletePost(post.id)}
            />
          ))}
        </div>
      )}

      {currentUser && isCreateModalOpen && (
        <CreatePostModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          currentUser={currentUser}
          onPostCreated={handlePostCreated}
        />
      )}
      {viewingPost && currentUser && (
        <ViewPostModal
            isOpen={!!viewingPost}
            onClose={() => setViewingPost(null)}
            post={viewingPost}
            currentUser={currentUser}
            onLikeToggle={() => handleLikeToggle(viewingPost.id)}
            onCommentAction={handleCommentAction}
            onDeletePost={() => handleDeletePost(viewingPost.id)}
        />
      )}
    </div>
  );
};


interface TransformationPostCardProps {
  post: TransformationPost;
  currentUser: User | null;
  onViewDetails: () => void;
  onLikeToggle: () => void;
  onDelete: () => void;
}
const TransformationPostCard: React.FC<TransformationPostCardProps> = ({ post, currentUser, onViewDetails, onLikeToggle, onDelete }) => {
    const { t } = useLocalization();
    const canDelete = currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SITE_MANAGER || currentUser.id === post.userId);
    const isLiked = currentUser && post.likes.includes(currentUser.id);

    return (
        <Card className="p-0 flex flex-col overflow-hidden">
            <div className="grid grid-cols-2">
                <img src={post.beforeImageUrl} alt={t('beforePhoto')} className="w-full h-32 sm:h-40 object-cover" />
                <img src={post.afterImageUrl} alt={t('afterPhoto')} className="w-full h-32 sm:h-40 object-cover" />
            </div>
            <div className="p-3 sm:p-4 flex flex-col flex-grow">
                <h3 className={`text-md sm:text-lg font-semibold text-${THEME_COLORS.primary} mb-1 break-all`}>{post.title}</h3>
                <div className="flex items-center text-xs text-slate-400 mb-2">
                     {post.userProfileImage ? (
                        <img src={post.userProfileImage} alt={post.userName} className="w-5 h-5 rounded-full me-1.5 object-cover" />
                    ) : (
                        <div className={`w-5 h-5 rounded-full bg-${THEME_COLORS.secondary} flex items-center justify-center text-black font-semibold text-xs me-1.5`}>
                            {post.userName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span>{post.userName} - {new Date(post.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-auto pt-2 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                        <button onClick={onLikeToggle} disabled={!currentUser} className={`flex items-center gap-1 ${isLiked ? `text-${THEME_COLORS.accent}` : ''} hover:text-${THEME_COLORS.accent} transition-colors`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" /></svg>
                            {post.likes.length}
                        </button>
                        <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M2 5.25A3.25 3.25 0 015.25 2h9.5A3.25 3.25 0 0118 5.25v7.5A3.25 3.25 0 0114.75 16h-4.191l-1.664 1.664a.75.75 0 01-1.061 0L6.191 16H5.25A3.25 3.25 0 012 12.75v-7.5zm1.5.035A1.75 1.75 0 015.25 3.5h9.5A1.75 1.75 0 0116.5 5.25v7.5A1.75 1.75 0 0114.75 14.5h-3.94l.878.878a.75.75 0 01-1.06 1.06L9.25 15.06l-1.378 1.378a.75.75 0 01-1.06-1.06l.878-.878H5.25A1.75 1.75 0 013.5 12.75v-7.5zM6 7.5a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 016 7.5zm.75 2.25a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" clipRule="evenodd" /></svg>
                            {post.commentsCount}
                        </span>
                    </div>
                     <Button onClick={onViewDetails} variant="ghost" size="xs" className="!px-1.5 !py-0.5">{t('viewPostDetails', 'عرض')}</Button>
                </div>
                 {canDelete && <Button onClick={onDelete} variant="danger" size="xs" className="!px-1.5 !py-0.5 mt-2 self-end">{t('deletePost')}</Button>}
            </div>
        </Card>
    );
};

interface CreatePostModalProps { isOpen: boolean; onClose: () => void; currentUser: User; onPostCreated: () => void; }
const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, currentUser, onPostCreated }) => {
    const { t } = useLocalization();
    const [title, setTitle] = useState('');
    const [beforeImage, setBeforeImage] = useState<File | null>(null);
    const [afterImage, setAfterImage] = useState<File | null>(null);
    const [beforePreview, setBeforePreview] = useState<string | null>(null);
    const [afterPreview, setAfterPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        setError(null);
        const file = e.target.files?.[0];
        if (file) {
            try {
                await imageFileToBase64(file); // Validate size and type
                if (type === 'before') { setBeforeImage(file); setBeforePreview(URL.createObjectURL(file)); }
                else { setAfterImage(file); setAfterPreview(URL.createObjectURL(file)); }
            } catch (err: any) { setError(t(err.message.includes("large") ? 'imageTooLarge' : 'invalidImageType')); }
        } else {
            if (type === 'before') { setBeforeImage(null); setBeforePreview(null); }
            else { setAfterImage(null); setAfterPreview(null); }
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!title.trim() || !beforeImage || !afterImage) { setError(t('allFieldsAndImagesRequired')); return; }
        setIsLoading(true);
        try {
            await DataService.addTransformationPost({ userId: currentUser.id, title }, beforeImage, afterImage, currentUser);
            onPostCreated();
            setTitle(''); setBeforeImage(null); setAfterImage(null); setBeforePreview(null); setAfterPreview(null); // Reset form
        } catch (err: any) { setError(err.message || t('errorOccurred')); }
        setIsLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('shareYourProgress')} size="lg">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <Input label={t('titleOrCaption')} value={title} onChange={e => setTitle(e.target.value)} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('beforePhoto')}</label>
                        <Input type="file" accept="image/*" onChange={e => handleFileChange(e, 'before')} required />
                        {beforePreview && <img src={beforePreview} alt="Before preview" className="mt-2 rounded-md max-h-40 object-contain mx-auto" />}
                    </div>
                    <div>
                        <label className={`block text-xs sm:text-sm font-medium text-${THEME_COLORS.textSecondary} mb-1`}>{t('afterPhoto')}</label>
                        <Input type="file" accept="image/*" onChange={e => handleFileChange(e, 'after')} required />
                        {afterPreview && <img src={afterPreview} alt="After preview" className="mt-2 rounded-md max-h-40 object-contain mx-auto" />}
                    </div>
                </div>
                {error && <p className="text-red-400 text-xs sm:text-sm text-center">{error}</p>}
                <div className="flex justify-end gap-2 sm:gap-3 pt-2 sm:pt-3">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} size="sm">{t('cancel')}</Button>
                    <Button type="submit" isLoading={isLoading} size="sm">{t('publishPost')}</Button>
                </div>
            </form>
        </Modal>
    );
};

interface ViewPostModalProps { isOpen: boolean; onClose: () => void; post: TransformationPost; currentUser: User; onLikeToggle: () => void; onCommentAction: () => void; onDeletePost: () => void; }
const ViewPostModal: React.FC<ViewPostModalProps> = ({ isOpen, onClose, post, currentUser, onLikeToggle, onCommentAction, onDeletePost }) => {
    const { t } = useLocalization();
    const [comments, setComments] = useState<TransformationComment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentError, setCommentError] = useState<string | null>(null);
    const [isSendingComment, setIsSendingComment] = useState(false);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    const isLiked = post.likes.includes(currentUser.id);
    const canDeletePost = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SITE_MANAGER || currentUser.id === post.userId;

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const fetchedComments = await DataService.getCommentsForPost(post.id);
            setComments(fetchedComments.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        } catch (err) { console.error("Error fetching comments:", err); }
        setLoadingComments(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchComments();
        }
    }, [isOpen, post.id]);
    
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);


    const handleAddComment = async (e: FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsSendingComment(true);
        setCommentError(null);
        try {
            await DataService.addTransformationComment({ postId: post.id, userId: currentUser.id, text: newComment }, currentUser);
            setNewComment('');
            await fetchComments(); // Refresh comments list
            onCommentAction(); // Notify parent to refresh post data (comment count)
        } catch (err: any) { setCommentError(err.message || t('errorOccurred')); }
        setIsSendingComment(false);
        commentInputRef.current?.focus();
    };

    const handleDeleteComment = async (commentId: string) => {
        const commentToDelete = comments.find(c => c.id === commentId);
        if(!commentToDelete) return;

        const canDeleteComment = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SITE_MANAGER || currentUser.id === commentToDelete.userId;
        if (!canDeleteComment) { alert(t('actionNotAllowed')); return; }

        if (window.confirm(t('confirmDeleteComment'))) {
            try {
                await DataService.deleteTransformationComment(commentId, currentUser.id);
                await fetchComments();
                onCommentAction();
            } catch (err: any) { alert(err.message || t('errorOccurred')); }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={post.title} size="2xl">
            <div className="max-h-[80vh] flex flex-col">
                <div className="overflow-y-auto space-y-3 sm:space-y-4 p-1 flex-grow">
                    <p className="text-slate-300 text-sm sm:text-base mb-1 whitespace-pre-line">{post.title} - <span className="text-xs">by {post.userName}</span></p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                        <div><h4 className="text-xs font-semibold text-slate-400 mb-1">{t('beforePhoto')}</h4><img src={post.beforeImageUrl} alt={t('beforePhoto')} className="w-full rounded-lg shadow-md object-contain max-h-60 sm:max-h-80"/></div>
                        <div><h4 className="text-xs font-semibold text-slate-400 mb-1">{t('afterPhoto')}</h4><img src={post.afterImageUrl} alt={t('afterPhoto')} className="w-full rounded-lg shadow-md object-contain max-h-60 sm:max-h-80"/></div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-t border-slate-700">
                        <div className="flex items-center gap-3">
                            <button onClick={onLikeToggle} className={`flex items-center gap-1 text-sm ${isLiked ? `text-${THEME_COLORS.accent}` : 'text-slate-400'} hover:text-${THEME_COLORS.accent} transition-colors`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" /></svg>
                                {post.likes.length} {t('likes')}
                            </button>
                            <span className="text-slate-400 text-sm">{post.commentsCount} {t('comments')}</span>
                        </div>
                        {canDeletePost && <Button onClick={onDeletePost} variant="danger" size="sm" className="!text-xs !px-2 !py-1">{t('deletePost')}</Button>}
                    </div>

                    <h4 className="text-md sm:text-lg font-semibold text-white pt-2">{t('comments')}</h4>
                    <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 overflow-y-auto pr-1">
                        {loadingComments ? <Spinner className="mx-auto" /> : comments.length === 0 ? <p className="text-slate-400 text-xs sm:text-sm">{t('noCommentsYet')}</p> : 
                        comments.map(comment => (
                            <div key={comment.id} className={`p-1.5 sm:p-2 rounded-lg bg-slate-700`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center mb-0.5">
                                        {comment.userProfileImage ? <img src={comment.userProfileImage} alt={comment.userName} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover me-1.5" /> : <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-${THEME_COLORS.secondary} flex items-center justify-center text-black font-semibold text-xs me-1.5`}>{comment.userName.charAt(0).toUpperCase()}</div>}
                                        <div><p className="text-xs sm:text-sm font-semibold text-slate-200">{comment.userName}</p><p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleDateString('ar-EG', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</p></div>
                                    </div>
                                    {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SITE_MANAGER || currentUser.id === comment.userId) && (
                                        <Button onClick={() => handleDeleteComment(comment.id)} variant="danger" size="xs" className="!p-0.5 sm:!p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5"><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 000 1.5h.31l.421 8.424A2.25 2.25 0 005.731 16h4.538a2.25 2.25 0 002.25-2.076L12.941 5.5h.31a.75.75 0 000-1.5H11v-.75A2.25 2.25 0 008.75 1h-1.5A2.25 2.25 0 005 3.25zm2.25-.75c0-.414.336-.75.75-.75h1.5a.75.75 0 01.75.75V4h-3V2.5zM7.25 7a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 017.25 7zM10 7.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" /></svg>
                                        </Button>
                                    )}
                                </div>
                                <p className="text-slate-300 text-xs sm:text-sm ps-7 sm:ps-8 whitespace-pre-line">{comment.text}</p>
                            </div>
                        ))}
                         <div ref={commentsEndRef} />
                    </div>
                </div>
                <form onSubmit={handleAddComment} className="mt-auto pt-3 border-t border-slate-700">
                    <Textarea ref={commentInputRef} value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t('addYourComment')} rows={2} required className="!text-xs sm:!text-sm" />
                    {commentError && <p className="text-red-400 text-xs mt-1">{commentError}</p>}
                    <div className="flex justify-end mt-2">
                        <Button type="submit" isLoading={isSendingComment} size="sm">{t('addComment')}</Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// --- END OF FILE TransformationsPage.tsx ---
// (No default export needed if this is the only export from the file and App.tsx uses named import)
