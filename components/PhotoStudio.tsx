import React, { useState, useRef } from 'react';
import { GameStats, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { VoxelEngine } from '../services/VoxelEngine';

interface PhotoStudioProps {
  stats: GameStats;
  language: Language;
  onClose: () => void;
  engine: VoxelEngine;
}

const PhotoStudio: React.FC<PhotoStudioProps> = ({ stats, language, onClose, engine }) => {
  const t = TRANSLATIONS[language];
  const [rotation, setRotation] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleRotate = (val: number) => {
      setRotation(val);
      // Convert 0-100 range to -PI to PI
      const rad = ((val - 50) / 50) * Math.PI;
      engine.setPetRotation(rad);
  };

  const handleSnap = async () => {
      // 1. Get raw image from ThreeJS
      const rawImage = engine.takeScreenshot();

      // 2. Generate Card via Canvas API
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cardW = 400;
      const cardH = 600;
      canvas.width = cardW;
      canvas.height = cardH;

      // Draw Card Background
      const gradient = ctx.createLinearGradient(0, 0, cardW, cardH);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#f0f9ff');
      ctx.fillStyle = gradient;
      ctx.roundRect(0, 0, cardW, cardH, 20);
      ctx.fill();

      // Draw Border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 15;
      ctx.stroke();

      // Load Image
      const img = new Image();
      img.src = rawImage;
      await new Promise(r => img.onload = r);

      // Draw Pet Image (Center)
      // Crop aspect ratio 1:1 roughly from the center of the screen
      const sSize = Math.min(img.width, img.height);
      const sx = (img.width - sSize) / 2;
      const sy = (img.height - sSize) / 2;
      
      const photoSize = 340;
      const photoX = (cardW - photoSize) / 2;
      const photoY = 80;

      // Photo Frame
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(photoX - 5, photoY - 5, photoSize + 10, photoSize + 10);
      
      ctx.drawImage(img, sx, sy, sSize, sSize, photoX, photoY, photoSize, photoSize);

      // Text Config
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1e293b';

      // Name
      ctx.font = 'bold 40px "Nunito", sans-serif';
      ctx.fillText(stats.name, cardW / 2, 55);

      // Stats Area
      const statY = 480;
      ctx.font = 'bold 20px "Nunito", sans-serif';
      ctx.fillStyle = '#64748b';
      
      const speciesIcon = stats.species === 'pig' ? '🐷' : '🐔';
      ctx.fillText(`${speciesIcon} LEVEL ${stats.evolutionStage + 1}`, cardW / 2, statY);
      
      const date = new Date().toLocaleDateString();
      ctx.font = '16px "Nunito", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`VOXEL FARM • ${date}`, cardW / 2, 560);

      // Set Result
      setCapturedImage(canvas.toDataURL('image/png'));
  };

  const handleDownload = () => {
      if (!capturedImage) return;
      const link = document.createElement('a');
      link.download = `voxel-pet-${stats.name}.png`;
      link.href = capturedImage;
      link.click();
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full z-20 flex flex-col justify-between pointer-events-none">
      
      {/* Top Header */}
      <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pointer-events-auto">
         <h2 className="text-white font-black text-xl drop-shadow-md">{t.photoMode}</h2>
         <button 
            onClick={onClose}
            className="bg-white/20 hover:bg-white/40 backdrop-blur text-white p-2 rounded-full"
         >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
         </button>
      </div>

      {/* Frame Guides (Cosmetic) */}
      {!capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
             <div className="w-64 h-64 md:w-80 md:h-80 border-2 border-white/50 rounded-2xl border-dashed"></div>
          </div>
      )}

      {/* Bottom Controls */}
      {!capturedImage && (
      <div className="p-6 bg-gradient-to-t from-black/60 to-transparent pointer-events-auto flex flex-col items-center gap-4">
          
          {/* Rotation Slider */}
          <div className="w-full max-w-xs flex items-center gap-3">
              <span className="text-white text-xs font-bold">{t.rotate}</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={rotation}
                onChange={(e) => handleRotate(parseInt(e.target.value))}
                className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
              />
          </div>

          <button 
             onClick={handleSnap}
             className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
          >
             <div className="w-12 h-12 bg-red-500 rounded-full"></div>
          </button>
      </div>
      )}

      {/* Result Modal */}
      {capturedImage && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto z-30">
              <div className="flex flex-col items-center gap-4 animate-pop-in">
                  <h3 className="text-white font-bold text-lg">{t.shareTitle}</h3>
                  <img src={capturedImage} alt="Pet Card" className="w-64 md:w-80 rounded-xl shadow-2xl border-4 border-white" />
                  
                  <div className="flex gap-4">
                      <button 
                        onClick={handleDownload}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full shadow-lg flex items-center gap-2"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         {t.download}
                      </button>
                      <button 
                        onClick={() => setCapturedImage(null)}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-full shadow-lg"
                      >
                         Retry
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PhotoStudio;