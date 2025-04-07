// Define common types for the application

// Type for a single lap timing record
export interface Lap {
  number: number;
  time: number;
  splitTime: number;
}

// Type for a time record
export interface TimeRecord {
  id: string;
  time: number;
  date: string | Date;
  stroke: string;
  distance: string;
  laps: Lap[];
}

// Type for a swimmer
export interface Swimmer {
  id: string;
  name: string;
  times: TimeRecord[];
  bestLapTimes: Record<number, number>; // Lap number -> best split time
}

// Type for club settings
export interface ClubSettings {
  name: string;
  logoUrl: string | null;
}

// Type for a user
export interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt?: string | Date;
}

// Constants
export const STROKE_TYPES = ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual Medley"];
export const DISTANCES = ["25m", "50m", "100m", "200m", "400m", "800m", "1500m"]; 