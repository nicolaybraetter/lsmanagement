import { create } from 'zustand';

interface Farm {
  id: number;
  name: string;
  description?: string;
  location?: string;
  game_version: string;
  total_area: number;
  owner_id: number;
}

interface FarmState {
  currentFarm: Farm | null;
  farms: Farm[];
  setCurrentFarm: (farm: Farm | null) => void;
  setFarms: (farms: Farm[]) => void;
}

export const useFarmStore = create<FarmState>((set) => ({
  currentFarm: (() => {
    try { return JSON.parse(localStorage.getItem('currentFarm') || 'null'); } catch { return null; }
  })(),
  farms: [],
  setCurrentFarm: (farm) => {
    if (farm) localStorage.setItem('currentFarm', JSON.stringify(farm));
    else localStorage.removeItem('currentFarm');
    set({ currentFarm: farm });
  },
  setFarms: (farms) => set({ farms }),
}));
