"use client";

import { UploadIcon, EditIcon, ShareIcon } from '@/components/icons';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Features() {
  const { t } = useLanguage();
  
  return (
    <section className="bg-slate-100 dark:bg-slate-800 py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">{t('features.title')}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <FeatureCard 
            icon={<UploadIcon className="text-black dark:text-white" />}
            title={t('feature1.title')}
            description={t('feature1.description')}
            iconBgClass="bg-blue-100 dark:bg-blue-900"
          />
          
          <FeatureCard 
            icon={<EditIcon className="text-black dark:text-white" />}
            title={t('feature2.title')} 
            description={t('feature2.description')}
            iconBgClass="bg-purple-100 dark:bg-purple-900"
          />
          
          <FeatureCard 
            icon={<ShareIcon className="text-black dark:text-white" />}
            title={t('feature3.title')} 
            description={t('feature3.description')}
            iconBgClass="bg-green-100 dark:bg-green-900"
          />
        </div>
      </div>
    </section>
  );
}

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBgClass: string;
};

function FeatureCard({ icon, title, description, iconBgClass }: FeatureCardProps) {
  return (
    <div className="bg-white dark:bg-slate-700 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className={`w-12 h-12 ${iconBgClass} rounded-full flex items-center justify-center mb-6`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
} 