import { NextRequest, NextResponse } from 'next/server';
import { fetchJobsByDate } from '@/lib/jobData';

export async function GET(
  request: NextRequest,
  context: { params: { date: string } }
) {
  try {
    // Extract date from context
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
      : null;
    
    // Get paginated jobs with total count and pending count
    const result = await fetchJobsByDate(date, limit, lastGrade, true);
    
    return NextResponse.json({ 
      date, 
      jobs: result.jobs,
      totalCount: result.totalCount,
      pendingCount: result.pendingCount,
      pagination: {
        hasMore: result.pagination.hasMore,
        nextGrade: result.pagination.nextGrade
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