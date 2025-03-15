"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  
  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };
  
  return (
    <header className="w-full py-4 sm:py-6 px-4 sm:px-8 flex justify-between items-center">
      <div className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
        <Link href={'/'}>
          {t('site.name')}
        </Link>
      </div>
      
      <button 
        onClick={toggleLanguage}
        className="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
      >
        {t('language.switch')}
      </button>
    </header>
  );
} 