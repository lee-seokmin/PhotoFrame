'use client';

import { useState } from 'react';
import FullScreenImageViewer from '@/components/FullScreenImageViewer';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { PreviewContainer } from '@/components/preview/PreviewContainer';
import { DropzoneContainer } from '@/components/preview/DropzoneContainer';

interface PhotoDropZoneProps {
  onFileSelect: (file: File) => void;
  preview: string | null;
}

export default function PhotoDropZone({ onFileSelect, preview }: PhotoDropZoneProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { 
    isDragging, 
    handleDragEnter, 
    handleDragLeave, 
    handleDragOver, 
    handleDrop 
  } = useDragAndDrop();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <>
      {preview ? (
        <PreviewContainer 
          preview={preview} 
          onClick={() => setIsFullScreen(true)} 
        />
      ) : (
        <DropzoneContainer
          isDragging={isDragging}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, onFileSelect)}
          onClick={() => document.getElementById('photo-input')?.click()}
        />
      )}

      <input
        id="photo-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview && (
        <FullScreenImageViewer
          isOpen={isFullScreen}
          onClose={() => setIsFullScreen(false)}
          imageUrl={preview}
          alt="Preview"
        />
      )}
    </>
  );
}
