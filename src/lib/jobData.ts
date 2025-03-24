import { addDays, sub } from 'date-fns';
import clientPromise from '@/lib/mongodb';
import { Job } from './models/job';

const DB_NAME = 'job_list';
const COLLECTION_NAME = 'job_applications';

/**
 * Normalizes a MongoDB job object to the Job interface
 */
function normalizeJob(job: any): Job {
  // Convert MongoDB specific types to standard types
  return {
    ...job,
    // Handle $oid if present
    _id: job._id?.$oid ? { $oid: job._id.$oid } : job._id,
    // Convert experience_required if it's a $numberInt
    experience_required: job.experience_required?.$numberInt 
      ? parseInt(job.experience_required.$numberInt) 
      : job.experience_required,
    // Ensure grade is always a number <= 1000
    grade: typeof job.grade === 'number' 
      ? Math.min(job.grade, 1000) 
      : (job.grade === true ? 1000 : 0)
  };
}

/**
 * Fetches paginated job dates sorted by most recent first
 */
export async function fetchJobDates(limit: number = 7, offset: number = 0): Promise<string[]> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Get distinct dates from the date_listed field (rather than scraped_on)
    const uniqueDates = await collection.distinct('date_listed');
    
    // Convert date strings to Date objects for proper sorting
    const processedDates = uniqueDates.map(date => {
      // Extract just the YYYY-MM-DD part
      if (typeof date === 'string') {
        const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[0] : date;
      }
      return date;
    });
    
    // Remove duplicates
    const uniqueDatesSet = [...new Set(processedDates)];

    // Sort dates descending (newest first)
    const sortedDates = uniqueDatesSet.sort((a, b) => {
      return new Date(String(b)).getTime() - new Date(String(a)).getTime();
    });

    // Apply pagination
    return sortedDates.slice(offset, offset + limit);
  } catch (error) {
    console.error('Error fetching job dates:', error);
    return [];
  }
}

/**
 * Fetch jobs for a specific date with cursor-based pagination
 */
export async function fetchJobsByDate(date: string, limit: number = 20, lastGrade: number | null = null): Promise<{
  jobs: Job[];
  pagination: {
    hasMore: boolean;
    nextGrade: number | null;
  }
}> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Extract YYYY-MM-DD part from date
    const dateRegex = new RegExp(`^${date}`);
    
    // Build our query object
    const filter: Record<string, any> = { 
      date_listed: { $regex: dateRegex } 
    };
    
    // Add cursor-based pagination if lastGrade is provided
    if (lastGrade !== null) {
      filter.grade = { $lt: lastGrade };
    }
    
    // Fetch jobs with pagination, fallback to sorting by creation date if grade is boolean
    const jobs = await collection
      .find(filter)
      .sort({ created_at: -1 }) // Sort by creation date descending
      .limit(limit + 1) // Fetch one extra to check if there are more
      .toArray();
    
    // Normalize all jobs
    const normalizedJobs = jobs.map(normalizeJob);
    
    // Check if we have more results
    const hasMore = normalizedJobs.length > limit;
    
    // Remove the extra item we used to check for more
    const paginatedJobs = hasMore ? normalizedJobs.slice(0, limit) : normalizedJobs;
    
    // Get the creation date of the last item (for next cursor)
    const nextGrade = hasMore && paginatedJobs.length > 0 
      ? 0 // Use 0 as default, we're sorting by creation date
      : null;
    
    return {
      jobs: paginatedJobs,
      pagination: {
        hasMore,
        nextGrade
      }
    };
  } catch (error) {
    console.error('Error fetching jobs by date:', error);
    return { 
      jobs: [],
      pagination: {
        hasMore: false,
        nextGrade: null
      }
    };
  }
}

/**
 * Gets a job by its ID
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const job = await collection.findOne({ job_id: jobId });
    
    if (!job) return null;
    
    // Normalize the job data
    return normalizeJob(job);
  } catch (error) {
    console.error(`Error fetching job with ID ${jobId}:`, error);
    return null;
  }
}

/**
 * Updates the status of a job application
 */
export async function updateJobStatus(jobId: string, status: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.updateOne(
      { job_id: jobId },
      { 
        $set: { 
          status: status,
          updated_at: new Date().toISOString()
        } 
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error(`Error updating job status for job ${jobId}:`, error);
    return false;
  }
} 