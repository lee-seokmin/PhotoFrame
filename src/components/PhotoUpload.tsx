'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhotoDropZone from '@/components/PhotoDropZone';
import StatusMessage from '@/components/StatusMessage';
import { usePhoto } from '@/contexts/PhotoContext';
import ExifReader from 'exifreader';
import { isMobileDevice } from '@/utils/deviceUtils';
import imageCompression from 'browser-image-compression';

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
   * 2. browser-image-compression을 사용하여 이미지 압축
   * 3. 압축된 이미지와 추출된 메타데이터를 함께 서버로 전송
   */
  const compressImageWithMetadata = async (file: File): Promise<{ compressedFile: File, extractedMetadata: ExifMetadata | null }> => {
    try {
      // 1. 원본 이미지에서 메타데이터 추출 (모든 환경에서 먼저 수행)
      const arrayBuffer = await file.arrayBuffer();
      let extractedMetadata: ExifMetadata | null = null;
      
      try {
        extractedMetadata = ExifReader.load(arrayBuffer);
        console.log('메타데이터 추출 성공:', extractedMetadata);
      } catch (exifError) {
        console.warn('메타데이터 추출 실패:', exifError);
        // 메타데이터 추출 실패해도 계속 진행
      }
      
      // 2. 이미지 압축 (VERCEL_SIZE_LIMIT인 4.5MB 이하로)
      const VERCEL_SIZE_LIMIT = 4.5 * 1024 * 1024;
      
      // 파일이 이미 충분히 작으면 원본 사용
      if (file.size <= VERCEL_SIZE_LIMIT) {
        console.log('파일 크기가 이미 충분히 작음:', (file.size / (1024 * 1024)).toFixed(2) + 'MB');
        return { compressedFile: file, extractedMetadata };
      }
      
      // 모바일 디바이스 감지
      const isMobile = isMobileDevice();
      console.log('모바일 디바이스 여부:', isMobile);
      
      // browser-image-compression 옵션 설정
      const options = {
        maxSizeMB: 4.0, // 4MB로 제한 (Vercel 제한보다 여유있게)
        maxWidthOrHeight: isMobile ? 2500 : 3000, // 모바일에서는 더 작은 해상도
        useWebWorker: true, // 웹 워커 사용으로 UI 블로킹 방지
        fileType: 'image/jpeg', // JPEG로 변환하여 최적의 압축률
        initialQuality: isMobile ? 0.6 : 0.8, // 모바일에서는 더 낮은 초기 품질
        alwaysKeepResolution: false, // 필요시 해상도 조정 허용
        preserveExif: false, // EXIF 메타데이터는 별도로 추출했으므로 제거
      };
      
      console.log('browser-image-compression으로 압축 시작...');
      const compressedFile = await imageCompression(file, options);
      
      console.log(`압축 완료: ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB (원본: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      
      return { compressedFile, extractedMetadata };
      
    } catch (err) {
      console.error('이미지 압축 오류:', err);
      // 압축 실패시 원본 파일과 메타데이터 반환
      return { compressedFile: file, extractedMetadata: null };
    }
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

      // 로그 추가 - 디버깅 용
      console.log('압축된 파일 크기:', (compressedFile.size / (1024 * 1024)).toFixed(2) + 'MB');
      console.log('메타데이터 포함 여부:', extractedMetadata ? 'O' : 'X');

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
