'use client';

import React, { useState, useEffect } from 'react';
import { Job } from '@/lib/models/job';
import Badge from './Badge';
import { format, parseISO } from 'date-fns';

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
    rgba(17, 24, 39, 0.7) 8%, 
    rgba(59, 130, 246, 0.3) 18%, 
    rgba(17, 24, 39, 0.7) 33%
  );
  background-size: 1000px 100%;
  position: relative;
  overflow: hidden;
}

.skeleton-base {
  background-color: rgba(55, 65, 81, 0.3);
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
    rgba(255, 255, 255, 0.05) 20%,
    rgba(255, 255, 255, 0.1) 60%,
    rgba(255, 255, 255, 0)
  );
  animation: shimmer 2s infinite;
  content: '';
}

/* Table specific styles */
.sticky-header th {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: rgb(17, 24, 39); /* bg-gray-900 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  color: rgb(209, 213, 219); /* text-gray-300 - ensure consistent header text color */
}

.table-cell {
  font-size: 0.875rem; /* text-sm */
  line-height: 1.25rem;
  color: rgb(229, 231, 235); /* text-gray-200 - ensure consistent cell text color */
}

.expanded-content {
  font-size: 0.875rem; /* text-sm */
  line-height: 1.25rem;
}

/* Ensure text colors are consistent */
.table-text-primary {
  color: rgb(229, 231, 235); /* text-gray-200 */
}

.table-text-secondary {
  color: rgb(156, 163, 175); /* text-gray-400 */
}

.table-link {
  color: rgb(96, 165, 250); /* text-blue-400 */
}

.table-link:hover {
  color: rgb(147, 197, 253); /* text-blue-300 */
}
`;

// Add style tag for shimmer animation
const ShimmerStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: shimmerStyles }} />
);

// Observer component that triggers when it becomes visible
const IntersectionObserverRow = ({ callback }: { callback: () => void }) => {
  useEffect(() => {
    // Create the observer
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        callback();
      }
    });
    
    // Find and observe the element
    const element = document.getElementById('observer-element');
    if (element) observer.observe(element);
    
    // Cleanup function
    return () => observer.disconnect();
  }, [callback]);
  
  return <tr><td colSpan={7} id="observer-element" className="p-2 border-none"></td></tr>;
};

// Skeleton table rows
const SkeletonTableRow = () => (
  <tr className="hover:bg-gray-900/10">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-5 w-24 skeleton-base shimmer rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-5 w-32 skeleton-base shimmer rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-5 w-20 skeleton-base shimmer rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-5 w-24 skeleton-base shimmer rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="w-24 skeleton-base rounded-full h-2.5 mr-2">
          <div className="shimmer h-full w-full rounded-full"></div>
        </div>
        <div className="h-5 w-8 skeleton-base shimmer rounded"></div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right">
      <div className="h-5 w-10 skeleton-base shimmer rounded ml-auto"></div>
    </td>
  </tr>
);

// Full skeleton table
const SkeletonTable = () => (
  <div className="overflow-x-auto">
    <ShimmerStyles />
    <table className="min-w-full divide-y divide-gray-700 bg-black">
      <thead className="bg-gray-900 sticky-header">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
            Company
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
            Job Title
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
            Location
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
            Applied Date
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
            Grade
            <span className="ml-1 text-xs text-gray-400">(Sorted)</span>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-black divide-y divide-gray-700">
        {Array(8).fill(0).map((_, index) => (
          <SkeletonTableRow key={index} />
        ))}
      </tbody>
    </table>
  </div>
);

interface JobsTableProps {
  jobs: Job[];
  onStatusChange?: (jobId: string, newStatus: string) => void;
  lastRowRef?: () => void; // Changed to a callback function instead of a ref
  isLoading?: boolean;
}

// Helper function to calculate grade percentage
const calculateGradePercentage = (grade: number): number => {
  if (typeof grade !== 'number') return 0;
  return Math.min(grade / 10, 100); // Convert grade to percentage (0-100), capped at 100%
};

// Helper function to display grade value
const formatGrade = (grade: number): string => {
  if (typeof grade !== 'number') return 'N/A';
  return grade.toString();
};

// Helper to format experience required
const formatExperience = (experience: number | { $numberInt: string } | undefined): string => {
  if (experience === undefined) return 'Not specified';
  if (typeof experience === 'number') return `${experience} years`;
  if (experience.$numberInt) return `${experience.$numberInt} years`;
  return 'Not specified';
};

export default function JobsTable({ jobs, onStatusChange, lastRowRef, isLoading = false }: JobsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (jobId: string) => {
    if (expandedRow === jobId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(jobId);
    }
  };

  // Handle double click to open job link
  const handleDoubleClick = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row toggle
    if (job.job_link) {
      window.open(job.job_link, '_blank', 'noopener,noreferrer');
    }
  };

  // Updated status options to include all possible statuses
  const statusOptions = ['Pending', 'Applied', 'Interview', 'Rejected', 'Offer', 'Hired', 'Declined', 'Expired'];

  const handleStatusChange = (
    jobId: string,
    _e: React.ChangeEvent<HTMLSelectElement>,
    newStatus: string
  ) => {
    if (onStatusChange) {
      onStatusChange(jobId, newStatus);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'Pending' || dateStr === 'Unknown') return dateStr;
    try {
      // Handle both ISO strings and date strings from MongoDB
      return format(parseISO(dateStr), 'MMM dd, yyyy');
    } catch (e) {
      // If parseISO fails, try parsing it differently or return as is
      try {
        return format(new Date(dateStr), 'MMM dd, yyyy');
      } catch (err) {
        return dateStr;
      }
    }
  };

  // Show skeleton loading if loading or no jobs available yet
  if (isLoading) {
    return <SkeletonTable />;
  }

  if (!jobs || jobs.length === 0) {
    return <div className="text-center py-12 px-4">
      <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-300">No jobs found</h3>
      <p className="mt-1 text-sm text-gray-400">Nothing to show for this date.</p>
    </div>;
  }

  return (
    <div className="overflow-x-auto relative">
      <ShimmerStyles />
      {/* Background image - could be added here */}
      <table className="min-w-full divide-y divide-gray-700 bg-black table-fixed">
        <thead className="bg-gray-900 sticky-header">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider w-1/5">
              Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider w-1/5">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider w-1/5">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider w-1/5">
              Applied Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider w-1/5">
              Rating
              <span className="ml-1 text-xs text-gray-400">(Sorted)</span>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider w-1/5">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-black divide-y divide-gray-700">
          {jobs.map((job, _index) => (
            <React.Fragment key={job.job_id}>
              <tr
                className={`hover:bg-gray-900/50 cursor-pointer ${
                  expandedRow === job.job_id ? 'bg-gray-900/70' : ''
                }`}
                onClick={() => toggleRow(job.job_id)}
                onDoubleClick={(e) => handleDoubleClick(job, e)}
                title="Double-click to open job posting"
              >
                <td className="px-6 py-4 whitespace-nowrap table-cell">
                  <div className="text-sm font-medium table-text-primary">{job.company}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap table-cell">
                  <div className="text-sm table-text-primary">{job.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap table-cell">
                  <div className="text-sm table-text-secondary">{job.work_location}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm table-text-secondary table-cell">
                  {formatDate(job.date_applied)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap table-cell">
                  <div className="text-sm">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-700 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${calculateGradePercentage(job.grade)}%` }}
                        ></div>
                      </div>
                      <span className="table-text-primary">{formatGrade(job.grade)}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium table-cell">
                  <a
                    href={job.job_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 mr-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </a>
                </td>
              </tr>
              {expandedRow === job.job_id && (
                <tr className="bg-gray-900">
                  <td colSpan={6} className="px-6 py-4 expanded-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-200 mb-2 text-base">Job Details</h4>
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="font-medium text-gray-300">Work Style:</span> {job.work_style}
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="font-medium text-gray-300">Experience Required:</span>{' '}
                          {formatExperience(job.experience_required)}
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="font-medium text-gray-300">Skills:</span>{' '}
                          {job.skills || 'Not specified'}
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="font-medium text-gray-300">HR Contact:</span> {job.hr_name}
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="font-medium text-gray-300">Listed Date:</span>{' '}
                          {formatDate(job.date_listed)}
                        </p>
                        {job.scraped_on && (
                          <p className="text-sm text-gray-400 mb-2">
                            <span className="font-medium text-gray-300">Scraped On:</span>{' '}
                            {job.scraped_on}
                          </p>
                        )}
                        <p className="text-sm text-gray-400 mb-4">
                          <span className="font-medium text-gray-300">Rating:</span>{' '}
                          <span className="font-semibold text-blue-400">
                            {typeof job.grade === 'number' ? job.grade : 'N/A'}/1000
                          </span>
                          <div className="w-full bg-gray-800 rounded-full h-2.5 mt-1">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${calculateGradePercentage(job.grade)}%` }}
                            ></div>
                          </div>
                        </p>
                        
                        <h4 className="font-medium text-gray-200 mb-2 text-base">Update Status</h4>
                        <select
                          className="form-select rounded-md border-gray-700 bg-gray-800 text-gray-200 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-400 focus:ring-opacity-50"
                          value={job.status || 'Pending'}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(job.job_id, e, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-200 mb-2 text-base">Job Description</h4>
                        <div className="text-sm text-gray-400 mb-4 max-h-60 overflow-y-auto">
                          {job.description}
                        </div>
                        
                        <h4 className="font-medium text-gray-200 mb-2 text-base">Application Links</h4>
                        <div className="flex flex-col space-y-2">
                          <a
                            href={job.job_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Job Posting
                          </a>
                          {job.hr_link && (
                            <a
                              href={job.hr_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              HR Profile
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          
          {/* Observer element for infinite scrolling */}
          {lastRowRef && <IntersectionObserverRow callback={lastRowRef} />}
        </tbody>
      </table>
    </div>
  );
} 