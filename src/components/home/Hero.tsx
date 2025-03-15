"use client";

import PhotoUpload from '@/components/PhotoUpload';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-12">
      <div className="md:w-1/2 space-y-4 sm:space-y-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">{t('hero.title.prefix')}</span> {t('hero.title.suffix')}
        </h1>
        <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-md">
          {t('hero.description')}
        </p>
      </div>
      
      <div className="w-full md:w-1/2 bg-white dark:bg-slate-800 p-4 sm:p-8 rounded-2xl shadow-xl overflow-y-auto max-h-[80vh]">
        <div className="aspect-square relative overflow-hidden rounded-xl border-4 border-white dark:border-slate-700 shadow-inner flex">
          <PhotoUpload />
        </div>
        <div className="mt-4 sm:mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          {t('hero.upload.prompt')}
        </div>
      </div>
    </div>
  );
} 