import React, { useState } from "react";
import { useVoting } from "../hooks/useVoting";
import CandidateCard from "./CandidateCard";
import { School, Users, Vote, BarChart3, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";

const VotingPage: React.FC = () => {
  const { school, candidates, votes, loading, hasVoted, submitVote } = useVoting();
  const [showResults, setShowResults] = useState(false);

  const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);

  const handleVote = async (candidateId: string) => {
    const success = await submitVote(candidateId);
    if (success) {
      setTimeout(() => setShowResults(true), 1000);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <School className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Data Sekolah Tidak Ditemukan
          </h2>
          <p className="text-gray-600">
            Silakan hubungi administrator untuk setup awal.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-8 px-4 bg-gradient-to-b from-white via-blue-50 to-white"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 p-6 rounded-xl shadow-sm bg-white/70 backdrop-blur"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            {school.logo_url && (
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={school.logo_url}
                alt="Logo"
                className="w-16 h-16 object-contain"
              />
            )}
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800">
                {school.name}
              </h1>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-blue-600 mb-2">
            {school.election_title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {school.election_description}
          </p>

          {/* Status indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6">
            <StatusItem icon={<Users />} text={`${candidates.length} Kandidat`} />
            <StatusItem icon={<Vote />} text={`${totalVotes} Total Suara`} />
            <StatusItem
              icon={<Calendar />}
              text={school.is_voting_open ? "Voting Dibuka" : "Voting Ditutup"}
              color={school.is_voting_open ? "text-green-600" : "text-red-600"}
            />
          </div>
        </motion.div>

        {/* Toggle Results Button */}
        <div className="text-center mb-8">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(34,197,94,0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowResults(!showResults)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold transition-all shadow-md"
          >
            <BarChart3 className="w-5 h-5" />
            {showResults ? "Sembunyikan Hasil" : "Lihat Hasil Sementara"}
          </motion.button>
        </div>

        {/* Voting status message */}
        {hasVoted && (
          <StatusMessage
            type="success"
            icon={<Vote className="w-5 h-5" />}
            message="Terima kasih! Vote Anda sudah tersimpan."
          />
        )}

        {!school.is_voting_open && (
          <StatusMessage
            type="error"
            icon={<Calendar className="w-5 h-5" />}
            message="Periode voting sudah ditutup."
          />
        )}

        {/* Candidates Grid */}
        {candidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {candidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
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
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Belum Ada Kandidat
            </h3>
            <p className="text-gray-600">
              Administrator belum menambahkan kandidat.
            </p>
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
    </motion.div>
  );
};

export default VotingPage;

/* -------------------- COMPONENTS -------------------- */
const StatusItem = ({ icon, text, color = "text-gray-600" }) => (
  <div className={`flex items-center gap-2 ${color}`}>
    {icon}
    <span>{text}</span>
  </div>
);

const StatusMessage = ({ type, icon, message }) => {
  const bg =
    type === "success"
      ? "bg-green-100 border-green-300 text-green-700"
      : "bg-red-100 border-red-300 text-red-700";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`border rounded-lg p-4 mb-8 text-center ${bg}`}
    >
      <div className="flex items-center justify-center gap-2 font-semibold">
        {icon}
        <span>{message}</span>
      </div>
    </motion.div>
  );
};
