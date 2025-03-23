import { NextRequest, NextResponse } from 'next/server';
import { fetchJobDates } from '@/lib/jobData';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10); 
    
    // Get dates with pagination
    const dates = await fetchJobDates(limit, offset);
    
    return NextResponse.json({ 
      dates,
      hasMore: dates.length === limit // Boolean indicating if there are more results
    });
  } catch (error) {
    console.error('Error fetching job dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job dates' },
      { status: 500 }
    );
  }
} 