'use client';

import React, { useEffect, useState } from 'react';
import { format, parse } from 'date-fns';
import Card from '@/components/Card';
import Link from 'next/link';
import JobStats from '@/components/JobStats';
import Image from 'next/image';

// Observer component that triggers when it becomes visible
const ObserverComponent = ({ callback }: { callback: () => void }) => {
  useEffect(() => {
    // Create the observer with proper types
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        callback();
      }
    });
    
    // Find and observe the element
    const element = document.getElementById('dates-observer');
    if (element) observer.observe(element);
    
    // Cleanup function
    return () => observer.disconnect();
  }, [callback]);
  
  return <div id="dates-observer" className="w-full h-10"></div>;
};

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

  // Initial data fetch
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);
        
        // Fetch initial batch of dates
        const datesResponse = await fetch('/api/jobs/dates?limit=10');
        
        if (!datesResponse.ok) {
          throw new Error('Failed to fetch dates');
        }
        
        const datesData = await datesResponse.json();
        setDates(datesData.dates || []);
        setCursor(datesData.nextCursor);
        setHasMore(datesData.hasMore);
        
        // Fetch statistics
        const statsResponse = await fetch('/api/jobs/stats');
        
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch statistics');
        }
        
        const statsData = await statsResponse.json();
        setDateStats(statsData.dateStats || []);
        
        // Fetch status statistics
        const statusStatsResponse = await fetch('/api/jobs/status-stats');
        
        if (!statusStatsResponse.ok) {
          throw new Error('Failed to fetch status statistics');
        }
        
        const statusStatsData = await statusStatsResponse.json();
        setStatusStats(statusStatsData.statusStats || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    }
    
    fetchInitialData();
  }, []);

  // Function to load more dates
  const loadMoreDates = async () => {
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
  };

  const formatDate = (dateStr: string) => {
    try {
      // Parse the date (format from API is YYYY-MM-DD)
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      // Format to display as "23 March"
      return format(date, 'd MMMM');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateStr;
    }
  };

  // Find status stats for a specific date
  const getStatusStatForDate = (dateStr: string) => {
    return statusStats.find(stat => stat.date === dateStr) || { 
      date: dateStr, 
      totalCount: 0, 
      pendingCount: 0 
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
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

  if (dates.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Job Application Dashboard</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No job application data found. Generate some dummy data to get started.
              </p>
              <p className="mt-3 text-sm">
                <Link
                  href="/api/seed"
                  className="font-medium text-yellow-700 underline hover:text-yellow-600"
                >
                  Generate Data (10 days × 30+ jobs)
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 bg-gradient-to-b from-black to-blue-900">
      <div className="relative mb-12">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-md shadow-sm text-blue-400 bg-transparent hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Home
          </Link>
        </div>
        
        {/* Logo positioned to be responsive and centered */}
        <div className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none">
          <Image src="/metagross2.png" alt="logo" width={200} height={100} />
        </div>
        
        {dateStats.length > 0 && statusStats.length > 0 && (
          <div className="absolute top-0 right-40">
            <JobStats dateStats={dateStats} statusStats={statusStats} />
          </div>
        )}
      </div>
      
      {!loading && !error && dates.length > 0 && (
        <div className="grid grid-cols-1 gap-8 mt-12">
          <div className="mb-4">
            <h2 className="text-xl font-medium text-gray-300 mb-5">Job Applications by Date</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
            </div>
            
            {/* Observer element for infinite scrolling */}
            {hasMore && !loadingMore && (
              <ObserverComponent callback={loadMoreDates} />
            )}
            
            {/* Loading indicator for pagination */}
            {loadingMore && (
              <div className="flex justify-center mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-300">Loading more...</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!loading && !error && dates.length > 0 && (
        <div className="mt-8">
          <Link 
            href="/api/seed" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Regenerate Data (10 days × 30+ jobs)
          </Link>
        </div>
      )}
    </div>
  );
} 