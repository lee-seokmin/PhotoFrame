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

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setLoading(true);

    // Create preview URL
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('파일 업로드에 실패했습니다');
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
