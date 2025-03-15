"use client";

import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-blue-50 dark:bg-slate-900 text-black dark:text-white py-8 sm:py-12 border-t border-blue-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-row justify-between items-center gap-6 sm:gap-8">
          <div>
            <div className="text-xl font-bold mb-2 text-black dark:text-white">{t('site.name')}</div>
            <p className="text-black/70 dark:text-white/70 text-sm">© {new Date().getFullYear()}. {t('footer.copyright')}</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-0 sm:space-x-8">
            <a href="https://github.com/lee-seokmin/PhotoFrame" target="_blank" rel="noopener noreferrer" className="text-black dark:text-white hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Github</a>
          </div>
        </div>
      </div>
    </footer>
  );
} 