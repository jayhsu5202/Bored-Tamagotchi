export type Language = 'en' | 'zh-TW' | 'ja';
export type Species = 'chicken' | 'pig';

export interface GameStats {
  hunger: number;
  hygiene: number;
  happiness: number;
  energy: number;
  weight: number; // New stat: 0-100, default 50
  isSleeping: boolean;
  isAlive: boolean;
  evolutionStage: number; // 0: Baby, 1: Evolved
  seed: string;
  name: string;
  species: Species;
}

export interface LocalizationData {
  title: string;
  hunger: string;
  hygiene: string;
  happiness: string;
  energy: string;
  weight: string; // New
  feed: string;
  clean: string;
  play: string;
  exercise: string; // New
  sleep: string;
  wake: string;
  dead: string;
  evolved: string;
  newPet: string;
  export: string;
  import: string;
  saveCode: string;
  copy: string;
  close: string;
  importError: string;
  copied: string;
  placeholder: string;
  photoMode: string;
  snap: string;
  rotate: string;
  download: string;
  shareTitle: string;
  exerciseInstruction: string; // New
}

export type Localizations = Record<Language, LocalizationData>;