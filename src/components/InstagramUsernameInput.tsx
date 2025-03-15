"use client";

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type InstagramUsernameInputProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
};

export default function InstagramUsernameInput({ 
  value, 
  onChange, 
  label, 
  placeholder 
}: InstagramUsernameInputProps) {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col">
      <label htmlFor="instagram-username" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label || t('create.username.label')}
      </label>
      <div className="relative">
        <input
          id="instagram-username"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || t('create.username.placeholder')}
          className="pl-4 px-4 py-3 text-base w-full border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 transition-all"
        />
      </div>
    </div>
  );
} 