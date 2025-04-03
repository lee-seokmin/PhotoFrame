'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusMessage from '@/components/StatusMessage';
import InstagramUsernameInput from '@/components/InstagramUsernameInput';
import { createPhotoFrame } from '@/utils/imageUtils';
import FramedImagePreview from '@/components/FramedImagePreview';
import ResultActions from '@/components/ResultActions';
import FullScreenImageViewer from '@/components/FullScreenImageViewer';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePhoto } from '@/contexts/PhotoContext';

export default function CreateFramePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { imageDataUrl, fileName, metadata, clearPhotoData } = usePhoto();
  
  const [instagramUsername, setInstagramUsername] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [framedImage, setFramedImage] = useState<string | null>(null);
  const [generatingFrame, setGeneratingFrame] = useState(false);
  
  // Full screen viewer state
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  
  // Check if we have the necessary data on component mount
  useEffect(() => {
    if (!imageDataUrl || !fileName || !metadata) {
      // If data is missing, redirect back to home
      router.push('/');
    }
  }, [imageDataUrl, fileName, metadata, router]);
  
  const handleCreateFrame = async () => {
    if (!imageDataUrl || !metadata) {
      setError(t('status.error.generic'));
      return;
    }
    
    if (!instagramUsername.trim()) {
      setError(t('status.error.instagram'));
      return;
    }

    setError(null);
    setGeneratingFrame(true);

    try {
      const result = await createPhotoFrame(imageDataUrl, metadata, instagramUsername);
      setFramedImage(result);
    } catch (err) {
      console.error(err);
      setError(t('status.error.generic'));
    } finally {
      setGeneratingFrame(false);
    }
  };
  
  const handleGoBack = () => {
    // Clear context data and go back to homepage
    clearPhotoData();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Header />

      <main className="flex-grow container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-xl">
          <div className="flex justify-end items-center mb-4 sm:mb-6">
            <button
              onClick={handleGoBack}
              className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors"
            >
              {t('create.back')}
            </button>
          </div>

          {error && <div className="mb-3 sm:mb-4"><StatusMessage type="error" message={error} /></div>}

          {generatingFrame && <div className="mb-3 sm:mb-4"><StatusMessage type="loading" message={t('status.generating')} /></div>}

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              {imageDataUrl && (
                <div className="space-y-4">
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => setIsFullScreenOpen(true)}
                  >
                    <FramedImagePreview 
                      imageUrl={imageDataUrl}
                      alt={fileName || 'Original photo'}
                    />
                  </div>
                  
                  {/* Username input and generate button */}
                  <div className="space-y-4">
                    <InstagramUsernameInput
                      value={instagramUsername}
                      onChange={setInstagramUsername}
                      label={t('create.username.label')}
                      placeholder={t('create.username.placeholder')}
                    />

                    <button
                      onClick={handleCreateFrame}
                      disabled={generatingFrame}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg min-h-[48px] touch-manipulation"
                    >
                      {t('create.generate.button')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={`${framedImage ? 'mt-4 sm:mt-0' : ''}`}>
              {framedImage && (
                <div className="space-y-3 sm:space-y-4">
                  <FramedImagePreview 
                    imageUrl={framedImage} 
                    alt={fileName || 'photo-frame.jpg'} 
                  />
                  
                  <ResultActions 
                    imageUrl={framedImage} 
                    fileName={fileName || 'photo-frame.jpg'} 
                    downloadLabel={t('create.download.button')}
                    shareLabel={t('create.share.button')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {isFullScreenOpen && imageDataUrl && (
        <FullScreenImageViewer
          isOpen={isFullScreenOpen}
          imageUrl={imageDataUrl}
          onClose={() => setIsFullScreenOpen(false)}
          alt={fileName || 'Original Photo'}
        />
      )}
    </div>
  );
} 