import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post('/api/admin/create-user', async (req, res) => {
  const { email, password, name, schoolId } = req.body;

  try {
    // 1. Buat user di Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, schoolId, role: 'admin' }
    });
    if (error) throw error;

    // 2. Masukkan ke tabel admins
    await supabaseAdmin.from('admins').insert({
      id: data.user.id,
      school_id: schoolId,
      email,
      name,
      role: 'admin'
    });

    res.json({ success: true, userId: data.user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('✅ Backend API running on http://localhost:3000');
});
