'use client';

import { PhotoMetadata } from '@/types/photo';

interface MetadataDisplayProps {
  metadata: PhotoMetadata;
}

// 메타데이터 한국어 레이블 매핑
const metadataLabels: Record<string, string> = {
  Make: '제조사',
  Model: '모델',
  ExposureTime: '셔터 스피드',
  ISO: 'ISO',
  FNumber: '조리개 값',
  FocalLength: '초점 거리',
  DateTimeOriginal: '촬영 일시',
  LensModel: '렌즈 모델'
};

export default function MetadataDisplay({ metadata }: MetadataDisplayProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white font-medium">
        사진 정보
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-b-xl overflow-auto text-sm">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(metadata).map(([key, value]) => (
            value !== null && (
              <div key={key} className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400">{metadataLabels[key] || key}</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {key === 'ExposureTime' && typeof value === 'number' 
                    ? (value < 1 ? `1/${Math.round(1/value)}` : `${value}초`)
                    : key === 'FNumber' && typeof value === 'number'
                    ? `F${value}`
                    : key === 'FocalLength' && typeof value === 'number'
                    ? `${value}mm`
                    : value.toString()}
                </span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
} 