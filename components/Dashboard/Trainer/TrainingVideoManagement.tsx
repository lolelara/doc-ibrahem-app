
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { TrainingVideo } from '../../../types';
import Button from '../../Shared/Button';
import Input from '../../Shared/Input';
import Modal from '../../Shared/Modal';
import { ARABIC_STRINGS } from '../../../constants';

const TrainingVideoManagement: React.FC = () => {
  const { user, trainingVideos, addTrainingVideo, deleteTrainingVideo, fetchTrainingVideos, actionLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  useEffect(() => {
    if (user) {
      fetchTrainingVideos(user.id); // Fetch videos uploaded by this trainer
    }
  }, [user, fetchTrainingVideos]);

  const handleAddVideoSubmit = async () => {
    if (!newVideoTitle || !newVideoUrl || !user) {
      alert("يرجى ملء جميع الحقول.");
      return;
    }
    if (!newVideoUrl.includes('youtube.com/') && !newVideoUrl.includes('youtu.be/')) {
        alert("يرجى إدخال رابط يوتيوب صالح.");
        return;
    }

    const result = await addTrainingVideo({ title: newVideoTitle, youtubeUrl: newVideoUrl });
    if (result) {
      setIsModalOpen(false);
      setNewVideoTitle('');
      setNewVideoUrl('');
    }
    // Error messages are handled by AuthContext
  };
  
  const handleDeleteVideo = async (videoId: string) => {
    if (window.confirm("هل أنت متأكد أنك تريد حذف هذا الفيديو؟")) {
        await deleteTrainingVideo(videoId);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };


  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md text-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">{ARABIC_STRINGS.trainingVideos}</h2>
        <Button onClick={() => setIsModalOpen(true)} variant="success" disabled={actionLoading}>
            <i className="fas fa-plus me-2"></i> {ARABIC_STRINGS.addTrainingVideo}
        </Button>
      </div>

      {actionLoading && trainingVideos.length === 0 && <p className="text-blue-300">جاري تحميل الفيديوهات...</p>}
      {!actionLoading && trainingVideos.length === 0 && (
        <p className="text-gray-400">{ARABIC_STRINGS.noDataAvailable} لم تقم بإضافة أي فيديوهات بعد.</p>
      )}

      {trainingVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {trainingVideos.map(video => {
            const embedUrl = getYouTubeEmbedUrl(video.youtubeUrl);
            return (
                <div key={video.id} className="bg-gray-700 p-4 rounded-lg shadow relative">
                <h3 className="text-md font-semibold text-blue-400 mb-2">{video.title}</h3>
                {embedUrl ? (
                    <div className="aspect-w-16 aspect-h-9 rounded overflow-hidden">
                    <iframe
                        src={embedUrl}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full" 
                    ></iframe>
                    </div>
                ) : <p className="text-red-400">رابط فيديو غير صالح.</p>}
                 <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleDeleteVideo(video.id)} 
                    disabled={actionLoading}
                    className="absolute top-2 end-2 opacity-75 hover:opacity-100"
                    aria-label="Delete video"
                >
                    <i className="fas fa-trash"></i>
                </Button>
                </div>
            );
        })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={ARABIC_STRINGS.addTrainingVideo}>
        <div className="space-y-4">
          <Input 
            label={ARABIC_STRINGS.videoTitle} 
            value={newVideoTitle} 
            onChange={(e) => setNewVideoTitle(e.target.value)} 
            required 
          />
          <Input 
            label={ARABIC_STRINGS.youtubeLink} 
            type="url"
            value={newVideoUrl} 
            onChange={(e) => setNewVideoUrl(e.target.value)} 
            placeholder="https://www.youtube.com/watch?v=..."
            required 
          />
        </div>
        <div className="mt-6 flex justify-end space-s-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>{ARABIC_STRINGS.cancel}</Button>
            <Button onClick={handleAddVideoSubmit} isLoading={actionLoading}>{ARABIC_STRINGS.addPlan}</Button> {/* Consider changing text to "إضافة فيديو" */}
        </div>
      </Modal>
    </div>
  );
};

export default TrainingVideoManagement;
