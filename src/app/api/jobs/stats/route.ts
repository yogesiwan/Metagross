import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'job_list';
const COLLECTION_NAME = 'job_applications';

export async function GET(_request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Get job count by scraped_on date
    const stats = await collection.aggregate([
      { $group: { _id: '$scraped_on', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },  // Sort by date descending (newest first)
      { $limit: 10 }  // Only get stats for the last 10 dates
    ]).toArray();

    // Format to a more usable structure
    const dateStats = stats.map(stat => ({
      date: stat._id,
      count: stat.count
    }));

    return NextResponse.json({ dateStats });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job statistics' },
      { status: 500 }
    );
  }
} 