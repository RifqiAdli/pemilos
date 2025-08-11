import React from 'react';
import { Candidate, VoteData } from '../types';
import { User, Vote } from 'lucide-react';
import { motion } from 'framer-motion';

interface CandidateCardProps {
  candidate: Candidate;
  votes: VoteData[];
  onVote?: (candidateId: string) => void;
  hasVoted: boolean;
  votingOpen: boolean;
  showVoteCount?: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  votes,
  onVote,
  hasVoted,
  votingOpen,
  showVoteCount = false,
}) => {
  const voteCount = votes.find(v => v.candidate_id === candidate.id)?.count || 0;
  const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);
  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  const handleVote = () => {
    if (onVote && !hasVoted && votingOpen) {
      onVote(candidate.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Header with candidate number */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Kandidat #{candidate.candidate_number}</h3>
          {showVoteCount && (
            <div className="text-right">
              <div className="text-2xl font-bold">{voteCount}</div>
              <div className="text-sm opacity-90">suara ({percentage}%)</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Candidate photo */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-blue-100">
            {candidate.photo_url ? (
              <img
                src={candidate.photo_url}
                alt={candidate.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Candidate info */}
        <div className="text-center mb-4">
          <h4 className="text-xl font-bold text-gray-800 mb-1">{candidate.name}</h4>
          <p className="text-gray-600 font-medium">Kelas {candidate.class_grade}</p>
        </div>

        {/* Vision */}
        <div className="mb-4">
          <h5 className="font-semibold text-gray-800 mb-2">Visi:</h5>
          <p className="text-gray-600 text-sm leading-relaxed">{candidate.vision}</p>
        </div>

        {/* Mission */}
        <div className="mb-6">
          <h5 className="font-semibold text-gray-800 mb-2">Misi:</h5>
          <p className="text-gray-600 text-sm leading-relaxed">{candidate.mission}</p>
        </div>

        {/* Vote button */}
        {onVote && (
          <motion.button
            whileHover={{ scale: hasVoted || !votingOpen ? 1 : 1.05 }}
            whileTap={{ scale: hasVoted || !votingOpen ? 1 : 0.95 }}
            onClick={handleVote}
            disabled={hasVoted || !votingOpen}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              hasVoted
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : !votingOpen
                ? 'bg-red-100 text-red-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            <Vote className="w-5 h-5" />
            {hasVoted 
              ? 'Sudah Voting' 
              : !votingOpen 
              ? 'Voting Ditutup'
              : 'Pilih Kandidat Ini'
            }
          </motion.button>
        )}

        {/* Vote progress bar for results view */}
        {showVoteCount && totalVotes > 0 && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CandidateCard;