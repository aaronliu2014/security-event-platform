import { create } from 'zustand';
import { authService, userService, notificationService } from '../services/api';

let ws = null;

function connectWebSocket() {
  const token = localStorage.getItem('authToken');
  if (!token) return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.REACT_APP_WS_URL || `${protocol}//localhost:3000`;

  try {
    ws = new WebSocket(`${host}/ws?token=${token}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'notification') {
          useNotificationStore.getState().onWsNotification(msg.data);
        }
      } catch { /* ignore malformed messages */ }
    };

    ws.onclose = () => {
      setTimeout(connectWebSocket, 5000);
    };
  } catch { /* WebSocket not available */ }
}

function disconnectWebSocket() {
  if (ws) {
    ws.close();
    ws = null;
  }
}

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('authUser') || 'null'),
  isAuthenticated: !!localStorage.getItem('authToken'),

  login: async (email, password) => {
    const response = await authService.login({ email, password });
    const { token, user } = response.data.data;
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    set({ user, isAuthenticated: true });
    connectWebSocket();
    return user;
  },

  register: async (data) => {
    const response = await authService.register(data);
    return response.data;
  },

  logout: () => {
    disconnectWebSocket();
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    set({ user: null, isAuthenticated: false });
  },

  initFromStorage: () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      connectWebSocket();
    }
  },

  loadProfile: async () => {
    try {
      const response = await userService.getProfile();
      const user = response.data.data;
      localStorage.setItem('authUser', JSON.stringify(user));
      set({ user });
    } catch {
      // token may be expired, ignore
    }
  },
}));

export const useEventStore = create((set) => ({
  events: [],
  loading: false,
  error: null,
  total: 0,

  setEvents: (events) => set({ events }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setTotal: (total) => set({ total }),
}));

export const usePreferencesStore = create((set) => ({
  preferences: null,
  loading: false,

  setPreferences: (preferences) => set({ preferences }),
  setLoading: (loading) => set({ loading }),

  loadPreferences: async () => {
    set({ loading: true });
    try {
      const response = await userService.getPreferences();
      set({ preferences: response.data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  savePreferences: async (values) => {
    const response = await userService.updatePreferences(values);
    set({ preferences: response.data.data });
    return response.data;
  },
}));

export const useNewsStore = create((set) => ({
  featuredArticles: [],
  articles: [],
  trendingTags: [],
  loading: false,
  error: null,
  total: 0,
  filters: { tag: null, source: null, page: 1 },

  setFeatured: (featuredArticles) => set({ featuredArticles }),
  setArticles: (articles, total) => set({ articles, total }),
  setTrendingTags: (trendingTags) => set({ trendingTags }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setLoading: (loading) => set({ loading }),

  loadNotifications: async (params = {}) => {
    set({ loading: true });
    try {
      const response = await notificationService.getNotifications(params);
      set({
        notifications: response.data.data,
        unreadCount: response.data.unreadCount,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    await notificationService.markRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await notificationService.markAllRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  deleteNotification: async (id) => {
    await notificationService.deleteNotification(id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  onWsNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
