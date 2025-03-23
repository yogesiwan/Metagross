import React from 'react';

interface JobStatsProps {
  dateStats: {
    date: string;
    count: number;
  }[];
  statusStats?: {
    date: string;
    totalCount: number;
    pendingCount: number;
  }[];
}

export default function JobStats({ dateStats, statusStats = [] }: JobStatsProps) {
  // Calculate totals across all dates
  const totalJobs = dateStats.reduce((sum, stat) => sum + stat.count, 0);
  
  // Calculate total pending jobs
  const totalPending = statusStats.reduce((sum, stat) => sum + stat.pendingCount, 0);
  
  return (
    <div className="bg-blue-900/50 p-2 rounded-lg border border-blue-400/30 text-center shadow-md">
      <div className="flex space-x-6 items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400">Total Jobs</span>
          <div className="flex items-center mt-1">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
            <span className="text-xl font-bold text-white">{totalJobs}</span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400">Pending</span>
          <div className="flex items-center mt-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
            <span className="text-xl font-bold text-white">{totalPending}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 