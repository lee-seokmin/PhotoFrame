'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhotoDropZone from '@/components/PhotoDropZone';
import StatusMessage from '@/components/StatusMessage';
import { usePhoto } from '@/contexts/PhotoContext';
import ExifReader from 'exifreader';

// ExifReader 결과 타입은 복잡하므로 단순화
type ExifMetadata = unknown;

export default function PhotoUpload() {
  const router = useRouter();
  const { setPhotoData } = usePhoto();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  /**
   * 클라이언트 측에서 메타데이터를 보존하면서 이미지 압축
   * 1. 원본 이미지에서 EXIF 메타데이터를 추출
   * 2. 이미지 압축 (canvas 사용)
   * 3. 압축된 이미지와 추출된 메타데이터를 함께 서버로 전송
   */
  const compressImageWithMetadata = async (file: File): Promise<{ compressedFile: File, extractedMetadata: ExifMetadata | null }> => {
    return new Promise(async (resolve) => {
      try {
        // 1. 원본 이미지에서 메타데이터 추출
        const arrayBuffer = await file.arrayBuffer();
        let extractedMetadata: ExifMetadata | null = null;
        
        try {
          extractedMetadata = ExifReader.load(arrayBuffer);
        } catch (exifError) {
          console.warn('메타데이터 추출 실패:', exifError);
          // 메타데이터 추출 실패해도 계속 진행
        }
        
        // 2. 이미지 압축 (VERCEL_SIZE_LIMIT인 4.5MB 이하로)
        const VERCEL_SIZE_LIMIT = 4.5 * 1024 * 1024;
        
        // 파일이 이미 충분히 작으면 원본 사용
        if (file.size <= VERCEL_SIZE_LIMIT) {
          console.log('파일 크기가 이미 충분히 작음:', (file.size / (1024 * 1024)).toFixed(2) + 'MB');
          resolve({ compressedFile: file, extractedMetadata });
          return;
        }
        
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = () => {
          // 점진적 압축 전략
          const compressWithQuality = (initialQuality: number, maxAttempts: number) => {
            let currentQuality = initialQuality;
            let attempt = 0;
            
            const tryCompression = () => {
              // 캔버스 생성 및 이미지 그리기
              const canvas = document.createElement('canvas');
              
              // 원본 크기 유지 또는 대형 이미지 리사이징
              let width = img.width;
              let height = img.height;
              
              // 매우 큰 이미지의 경우 해상도 감소
              const MAX_DIMENSION = 3000;
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
              
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                console.warn('Canvas 컨텍스트를 가져올 수 없음, 원본 파일 사용');
                URL.revokeObjectURL(img.src);
                resolve({ compressedFile: file, extractedMetadata });
                return;
              }
              
              ctx.drawImage(img, 0, 0, width, height);
              
              // JPEG 형식으로 압축 (최상의 압축률)
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    console.warn('Blob 변환 실패, 원본 파일 사용');
                    URL.revokeObjectURL(img.src);
                    resolve({ compressedFile: file, extractedMetadata });
                    return;
                  }
                  
                  // 압축된 크기 확인
                  console.log(`압축 품질 ${currentQuality.toFixed(1)}로 압축된 크기: ${(blob.size / (1024 * 1024)).toFixed(2)}MB`);
                  
                  if (blob.size <= VERCEL_SIZE_LIMIT || currentQuality <= 0.1 || attempt >= maxAttempts) {
                    // 압축된 파일 생성
                    const compressedFile = new File(
                      [blob], 
                      file.name, 
                      { type: 'image/jpeg', lastModified: Date.now() }
                    );
                    
                    URL.revokeObjectURL(img.src);
                    resolve({ compressedFile, extractedMetadata });
                  } else {
                    // 품질 낮추고 재시도
                    attempt++;
                    currentQuality = Math.max(currentQuality - 0.1, 0.1);
                    console.log(`압축 재시도 #${attempt}, 품질: ${currentQuality.toFixed(1)}`);
                    tryCompression();
                  }
                },
                'image/jpeg',
                currentQuality
              );
            };
            
            tryCompression();
          };
          
          // 이미지 크기에 따른 초기 품질 설정
          const isLargeImage = img.width > 3000 || img.height > 3000 || file.size > 10 * 1024 * 1024;
          const initialQuality = isLargeImage ? 0.5 : 0.8;
          
          compressWithQuality(initialQuality, 8);
        };
        
        img.onerror = () => {
          console.warn('이미지 로딩 실패, 원본 파일 사용');
          URL.revokeObjectURL(img.src);
          resolve({ compressedFile: file, extractedMetadata });
        };
        
        // 타임아웃 설정
        setTimeout(() => {
          if (img.complete) return;
          console.warn('이미지 처리 타임아웃, 원본 파일 사용');
          URL.revokeObjectURL(img.src);
          resolve({ compressedFile: file, extractedMetadata });
        }, 10000); // 10초 타임아웃
        
      } catch (err) {
        console.error('이미지 압축 오류:', err);
        resolve({ compressedFile: file, extractedMetadata: null });
      }
    });
  };

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setLoading(true);

    // Create preview URL
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    try {
      // 메타데이터를 유지하면서 이미지 압축
      const { compressedFile, extractedMetadata } = await compressImageWithMetadata(selectedFile);
      
      const formData = new FormData();
      formData.append('file', compressedFile);
      // 추출된 메타데이터가 있으면 함께 전송
      if (extractedMetadata) {
        formData.append('clientMetadata', JSON.stringify(extractedMetadata));
      }

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
