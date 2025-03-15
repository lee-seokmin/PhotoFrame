import React from 'react';

type ActionButtonsProps = {
  loading: boolean;
  onUpload: () => void;
  onSelectAnother: () => void;
};

export default function ActionButtons({ 
  loading, 
  onUpload, 
  onSelectAnother
}: ActionButtonsProps) {
  
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <button
        onClick={onUpload}
        disabled={loading}
        className="flex-1 py-3 px-2 sm:px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg
                  hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                  disabled:opacity-70 disabled:cursor-not-allowed
                  text-base min-h-[48px] duration-200"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            처리 중...
          </span>
        ) : (
          '프레임 만들기'
        )}
      </button>
      <button
        onClick={onSelectAnother}
        className="flex-1 py-3 px-2 sm:px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg
                  hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 
                  text-base min-h-[48px] duration-200"
      >
        <span>다른 사진 선택하기</span>
      </button>
    </div>
  );
} 