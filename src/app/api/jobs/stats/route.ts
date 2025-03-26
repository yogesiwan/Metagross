import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'job_list';
const COLLECTION_PREFIX = 'job_applications_';

export async function GET(_request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Get all collections that match our prefix
    const collections = await db.listCollections().toArray();
    const jobCollections = collections
      .filter(collection => collection.name.startsWith(COLLECTION_PREFIX))
      .map(collection => collection.name);
    
    // For each collection, count the documents and extract the date from the collection name
    const statsPromises = jobCollections.map(async (collectionName) => {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      const date = collectionName.replace(COLLECTION_PREFIX, '');
      return { date, count };
    });
    
    // Wait for all counts to complete
    const stats = await Promise.all(statsPromises);
    
    // Sort by date descending (newest first) and limit to 10
    const dateStats = stats
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    
    return NextResponse.json({ dateStats });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job statistics' },
      { status: 500 }
    );
  }
} 