import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          election_title: string;
          election_description: string;
          is_voting_open: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          election_title?: string;
          election_description?: string;
          is_voting_open?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          election_title?: string;
          election_description?: string;
          is_voting_open?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      candidates: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          candidate_number: number;
          photo_url: string | null;
          vision: string;
          mission: string;
          class_grade: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          candidate_number: number;
          photo_url?: string | null;
          vision?: string;
          mission?: string;
          class_grade?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          name?: string;
          candidate_number?: number;
          photo_url?: string | null;
          vision?: string;
          mission?: string;
          class_grade?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          candidate_id: string;
          school_id: string;
          voter_ip: string;
          voter_fingerprint: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          school_id: string;
          voter_ip: string;
          voter_fingerprint: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          school_id?: string;
          voter_ip?: string;
          voter_fingerprint?: string;
          created_at?: string;
        };
      };
      admins: {
        Row: {
          id: string;
          school_id: string;
          email: string;
          name: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          school_id: string;
          email: string;
          name: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          email?: string;
          name?: string;
          role?: string;
          created_at?: string;
        };
      };
    };
  };
};