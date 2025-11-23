import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns'; // 1. Import module DNS

// 2. Paksa Node.js menggunakan IPv4
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

// Buat connection pool ke Supabase
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Wajib untuk koneksi ke Supabase
  }
});

// Helper function query
export const query = (text, params) => pool.query(text, params);

// Test koneksi saat start (Opsional, bisa dihapus jika mengganggu logs)
pool.connect((err) => {
  if (err) console.error('❌ Database connection error', err.stack);
  else console.log('✅ Connected to Supabase (PostgreSQL)');
});

export default pool;