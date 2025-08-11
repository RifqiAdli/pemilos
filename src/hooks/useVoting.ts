import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Candidate, School, VoteData } from '../types';
import toast from 'react-hot-toast';

export const useVoting = () => {
  const [school, setSchool] = useState<School | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);

  const generateFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Voting fingerprint', 2, 2);
    }
    
    return canvas.toDataURL() + 
           navigator.userAgent + 
           screen.width + 
           screen.height + 
           new Date().getTimezoneOffset();
  };

  const fetchSchoolData = async () => {
    try {
      // Ambil sekolah pertama yang tersedia, atau filter berdasarkan kondisi tertentu
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Error fetching school:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setSchool(data[0]);
      }
    } catch (error) {
      console.error('Error fetching school:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('candidate_number');
      
      if (error) {
        console.error('Error fetching candidates:', error);
        return;
      }
      
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('candidate_id');
      
      if (error) {
        console.error('Error fetching votes:', error);
        return;
      }

      const voteCounts: { [key: string]: number } = {};
      data?.forEach((vote) => {
        voteCounts[vote.candidate_id] = (voteCounts[vote.candidate_id] || 0) + 1;
      });

      const voteData = Object.entries(voteCounts).map(([candidate_id, count]) => ({
        candidate_id,
        count,
      }));

      setVotes(voteData);
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const checkIfVoted = async () => {
    try {
      const fingerprint = generateFingerprint();
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('voter_fingerprint', fingerprint);
      
      if (error) {
        console.error('Error checking vote status:', error);
        setHasVoted(false);
        return;
      }
      
      setHasVoted(data && data.length > 0);
    } catch (error) {
      console.error('Error checking vote status:', error);
      setHasVoted(false);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      // Coba beberapa service IP
      const response = await fetch('https://api.ipify.org?format=json', {
        timeout: 5000,
      } as any);
      
      if (!response.ok) {
        throw new Error('IP service unavailable');
      }
      
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      console.warn('Could not get IP address:', error);
      // Fallback ke browser fingerprint jika IP tidak bisa didapat
      return 'browser_' + Date.now();
    }
  };

  const submitVote = async (candidateId: string) => {
    if (hasVoted) {
      toast.error('Anda sudah melakukan voting!');
      return false;
    }

    if (!school) {
      toast.error('Data sekolah tidak ditemukan!');
      return false;
    }

    if (!school.is_voting_open) {
      toast.error('Periode voting sudah ditutup!');
      return false;
    }

    try {
      const fingerprint = generateFingerprint();
      const userIP = await getClientIP();

      console.log('Submitting vote with data:', {
        candidate_id: candidateId,
        school_id: school.id,
        voter_ip: userIP,
        voter_fingerprint: fingerprint.substring(0, 255), // Batasi panjang fingerprint
      });

      const { data, error } = await supabase
        .from('votes')
        .insert({
          candidate_id: candidateId,
          school_id: school.id,
          voter_ip: userIP,
          voter_fingerprint: fingerprint.substring(0, 255), // Batasi panjang
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        
        if (error.code === '23505') {
          toast.error('Anda sudah melakukan voting!');
          setHasVoted(true);
        } else if (error.code === '23503') {
          toast.error('Candidate atau school tidak ditemukan!');
        } else {
          toast.error(`Error: ${error.message}`);
        }
        return false;
      }

      console.log('Vote submitted successfully:', data);
      toast.success('Vote berhasil disimpan!');
      setHasVoted(true);
      fetchVotes();
      return true;
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Terjadi kesalahan saat menyimpan vote!');
      return false;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchSchoolData(),
          fetchCandidates(),
          fetchVotes(),
          checkIfVoted(),
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Set up real-time subscriptions dengan error handling
    const votesSubscription = supabase
      .channel('votes_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
      }, (payload) => {
        console.log('Votes changed:', payload);
        fetchVotes();
      })
      .subscribe((status) => {
        console.log('Votes subscription status:', status);
      });

    const candidatesSubscription = supabase
      .channel('candidates_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'candidates',
      }, (payload) => {
        console.log('Candidates changed:', payload);
        fetchCandidates();
      })
      .subscribe((status) => {
        console.log('Candidates subscription status:', status);
      });

    const schoolsSubscription = supabase
      .channel('schools_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'schools',
      }, (payload) => {
        console.log('Schools changed:', payload);
        fetchSchoolData();
      })
      .subscribe((status) => {
        console.log('Schools subscription status:', status);
      });

    return () => {
      votesSubscription.unsubscribe();
      candidatesSubscription.unsubscribe();
      schoolsSubscription.unsubscribe();
    };
  }, []);

  return {
    school,
    candidates,
    votes,
    loading,
    hasVoted,
    submitVote,
  };
};