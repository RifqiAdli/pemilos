import React, { useState } from 'react';
import { useVoting } from '../hooks/useVoting';
import CandidateCard from './CandidateCard';
import { School, Users, Vote, BarChart3, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

const VotingPage: React.FC = () => {
  const { school, candidates, votes, loading, hasVoted, submitVote } = useVoting();
  const [showResults, setShowResults] = useState(false);
  
  const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);

  const handleVote = async (candidateId: string) => {
    const success = await submitVote(candidateId);
    if (success) {
      // Auto show results after voting
      setTimeout(() => setShowResults(true), 1000);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <School className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Data Sekolah Tidak Ditemukan</h2>
          <p className="text-gray-600">Silakan hubungi administrator untuk setup awal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            {school.logo_url && (
              <img src={school.logo_url} alt="Logo" className="w-16 h-16 object-contain" />
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{school.name}</h1>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold text-blue-600 mb-2">{school.election_title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{school.election_description}</p>
          
          {/* Status indicators */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{candidates.length} Kandidat</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Vote className="w-5 h-5" />
              <span>{totalVotes} Total Suara</span>
            </div>
            <div className={`flex items-center gap-2 ${school.is_voting_open ? 'text-green-600' : 'text-red-600'}`}>
              <Calendar className="w-5 h-5" />
              <span>{school.is_voting_open ? 'Voting Dibuka' : 'Voting Ditutup'}</span>
            </div>
          </div>
        </motion.div>

        {/* Toggle Results Button */}
        <div className="text-center mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowResults(!showResults)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
          >
            <BarChart3 className="w-5 h-5" />
            {showResults ? 'Sembunyikan Hasil' : 'Lihat Hasil Sementara'}
          </motion.button>
        </div>

        {/* Voting status message */}
        {hasVoted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-100 border border-green-300 rounded-lg p-4 mb-8 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Vote className="w-5 h-5" />
              <span className="font-semibold">Terima kasih! Vote Anda sudah tersimpan.</span>
            </div>
          </motion.div>
        )}

        {!school.is_voting_open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-100 border border-red-300 rounded-lg p-4 mb-8 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-red-700">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold">Periode voting sudah ditutup.</span>
            </div>
          </motion.div>
        )}

        {/* Candidates Grid */}
        {candidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {candidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CandidateCard
                  candidate={candidate}
                  votes={votes}
                  onVote={handleVote}
                  hasVoted={hasVoted}
                  votingOpen={school.is_voting_open}
                  showVoteCount={showResults}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Belum Ada Kandidat</h3>
            <p className="text-gray-600">Administrator belum menambahkan kandidat.</p>
          </div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16 pt-8 border-t border-gray-200"
        >
          <p className="text-gray-500">
            Sistem Pemilihan OSIS Digital - {school.name}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default VotingPage;