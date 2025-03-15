'use client';

import React from 'react';

interface ImageViewerControlsProps {
  setScale: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
}

export const ImageViewerControls: React.FC<ImageViewerControlsProps> = ({ 
  setScale, 
  onClose 
}) => {
  return (
    <div className="absolute top-4 right-4 flex space-x-2">
      {/* 확대/축소 컨트롤 */}
      <button
        className="text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setScale(prev => Math.min(prev + 0.1, 3));
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      <button
        className="text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setScale(prev => Math.max(prev - 0.1, 0.5));
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      </button>
      <button
        className="text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setScale(1);
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
      {/* 닫기 버튼 */}
      <button
        className="text-white p-2 rounded-full hover:bg-white/10 transition-colors ml-2"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}; 