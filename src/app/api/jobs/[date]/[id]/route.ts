import { NextRequest, NextResponse } from 'next/server';
import { getJobById } from '@/lib/jobData';

interface Params {
  date: string;
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Correctly access params in App Router
    const { id } = params;
    
    const job = await getJobById(id);
    
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