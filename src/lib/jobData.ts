import { format, parseISO } from 'date-fns';
import clientPromise from './mongodb';
import { Job, JobsByDate } from './models/job';

const DB_NAME = 'job_list';
const COLLECTION_NAME = 'job_applications';

/**
 * Fetches available dates with job data from MongoDB with pagination support
 */
export async function getJobDates(limit = 10, cursor?: string | null): Promise<{
  dates: string[];
  nextCursor: string | null;
}> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Create a query that uses the cursor if provided
    const query = cursor 
      ? { _id: { $lt: cursor } } // Get dates before the cursor
      : {};

    // Use aggregation to get distinct dates from scraped_on field with pagination
    const dates = await collection.aggregate([
      { $group: { _id: '$scraped_on' } },
      { $sort: { _id: -1 } },  // Sort by date descending (newest first)
      ...(cursor ? [{ $match: { _id: { $lt: cursor } } }] : []), // Apply cursor filter if provided
      { $limit: limit + 1 }  // Get one extra to check if there are more
    ]).toArray();

    // Check if we have more results
    const hasMore = dates.length > limit;
    
    // Remove the extra item if we fetched more than requested
    const paginatedDates = hasMore ? dates.slice(0, limit) : dates;
    
    // Determine the next cursor (last item's date)
    const nextCursor = hasMore && paginatedDates.length > 0 
      ? paginatedDates[paginatedDates.length - 1]._id 
      : null;
      
    // Map to just the dates
    return {
      dates: paginatedDates.map(date => date._id),
      nextCursor
    };
  } catch (error) {
    console.error('Error fetching job dates:', error);
    return { dates: [], nextCursor: null };
  }
}

/**
 * Fetches jobs for a specific date with pagination support
 */
export async function getJobsByDate(
  dateString: string, 
  limit = 20, 
  lastGrade?: number
): Promise<{
  jobs: Job[];
  hasMore: boolean;
  nextGrade: number | null;
}> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Build query with cursor-based pagination
    const query: any = { scraped_on: dateString };
    
    // If lastGrade is provided, use it as a cursor
    if (lastGrade !== undefined) {
      query.grade = { $lt: lastGrade };
    }

    // Find all jobs scraped on the specified date
    // and sort them by grade in descending order (highest grade first)
    const jobs = await collection.find(query)
      .sort({ grade: -1 })
      .limit(limit + 1)  // Get one extra to check if there are more
      .toArray();

    // Check if we have more results
    const hasMore = jobs.length > limit;
    
    // Remove the extra item if we fetched more than requested
    const paginatedJobs = hasMore ? jobs.slice(0, limit) : jobs;
    
    // Determine the next grade cursor (last item's grade)
    const nextGrade = hasMore && paginatedJobs.length > 0 
      ? paginatedJobs[paginatedJobs.length - 1].grade 
      : null;
    
    return {
      jobs: paginatedJobs as unknown as Job[],
      hasMore,
      nextGrade
    };
  } catch (error) {
    console.error(`Error fetching jobs for date ${dateString}:`, error);
    return { jobs: [], hasMore: false, nextGrade: null };
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