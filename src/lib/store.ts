'use client';

import { create } from 'zustand';

interface MissionControlState {
  selectedProvider: string;
  setSelectedProvider: (id: string) => void;
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
}

export const useMissionControlStore = create<MissionControlState>((set) => ({
  selectedProvider: 'openai',
  setSelectedProvider: (id) => set({ selectedProvider: id }),
  selectedModelId: 'gpt-5.1-codex',
  setSelectedModelId: (id) => set({ selectedModelId: id })
}));
