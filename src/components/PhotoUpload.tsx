'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhotoDropZone from '@/components/PhotoDropZone';
import StatusMessage from '@/components/StatusMessage';
import { usePhoto } from '@/contexts/PhotoContext';
import ExifReader from 'exifreader';
import { isMobileDevice } from '@/utils/deviceUtils';
import imageCompression from 'browser-image-compression';

// Exif 메타데이터 타입 정의
type ExifValue = {
  description?: string;
  value?: string | number;
  [key: string]: unknown;
};

interface ExifMetadata {
  Make?: ExifValue;
  Model?: ExifValue;
  ExposureTime?: ExifValue;
  ISO?: ExifValue;
  FNumber?: ExifValue;
  FocalLength?: ExifValue;
  DateTimeOriginal?: ExifValue;
  LensModel?: ExifValue;
  [key: string]: ExifValue | undefined; // 다른 속성들을 위한 인덱스 시그니처
}

// 필수 메타데이터 타입
type EssentialMetadata = {
  Make?: string;
  Model?: string;
  ExposureTime?: string;
  ISO?: number;
  FNumber?: string;
  FocalLength?: string;
  DateTimeOriginal?: string;
  LensModel?: string;
};

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
  const compressImageWithMetadata = async (file: File): Promise<{ compressedFile: File, extractedMetadata: EssentialMetadata | null }> => {
    const VERCEL_SIZE_LIMIT = 4.0 * 1024 * 1024; // 4MB 타겟 (0.5MB 여유)
    const isMobile = isMobileDevice();
    console.log('모바일 디바이스 여부:', isMobile);
    
    try {
      // 1. 원본 이미지에서 메타데이터 추출
      const arrayBuffer = await file.arrayBuffer();
      let extractedMetadata: EssentialMetadata | null = null;
      
      try {
        const allMetadata = ExifReader.load(arrayBuffer) as unknown as ExifMetadata;
        // 필수 메타데이터만 추출 (크기 최소화)
        const essentialMetadata: EssentialMetadata = {};
        
        const getStringValue = (data: ExifValue | undefined): string | undefined => 
          typeof data?.description === 'string' ? data.description : undefined;
          
        const getNumberValue = (data: ExifValue | undefined): number | undefined => {
          if (typeof data?.value === 'number') return data.value;
          if (typeof data?.description === 'string') return parseFloat(data.description);
          return undefined;
        };
        
        const make = getStringValue(allMetadata.Make);
        const model = getStringValue(allMetadata.Model);
        const exposureTime = getStringValue(allMetadata.ExposureTime);
        const iso = getNumberValue(allMetadata.ISO);
        const fNumber = getStringValue(allMetadata.FNumber);
        const focalLength = getStringValue(allMetadata.FocalLength);
        const dateTime = getStringValue(allMetadata.DateTimeOriginal);
        const lensModel = getStringValue(allMetadata.LensModel);
        
        if (make) essentialMetadata.Make = make;
        if (model) essentialMetadata.Model = model;
        if (exposureTime) essentialMetadata.ExposureTime = exposureTime;
        if (iso !== undefined) essentialMetadata.ISO = iso;
        if (fNumber) essentialMetadata.FNumber = fNumber;
        if (focalLength) essentialMetadata.FocalLength = focalLength;
        if (dateTime) essentialMetadata.DateTimeOriginal = dateTime;
        if (lensModel) essentialMetadata.LensModel = lensModel;
        
        // 메타데이터가 비어있지 않은 경우에만 할당
        if (Object.keys(essentialMetadata).length > 0) {
          extractedMetadata = essentialMetadata;
        }
        
        console.log('필수 메타데이터 추출 완료', extractedMetadata);
      } catch (exifError) {
        console.warn('메타데이터 추출 실패:', exifError);
      }
      
      // 2. 이미지 압축 (더 공격적인 설정)
      const compressWithOptions = async (file: File, targetSizeMB: number, quality: number, maxDimension: number): Promise<File> => {
        console.log(`압축 시도: 타겟 ${targetSizeMB}MB, 품질 ${quality}, 최대 크기 ${maxDimension}px`);
        
        const options = {
          maxSizeMB: targetSizeMB,
          maxWidthOrHeight: maxDimension,
          useWebWorker: true,
          fileType: 'image/jpeg',
          initialQuality: quality,
          alwaysKeepResolution: false,
          preserveExif: false,
          maxIteration: 20,
        };
        
        try {
          const result = await imageCompression(file, options);
          console.log(`압축 완료: ${(result.size / (1024 * 1024)).toFixed(2)}MB (${((1 - result.size / file.size) * 100).toFixed(1)}% 감소)`);
          return result;
        } catch (error) {
          console.error('압축 실패:', error);
          throw error;
        }
      };
      
      // 파일이 이미 충분히 작으면 원본 사용
      if (file.size <= VERCEL_SIZE_LIMIT) {
        console.log('파일 크기가 이미 충분히 작음:', (file.size / (1024 * 1024)).toFixed(2) + 'MB');
        return { compressedFile: file, extractedMetadata };
      }
      
      // 압축 단계별로 시도 (점진적으로 더 공격적인 설정 적용)
      interface CompressionStage {
        size: number;
        quality: number;
        dimension: number;
      }
      
      const compressionStages: CompressionStage[] = [
        { size: 3.0, quality: 0.6, dimension: isMobile ? 1600 : 2000 }, // 1차 시도
        { size: 2.5, quality: 0.5, dimension: isMobile ? 1400 : 1800 }, // 2차 시도
        { size: 2.0, quality: 0.4, dimension: isMobile ? 1200 : 1600 }, // 3차 시도
        { size: 1.5, quality: 0.3, dimension: isMobile ? 1000 : 1200 }, // 4차 시도 (최후의 수단)
      ];
      
      let lastError: Error | null = null;
      let compressedFile = file;
      
      for (const stage of compressionStages) {
        try {
          compressedFile = await compressWithOptions(
            compressedFile,
            stage.size,
            stage.quality,
            stage.dimension
          );
          
          // 압축 후 크기 확인
          if (compressedFile.size <= VERCEL_SIZE_LIMIT) {
            console.log(`✅ 압축 성공: ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`);
            return { compressedFile, extractedMetadata };
          }
          
          console.warn(`⚠️ 압축 후에도 크기 초과: ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB > ${(VERCEL_SIZE_LIMIT / (1024 * 1024)).toFixed(1)}MB`);
        } catch (error) {
          console.warn(`압축 단계 실패 (${stage.size}MB/${stage.quality}/${stage.dimension}px):`, error);
          lastError = error as Error;
        }
      }
      
      // 모든 단계 실패 시 에러
      throw lastError || new Error('이미지 압축에 실패했습니다. 더 작은 이미지를 시도해주세요.');
      
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
      // 추출된 메타데이터가 있으면 함께 전송 (크기 제한 적용)
      if (extractedMetadata) {
        // 항상 필수 메타데이터만 추출 (ExifReader는 너무 많은 데이터를 포함)
        console.log('필수 메타데이터만 추출합니다.');
        const metadataObj = extractedMetadata as Record<string, unknown>;
        
        // ExifReader의 description 속성에서 값 추출
        const extractValue = (key: string) => {
          const obj = metadataObj[key] as Record<string, unknown>;
          if (obj && typeof obj === 'object' && 'description' in obj) {
            return obj.description;
          }
          return obj;
        };
        
        const essentialMetadata = {
          Make: extractValue('Make'),
          Model: extractValue('Model'),
          ExposureTime: extractValue('ExposureTime'),
          ISO: extractValue('ISO'),
          FNumber: extractValue('FNumber'),
          FocalLength: extractValue('FocalLength'),
          DateTimeOriginal: extractValue('DateTimeOriginal'),
          LensModel: extractValue('LensModel')
        };
        
        const essentialMetadataString = JSON.stringify(essentialMetadata);
        console.log('필수 메타데이터 크기:', (essentialMetadataString.length / 1024).toFixed(2) + 'KB');
        formData.append('clientMetadata', essentialMetadataString);
      }

      // 로그 추가 - 디버깅 용
      console.log('압축된 파일 크기:', (compressedFile.size / (1024 * 1024)).toFixed(2) + 'MB');
      console.log('메타데이터 포함 여부:', extractedMetadata ? 'O' : 'X');
      
      // 압축된 파일 크기와 메타데이터 크기 확인
      const VERCEL_LIMIT = 4.0 * 1024 * 1024; // 4MB 타겟 (0.5MB 여유)
      const metadataSize = extractedMetadata ? new TextEncoder().encode(JSON.stringify(extractedMetadata)).length : 0;
      const totalSize = compressedFile.size + metadataSize;
      
      console.log('파일 크기:', (compressedFile.size / (1024 * 1024)).toFixed(2) + 'MB');
      console.log('메타데이터 크기:', (metadataSize / 1024).toFixed(2) + 'KB');
      console.log('전체 크기:', (totalSize / (1024 * 1024)).toFixed(2) + 'MB');
      
      if (totalSize > VERCEL_LIMIT) {
        const overSizeMB = (totalSize - VERCEL_LIMIT) / (1024 * 1024);
        console.error(`❌ 전체 크기가 Vercel 제한을 초과합니다: ${(totalSize / (1024 * 1024)).toFixed(2)}MB > ${(VERCEL_LIMIT / (1024 * 1024)).toFixed(1)}MB (${overSizeMB.toFixed(2)}MB 초과)`);
        throw new Error(`이미지가 너무 큽니다. 더 작은 이미지를 선택하거나 해상도를 낮춰주세요. (현재: ${(totalSize / (1024 * 1024)).toFixed(1)}MB / 제한: ${(VERCEL_LIMIT / (1024 * 1024)).toFixed(1)}MB)`);
      } else {
        console.log('✅ Vercel 제한 내에서 업로드 가능합니다.');
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // 상태 코드에 따른 에러 메시지 설정
        if (response.status === 413) {
          throw new Error('이미지 크기가 너무 큽니다. 더 작은 이미지를 시도해주세요.');
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '잘못된 요청입니다. 파일을 다시 확인해주세요.');
        } else if (response.status >= 500) {
          throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
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
