import { useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAxios } from '../axiosInstance';
import useToasterNotification from '../hooks/useToasterNotification';

interface UseModeOfPaymentDataParams {
  searchTerm: string;
  selectedStatuses: string[];
  limit?: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export const useModeOfPaymentData = ({ 
  searchTerm, 
  selectedStatuses, 
  limit = 20, 
  scrollContainerRef 
}: UseModeOfPaymentDataParams) => {
  const queryClient = useQueryClient();
  const { showErrorNotification, showSuccessNotification } = useToasterNotification();
  const isFetchingRef = useRef(false);
  const initialCheckDoneRef = useRef<string>('');

  // Fetch data with TanStack Query - Infinite Query
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['modeOfPayments', searchTerm, [...selectedStatuses].sort()],
    queryFn: async ({ pageParam = 0 }) => {
      let url = `/accounts/mode-of-payments/?limit=${limit}&offset=${(pageParam-1)*limit}&is_deleted=false`;
      
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      
      if (selectedStatuses && selectedStatuses.length > 0) {
        selectedStatuses.forEach(status => {
          url += `&status=${status}`;
        });
      }

      const response = await authAxios.get(url);
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.next) {
        return allPages.length * limit;
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
    enabled: selectedStatuses.length > 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Mutation for updating status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await authAxios.post(
        `/accounts/mode-of-payments/${id}/update-active-status/`,
        { status }
      );
      return { id, status, data: response.data };
    },
    onSuccess: ({ id, status, data: updatedData }) => {
      // Direct cache update - instant UI, no API calls
      queryClient.setQueryData(['modeOfPayments', searchTerm, [...selectedStatuses].sort()], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            results: (page.results || []).map((item: any) =>
              item.id === id
                ? { ...item, status, ...updatedData }
                : item
            ),
          })),
        };
      });
      showSuccessNotification(updatedData.message || 'Status updated successfully');
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });

  // Mutation for deleting
  const deleteMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await authAxios.delete(`/accounts/mode-of-payments/${id}/`);
      return { id };
    },
    onSuccess: ({ id }) => {
      // Direct cache update - instant UI, no API calls
      queryClient.setQueryData(['modeOfPayments', searchTerm, [...selectedStatuses].sort()], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Filter out the deleted item from all pages
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            results: (page.results || []).filter((item: any) => item.id !== id),
          })),
        };
      });
      showSuccessNotification('Mode of Payment deleted successfully');
    },
    onError: (error) => {
      showErrorNotification(error);
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
      scrollContainer.scrollTop = 0;
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
    const allData = data?.pages.flatMap(page => page.results || []) || [];
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

  // Flatten all pages data
  const allData = data?.pages.flatMap((page) => page.results || []) || [];

  return {
    data: allData,
    isLoading,
    error,
    isFetchingNextPage,
    updateStatusMutation,
    deleteMutation,
  };
};
