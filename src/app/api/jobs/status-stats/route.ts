import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'job_list';
const COLLECTION_NAME = 'job_applications';

export async function GET(_request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Extract date from date_listed for consistent grouping
    const pipeline = [
      {
        $addFields: {
          // Extract YYYY-MM-DD from date_listed
          dateKey: {
            $substr: ["$date_listed", 0, 10]
          }
        }
      },
      { 
        $group: { 
          _id: '$dateKey', 
          totalCount: { $sum: 1 },
          pendingCount: { 
            $sum: { 
              $cond: [
                { $or: [
                  { $eq: ["$status", "Pending"] },
                  { $eq: ["$status", null] }  // Also count nulls as pending
                ]}, 
                1, 
                0
              ] 
            } 
          }
        } 
      },
      { $sort: { _id: -1 } },  // Sort by date descending (newest first)
      { $limit: 10 }  // Only get stats for the last 10 dates
    ];

    const stats = await collection.aggregate(pipeline).toArray();

    // Format to a more usable structure
    const statusStats = stats.map(stat => ({
      date: stat._id,
      totalCount: stat.totalCount,
      pendingCount: stat.pendingCount
    }));

    return NextResponse.json({ statusStats });
  } catch (error) {
    console.error('Error fetching job status stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status statistics' },
      { status: 500 }
    );
  }
} 