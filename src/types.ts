// src/types.ts

export type EmotionalState = 'Calm' | 'Anxious' | 'Overwhelmed' | 'Focused' | 'Energized' | 'Tired' | 'Happy' | 'Sad';

export type LocationType = 'Home' | 'Work' | 'Outdoors' | 'Transit' | 'Other';

export interface Task {
  id: string;
  text: string;
  priority: number;
  completed: boolean;
  createdAt: Date;
}

export interface RoutineTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface MoodEntry {
  state: EmotionalState;
  timestamp: Date;
  intensity: number;
}

export interface BreathingPreset {
  id: string;
  name: string;
  inhale: number;
  hold: number;
  exhale: number;
  description: string;
}

export interface AppData {
  moodHistory: MoodEntry[];
  tasks: Task[];
  routineTasks: RoutineTask[];
  reflections: string[];
  lastSaved: Date | null;
}