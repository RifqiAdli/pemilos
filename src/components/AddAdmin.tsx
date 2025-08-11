import React, { useState, useEffect } from 'react';
import { User, School, Plus, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

// Mock supabase client for demonstration
const supabase = {
  auth: {
    signUp: async ({ email, password, options }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        data: { user: { id: 'mock-user-id-' + Date.now() } },
        error: null
      };
    }
  },
  from: (table) => ({
    select: (columns) => ({
      order: (column) => ({
        then: async () => ({
          data: [
            { id: '1', name: 'SMA Negeri 1 Jakarta' },
            { id: '2', name: 'SMA Negeri 2 Jakarta' },
            { id: '3', name: 'SMA Swasta ABC' }
          ],
          error: null
        })
      })
    }),
    insert: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { error: null };
    }
  })
};

const AddAdminPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    schoolId: ''
  });
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch schools dari Supabase
  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
      setMessage({ 
        type: 'error', 
        text: 'Gagal memuat data sekolah' 
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name || !formData.schoolId) {
      setMessage({ type: 'error', text: 'Semua field harus diisi' });
      return false;
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter' });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Password tidak cocok' });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', text: 'Format email tidak valid' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // SOLUTION 1: Use service role key or admin function
      // Instead of client-side auth.signUp, use an admin function
      
      // Option A: Call admin function via Edge Function or API
      // Ubah bagian ini di handleSubmit
const response = await fetch('http://localhost:3000/api/admin/create-user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: formData.email,
    password: formData.password,
    name: formData.name,
    schoolId: formData.schoolId
  })
});


      if (!response.ok) {
        throw new Error('Failed to create admin');
      }

      const result = await response.json();

      setMessage({ 
        type: 'success', 
        text: `Admin ${formData.name} berhasil ditambahkan!` 
      });
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        schoolId: ''
      });

    } catch (error) {
      console.error('Error creating admin:', error);
      
      let errorMessage = 'Gagal menambahkan admin. Coba lagi.';
      
      if (error.message.includes('User already registered')) {
        errorMessage = 'Email sudah terdaftar. Gunakan email lain.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Format email tidak valid.';
      } else if (error.message.includes('Password should be at least 6 characters')) {
        errorMessage = 'Password minimal 6 karakter.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Tidak memiliki izin untuk membuat admin. Hubungi super admin.';
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Tambah Admin Baru</h1>
          </div>
          <p className="text-gray-600">Buat akun admin baru untuk mengelola sistem pemilihan OSIS</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-6">
            {/* School Selection */}
            <div>
              <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-2">
                <School className="w-4 h-4 inline mr-2" />
                Pilih Sekolah
              </label>
              <select
                id="schoolId"
                name="schoolId"
                value={formData.schoolId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Pilih Sekolah --</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Masukkan nama lengkap admin"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="admin@sekolah.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Ulangi password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Message */}
            {message.text && (
              <div className={`flex items-center gap-2 p-4 rounded-lg ${
                message.type === 'error' 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Menambahkan...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Tambah Admin
                </>
              )}
            </button>
          </div>
        </div>

        {/* Solutions Info */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800 mb-2">🚨 Solusi untuk Error 401:</h3>
          <div className="text-sm text-red-700 space-y-2">
            <p><strong>1. Gunakan Service Role Key:</strong> Buat Edge Function dengan service role key untuk admin operations</p>
            <p><strong>2. Row Level Security:</strong> Pastikan RLS policy mengizinkan admin membuat user baru</p>
            <p><strong>3. Admin Function:</strong> Buat server-side function khusus untuk create admin</p>
            <p><strong>4. Super Admin:</strong> Hanya super admin yang bisa membuat admin baru</p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Informasi:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Admin akan mendapat akses penuh ke sistem pemilihan OSIS</li>
            <li>• Email akan digunakan untuk login ke dashboard admin</li>
            <li>• Password harus minimal 6 karakter</li>
            <li>• Setiap admin hanya dapat mengelola satu sekolah</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddAdminPage;