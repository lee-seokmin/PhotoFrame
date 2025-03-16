"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'ko' | 'en';

type TranslationRecord = Record<string, string>;

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const translations: Record<Language, TranslationRecord> = {
  en: {
    // Header
    'site.name': 'PhotoFrame',
    'language.switch': 'KO',
    
    // Hero
    'hero.title.prefix': 'Instagram',
    'hero.title.suffix': 'Photo Metadata Frame',
    'hero.description': 'Automatically create high-quality frames with shutter speed, aperture, ISO, and other metadata without Photoshop.',
    'hero.upload.prompt': 'Drag and drop a photo or click to upload',
    
    // Features
    'features.title': 'Key Features',
    'feature1.title': 'Easy Upload',
    'feature1.description': 'Upload your photos quickly and easily with our drag and drop interface.',
    'feature2.title': 'Automatic Metadata Extraction',
    'feature2.description': 'Automatically extract shutter speed, aperture, ISO, and other data from your photos.',
    'feature3.title': 'Instagram Optimization',
    'feature3.description': 'Generate high-quality frames optimized for social media posting.',
    
    // Footer
    'footer.copyright': '이석민 all rights reserved.',
    
    // Create Frame Page
    'create.title': 'Create Photo Frame',
    'create.back': 'Back',
    'create.username.label': 'Instagram Username (Required)',
    'create.username.placeholder': 'Enter your Instagram username',
    'create.generate.button': 'Generate Frame',
    'create.download.button': 'Download',
    'create.share.button': 'Share',
    
    // Status Messages
    'status.loading': 'Loading...',
    'status.processing': 'Processing your photo...',
    'status.generating': 'Generating your frame...',
    'status.error.generic': 'An error occurred. Please try again.',
    'status.error.upload': 'Error uploading image. Please try a different file.',
    'status.error.metadata': 'Could not extract metadata from image.',
    'status.error.instagram' : 'Please enter your Instagram username.',
    
    // Photo Upload
    'photo.drag': 'Drag and drop your photo here',
    'photo.or': 'or',
    'photo.select': 'Select a file',
    'photo.fullscreen': 'View in full screen',
    
    // Preview Container
    'preview.click.to.expand': 'Click to enlarge',
    
    // Dropzone Container
    'dropzone.drop.here': 'Drop your photo here',
    'dropzone.click.or.drag': 'Click or drag and drop a photo',
    'dropzone.formats': 'PNG, JPG or HEIC formats (max 10MB)',
  },
  ko: {
    // Header
    'site.name': 'PhotoFrame',
    'language.switch': 'EN',
    
    // Hero
    'hero.title.prefix': '인스타그램용',
    'hero.title.suffix': '사진 메타데이터 프레임',
    'hero.description': '포토샵 없이도 셔터 스피드, 조리개 값, ISO 등의 메타데이터가 포함된 고품질 프레임을 자동으로 생성하세요.',
    'hero.upload.prompt': '사진을 드래그하여 놓거나 클릭하여 업로드하세요',
    
    // Features
    'features.title': '주요 기능',
    'feature1.title': '간편한 업로드',
    'feature1.description': '드래그 앤 드롭 인터페이스로 빠르고 쉽게 사진을 업로드하세요.',
    'feature2.title': '자동 메타데이터 추출',
    'feature2.description': '사진에서 셔터 스피드, 조리개 값, ISO 등의 데이터를 자동으로 추출합니다.',
    'feature3.title': '인스타그램 최적화',
    'feature3.description': 'SNS에 바로 올릴 수 있도록 최적화된 고품질 프레임을 생성합니다.',
    
    // Footer
    'footer.copyright': '이석민 all rights reserved.',
    
    // Create Frame Page
    'create.title': '사진 프레임 만들기',
    'create.back': '뒤로 가기',
    'create.username.label': '인스타그램 사용자 이름 (필수)',
    'create.username.placeholder': '인스타그램 사용자 이름을 입력하세요',
    'create.generate.button': '프레임 생성',
    'create.download.button': '다운로드',
    'create.share.button': '공유하기',
    
    // Status Messages
    'status.loading': '로딩 중...',
    'status.processing': '사진을 처리하는 중...',
    'status.generating': '프레임을 생성하는 중...',
    'status.error.generic': '오류가 발생했습니다. 다시 시도해 주세요.',
    'status.error.upload': '이미지 업로드 오류. 다른 파일을 시도해 주세요.',
    'status.error.metadata': '이미지에서 메타데이터를 추출할 수 없습니다.',
    'status.error.instagram': '인스타그램 사용자 이름을 입력해주세요.',
    
    // Photo Upload
    'photo.drag': '여기에 사진을 드래그하여 놓으세요',
    'photo.or': '또는',
    'photo.select': '파일 선택하기',
    'photo.fullscreen': '전체 화면으로 보기',
    
    // Preview Container
    'preview.click.to.expand': '확대하려면 클릭하세요',
    
    // Dropzone Container
    'dropzone.drop.here': '여기에 사진을 놓으세요',
    'dropzone.click.or.drag': '클릭하거나 사진을 끌어다 놓으세요',
    'dropzone.formats': 'PNG, JPG 또는 HEIC 형식 (최대 10MB)',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ko'); // Default to Korean
  
  const t = (key: string): string => {
    return translations[language][key] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
} 