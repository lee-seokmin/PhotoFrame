'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ImageViewerControls } from '@/components/viewer/ImageViewerControls';
import { KeyboardShortcutsInfo } from '@/components/viewer/KeyboardShortcutsInfo';

interface FullScreenImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

export default function FullScreenImageViewer({ 
  isOpen, 
  onClose, 
  imageUrl, 
  alt 
}: FullScreenImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === '+' || e.key === '=') {
      setScale(prev => Math.min(prev + 0.1, 3));
    } else if (e.key === '-') {
      setScale(prev => Math.max(prev - 0.1, 0.5));
    } else if (e.key === '0') {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [onClose]);

  // 드래그 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  }, [isDragging, scale, startPos]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 더블 클릭 핸들러
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (scale === 1) {
      // 더블 클릭 위치를 기준으로 확대
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      // 더블 클릭한 지점이 중앙에 오도록 위치 조정
      const centerX = (window.innerWidth / 2 - offsetX);
      const centerY = (window.innerHeight / 2 - offsetY);
      
      setPosition({ x: centerX, y: centerY });
      setScale(2);
    } else {
      // 다시 원래 크기로
      setPosition({ x: 0, y: 0 });
      setScale(1);
    }
  };

  // 컴포넌트가 마운트되면 키보드 이벤트 리스너 등록
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.overflow = ''; // 이벤트 리스너 제거 시 스크롤 복원
    };
  }, [isOpen, handleKeyDown, isDragging, handleMouseMove]);

  // 컴포넌트가 열리면 스케일과 위치 초기화
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // 스케일이 1로 변경되면 위치 초기화
  useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn" 
      onClick={onClose}
      ref={containerRef}
    >
      <ImageViewerControls 
        setScale={setScale}
        onClose={onClose}
      />
      
      <KeyboardShortcutsInfo scale={scale} />
      
      <div 
        className={`max-w-[90%] max-h-[85vh] ${scale > 1 ? 'cursor-move' : 'cursor-zoom-in'} animate-scaleIn overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div 
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="origin-center"
        >
          <Image
            src={imageUrl.startsWith('data:') ? imageUrl : 
                imageUrl.startsWith('blob:') ? imageUrl : 
                `data:image/jpeg;base64,${imageUrl}`}
            alt={`Full Screen - ${alt}`}
            width={1200}
            height={800}
            className="rounded-lg shadow-2xl transition-transform duration-200"
            style={{ 
              transform: `scale(${scale})`,
              objectFit: 'contain',
              maxHeight: '85vh',
              width: 'auto'
            }}
            unoptimized={true}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
} 