import React, { useEffect, useRef } from 'react';
import { VoxelEngine } from '../services/VoxelEngine';
import { GameStats } from '../types';

interface GameCanvasProps {
  onStatsUpdate: (stats: GameStats) => void;
  onEngineReady: (engine: VoxelEngine) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onStatsUpdate, onEngineReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Engine
    const engine = new VoxelEngine(containerRef.current, onStatsUpdate);
    engineRef.current = engine;
    onEngineReady(engine);

    // Cleanup
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <div 
      ref={containerRef} 
      className="absolute top-0 left-0 w-full h-full z-0 cursor-pointer"
    />
  );
};

export default GameCanvas;