'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DropzoneContainerProps {
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onClick: () => void;
}

export const DropzoneContainer: React.FC<DropzoneContainerProps> = ({
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onClick
}) => {
  const { t } = useLanguage();
  
  return (
    <div
      className={`relative flex-1 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-300
                ${isDragging 
                  ? 'bg-blue-50 dark:bg-blue-900/30 scale-[0.98] shadow-inner ring-2 ring-blue-400 dark:ring-blue-500' 
                  : 'bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800/70 dark:to-blue-900/20 hover:shadow-lg'}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
    >
      <div className={`mb-3 sm:mb-4 p-3 sm:p-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 
                     dark:from-blue-800/40 dark:to-indigo-800/40 transition-all duration-300 
                     ${isDragging ? 'scale-110 shadow-md' : 'hover:scale-105'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="font-medium text-center text-slate-700 dark:text-slate-300">
        {isDragging ? t('dropzone.drop.here') : t('dropzone.click.or.drag')}
      </p>
      <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-1 sm:mt-2">
        {t('dropzone.formats')}
      </p>
    </div>
  );
}; 