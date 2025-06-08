
import React, { useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { ARABIC_STRINGS } from '../../../constants';

const TraineeVideoViewer: React.FC = () => {
  const { user, trainingVideos, fetchTrainingVideos, actionLoading } = useAuth();

  useEffect(() => {
    if (user) {
      // Fetch videos uploaded by their assigned trainer OR general admin videos.
      // The API (`/training-videos`) without `uploadedBy` param should ideally return admin/general videos.
      // Or, the API could accept a `forTraineeId` parameter to handle this logic.
      // For simplicity here, if a trainer is assigned, fetch their videos. Else, fetch general.
      // A more robust solution might involve two calls or a more intelligent backend.
      if (user.trainerId) {
        fetchTrainingVideos(user.trainerId); 
      } else {
        fetchTrainingVideos(); // Attempt to fetch general/admin videos
      }
    }
  }, [user, fetchTrainingVideos]);

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
      <h2 className="text-xl font-semibold mb-4 text-gray-100">{ARABIC_STRINGS.trainingVideos}</h2>
      
      {actionLoading && <p className="text-blue-300">جاري تحميل الفيديوهات...</p>}
      {!actionLoading && trainingVideos.length === 0 && (
        <p className="text-gray-400">{ARABIC_STRINGS.noDataAvailable} لا توجد فيديوهات تدريبية متاحة لك حاليًا.</p>
      )}

      {trainingVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {trainingVideos.map(video => {
             const embedUrl = getYouTubeEmbedUrl(video.youtubeUrl);
             return (
                <div key={video.id} className="bg-gray-700 p-4 rounded-lg shadow">
                    <h3 className="text-md font-semibold text-blue-400 mb-2">{video.title}</h3>
                    <p className="text-xs text-gray-400 mb-2">بواسطة: {video.uploadedByName || 'مدرب'}</p>
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
                </div>
             );
          })}
        </div>
      )}
    </div>
  );
};

export default TraineeVideoViewer;
