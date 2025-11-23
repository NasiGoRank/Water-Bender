import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns'; // 1. Import library DNS bawaan Node.js

// 2. Paksa Node.js menggunakan IPv4 agar tidak error ENETUNREACH di Render
dns.setDefaultResultOrder('ipv4first');

// Load environment variables
dotenv.config();

// Buat connection pool ke Supabase
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:gjAW3MAlhSHeEZlR@db.deqrzjdjpvvotjgmnxwq.supabase.co:5432/postgres",
  ssl: {
    rejectUnauthorized: false // Wajib untuk koneksi ke Supabase dari luar
  }
});

// Helper function
export const query = (text, params) => pool.query(text, params);

// Test koneksi saat start
pool.connect((err) => {
  if (err) console.error('❌ Database connection error', err.stack);
  else console.log('✅ Connected to Supabase (PostgreSQL)');
});

export default pool;