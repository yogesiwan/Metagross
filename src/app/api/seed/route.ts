import { NextRequest, NextResponse } from 'next/server';
import { generateDummyData } from '@/lib/dummyData';

export async function GET(request: NextRequest) {
  // Get MongoDB URI from environment variable
  const mongodbUri = process.env.MONGODB_URI;
  
  if (!mongodbUri) {
    return NextResponse.json(
      { error: 'MongoDB URI not configured' },
      { status: 500 }
    );
  }
  
  try {
    // Extract the count parameter from the URL query string
    const url = new URL(request.url);
    const countParam = url.searchParams.get('count');
    const count = countParam ? parseInt(countParam, 10) : 30;
    
    // Generate dummy data
    const success = await generateDummyData(mongodbUri, count);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Successfully generated ${count} dummy job records`
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to generate dummy data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in seed API route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 