
export interface TrackElement {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'obstacle' | 'sensor_point' | 'start' | 'end' | 'checkpoint';
  description: string;
}

export interface Rule {
  id: string;
  title: string;
  description: string;
  points: number;
}

export interface LogicStep {
  icon: 'start' | 'motor' | 'sensor' | 'wait' | 'stop' | 'loop';
  text: string;
}

export interface Challenge {
  name: string;
  theme: string;
  difficulty: ChallengeDifficulty;
  description: string;
  rules: Rule[];
  elements: TrackElement[];
  logicSteps: LogicStep[];
  estimatedTimeSeconds: number;
}

export enum ChallengeTheme {
  SPACE = 'Espaço',
  JUNGLE = 'Selva',
  CITY = 'Cidade Sustentável',
  OCEAN = 'Resgate no Oceano',
  CONSTRUCTION = 'Canteiro de Obras'
}

export enum ChallengeDifficulty {
  EASY = 'Iniciante',
  MEDIUM = 'Intermediário',
  HARD = 'Avançado'
}
