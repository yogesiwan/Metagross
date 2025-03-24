'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { format, parse } from 'date-fns';
import Card from '@/components/Card';
import Link from 'next/link';
import JobStats from '@/components/JobStats';
import Image from 'next/image';

// Observer component that triggers when it becomes visible
const ObserverComponent = React.memo(({ callback }: { callback: () => void }) => {
  useEffect(() => {
    // Create the observer with proper types
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        callback();
      }
    }, {
      rootMargin: '200px', // Load earlier for smoother experience
      threshold: 0.1
    });
    
    // Find and observe the element
    const element = document.getElementById('dates-observer');
    if (element) observer.observe(element);
    
    // Cleanup function
    return () => observer.disconnect();
  }, [callback]);
  
  return <div id="dates-observer" className="w-full h-10"></div>;
});

ObserverComponent.displayName = 'ObserverComponent';

// CSS for shimmer effect - Instagram-style loading
const shimmerStyles = `
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.shimmer {
  animation: shimmer 1.5s infinite linear;
  background: linear-gradient(
    to right,
    rgba(33, 50, 91, 0.05) 8%, 
    rgba(76, 130, 227, 0.2) 18%, 
    rgba(33, 50, 91, 0.05) 33%
  );
  background-size: 1000px 100%;
  position: relative;
  overflow: hidden;
}

.skeleton-base {
  background-color: rgba(75, 85, 99, 0.1);
  border-radius: 0.25rem;
  overflow: hidden;
  position: relative;
}

.skeleton-base::after {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.1) 20%,
    rgba(255, 255, 255, 0.2) 60%,
    rgba(255, 255, 255, 0)
  );
  animation: shimmer 2s infinite;
  content: '';
}
`;

// Skeleton loaders
const SkeletonCard = () => (
  <div className="cursor-pointer">
    <div className="p-4 flex flex-col gap-1 rounded-lg border border-blue-400/30 bg-blue-900/20 h-full overflow-hidden skeleton-base">
      {/* Title placeholder */}
      <div className="flex justify-center mb-1">
        <div className="h-6 w-20 rounded shimmer"></div>
      </div>
      
      {/* Counts section */}
      <div className="mt-1 flex items-center justify-center space-x-4">
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-gray-400/50 mb-1">Total</div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500/40 mr-1"></div>
            <div className="h-4 w-5 rounded shimmer"></div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-gray-400/50 mb-1">Pending</div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-yellow-500/40 mr-1"></div>
            <div className="h-4 w-5 rounded shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Skeleton for JobStats component
const SkeletonJobStats = () => (
  <div className="bg-blue-900/50 p-2 rounded-lg border border-blue-400/30 text-center shadow-md skeleton-base">
    <div className="flex space-x-6 items-center justify-center">
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-400/50">Total</span>
        <div className="flex items-center mt-1">
          <div className="w-2 h-2 rounded-full bg-blue-500/40 mr-1"></div>
          <div className="h-6 w-8 rounded shimmer"></div>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-400/50">Pending</span>
        <div className="flex items-center mt-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500/40 mr-1"></div>
          <div className="h-6 w-8 rounded shimmer"></div>
        </div>
      </div>
    </div>
  </div>
);

// Add style tag for shimmer animation
const ShimmerStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: shimmerStyles }} />
);

interface DateStat {
  date: string;
  count: number;
}

interface StatusStat {
  date: string;
  totalCount: number;
  pendingCount: number;
}

export default function Dashboard() {
  const [dates, setDates] = useState<string[]>([]);
  const [dateStats, setDateStats] = useState<DateStat[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Track if we're on client side for client-only features
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initial data fetch with AbortController for cleanup
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    async function fetchInitialData() {
      try {
        setLoading(true);
        
        // Parallel requests for faster loading
        const [datesResponse, statsResponse, statusStatsResponse] = await Promise.all([
          fetch('/api/jobs/dates?limit=10', { signal }),
          fetch('/api/jobs/stats', { signal }),
          fetch('/api/jobs/status-stats', { signal })
        ]);
        
        if (!datesResponse.ok) {
          throw new Error('Failed to fetch dates');
        }
        
        const datesData = await datesResponse.json();
        setDates(datesData.dates || []);
        setCursor(datesData.nextCursor);
        setHasMore(datesData.hasMore);
        
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch statistics');
        }
        
        const statsData = await statsResponse.json();
        setDateStats(statsData.dateStats || []);
        
        if (!statusStatsResponse.ok) {
          throw new Error('Failed to fetch status statistics');
        }
        
        const statusStatsData = await statusStatsResponse.json();
        setStatusStats(statusStatsData.statusStats || []);
        
        setLoading(false);
      } catch (err) {
        if (signal.aborted) return;
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    }
    
    fetchInitialData();
    
    return () => {
      controller.abort();
    };
  }, []);

  // Memoized function to load more dates
  const loadMoreDates = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    
    try {
      setLoadingMore(true);
      
      const response = await fetch(`/api/jobs/dates?limit=10&cursor=${cursor}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch more dates');
      }
      
      const data = await response.json();
      
      if (data.dates && data.dates.length > 0) {
        setDates(prevDates => [...prevDates, ...data.dates]);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
      
      setLoadingMore(false);
    } catch (err) {
      console.error('Error fetching more dates:', err);
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, cursor]);

  // Memoized format date function
  const formatDate = useCallback((dateStr: string) => {
    try {
      // Parse the date (format from API is YYYY-MM-DD)
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      // Format to display as "23 March"
      return format(date, 'd MMMM');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateStr;
    }
  }, []);

  // Memoized stats lookup
  const getStatusStatForDate = useCallback((dateStr: string) => {
    return statusStats.find(stat => stat.date === dateStr) || { 
      date: dateStr, 
      totalCount: 0, 
      pendingCount: 0 
    };
  }, [statusStats]);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-4 max-w-md" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-black to-blue-900">
      <ShimmerStyles />
      
      {/* Fixed header area - improved for mobile */}
      <div className="w-full px-4 py-4">
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-4 sm:mb-0">Dashboard</h1>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-md shadow-sm text-blue-400 bg-transparent hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Home
            </Link>
          </div>
          
          {/* Logo positioned to be responsive and centered */}
          <div className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none">
            {isClient && (
              <Image 
                src="/metagross.png" 
                alt="logo" 
                width={800} 
                height={100} 
                className="opacity-12 hidden sm:block" 
                priority={false}
                loading="lazy"
              />
            )}
          </div>
          
          {loading ? (
            <div className="hidden sm:block absolute top-0 right-40">
              <SkeletonJobStats />
            </div>
          ) : (
            dateStats.length > 0 && statusStats.length > 0 && (
              <div className="mt-4 sm:mt-0 sm:absolute sm:top-0 sm:right-40">
                <JobStats dateStats={dateStats} statusStats={statusStats} />
              </div>
            )
          )}
        </div>
      </div>
      
      {/* Sticky header for stats section */}
      <div className="sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <h2 className="text-xl font-medium text-gray-300">Stat's Till Now</h2>
        </div>
      </div>
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto px-4 py-2">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3">
              {Array(6).fill(0).map((_, index) => (
                <div key={index}>
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : (
            dates.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3 pb-4">
                {dates.map((dateStr) => {
                  const stats = getStatusStatForDate(dateStr);
                  
                  return (
                    <div key={dateStr}>
                      <Card
                        title={formatDate(dateStr)}
                        href={`/dashboard/${dateStr}`}
                        totalCount={stats.totalCount}
                        pendingCount={stats.pendingCount}
                      />
                    </div>
                  );
                })}
                
                {/* Observer element for infinite scrolling */}
                {hasMore && !loadingMore && (
                  <ObserverComponent callback={loadMoreDates} />
                )}
              </div>
            )
          )}
          
          {/* Loading indicator for pagination */}
          {loadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3">
              {Array(3).fill(0).map((_, index) => (
                <div key={`skeleton-${index}`}>
                  <SkeletonCard />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 