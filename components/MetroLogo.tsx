import React from 'react';

export const MetroLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex items-center justify-center h-14 bg-[#004D95] border-2 border-white select-none px-6 ${className}`}>
      {/* Text Section Only */}
      <span className="text-white text-3xl font-black tracking-tight leading-none" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
        METRÔ
      </span>
    </div>
  );
};