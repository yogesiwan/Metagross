'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Image from 'next/image';

export default function Home() {
  const [seeds, setSeeds] = useState<null | { success: boolean; message: string }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typedText, setTypedText] = useState('');
  const fullText = 'Welcome';
  
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 150);
    
    return () => clearInterval(typingInterval);
  }, []);
  
  const generateDummyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // We're not specifying a count since our updated implementation 
      // will generate at least 30 jobs per day for 10 days
      const response = await fetch('/api/seed');
      
      if (!response.ok) {
        throw new Error('Failed to generate dummy data');
      }
      
      const data = await response.json();
      setSeeds(data);
      setLoading(false);
    } catch (err) {
      console.error('Error generating dummy data:', err);
      setError('Failed to generate dummy data. Please try again later.');
      setLoading(false);
    }
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-blue-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-25">
          <h1 className="text-4xl font-bold mb-4 text-blue-500 typing-cursor">
            {typedText}
          </h1>
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <Image src="/metagross.png" alt="Metagross" width={250} height={400} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card
            title="Dashboard"
            description="View Stats"
            href="/dashboard"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            }
          />
          
          <Card
            title="Generate Data"
            description="Generate 10 days of job data (30+ jobs per day)"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            }
            onClick={generateDummyData}
          />
          
          <Card
            title="GitHub Repository"
            description="View source code and documentation"
            href="https://github.com/yourgithub/metagross"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582A1 1 0 004 6.82v10.193a1 1 0 001.447.894l4-1.6a1 1 0 00.553-.894v-7.4l6.558-2.447A1 1 0 0018 4.82V3a1 1 0 00-1-1H10zm8 3.75V4.82a.148.148 0 00-.211-.134L11 7.133V16.6c0 .04-.02.077-.042.106L6 18.333V6.82a.148.148 0 01.094-.139l3.954-1.582A1 1 0 0010 4.181V3h8v2.75z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>
        
        {loading && (
          <div className="flex justify-center items-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Generating data...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-8 mx-auto max-w-md">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {seeds && (
          <div className="mt-6 text-center text-green-500">
            <p>{seeds.message}</p>
          </div>
        )}
    </div>
    </main>
  );
}