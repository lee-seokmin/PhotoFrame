import { useState, useEffect, useCallback } from 'react';
import { PhotoMetadata, ImageData } from '@/types/photo';
import { createPhotoFrame, downloadImage } from '@/utils/imageUtils';

/**
 * 파일 업로드 처리 로직
 */
function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PhotoMetadata | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);

  // 파일 선택 처리
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setMetadata(null);
    setError(null);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  };

  // 파일 업로드 API 요청 처리
  const uploadFile = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setMetadata(data.filteredMetadata);
      setImageData(data.imageData);
      
      return { metadata: data.filteredMetadata, imageData: data.imageData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    file,
    preview,
    loading,
    error,
    metadata,
    imageData,
    setFile,
    setError,
    setPreview,
    setMetadata,
    setImageData,
    handleFileSelect,
    uploadFile
  };
}

/**
 * 프레임 생성 로직
 */
function useFrameGeneration() {
  const [framedImage, setFramedImage] = useState<string | null>(null);
  const [generatingFrame, setGeneratingFrame] = useState(false);

  // 이미지 프레임 생성
  const generatePhotoFrame = useCallback(async (
    imageData: ImageData,
    metadata: PhotoMetadata,
    fileName: string,
    instagramUsername: string
  ) => {
    setGeneratingFrame(true);

    try {
      const framedImageUrl = await createPhotoFrame(
        imageData.dataUrl,
        metadata,
        fileName,
        instagramUsername
      );
      setFramedImage(framedImageUrl);
      return framedImageUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create photo frame';
      throw new Error(errorMessage);
    } finally {
      setGeneratingFrame(false);
    }
  }, []);

  return {
    framedImage,
    generatingFrame,
    setFramedImage,
    generatePhotoFrame
  };
}

/**
 * 메인 포토 프레임 훅
 */
export function usePhotoFrame() {
  const {
    file,
    preview,
    loading,
    error,
    metadata,
    imageData,
    setFile,
    setError,
    setPreview,
    setMetadata,
    setImageData,
    handleFileSelect,
    uploadFile
  } = useFileUpload();

  const {
    framedImage,
    generatingFrame,
    setFramedImage,
    generatePhotoFrame
  } = useFrameGeneration();

  const [instagramUsername, setInstagramUsername] = useState<string>('');

  // 업로드 버튼 클릭 처리
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a photo first');
      return;
    }
    
    if (!instagramUsername.trim()) {
      setError('인스타그램 사용자 이름을 입력해주세요');
      return;
    }
    
    setFramedImage(null);

    try {
      await uploadFile(file);
    } catch {
      // 에러는 uploadFile 내부에서 처리됨
    }
  };
  
  // 다운로드 버튼 클릭 처리
  const handleDownload = (e: React.MouseEvent, framedImage: string, file: File) => {
    e.stopPropagation(); // Prevent triggering handleReset
    downloadImage(framedImage, file.name);
  };

  // 초기화 버튼 클릭 처리
  const handleReset = () => {
    setFile(null);
    setMetadata(null);
    setPreview(null);
    setImageData(null);
    setFramedImage(null);
    setInstagramUsername('');
  };

  // 메타데이터와 이미지 데이터가 있으면 프레임 생성
  useEffect(() => {
    if (metadata && imageData && file) {
      generatePhotoFrame(imageData, metadata, file.name, instagramUsername)
        .catch(err => setError(err.message));
    }
  }, [metadata, imageData, file, instagramUsername, generatePhotoFrame, setError]);

  return {
    file,
    metadata,
    loading,
    error,
    preview,
    imageData,
    framedImage,
    generatingFrame,
    instagramUsername,
    setInstagramUsername,
    handleFileSelect,
    handleUpload,
    handleDownload,
    handleReset
  };
} 