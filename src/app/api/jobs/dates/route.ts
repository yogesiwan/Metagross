import { NextRequest, NextResponse } from 'next/server';
import { getJobDates } from '@/lib/jobData';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const cursor = url.searchParams.get('cursor'); // Date cursor for pagination
    
    // Get dates with pagination
    const { dates, nextCursor } = await getJobDates(limit, cursor);
    
    return NextResponse.json({ 
      dates,
      nextCursor, // Return the next cursor for subsequent requests
      hasMore: !!nextCursor // Boolean indicating if there are more results
    });
  } catch (error) {
    console.error('Error fetching job dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job dates' },
      { status: 500 }
    );
  }
} 