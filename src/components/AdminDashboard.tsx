import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { School, Candidate, VoteData } from '../types';
import { 
  Users, 
  Vote, 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  BarChart3,
  LogOut,
  School as SchoolIcon,
  Image,
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const { admin, signOut } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'settings'>('overview');
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    candidate_number: 1,
    photo_url: '',
    vision: '',
    mission: '',
    class_grade: '',
  });

  const [schoolForm, setSchoolForm] = useState({
    name: '',
    logo_url: '',
    election_title: '',
    election_description: '',
    is_voting_open: true,
  });

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const votesSubscription = supabase
      .channel('admin_votes_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
      }, () => {
        fetchVotes();
      })
      .subscribe();

    const candidatesSubscription = supabase
      .channel('admin_candidates_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'candidates',
      }, () => {
        fetchCandidates();
      })
      .subscribe();

    return () => {
      votesSubscription.unsubscribe();
      candidatesSubscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSchool(),
      fetchCandidates(),
      fetchVotes(),
    ]);
    setLoading(false);
  };

  const fetchSchool = async () => {
    try {
      const { data } = await supabase
        .from('schools')
        .select('*')
        .single();
      
      if (data) {
        setSchool(data);
        setSchoolForm({
          name: data.name,
          logo_url: data.logo_url || '',
          election_title: data.election_title,
          election_description: data.election_description,
          is_voting_open: data.is_voting_open,
        });
      }
    } catch (error) {
      console.error('Error fetching school:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const { data } = await supabase
        .from('candidates')
        .select('*')
        .order('candidate_number');
      
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const fetchVotes = async () => {
    try {
      const { data } = await supabase
        .from('votes')
        .select('candidate_id');
      
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

  const handleSchoolUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;

    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: schoolForm.name,
          logo_url: schoolForm.logo_url || null,
          election_title: schoolForm.election_title,
          election_description: schoolForm.election_description,
          is_voting_open: schoolForm.is_voting_open,
          updated_at: new Date().toISOString(),
        })
        .eq('id', school.id);

      if (error) throw error;

      toast.success('Pengaturan sekolah berhasil diperbarui!');
      fetchSchool();
    } catch (error) {
      console.error('Error updating school:', error);
      toast.error('Gagal memperbarui pengaturan sekolah');
    }
  };

  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;

    try {
      if (editingCandidate) {
        // Update existing candidate
        const { error } = await supabase
          .from('candidates')
          .update({
            name: candidateForm.name,
            candidate_number: candidateForm.candidate_number,
            photo_url: candidateForm.photo_url || null,
            vision: candidateForm.vision,
            mission: candidateForm.mission,
            class_grade: candidateForm.class_grade,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCandidate.id);

        if (error) throw error;
        toast.success('Kandidat berhasil diperbarui!');
      } else {
        // Add new candidate
        const { error } = await supabase
          .from('candidates')
          .insert({
            school_id: school.id,
            name: candidateForm.name,
            candidate_number: candidateForm.candidate_number,
            photo_url: candidateForm.photo_url || null,
            vision: candidateForm.vision,
            mission: candidateForm.mission,
            class_grade: candidateForm.class_grade,
          });

        if (error) throw error;
        toast.success('Kandidat berhasil ditambahkan!');
      }

      // Reset form
      setCandidateForm({
        name: '',
        candidate_number: candidates.length + 1,
        photo_url: '',
        vision: '',
        mission: '',
        class_grade: '',
      });
      setShowAddCandidate(false);
      setEditingCandidate(null);
      fetchCandidates();
    } catch (error: any) {
      console.error('Error saving candidate:', error);
      if (error.code === '23505') {
        toast.error('Nomor kandidat sudah digunakan!');
      } else {
        toast.error('Gagal menyimpan kandidat');
      }
    }
  };

  const handleDeleteCandidate = async (candidate: Candidate) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kandidat ${candidate.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidate.id);

      if (error) throw error;

      toast.success('Kandidat berhasil dihapus!');
      fetchCandidates();
      fetchVotes();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast.error('Gagal menghapus kandidat');
    }
  };

  const startEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setCandidateForm({
      name: candidate.name,
      candidate_number: candidate.candidate_number,
      photo_url: candidate.photo_url || '',
      vision: candidate.vision,
      mission: candidate.mission,
      class_grade: candidate.class_grade,
    });
    setShowAddCandidate(true);
  };

  const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <SchoolIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">{school?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Halo, {admin?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'candidates', label: 'Kandidat', icon: Users },
              { key: 'settings', label: 'Pengaturan', icon: Settings },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Kandidat</p>
                    <p className="text-3xl font-bold text-gray-900">{candidates.length}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Suara</p>
                    <p className="text-3xl font-bold text-gray-900">{totalVotes}</p>
                  </div>
                  <Vote className="w-12 h-12 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Status Voting</p>
                    <p className={`text-lg font-semibold ${
                      school?.is_voting_open ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {school?.is_voting_open ? 'Dibuka' : 'Ditutup'}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    school?.is_voting_open ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {school?.is_voting_open ? (
                      <Eye className="w-6 h-6 text-green-500" />
                    ) : (
                      <EyeOff className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Vote Results */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hasil Voting Real-time</h3>
              <div className="space-y-4">
                {candidates.map((candidate) => {
                  const voteCount = votes.find(v => v.candidate_id === candidate.id)?.count || 0;
                  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                  
                  return (
                    <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                          #{candidate.candidate_number}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                          <p className="text-sm text-gray-600">Kelas {candidate.class_grade}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{voteCount}</p>
                        <p className="text-sm text-gray-600">suara ({percentage}%)</p>
                      </div>
                    </div>
                  );
                })}
                
                {candidates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada kandidat yang terdaftar
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Kelola Kandidat</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowAddCandidate(true);
                  setEditingCandidate(null);
                  setCandidateForm({
                    name: '',
                    candidate_number: candidates.length + 1,
                    photo_url: '',
                    vision: '',
                    mission: '',
                    class_grade: '',
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Tambah Kandidat
              </motion.button>
            </div>

            {/* Candidates List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {candidates.map((candidate) => {
                const voteCount = votes.find(v => v.candidate_id === candidate.id)?.count || 0;
                
                return (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-xl">
                          #{candidate.candidate_number}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                          <p className="text-gray-600">Kelas {candidate.class_grade}</p>
                          <p className="text-sm text-green-600 font-medium">{voteCount} suara</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditCandidate(candidate)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCandidate(candidate)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-medium text-gray-700">Visi:</h4>
                        <p className="text-gray-600 text-sm">{candidate.vision}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">Misi:</h4>
                        <p className="text-gray-600 text-sm">{candidate.mission}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Pengaturan Sekolah</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <form onSubmit={handleSchoolUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Sekolah
                    </label>
                    <input
                      type="text"
                      value={schoolForm.name}
                      onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Logo Sekolah
                    </label>
                    <input
                      type="url"
                      value={schoolForm.logo_url}
                      onChange={(e) => setSchoolForm({ ...schoolForm, logo_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Pemilihan
                  </label>
                  <input
                    type="text"
                    value={schoolForm.election_title}
                    onChange={(e) => setSchoolForm({ ...schoolForm, election_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi Pemilihan
                  </label>
                  <textarea
                    value={schoolForm.election_description}
                    onChange={(e) => setSchoolForm({ ...schoolForm, election_description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="voting_open"
                    checked={schoolForm.is_voting_open}
                    onChange={(e) => setSchoolForm({ ...schoolForm, is_voting_open: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="voting_open" className="ml-2 block text-sm text-gray-700">
                    Buka periode voting
                  </label>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  Simpan Pengaturan
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Candidate Modal */}
      <AnimatePresence>
        {showAddCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCandidate ? 'Edit Kandidat' : 'Tambah Kandidat Baru'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddCandidate(false);
                    setEditingCandidate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCandidateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={candidateForm.name}
                      onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Kandidat *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={candidateForm.candidate_number}
                      onChange={(e) => setCandidateForm({ ...candidateForm, candidate_number: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kelas *
                    </label>
                    <input
                      type="text"
                      value={candidateForm.class_grade}
                      onChange={(e) => setCandidateForm({ ...candidateForm, class_grade: e.target.value })}
                      placeholder="9A, 9B, dst..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Image className="w-4 h-4 inline mr-1" />
                      URL Foto
                    </label>
                    <input
                      type="url"
                      value={candidateForm.photo_url}
                      onChange={(e) => setCandidateForm({ ...candidateForm, photo_url: e.target.value })}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visi *
                  </label>
                  <textarea
                    value={candidateForm.vision}
                    onChange={(e) => setCandidateForm({ ...candidateForm, vision: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Misi *
                  </label>
                  <textarea
                    value={candidateForm.mission}
                    onChange={(e) => setCandidateForm({ ...candidateForm, mission: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCandidate(false);
                      setEditingCandidate(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    {editingCandidate ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;