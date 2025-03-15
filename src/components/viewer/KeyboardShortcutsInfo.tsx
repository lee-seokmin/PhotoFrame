'use client';

import React from 'react';

interface KeyboardShortcutsInfoProps {
  scale: number;
}

export const KeyboardShortcutsInfo: React.FC<KeyboardShortcutsInfoProps> = ({ scale }) => {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-sm bg-black/50 px-4 py-2 rounded-full">
      <span className="hidden sm:inline">ESC: 닫기</span>
      <span className="hidden sm:inline mx-2">|</span>
      <span>+/-: 확대/축소</span>
      <span className="mx-2">|</span>
      <span>0: 원본 크기</span>
      {scale > 1 && <span className="hidden sm:inline ml-2">| 드래그하여 이동</span>}
      <span className="hidden sm:inline mx-2">|</span>
      <span className="hidden sm:inline">더블클릭: 확대/축소</span>
    </div>
  );
}; 