'use client';

import React, { useEffect, useState } from 'react';
import { format, parse } from 'date-fns';
import JobsTable from '@/components/JobsTable';
import Link from 'next/link';
import { Job } from '@/lib/models/job';
import Image from 'next/image';
import { useParams } from 'next/navigation';

export default function JobsByDatePage() {
  // Use the useParams hook to get the date parameter from the URL
  const params = useParams();
  // Extract and convert date from string or string[] to string
  const date = typeof params.date === 'string' ? params.date : params.date?.[0] || '';
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("Pending");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextGrade, setNextGrade] = useState<number | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{
    loading: boolean;
    jobId: string | null;
    error: string | null;
  }>({
    loading: false,
    jobId: null,
    error: null,
  });
  const [totalJobCount, setTotalJobCount] = useState<number>(0);
  const [pendingJobCount, setPendingJobCount] = useState<number>(0);

  // Initial load of jobs
  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const response = await fetch(`/api/jobs/${date}?limit=20`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        
        const data = await response.json();
        setJobs(data.jobs || []);
        setHasMore(data.pagination?.hasMore || false);
        setNextGrade(data.pagination?.nextGrade || null);
        
        // Set the total job count and pending count
        if (data.totalCount !== undefined) {
          setTotalJobCount(data.totalCount);
        }
        
        if (data.pendingCount !== undefined) {
          setPendingJobCount(data.pendingCount);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load jobs for this date. Please try again later.');
        setLoading(false);
      }
    }
    
    fetchJobs();
  }, [date]);

  // Function to load more jobs
  const loadMoreJobs = async () => {
    if (!hasMore || loadingMore || nextGrade === null) return;
    
    try {
      setLoadingMore(true);
      
      const response = await fetch(`/api/jobs/${date}?limit=20&lastGrade=${nextGrade}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch more jobs');
      }
      
      const data = await response.json();
      
      if (data.jobs && data.jobs.length > 0) {
        // Append new jobs to existing list
        setJobs(prevJobs => [...prevJobs, ...data.jobs]);
        setHasMore(data.pagination?.hasMore || false);
        setNextGrade(data.pagination?.nextGrade || null);
        
        // Update total count if it changed
        if (data.totalCount !== undefined && data.totalCount !== totalJobCount) {
          setTotalJobCount(data.totalCount);
        }
        
        // Update pending count if it changed
        if (data.pendingCount !== undefined && data.pendingCount !== pendingJobCount) {
          setPendingJobCount(data.pendingCount);
        }
      } else {
        setHasMore(false);
      }
      
      setLoadingMore(false);
    } catch (err) {
      console.error('Error fetching more jobs:', err);
      setLoadingMore(false);
    }
  };

  // Calculate job counts for different statuses
  const statusCounts = {
    All: totalJobCount,
    Pending: pendingJobCount,
    Applied: totalJobCount - pendingJobCount
  };

  // Available filters
  const filters = ['All', 'Pending', 'Applied'];

  // Apply filter when jobs or activeFilter changes
  useEffect(() => {
    if (activeFilter === 'All') {
      setFilteredJobs(jobs);
    } else if (activeFilter === 'Pending') {
      setFilteredJobs(jobs.filter(job => job.date_applied === 'Pending' || !job.date_applied));
    } else if (activeFilter === 'Applied') {
      setFilteredJobs(jobs.filter(job => job.date_applied !== 'Pending' && job.date_applied));
    }
  }, [jobs, activeFilter]);

  const formatDate = (dateStr: string) => {
    try {
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      return format(date, 'MMMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    setUpdateStatus({
      loading: true,
      jobId,
      error: null,
    });

    try {
      const response = await fetch(`/api/jobs/${date}/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state to reflect the change
      const updatedJobs = jobs.map((job) =>
        job.job_id === jobId ? { ...job, status: newStatus } : job
      );
      
      setJobs(updatedJobs);

      setUpdateStatus({
        loading: false,
        jobId: null,
        error: null,
      });
    } catch (err) {
      console.error('Error updating job status:', err);
      setUpdateStatus({
        loading: false,
        jobId: null,
        error: 'Failed to update status. Please try again.',
      });
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setActiveFilter(newFilter);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    loadMoreJobs();
  };


  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-black to-gray-900">
        <div className="bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button
            onClick={handleRetry}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-black to-gray-900 text-gray-200">
      
      {/* Header section - fixed height */}
      <div className="container mx-auto px-4 py-4 z-10 relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-100">
            {formatDate(date)}
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({loading ? '...' : totalJobCount} {totalJobCount === 1 ? 'entry' : 'entries'})
            </span>
          </h1>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-md shadow-sm text-blue-400 bg-transparent hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Sticky filter tabs */}
        <div className="sticky top-0 z-20 pt-2 pb-0 backdrop-blur-sm border-b border-blue-900/30 shadow-md">
          <div className="flex flex-wrap -mb-px">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`mr-2 inline-flex items-center py-2 px-4 text-sm font-medium ${
                  activeFilter === filter
                    ? 'text-blue-400 border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                {filter} 
                <span className="ml-2 bg-gray-800 text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {statusCounts[filter as keyof typeof statusCounts] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error message */}
      {updateStatus.error && (
        <div className="container mx-auto px-4 z-10 relative">
          <div className="mb-4 bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4" role="alert">
            <p>{updateStatus.error}</p>
          </div>
        </div>
      )}

      {/* Scrollable table container */}
      <div className="flex-1 overflow-auto container mx-auto px-4 relative z-10">
        <JobsTable 
          jobs={filteredJobs} 
          onStatusChange={handleStatusChange} 
          lastRowRef={hasMore && !loadingMore ? loadMoreJobs : undefined}
          isLoading={loading}
        />
        
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-300">Loading more jobs...</span>
          </div>
        )}
      </div>
    </div>
  );
} 