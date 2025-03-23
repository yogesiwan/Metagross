import { addDays, sub } from 'date-fns';
import clientPromise from '@/lib/mongodb';
import { Job } from './models/job';

const DB_NAME = 'job_list';
const COLLECTION_NAME = 'job_applications';

/**
 * Fetches paginated job dates sorted by most recent first
 */
export async function fetchJobDates(limit: number = 7, offset: number = 0): Promise<string[]> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Get distinct dates (scraped_on field)
    const uniqueDates = await collection.distinct('scraped_on');
    
    // Sort dates descending (newest first) and apply pagination
    const sortedDates = uniqueDates.sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
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
    
    // Build our query object - remove the unused 'query' variable declaration
    const filter: Record<string, any> = { scraped_on: date };
    
    // Add cursor-based pagination if lastGrade is provided
    if (lastGrade !== null) {
      filter.grade = { $lt: lastGrade };
    }
    
    // Fetch jobs with pagination
    const jobs = await collection
      .find(filter)
      .sort({ grade: -1 }) // Sort by grade descending
      .limit(limit + 1) // Fetch one extra to check if there are more
      .toArray();
    
    // Check if we have more results
    const hasMore = jobs.length > limit;
    
    // Remove the extra item we used to check for more
    const paginatedJobs = hasMore ? jobs.slice(0, limit) : jobs;
    
    // Get the grade of the last item (for next cursor)
    const nextGrade = hasMore && paginatedJobs.length > 0 
      ? paginatedJobs[paginatedJobs.length - 1].grade 
      : null;
    
    return {
      jobs: paginatedJobs as unknown as Job[],
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
    return job as unknown as Job;
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