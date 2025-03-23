import { NextRequest, NextResponse } from 'next/server';
import { updateJobStatus } from '@/lib/jobData';

interface Params {
  date: string;
  id: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Correctly access params in App Router
    const { id } = params;
    
    // Parse request body to get the status
    const body = await request.json();
    const { status } = body;
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    
    const success = await updateJobStatus(id, status);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to update job status or job not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { error: 'Failed to update job status' },
      { status: 500 }
    );
  }
} 