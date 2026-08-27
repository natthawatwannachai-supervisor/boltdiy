import { QueryClient } from '@tanstack/react-query';
import { AppError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // ไม่ต้อง retry ถ้าเป็นปัญหาเรื่องสิทธิ์หรือเครดิต — ผู้ใช้ต้องลงมือแก้เอง
        if (error instanceof AppError && !error.retryable) {
          return false;
        }

        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  wallet: () => ['wallet'] as const,
  subscription: () => ['subscription'] as const,
  videos: (filter: string, projectId?: string) => ['videos', filter, projectId ?? null] as const,
  recentVideos: () => ['videos', 'recent'] as const,
  activeVideos: () => ['videos', 'active'] as const,
  video: (id: string) => ['video', id] as const,
  scenes: (videoId: string) => ['scenes', videoId] as const,
  subtitles: (videoId: string) => ['subtitles', videoId] as const,
  quality: (videoId: string) => ['quality', videoId] as const,
  jobs: (videoId: string) => ['jobs', videoId] as const,
  projects: () => ['projects'] as const,
  project: (id: string) => ['project', id] as const,
  templates: (subject: string, search: string) => ['templates', subject, search] as const,
  notifications: () => ['notifications'] as const,
  unreadCount: () => ['notifications', 'unread'] as const,
  creditHistory: () => ['credits', 'history'] as const,
  referrals: () => ['referrals'] as const,
  assistantThreads: () => ['assistant', 'threads'] as const,
  assistantMessages: (threadId: string) => ['assistant', 'messages', threadId] as const,
  adminOverview: () => ['admin', 'overview'] as const,
  adminDaily: () => ['admin', 'daily'] as const,
};
