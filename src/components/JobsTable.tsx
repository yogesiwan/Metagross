'use client';

import React, { useState, useEffect } from 'react';
import { Job } from '@/lib/models/job';
import Badge from './Badge';
import { format, parseISO } from 'date-fns';

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

interface JobsTableProps {
  jobs: Job[];
  onStatusChange?: (jobId: string, newStatus: string) => void;
  lastRowRef?: () => void; // Changed to a callback function instead of a ref
}

export default function JobsTable({ jobs, onStatusChange, lastRowRef }: JobsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (jobId: string) => {
    if (expandedRow === jobId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(jobId);
    }
  };

  const statusOptions = ['Pending', 'Applied'];

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
      return format(parseISO(dateStr), 'MMM dd, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  if (!jobs || jobs.length === 0) {
    return <div className="text-center py-8 text-gray-400">No jobs found for this date.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700 bg-black">
        <thead className="bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Job Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Applied Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Grade
              <span className="ml-1 text-xs text-gray-400">(Sorted)</span>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-black divide-y divide-gray-700">
          {jobs.map((job, _index) => (
            <React.Fragment key={job.job_id}>
              <tr
                className={`hover:bg-gray-900 cursor-pointer ${
                  expandedRow === job.job_id ? 'bg-gray-900' : ''
                }`}
                onClick={() => toggleRow(job.job_id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-200">{job.company}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-200">{job.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-400">{job.work_location}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(job.date_applied)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-700 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${job.grade / 10}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-200">{job.grade}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge status={job.status || 'Pending'} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a
                    href={job.job_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 mr-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </a>
                </td>
              </tr>
              {expandedRow === job.job_id && (
                <tr className="bg-gray-900">
                  <td colSpan={7} className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-200 mb-2">Job Details</h4>
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="font-medium text-gray-300">Work Style:</span> {job.work_style}
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="font-medium text-gray-300">Experience Required:</span>{' '}
                          {job.experience_required} years
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="font-medium text-gray-300">Skills:</span>{' '}
                          {Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="font-medium text-gray-300">HR Contact:</span> {job.hr_name}
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="font-medium text-gray-300">Listed Date:</span>{' '}
                          {formatDate(job.date_listed)}
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="font-medium text-gray-300">Scraped On:</span>{' '}
                          {job.scraped_on}
                        </p>
                        <p className="text-sm text-gray-400 mb-4">
                          <span className="font-medium text-gray-300">Grade:</span>{' '}
                          <span className="font-semibold text-blue-400">{job.grade}/1000</span>
                          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${job.grade / 10}%` }}
                            ></div>
                          </div>
                        </p>
                        
                        <h4 className="font-medium text-gray-200 mb-2">Update Status</h4>
                        <select
                          className="form-select rounded-md border-gray-600 bg-gray-800 text-gray-200 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-300 focus:ring-opacity-50"
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
                        <h4 className="font-medium text-gray-200 mb-2">Job Description</h4>
                        <div className="text-sm text-gray-400 mb-4 max-h-60 overflow-y-auto">
                          {job.description}
                        </div>
                        
                        <h4 className="font-medium text-gray-200 mb-2">Application Links</h4>
                        <div className="flex flex-col space-y-2">
                          <a
                            href={job.job_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Job Posting
                          </a>
                          <a
                            href={job.application_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Application Link
                          </a>
                          {job.hr_link && (
                            <a
                              href={job.hr_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 text-sm"
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