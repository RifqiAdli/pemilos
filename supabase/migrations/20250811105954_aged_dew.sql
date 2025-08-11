/*
  # OSIS Election System Database Schema

  1. New Tables
    - `schools`
      - `id` (uuid, primary key)
      - `name` (text)
      - `logo_url` (text, optional)
      - `election_title` (text)
      - `election_description` (text)
      - `is_voting_open` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `candidates`
      - `id` (uuid, primary key) 
      - `school_id` (uuid, foreign key)
      - `name` (text)
      - `candidate_number` (integer, unique per school)
      - `photo_url` (text, optional)
      - `vision` (text)
      - `mission` (text)
      - `class_grade` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `votes`
      - `id` (uuid, primary key)
      - `candidate_id` (uuid, foreign key)
      - `school_id` (uuid, foreign key)
      - `voter_ip` (text)
      - `voter_fingerprint` (text)
      - `created_at` (timestamp)

    - `admins`
      - `id` (uuid, primary key)
      - `school_id` (uuid, foreign key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (text, default 'admin')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public voting access
    - Add policies for admin management
    - Add policies for real-time subscriptions

  3. Indexes
    - Add indexes for performance optimization
    - Unique constraints for candidate numbers per school
*/

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'SMP Negeri 1',
  logo_url text,
  election_title text NOT NULL DEFAULT 'Pemilihan OSIS 2024',
  election_description text DEFAULT 'Pilih calon ketua dan wakil ketua OSIS terbaik untuk sekolah kita',
  is_voting_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Candidates table  
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  candidate_number integer NOT NULL,
  photo_url text,
  vision text NOT NULL DEFAULT '',
  mission text NOT NULL DEFAULT '',
  class_grade text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, candidate_number)
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  voter_ip text NOT NULL,
  voter_fingerprint text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(school_id, voter_fingerprint)
);

-- Admins table (linked to auth.users)
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_school_id ON candidates(school_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_votes_school_id ON votes(school_id);
CREATE INDEX IF NOT EXISTS idx_admins_school_id ON admins(school_id);

-- Enable RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schools
CREATE POLICY "Schools are viewable by everyone"
  ON schools FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Schools can be updated by admins"
  ON schools FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() AND admins.school_id = schools.id
    )
  );

-- RLS Policies for candidates  
CREATE POLICY "Candidates are viewable by everyone"
  ON candidates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Candidates can be managed by school admins"
  ON candidates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() AND admins.school_id = candidates.school_id
    )
  );

-- RLS Policies for votes
CREATE POLICY "Votes can be inserted by everyone"
  ON votes FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Vote counts are viewable by everyone" 
  ON votes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Votes can be managed by school admins"
  ON votes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() AND admins.school_id = votes.school_id
    )
  );

-- RLS Policies for admins
CREATE POLICY "Admins can view their own data"
  ON admins FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update their own data"
  ON admins FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Insert default school data
INSERT INTO schools (name, election_title, election_description) 
VALUES ('SMP Negeri 1', 'Pemilihan OSIS 2024', 'Pilih calon ketua dan wakil ketua OSIS terbaik untuk sekolah kita')
ON CONFLICT DO NOTHING;

-- Insert sample candidates
DO $$
DECLARE
  school_uuid uuid;
BEGIN
  SELECT id INTO school_uuid FROM schools LIMIT 1;
  
  INSERT INTO candidates (school_id, name, candidate_number, vision, mission, class_grade) VALUES 
  (school_uuid, 'Ahmad Rizki Pratama', 1, 'Menjadikan OSIS sebagai wadah yang dapat menampung aspirasi seluruh siswa dan menciptakan lingkungan sekolah yang harmonis.', 'Mengadakan kegiatan yang bermanfaat, meningkatkan prestasi sekolah, dan menciptakan komunikasi yang baik antara siswa dan guru.', '9A'),
  (school_uuid, 'Siti Nurhaliza Putri', 2, 'Membangun OSIS yang inovatif, kreatif, dan mampu menjadi teladan bagi seluruh siswa di sekolah.', 'Mengorganisir event-event menarik, meningkatkan fasilitas sekolah, dan membangun kebersamaan antar siswa.', '9B'),
  (school_uuid, 'Muhammad Fajar Sidiq', 3, 'Menciptakan OSIS yang transparan, bertanggung jawab, dan selalu mengutamakan kepentingan bersama.', 'Menyediakan program pengembangan bakat siswa, meningkatkan kedisiplinan, dan memperkuat nilai-nilai Pancasila.', '9C')
  ON CONFLICT DO NOTHING;
END $$;