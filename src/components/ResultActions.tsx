"use client";

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type ResultActionsProps = {
  imageUrl: string;
  fileName: string;
  downloadLabel?: string;
  shareLabel?: string;
};

// Define a type for the share data to fix the TypeScript error
type ShareData = {
  title: string;
  text: string;
  files?: File[];
};

export default function ResultActions({ 
  imageUrl, 
  fileName, 
  downloadLabel, 
  shareLabel 
}: ResultActionsProps) {
  const { t } = useLanguage();
  
  // Helper function to ensure we have a proper data URL
  const getProperDataUrl = (url: string): string => {
    return url.startsWith('data:') ? url : `data:image/jpeg;base64,${url}`;
  };
  
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = getProperDataUrl(imageUrl);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // For sharing, we need to convert the data URL to a Blob URL
  const handleShare = async () => {
    try {
      // Convert data URL to blob first
      const dataUrl = getProperDataUrl(imageUrl);
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Create a File object from the blob
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      
      // Create a temporary blob URL
      const blobUrl = URL.createObjectURL(blob);

      // Check if navigator.share and File support (modern mobile browsers)
      if (navigator.share && navigator.canShare) {
        try {
          const shareData: ShareData = {
            title: 'Photo Frame',
            text: 'Check out my photo with metadata frame!',
          };
          
          // Test if files can be shared on this device
          if (navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
          
          await navigator.share(shareData);
          console.log('Successfully shared');
        } catch (err) {
          console.warn('Error with Web Share API, falling back', err);
          // Fall back to other methods if Web Share API fails
          window.open(blobUrl, '_blank');
        }
      } 
      // Fallback for desktop or browsers without Web Share API
      else {
        // Open the image in a new tab
        window.open(blobUrl, '_blank');
      }
      
      // Clean up blob URL after a delay to ensure it's used
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      console.error('Error in share process:', err);
      alert(t('status.error.sharing') || 'Error sharing image. Please try again.');
    }
  };
  
  return (
    <div className='flex flex-col gap-3 w-full max-w-xs mx-auto'>
      <button
        onClick={handleDownload}
        className="w-full py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white 
              font-medium rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
      >
        <span className="flex items-center justify-center">
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3V16M12 16L16 11.625M12 16L8 11.625" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 21H9C6.17157 21 4.75736 21 3.87868 20.1213C3 19.2426 3 17.8284 3 15M21 15C21 17.8284 21 19.2426 20.1213 20.1213C19.8215 20.4211 19.4594 20.6186 19 20.7487" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {downloadLabel || t('create.download.button')}
        </span>
      </button>
      <button
        onClick={handleShare}
        className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer min-h-[44px] touch-manipulation"
      >
        <span className="flex items-center justify-center">
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L15 12M15 12L12.5 9.5M15 12L12.5 14.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ffffff" strokeWidth="1.5"/>
          </svg>
          {shareLabel || t('create.share.button')}
        </span>
      </button>
    </div>
  );
} 