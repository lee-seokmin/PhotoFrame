'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface PreviewContainerProps {
  preview: string;
  onClick: () => void;
}

export const PreviewContainer: React.FC<PreviewContainerProps> = ({ preview, onClick }) => {
  const { t } = useLanguage();
  
  return (
    <div 
      className="relative flex-1 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-300 overflow-hidden" 
      onClick={onClick}
    >
      <div className="relative w-full h-full group">
        <Image
          src={preview}
          alt="Preview"
          fill
          style={{ objectFit: 'cover' }}
          className="rounded-xl transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
          <span className="text-white font-medium px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full">
            {t('preview.click.to.expand')}
          </span>
        </div>
      </div>
    </div>
  );
}; 