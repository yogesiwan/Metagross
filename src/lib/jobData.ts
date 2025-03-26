import { addDays, sub, format } from 'date-fns';
import clientPromise from '@/lib/mongodb';
import { Job } from './models/job';

const DB_NAME = 'job_list';
const COLLECTION_PREFIX = 'job_applications_';

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
      : (job.grade?.$numberInt ? parseInt(job.grade.$numberInt) : 0)
  };
}

/**
 * Gets all collection names from the database that match the job_applications_ prefix
 */
async function getJobCollections(): Promise<string[]> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();
    
    return collections
      .map(collection => collection.name)
      .filter(name => name.startsWith(COLLECTION_PREFIX))
      .sort()
      .reverse(); // Newest first
  } catch (error) {
    console.error('Error getting job collections:', error);
    return [];
  }
}

/**
 * Extracts date from collection name (job_applications_YYYY-MM-DD -> YYYY-MM-DD)
 */
function extractDateFromCollection(collectionName: string): string {
  return collectionName.replace(COLLECTION_PREFIX, '');
}

/**
 * Creates collection name from date (YYYY-MM-DD -> job_applications_YYYY-MM-DD)
 */
function createCollectionName(date: string): string {
  return `${COLLECTION_PREFIX}${date}`;
}

/**
 * Fetches paginated job dates sorted by most recent first
 */
export async function fetchJobDates(limit: number = 7, offset: number = 0): Promise<string[]> {
  try {
    // Get all collections that match the job_applications_ prefix
    const collections = await getJobCollections();
    
    // Extract dates from collection names and apply pagination
    const dates = collections
      .map(collection => extractDateFromCollection(collection))
      .slice(offset, offset + limit);
    
    return dates;
  } catch (error) {
    console.error('Error fetching job dates:', error);
    return [];
  }
}

/**
 * Fetch jobs for a specific date with cursor-based pagination
 */
export async function fetchJobsByDate(
  date: string, 
  limit: number = 20, 
  lastGrade: number | null = null,
  includeTotalCount: boolean = false
): Promise<{
  jobs: Job[];
  totalCount?: number;
  pendingCount?: number;
  pagination: {
    hasMore: boolean;
    nextGrade: number | null;
  }
}> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collectionName = createCollectionName(date);
    
    // Check if collection exists, if not return empty results
    const collections = await getJobCollections();
    if (!collections.includes(collectionName)) {
      return {
        jobs: [],
        totalCount: 0,
        pendingCount: 0,
        pagination: {
          hasMore: false,
          nextGrade: null
        }
      };
    }
    
    const collection = db.collection(collectionName);
    
    // Get total count and pending count if requested
    let totalCount: number | undefined = undefined;
    let pendingCount: number | undefined = undefined;
    
    if (includeTotalCount) {
      totalCount = await collection.countDocuments();
      
      // Count pending jobs (where date_applied is 'Pending' or not set)
      pendingCount = await collection.countDocuments({
        $or: [
          { date_applied: "Pending" },
          { date_applied: { $exists: false } },
          { date_applied: null }
        ]
      });
    }
    
    // Build our query object for pagination
    const filter: Record<string, any> = {};
    
    // Add cursor-based pagination if lastGrade is provided
    if (lastGrade !== null) {
      filter.grade = { $lt: lastGrade };
    }
    
    // Fetch jobs with pagination, sorted by grade
    const jobs = await collection
      .find(filter)
      .sort({ grade: -1 }) // Sort by grade descending
      .limit(limit + 1) // Fetch one extra to check if there are more
      .toArray();
    
    // Normalize all jobs
    const normalizedJobs = jobs.map(normalizeJob);
    
    // Check if we have more results
    const hasMore = normalizedJobs.length > limit;
    
    // Remove the extra item we used to check for more
    const paginatedJobs = hasMore ? normalizedJobs.slice(0, limit) : normalizedJobs;
    
    // Get the grade of the last item (for next cursor)
    const nextGrade = hasMore && paginatedJobs.length > 0 
      ? Number(paginatedJobs[paginatedJobs.length - 1].grade) 
      : null;
    
    return {
      jobs: paginatedJobs,
      totalCount,
      pendingCount,
      pagination: {
        hasMore,
        nextGrade
      }
    };
  } catch (error) {
    console.error('Error fetching jobs by date:', error);
    return { 
      jobs: [],
      totalCount: 0,
      pendingCount: 0,
      pagination: {
        hasMore: false,
        nextGrade: null
      }
    };
  }
}

/**
 * Gets a job by its ID and date
 */
export async function getJobById(jobId: string, date?: string): Promise<Job | null> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // If date is provided, look in that specific collection
    if (date) {
      const collectionName = createCollectionName(date);
      const collection = db.collection(collectionName);
      const job = await collection.findOne({ job_id: jobId });
      
      if (job) {
        return normalizeJob(job);
      }
    }
    
    // Otherwise, search through all collections
    const collections = await getJobCollections();
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const job = await collection.findOne({ job_id: jobId });
      
      if (job) {
        return normalizeJob(job);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching job with ID ${jobId}:`, error);
    return null;
  }
}

/**
 * Updates the status of a job application
 */
export async function updateJobStatus(jobId: string, status: string, date?: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // If date is provided, update in that specific collection
    if (date) {
      const collectionName = createCollectionName(date);
      const collection = db.collection(collectionName);
      
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
    }
    
    // Otherwise, find and update in the correct collection
    const collections = await getJobCollections();
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      // Check if job exists in this collection
      const job = await collection.findOne({ job_id: jobId });
      
      if (job) {
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
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating job status for job ${jobId}:`, error);
    return false;
  }
} 