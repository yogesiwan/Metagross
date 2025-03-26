import { NextRequest, NextResponse } from 'next/server';
import { getJobById } from '@/lib/jobData';

export async function GET(
  request: NextRequest,
  context: { params: { date: string; id: string } }
) {
  try {
    // Extract params from context
    const { id, date } = context.params;
    
    const job = await getJobById(id, date);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error fetching job by ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
} 