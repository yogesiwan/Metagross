export interface JobQuestion {
  question: string;
  answer: string;
  type: string;
  previous_answer: string | null;
}

export interface Job {
  _id?: {
    $oid: string;
  };
  job_id: string;
  title: string;
  company: string;
  work_location: string;
  work_style: string;
  description: string;
  experience_required: number | { $numberInt: string };
  skills: string;
  hr_name: string;
  hr_link: string;
  resume: string;
  reposted: boolean;
  date_listed: string;
  date_applied: string;
  job_link: string;
  application_link: string;
  questions: JobQuestion[];
  connect_request: string;
  grade: number;
  created_at: string;
  scraped_on?: string;
  status?: string;
  updated_at?: string;
}

export interface JobsByDate {
  date: string;
  jobs: Job[];
} 