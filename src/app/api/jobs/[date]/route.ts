import { NextRequest, NextResponse } from 'next/server';
import { getJobsByDate } from '@/lib/jobData';

interface Params {
  params: {
    date: string;
  };
}

export async function GET(
  request: NextRequest,
  context: Params
) {
  try {
    // Correctly access params in App Router
    const { date } = context.params;
    
    // Validate date format (YYYY-MM-DD)
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    // Parse query parameters for pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const lastGrade = url.searchParams.get('lastGrade') 
      ? parseInt(url.searchParams.get('lastGrade') || '0', 10)
      : undefined;
    
    // Get paginated jobs
    const { jobs, hasMore, nextGrade } = await getJobsByDate(date, limit, lastGrade);
    
    return NextResponse.json({ 
      date, 
      jobs,
      pagination: {
        hasMore,
        nextGrade
      }
    });
  } catch (error) {
    console.error('Error fetching jobs by date:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
} 