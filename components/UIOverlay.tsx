import React from 'react';
import { GameStats, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface UIOverlayProps {
  stats: GameStats;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onAction: (action: 'feed' | 'clean' | 'play' | 'sleep' | 'exercise') => void;
  onNewPet: () => void;
  onExport: () => void;
  onImport: () => void;
  onPhoto: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  stats, language, onLanguageChange, onAction, 
  onNewPet, onExport, onImport, onPhoto
}) => {
  const t = TRANSLATIONS[language];

  // Icons (Simple SVGs)
  const Icons = {
    food: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />,
    clean: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3.5-6.5l-1 1.73-1.73-1 1-1.73 1.73 1z" />,
    play: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.6 13.78l-1.9-2.3c-.23-.28-.5-.5-.78-.7 0 0 .6-.2.8-.2.95 0 1.7-.75 1.7-1.7 0-.96-.74-1.7-1.7-1.7-.95 0-1.7.75-1.7 1.7 0 .38.13.73.34 1.02l-1.36 1.66c-.34.42-.9.55-1.38.32-.47-.23-.7-.76-.55-1.25.16-.54.67-.9 1.23-.9.1 0 .2.01.29.04l.43-.53c-.34-.14-.7-.22-1.07-.22-1.3 0-2.4 1-2.52 2.29-.07.72.18 1.43.69 1.95l1.9 2.31c.23.28.5.5.78.7 0 0-.6.2-.8.2-.95 0-1.7.75-1.7 1.7 0 .96.74 1.7 1.7 1.7.95 0 1.7-.75 1.7-1.7 0-.38.13-.73.34-1.02z" />,
    sleep: <path d="M13.5 2c-5.24 0-9.5 4.25-9.5 9.49 0 5.24 4.25 9.49 9.5 9.49 5.24 0 9.5-4.25 9.5-9.49 0-5.24-4.25-9.49-9.5-9.49zm0 17.49c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z M12.5 7.5h2v5.5l3.5 2.1-1 1.7-4.5-2.7z" />,
    sun: <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 9c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />,
    exercise: <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22 14.86 20.57 16.29 22 18.43 19.86 19.86 21.29 21.29 19.86 19.86 18.43 22 16.29z"/>
  };

  const StatItem = ({ label, value, color, icon, compact }: any) => {
    // Mobile Compact View
    if (compact) {
        return (
            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md">
                <span className="text-xs">{icon}</span>
                <span className="text-[10px] font-black text-white">{Math.round(value)}%</span>
            </div>
        );
    }
    // Desktop Card View
    return (
        <div className="mb-1.5 md:mb-2 w-full group">
        <div className="flex justify-between items-center mb-0.5 px-1">
            <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-black text-gray-700 uppercase tracking-wider">{icon} {label}</span>
            <span className="text-[10px] md:text-xs font-bold text-gray-500">{Math.round(value)}</span>
        </div>
        <div className="w-full bg-black/10 h-2 md:h-3 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
            className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_2px_4px_rgba(0,0,0,0.1)] relative overflow-hidden"
            style={{ width: `${Math.min(100, Math.max(5, value))}%`, backgroundColor: color }}
            >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
            </div>
        </div>
        </div>
    );
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none flex flex-col justify-between select-none">
      
      {/* Top Bar Area */}
      <div className="flex flex-col w-full p-2 gap-2 bg-gradient-to-b from-black/20 to-transparent pointer-events-auto">
          {/* Header Row */}
          <div className="flex justify-between items-start gap-2">
            
            {/* Left: Name & Level */}
            <div className="bg-white/90 backdrop-blur-xl px-3 py-1.5 md:px-4 md:py-2 rounded-2xl shadow-lg border border-white/50 flex flex-col min-w-[100px] md:min-w-[120px]">
                <h1 className="text-base md:text-lg font-black text-gray-800 leading-none truncate max-w-[120px] md:max-w-[150px]">
                    {stats.name}
                </h1>
                <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                    <span className="text-[9px] md:text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full">
                        {stats.species === 'pig' ? '🐷' : '🐔'} LVL {stats.evolutionStage + 1}
                    </span>
                    {/* Weight badge on Mobile */}
                    <span className="md:hidden text-[9px] font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        ⚖️ {Math.round(stats.weight)}
                    </span>
                </div>
            </div>

            {/* Right: Tools & Lang */}
            <div className="flex items-center gap-2">
                <div className="flex bg-white/90 backdrop-blur-xl rounded-full p-1 shadow-lg border border-white/50">
                    <select 
                        className="bg-transparent text-xs md:text-sm font-bold text-gray-700 focus:outline-none cursor-pointer px-2 py-1 rounded-full hover:bg-black/5"
                        value={language}
                        onChange={(e) => onLanguageChange(e.target.value as Language)}
                    >
                        <option value="en">EN</option>
                        <option value="zh-TW">繁中</option>
                        <option value="ja">JP</option>
                    </select>
                </div>

                <div className="flex gap-1.5 md:gap-2 bg-white/90 backdrop-blur-xl rounded-2xl p-1.5 shadow-lg border border-white/50">
                    <ToolBtn onClick={onPhoto} icon={<path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>} />
                    <ToolBtn onClick={onNewPet} icon={<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>} />
                    <ToolBtn onClick={onExport} icon={<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>} />
                    <ToolBtn onClick={onImport} icon={<path d="M5 15h4v6h6v-6h4l-7-7-7 7zM19 6H5v2h14V6z"/>} />
                </div>
            </div>
        </div>

        {/* Mobile Stats Row (Ultra Compact) */}
        <div className="flex md:hidden justify-center items-center w-full gap-2 mt-1 flex-wrap">
             <StatItem label={t.hunger} value={stats.hunger} color="#FBBF24" icon="🌽" compact />
             <StatItem label={t.hygiene} value={stats.hygiene} color="#4FC3F7" icon="✨" compact />
             <StatItem label={t.happiness} value={stats.happiness} color="#F48FB1" icon="❤️" compact />
             <StatItem label={t.energy} value={stats.energy} color="#A5D6A7" icon="⚡" compact />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between p-2 md:p-4">
        
        {/* Desktop Stats Card */}
        <div className="hidden md:block bg-white/80 backdrop-blur-lg rounded-3xl p-3 md:p-4 shadow-xl border border-white/60 w-40 md:w-52 transform transition-all hover:scale-105 pointer-events-auto mt-2 md:mt-0">
            <StatItem label={t.hunger} value={stats.hunger} color="#FBBF24" icon="🌽" />
            <StatItem label={t.hygiene} value={stats.hygiene} color="#4FC3F7" icon="✨" />
            <StatItem label={t.happiness} value={stats.happiness} color="#F48FB1" icon="❤️" />
            <StatItem label={t.energy} value={stats.energy} color="#A5D6A7" icon="⚡" />
            {/* Weight Bar */}
            <StatItem label={t.weight} value={stats.weight} color="#8E24AA" icon="⚖️" />
        </div>

        {/* Floating Instruction Text (for Exercise) */}
        <div className="pointer-events-none w-full flex justify-center pb-20 md:pb-0">
             {/* We can show hints here if needed */}
        </div>

        {/* Death Message */}
        {!stats.isAlive && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/90 text-white text-center font-bold p-6 rounded-2xl border-4 border-red-500 shadow-2xl animate-bounce z-50 pointer-events-auto">
                <div className="text-4xl mb-2">💀</div>
                <div className="text-xl uppercase tracking-widest">{t.dead}</div>
            </div>
        )}

        {/* Bottom Actions - Now with 5 buttons */}
        <div className="pointer-events-auto w-full flex flex-col items-center pb-2 md:pb-6 gap-2">
            
            {/* Hint Text when weight is high or low energy */}
            {stats.weight > 80 && (
                <div className="animate-bounce bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-purple-600 shadow-sm backdrop-blur">
                    {t.exerciseInstruction}
                </div>
            )}

            <div className="flex justify-center items-end gap-1.5 md:gap-4 w-full px-1">
                <RoundBtn 
                icon={Icons.food} 
                label={t.feed} 
                color="bg-amber-400 border-amber-500 shadow-amber-600/40"
                onClick={() => onAction('feed')}
                disabled={stats.isSleeping || !stats.isAlive}
                />
                <RoundBtn 
                icon={Icons.clean} 
                label={t.clean} 
                color="bg-cyan-400 border-cyan-500 shadow-cyan-600/40"
                onClick={() => onAction('clean')}
                disabled={stats.isSleeping || !stats.isAlive}
                />
                <RoundBtn 
                icon={Icons.play} 
                label={t.play} 
                color="bg-pink-400 border-pink-500 shadow-pink-600/40"
                onClick={() => onAction('play')}
                disabled={stats.isSleeping || !stats.isAlive}
                />
                <RoundBtn 
                icon={Icons.exercise} 
                label={t.exercise} 
                color="bg-purple-400 border-purple-500 shadow-purple-600/40"
                onClick={() => onAction('exercise')}
                disabled={stats.isSleeping || !stats.isAlive || stats.energy < 10}
                />
                <RoundBtn 
                icon={stats.isSleeping ? Icons.sun : Icons.sleep} 
                label={stats.isSleeping ? t.wake : t.sleep} 
                color="bg-indigo-500 border-indigo-600 shadow-indigo-700/40"
                onClick={() => onAction('sleep')}
                disabled={!stats.isAlive}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

const ToolBtn = ({ onClick, icon }: any) => (
    <button 
        onClick={onClick}
        className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-xl hover:bg-black/10 text-gray-600 transition-colors"
    >
        <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">{icon}</svg>
    </button>
);

const RoundBtn = ({ icon, label, color, onClick, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      ${color} ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-2 hover:brightness-110 active:scale-95'}
      w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 
      rounded-[1rem] md:rounded-[1.5rem] shadow-xl border-b-4 md:border-b-8
      flex flex-col items-center justify-center
      transition-all duration-300 group relative
      shrink-0
    `}
  >
    <svg className="w-5 h-5 md:w-8 md:h-8 text-white fill-current drop-shadow-md" viewBox="0 0 24 24">
      {icon}
    </svg>
    <span className="absolute -bottom-6 md:-bottom-8 bg-black/70 backdrop-blur px-2 md:px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-wider z-20">
      {label}
    </span>
  </button>
);

export default UIOverlay;