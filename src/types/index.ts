export interface School {
  id: string;
  name: string;
  logo_url?: string | null;
  election_title: string;
  election_description: string;
  is_voting_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  school_id: string;
  name: string;
  candidate_number: number;
  photo_url?: string | null;
  vision: string;
  mission: string;
  class_grade: string;
  created_at: string;
  updated_at: string;
  vote_count?: number;
}

export interface Vote {
  id: string;
  candidate_id: string;
  school_id: string;
  voter_ip: string;
  voter_fingerprint: string;
  created_at: string;
}

export interface Admin {
  id: string;
  school_id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface VoteData {
  candidate_id: string;
  count: number;
}