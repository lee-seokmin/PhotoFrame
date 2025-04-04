'use client';

import { useState } from 'react';
import FullScreenImageViewer from '@/components/FullScreenImageViewer';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { PreviewContainer } from '@/components/preview/PreviewContainer';
import { DropzoneContainer } from '@/components/preview/DropzoneContainer';

// 최대 파일 크기 (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface PhotoDropZoneProps {
  onFileSelect: (file: File) => void;
  preview: string | null;
}

export default function PhotoDropZone({ onFileSelect, preview }: PhotoDropZoneProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const { 
    isDragging, 
    handleDragEnter, 
    handleDragLeave, 
    handleDragOver, 
    handleDrop 
  } = useDragAndDrop();

  const validateAndProcessFile = (file: File) => {
    setFileError(null);

    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      setFileError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 확인
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / (1024 * 1024)}MB까지 업로드 가능합니다.`);
      return;
    }

    // 파일이 유효하면 onFileSelect 호출
    onFileSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleCustomDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDrop(e, (file: File) => {
      validateAndProcessFile(file);
    });
  };

  return (
    <>
      {preview ? (
        <PreviewContainer 
          preview={preview} 
          onClick={() => setIsFullScreen(true)} 
        />
      ) : (
        <>
          <DropzoneContainer
            isDragging={isDragging}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleCustomDrop}
            onClick={() => document.getElementById('photo-input')?.click()}
          />
          {fileError && (
            <div className="mt-2 text-red-500 text-sm">{fileError}</div>
          )}
        </>
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
