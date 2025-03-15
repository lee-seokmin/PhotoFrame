'use client';

import { useState } from 'react';
import Image from 'next/image';
import FullScreenImageViewer from '@/components/FullScreenImageViewer';
import { useLanguage } from '@/contexts/LanguageContext';

interface FramedImagePreviewProps {
  imageUrl: string;
  alt?: string;
}

export default function FramedImagePreview({ imageUrl, alt = 'Framed Photo' }: FramedImagePreviewProps) {
  const { t } = useLanguage();
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  return (
    <>
      <div className="relative flex flex-col items-center justify-center w-full max-w-xs mx-auto">
        <div 
          className="w-full rounded-xl overflow-hidden cursor-pointer shadow-md"
          onClick={() => setIsFullScreen(true)}
        >
          <Image 
            src={imageUrl.startsWith('data:') ? imageUrl : `data:image/jpeg;base64,${imageUrl}`}
            alt={alt}
            width={500}
            height={500}
            className="w-full h-auto object-contain"
            unoptimized={true}
          />
        </div>
        <div className="text-xs text-slate-500 mt-1 text-center">
          {t('photo.fullscreen')}
        </div>
      </div>

      <FullScreenImageViewer 
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        imageUrl={imageUrl}
        alt={alt}
      />
    </>
  );
}