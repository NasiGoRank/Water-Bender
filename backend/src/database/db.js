import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// --- FIX KHUSUS RENDER (FORCE IPv4) ---
// Fungsi ini akan mencari alamat IP angka (IPv4) dari domain Supabase
// agar tidak tersesat ke jalur IPv6 yang error.
async function createPool() {
  let connectionString = process.env.DATABASE_URL;
  let sslConfig = { rejectUnauthorized: false };

  try {
    // 1. Ambil Hostname dari URL Database
    const url = new URL(process.env.DATABASE_URL);
    const hostname = url.hostname;

    // 2. Cari alamat IPv4-nya secara manual
    console.log(`🔍 Resolving IPv4 for database: ${hostname}...`);
    const addresses = await dns.promises.resolve4(hostname);

    if (addresses && addresses.length > 0) {
      const ip = addresses[0];
      console.log(`✅ Resolved to IPv4: ${ip}`);

      // 3. Ganti hostname dengan IP di URL koneksi
      url.hostname = ip;
      connectionString = url.toString();

      // 4. PENTING: Beri tahu server Supabase nama host aslinya (SNI)
      // agar koneksi SSL tetap valid meskipun kita tembak IP-nya langsung.
      sslConfig.servername = hostname;
    }
  } catch (e) {
    console.warn("⚠️ DNS Resolution failed, trying default connection:", e.message);
  }

  // 5. Buat Pool dengan konfigurasi yang sudah diperbaiki
  return new pg.Pool({
    connectionString: connectionString,
    ssl: sslConfig
  });
}

// Gunakan Top-Level Await untuk inisialisasi (Didukung di Node.js terbaru)
const pool = await createPool();

// Helper query
export const query = (text, params) => pool.query(text, params);

// Cek koneksi
pool.connect((err) => {
  if (err) console.error('❌ Database connection error:', err.message);
  else console.log('✅ Connected to Supabase (PostgreSQL) via IPv4');
});

export default pool;