'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusMessage from '@/components/StatusMessage';
import InstagramUsernameInput from '@/components/InstagramUsernameInput';
import { createPhotoFrame } from '@/utils/imageUtils';
import FramedImagePreview from '@/components/FramedImagePreview';
import ResultActions from '@/components/ResultActions';
import { PhotoMetadata } from '@/types/photo';
import FullScreenImageViewer from '@/components/FullScreenImageViewer';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CreateFramePage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [instagramUsername, setInstagramUsername] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [framedImage, setFramedImage] = useState<string | null>(null);
  const [generatingFrame, setGeneratingFrame] = useState(false);
  
  // Image data state
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PhotoMetadata | null>(null);
  
  // Full screen viewer state
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  
  // Load data from localStorage on component mount
  useEffect(() => {
    // Get data from localStorage
    const storedImageDataUrl = localStorage.getItem('photoFrame_imageDataUrl');
    const storedFileName = localStorage.getItem('photoFrame_fileName');
    const storedMetadata = localStorage.getItem('photoFrame_metadata');
    
    if (storedImageDataUrl && storedFileName && storedMetadata) {
      setImageDataUrl(storedImageDataUrl);
      setFileName(storedFileName);
      try {
        setMetadata(JSON.parse(storedMetadata));
      } catch (err) {
        console.error('Failed to parse metadata:', err);
        setError('메타데이터 처리 중 오류가 발생했습니다.');
        router.push('/');
      }
    } else {
      // If data is missing, redirect back to home
      router.push('/');
    }
  }, [router]);
  
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
    // Clear localStorage and go back to homepage
    localStorage.removeItem('photoFrame_imageDataUrl');
    localStorage.removeItem('photoFrame_fileName');
    localStorage.removeItem('photoFrame_metadata');
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            <div>
              {imageDataUrl && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700">
                    <Image
                      src={imageDataUrl}
                      alt="Original photo"
                      width={600}
                      height={600}
                      className="object-contain w-full aspect-square bg-slate-100 dark:bg-slate-800"
                    />
                    <button 
                      className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-black/50 rounded-md touch-manipulation"
                      onClick={() => setIsFullScreenOpen(true)}
                      aria-label="View fullscreen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                    </button>
                  </div>

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