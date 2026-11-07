import { useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { authAxios } from '../axiosInstance';
import useToasterNotification from '../hooks/useToasterNotification';

interface UseDesignationDataParams {
  searchTerm: string;
  selectedStatuses: string[];
  limit?: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export const useDesignationData = ({ 
  searchTerm, 
  selectedStatuses, 
  limit = 20, 
  scrollContainerRef 
}: UseDesignationDataParams) => {
  const queryClient = useQueryClient();
  const { showErrorNotification } = useToasterNotification();
  const isFetchingRef = useRef(false);
  const initialCheckDoneRef = useRef<string>('');

  // Fetch data with TanStack Query - Infinite Query
  const {
    data,
    isLoading,
    error,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['designations', searchTerm, [...selectedStatuses].sort()],
    queryFn: async ({ pageParam = 0, signal }) => {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', (pageParam * limit).toString());
      params.append('is_deleted', 'false');

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      selectedStatuses.forEach((status) => {
        params.append('status', status);
      });

      const response = await authAxios.get(`/users/designations?${params.toString()}`, {
        signal,
      });

      return { ...response.data, page: pageParam };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const totalCount = lastPage?.count ?? 0;
      const loadedItems = pages.reduce(
        (acc: number, page: any) => acc + (page?.results?.length ?? 0),
        0,
      );
      return loadedItems < totalCount ? pages.length : undefined;
    },
    enabled: selectedStatuses.length > 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Handle scroll to load more data
  useEffect(() => {
    if (!scrollContainerRef) return;
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || isLoading) return;

    // Create a unique key for current filter/search state
    const currentStateKey = JSON.stringify({ searchTerm, statuses: selectedStatuses.sort() });

    // Reset refs when filter/search changes
    if (initialCheckDoneRef.current && initialCheckDoneRef.current !== currentStateKey) {
      initialCheckDoneRef.current = '';
      isFetchingRef.current = false;
      scrollContainer.scrollTo({ top: 0 });
    }

    const checkAndFetch = () => {
      // Prevent multiple simultaneous calls
      if (isFetchingRef.current || isFetchingNextPage || !hasNextPage) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;
      
      // Check if content doesn't fill viewport or if scrolled near bottom
      const needsMoreData = scrollHeight <= clientHeight || scrollBottom < 100;
      
      if (needsMoreData) {
        isFetchingRef.current = true;
        fetchNextPage().finally(() => {
          setTimeout(() => {
            isFetchingRef.current = false;
          }, 300);
        });
      }
    };

    // Throttle scroll handler using requestAnimationFrame
    let rafId: number | null = null;
    const throttledHandleScroll = () => {
      if (rafId !== null) return;
      
      rafId = window.requestAnimationFrame(() => {
        checkAndFetch();
        rafId = null;
      });
    };

    scrollContainer.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    // Only run initial check once per filter/search change
    const allData = data?.pages.flatMap(page => page?.results || []) || [];
    const shouldRunInitialCheck = initialCheckDoneRef.current !== currentStateKey && allData.length > 0;
    
    let timeoutId: NodeJS.Timeout | undefined;
    if (shouldRunInitialCheck) {
      initialCheckDoneRef.current = currentStateKey;
      timeoutId = setTimeout(() => {
        checkAndFetch();
      }, 300);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      scrollContainer.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [scrollContainerRef, hasNextPage, isFetchingNextPage, fetchNextPage, isLoading, data, selectedStatuses, searchTerm]);

  // Handle error notifications
  useEffect(() => {
    if (isError && error) {
      showErrorNotification(error);
    }
  }, [error, isError, showErrorNotification]);

  // Refresh function for modals
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['designations'] });
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({ top: 0 });
    }
  };

  // Flatten all pages data
  const allData = data?.pages.flatMap((page: any) => page?.results ?? []) || [];

  return {
    data: allData,
    isLoading,
    error,
    isError,
    isFetchingNextPage,
    refreshData,
  };
};
