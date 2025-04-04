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
      // Check for Vercel API size limit (4.5MB)
      const VERCEL_SIZE_LIMIT = 4.5 * 1024 * 1024;
      
      // First check if the file is too large or in an unsuitable format
      if (file.size > 50 * 1024 * 1024) {
        console.warn('File very large, attempting aggressive compression');
        // Continue with compression for large files instead of just returning
      }
      
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          // Progressive compression strategy
          const attemptCompression = (currentQuality: number, maxAttempts: number): void => {
            // Create canvas with the same dimensions as the image
            const canvas = document.createElement('canvas');
            
            // Calculate dimensions
            let width = img.width;
            let height = img.height;
            
            // If the image is extremely large, scale it down while maintaining aspect ratio
            const MAX_DIMENSION = 3000; // Reasonable maximum dimension
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
              if (width > height) {
                height = Math.round((height / width) * MAX_DIMENSION);
                width = MAX_DIMENSION;
              } else {
                width = Math.round((width / height) * MAX_DIMENSION);
                height = MAX_DIMENSION;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw image on canvas with potentially reduced dimensions
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              console.warn('Canvas context not available, using original file');
              URL.revokeObjectURL(img.src);
              resolve(file); // Fallback to original file
              return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to blob with current quality setting
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
                
                // Check if compressed size is below Vercel limit
                if (blob.size <= VERCEL_SIZE_LIMIT || currentQuality <= 0.1 || maxAttempts <= 0) {
                  console.log(`Compression successful: ${(blob.size / (1024 * 1024)).toFixed(2)}MB with quality ${currentQuality}`);
                  
                  // Create a new File from the blob
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  
                  // Clean up object URL
                  URL.revokeObjectURL(img.src);
                  
                  resolve(compressedFile);
                } else {
                  // Try again with lower quality
                  console.log(`Compression attempt: ${(blob.size / (1024 * 1024)).toFixed(2)}MB with quality ${currentQuality}, reducing quality...`);
                  const newQuality = Math.max(currentQuality - 0.1, 0.1);
                  attemptCompression(newQuality, maxAttempts - 1);
                }
              },
              'image/jpeg',
              currentQuality
            );
          };
          
          // Start compression with initial quality
          // Use more aggressive starting point for very large files
          const initialQuality = file.size > 10 * 1024 * 1024 ? 0.5 : quality;
          attemptCompression(initialQuality, 10);
          
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
