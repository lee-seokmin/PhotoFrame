'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhotoDropZone from '@/components/PhotoDropZone';
import StatusMessage from '@/components/StatusMessage';
import { usePhoto } from '@/contexts/PhotoContext';

export default function PhotoUpload() {
  const router = useRouter();
  const { setPhotoData } = usePhoto();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  /**
   * Compresses an image file while maintaining its original resolution
   * @param file Original image file
   * @param quality Compression quality (0-1)
   * @returns Promise resolving to a compressed File object
   */
  const compressImage = (file: File, quality = 0.7): Promise<File> => {
    return new Promise((resolve) => {
      // First check if the file is too large or in an unsuitable format
      if (file.size > 30 * 1024 * 1024) {
        console.warn('File very large, using original file as fallback');
        resolve(file); // Use original file as fallback for very large files
        return;
      }
      
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          // Create canvas with the same dimensions as the image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.warn('Canvas context not available, using original file');
            URL.revokeObjectURL(img.src);
            resolve(file); // Fallback to original file
            return;
          }
          
          ctx.drawImage(img, 0, 0, img.width, img.height);
          
          // Convert to blob with reduced quality
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.warn('Blob conversion failed, using original file');
                URL.revokeObjectURL(img.src);
                resolve(file); // Fallback to original file
                return;
              }
              
              // Verify the blob is valid
              if (blob.size === 0) {
                console.warn('Generated blob has zero size, using original file');
                URL.revokeObjectURL(img.src);
                resolve(file); // Fallback to original file
                return;
              }
              
              // Create a new File from the blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              // Clean up object URL
              URL.revokeObjectURL(img.src);
              
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          console.error('Error during image compression:', err);
          URL.revokeObjectURL(img.src);
          resolve(file); // Fallback to original file in case of any error
        }
      };
      
      img.onerror = () => {
        console.warn('Image loading failed, using original file');
        URL.revokeObjectURL(img.src);
        resolve(file); // Fallback to original file
      };
      
      // Add timeout in case the image loading hangs
      setTimeout(() => {
        console.warn('Image processing timed out, using original file');
        URL.revokeObjectURL(img.src);
        resolve(file); // Fallback to original file after timeout
      }, 10000); // 10 second timeout
    });
  };

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setLoading(true);

    // Create preview URL
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    try {
      // Compress the image before uploading
      const compressedFile = await compressImage(selectedFile);
      
      const formData = new FormData();
      formData.append('file', compressedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // 상태 코드에 따른 에러 메시지 설정
        if (response.status === 413) {
          throw new Error('이미지 크기가 너무 큽니다. 서버에서 압축 중이지만 처리에 실패했습니다.');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `파일 업로드에 실패했습니다 (${response.status})`);
        }
      }

      const data = await response.json();
      
      // Store image data in context instead of localStorage
      setPhotoData(
        data.imageData.dataUrl,
        selectedFile.name,
        data.filteredMetadata
      );
      
      // Redirect to the create-frame page
      router.push('/create-frame');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 p-2">
      <PhotoDropZone
        onFileSelect={handleFileSelect}
        preview={preview}
      />

      {loading && (
        <div className="mb-2">
          <StatusMessage type="loading" message="사진 분석 중..." />
        </div>
      )}

      {error && (
        <div>
          <StatusMessage type="error" message={error} />
        </div>
      )}
    </div>
  );
}
