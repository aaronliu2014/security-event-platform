import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

export const useEventStore = create((set) => ({
  events: [],
  loading: false,
  error: null,
  
  setEvents: (events) => set({ events }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export const usePreferencesStore = create((set) => ({
  preferences: null,
  
  setPreferences: (preferences) => set({ preferences }),
  updateFrequency: (frequency) => set((state) => ({
    preferences: { ...state.preferences, collection_frequency: frequency }
  })),
}));
