import { useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAxios } from '../axiosInstance';
import useToasterNotification from '../hooks/useToasterNotification';

interface UseRoleDataParams {
  searchTerm: string;
  selectedStatuses: string[];
  limit?: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export const useRoleData = ({ 
  searchTerm, 
  selectedStatuses, 
  limit = 10, 
  scrollContainerRef 
}: UseRoleDataParams) => {
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
    queryKey: ['roles', searchTerm, [...selectedStatuses].sort()],
    queryFn: async ({ pageParam = 1, signal }) => {
      let url = `/users/roles/?offset=${(pageParam-1)*limit}&limit=${limit}&is_deleted=false`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      selectedStatuses.forEach(status => {
        url += `&status=${status}`;
      });
      const response = await authAxios.get(url, {
        signal,
      });
      return response.data;
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.next) {
        return pages.length + 1;
      }
      return undefined;
    },
    staleTime: 0,
    initialPageParam: 1,
    enabled: selectedStatuses.length > 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Mutation for updating role status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await authAxios.post(`/users/roles/${id}/update-active-status/`, { status });
      return { id, status, data: response.data };
    },
    onSuccess: ({ id, status, data: updatedData }) => {
      // Direct cache update - instant UI, no API calls
      queryClient.setQueryData(['roles', searchTerm, [...selectedStatuses].sort()], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            results: page.results.map((item: any) =>
              item.id === id
                ? { ...item, status, ...updatedData }
                : item
            ),
          })),
        };
      });
    },
  });

  // Mutation for deleting role
  const deleteMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await authAxios.delete(`/users/roles/${id}/`);
      return { id };
    },
    onSuccess: ({ id }) => {
      // Direct cache update - instant UI, no API calls
      queryClient.setQueryData(['roles', searchTerm, [...selectedStatuses].sort()], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Filter out the deleted item from all pages
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            results: page.results.filter((item: any) => item.id !== id),
          })),
        };
      });
    },
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

  // Flatten all pages data
  const allData = data?.pages.flatMap((page: any) => page?.results ?? []) || [];

  return {
    data: allData,
    isLoading,
    error,
    isError,
    isFetchingNextPage,
    updateStatusMutation,
    deleteMutation,
  };
};

