"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { PhotoMetadata } from '@/types/photo';

interface PhotoContextType {
  imageDataUrl: string | null;
  fileName: string | null;
  metadata: PhotoMetadata | null;
  setPhotoData: (imageDataUrl: string, fileName: string, metadata: PhotoMetadata) => void;
  clearPhotoData: () => void;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PhotoMetadata | null>(null);
  
  const setPhotoData = (imageDataUrl: string, fileName: string, metadata: PhotoMetadata) => {
    setImageDataUrl(imageDataUrl);
    setFileName(fileName);
    setMetadata(metadata);
  };
  
  const clearPhotoData = () => {
    setImageDataUrl(null);
    setFileName(null);
    setMetadata(null);
  };
  
  return (
    <PhotoContext.Provider value={{ 
      imageDataUrl, 
      fileName, 
      metadata, 
      setPhotoData, 
      clearPhotoData 
    }}>
      {children}
    </PhotoContext.Provider>
  );
}

export function usePhoto() {
  const context = useContext(PhotoContext);
  
  if (context === undefined) {
    throw new Error('usePhoto must be used within a PhotoProvider');
  }
  
  return context;
} 