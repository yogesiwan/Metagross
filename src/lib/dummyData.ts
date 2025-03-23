import { Job } from './models/job';
import { MongoClient, Document } from 'mongodb';
import { addDays, subDays, startOfDay } from 'date-fns';
import { ObjectId } from 'mongodb';

const DB_NAME = 'job_list';
const COLLECTION_NAME = 'job_applications';

/**
 * Generates dummy job data for testing
 */
export async function generateDummyData(connectionString: string): Promise<boolean> {
  try {
    // Connect to MongoDB
    const client = new MongoClient(connectionString);
    await client.connect();
    
    console.log('Connected to MongoDB to generate dummy data');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Clear existing data (optional - for testing)
    await collection.deleteMany({});
    
    // Generate dummy jobs
    const jobs: Partial<Job>[] = [];
    
    const jobTitles = [
      'Software Engineer', 'Front-end Developer', 'Back-end Developer',
      'Full Stack Developer', 'Data Scientist', 'DevOps Engineer',
      'Product Manager', 'UX Designer', 'QA Engineer',
      'Technical Writer', 'Machine Learning Engineer', 'Cloud Architect',
      'Cybersecurity Analyst', 'Database Administrator', 'Site Reliability Engineer',
      'Data Engineer', 'UI Designer', 'Mobile Developer', 'Project Manager'
    ];
    
    const companies = [
      'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta',
      'Netflix', 'Spotify', 'Twitter', 'LinkedIn', 'Uber',
      'Airbnb', 'Slack', 'Stripe', 'Shopify', 'Adobe',
      'Salesforce', 'IBM', 'Oracle', 'Intel', 'Nvidia',
      'Tesla', 'Square', 'Dropbox', 'Zoom', 'Twilio'
    ];
    
    const locations = [
      'New York, NY', 'San Francisco, CA', 'Seattle, WA', 'Austin, TX',
      'Boston, MA', 'Chicago, IL', 'Los Angeles, CA', 'Atlanta, GA',
      'Denver, CO', 'Remote', 'Portland, OR', 'Miami, FL', 'Dallas, TX',
      'Washington, DC', 'San Diego, CA', 'Phoenix, AZ', 'Toronto, ON',
      'Vancouver, BC', 'London, UK', 'Berlin, Germany'
    ];
    
    const workStyles = ['Remote', 'Hybrid', 'On-site'];
    
    // Create dummy data with different scrape dates (generating 10 full days)
    const now = new Date();
    
    // Generate scrape dates - last 10 days
    const scrapeDates: Date[] = [];
    for (let i = 0; i < 10; i++) {
      scrapeDates.push(subDays(now, i));
    }
    
    // Total job counter
    let totalJobCounter = 0;
    
    // For each date, create at least 30 jobs
    for (let dateIndex = 0; dateIndex < scrapeDates.length; dateIndex++) {
      const scrapeDate = scrapeDates[dateIndex];
      const scrapeISOString = scrapeDate.toISOString();
      const scrapeYYYYMMDD = scrapeISOString.split('T')[0]; // Format as YYYY-MM-DD
      
      // Generate between 30-50 jobs per date to have varying amounts
      const jobsPerDate = Math.floor(Math.random() * 21) + 30; // Random number between 30-50
      
      for (let i = 0; i < jobsPerDate; i++) {
        totalJobCounter++;
        
        // Randomize creation date (usually same as scrape date or earlier)
        const createdDate = new Date(scrapeDate);
        if (Math.random() > 0.5) {
          // 50% chance to have been created a bit before being scraped (1-3 days)
          createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 3) - 1);
        }
        const createdAtISO = createdDate.toISOString();
        
        // Generate a date when the job was listed (usually before scrape date)
        const listedDate = new Date(createdDate);
        listedDate.setDate(listedDate.getDate() - Math.floor(Math.random() * 7) - 1); // Listed 1-7 days before creation
        const listedDateISO = listedDate.toISOString();
        
        // Simulate pending applications (70% of jobs will be in Pending status)
        const isPending = Math.random() > 0.3;
        const applied = isPending ? 'Pending' : createdAtISO;
        
        const job: Partial<Job> = {
          job_id: `job-${totalJobCounter}`,
          title: jobTitles[Math.floor(Math.random() * jobTitles.length)],
          company: companies[Math.floor(Math.random() * companies.length)],
          work_location: locations[Math.floor(Math.random() * locations.length)],
          work_style: workStyles[Math.floor(Math.random() * workStyles.length)],
          description: `This is a job description for position ${totalJobCounter}. It includes responsibilities and requirements for a ${jobTitles[Math.floor(Math.random() * jobTitles.length)]} role. The ideal candidate will have experience with various technologies and tools relevant to the position.`,
          experience_required: Math.floor(Math.random() * 10) + 1,
          skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker'].slice(0, Math.floor(Math.random() * 4) + 2),
          hr_name: `HR Person ${totalJobCounter}`,
          hr_link: `https://linkedin.com/in/hr-person-${totalJobCounter}`,
          resume: `resume-${totalJobCounter % 5 + 1}.pdf`,
          reposted: Math.random() > 0.5,
          date_listed: listedDateISO,
          date_applied: applied,
          job_link: `https://example.com/jobs/${totalJobCounter}`,
          application_link: `https://example.com/apply/${totalJobCounter}`,
          questions: [
            {
              question: 'Why do you want to work with us?',
              answer: 'I am passionate about the industry and would love to contribute to your team.',
              type: 'text',
              previous_answer: ''
            },
            {
              question: 'How many years of experience do you have?',
              answer: `${Math.floor(Math.random() * 8) + 2} years`,
              type: 'text',
              previous_answer: ''
            }
          ],
          connect_request: 'Pending',
          grade: Math.floor(Math.random() * 1000) + 1,
          created_at: createdAtISO,
          scraped_on: scrapeYYYYMMDD,
          status: isPending ? 'Pending' : (Math.random() > 0.5 ? 'Applied' : 'Interview')
        };
        
        jobs.push(job);
      }
    }
    
    // Insert dummy data into MongoDB
    if (jobs.length > 0) {
      await collection.insertMany(jobs as Document[]);
      console.log(`${jobs.length} dummy jobs inserted into MongoDB across 10 days`);
    }
    
    await client.close();
    return true;
  } catch (error) {
    console.error('Error generating dummy data:', error);
    return false;
  }
} 