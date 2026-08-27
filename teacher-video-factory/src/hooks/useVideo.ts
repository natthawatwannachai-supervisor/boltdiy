import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import {
  getVideo,
  listScenes,
  subscribeToScenes,
  subscribeToVideo,
} from '@/lib/api/videos';

/** โหลดวิดีโอพร้อมติดตามการเปลี่ยนแปลงแบบเรียลไทม์จากงานเบื้องหลัง */
export const useVideo = (videoId: string, options?: { realtime?: boolean }) => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.video(videoId), queryFn: () => getVideo(videoId) });
  const realtime = options?.realtime ?? true;

  useEffect(() => {
    if (!realtime || !videoId) {
      return;
    }

    return subscribeToVideo(videoId, (video) => {
      queryClient.setQueryData(queryKeys.video(videoId), video);
    });
  }, [queryClient, realtime, videoId]);

  return query;
};

export const useScenes = (videoId: string, options?: { realtime?: boolean }) => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.scenes(videoId), queryFn: () => listScenes(videoId) });
  const realtime = options?.realtime ?? true;

  useEffect(() => {
    if (!realtime || !videoId) {
      return;
    }

    return subscribeToScenes(videoId, () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.scenes(videoId) });
    });
  }, [queryClient, realtime, videoId]);

  return query;
};
