import Header from '@/components/layout/Header';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-16 w-full">
        <Hero />
      </main>

      <Features />
      
      <Footer />
    </div>
  );
}
