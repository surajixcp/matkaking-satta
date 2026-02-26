const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/matkaking_db';

const client = new Client({
  connectionString: connectionString
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully!");

    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const todayIST = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}-${String(nowIST.getDate()).padStart(2, '0')}`;
    
    console.log("Checking Results for date:", todayIST);

    // 1. Check existing results for today
    const res = await client.query(`SELECT r.*, m.name as market_name FROM "Results" r JOIN "Markets" m ON r.market_id = m.id WHERE r.date = $1`, [todayIST]);
    
    console.log(`Found ${res.rows.length} results for today:`);
    res.rows.forEach(r => {
        console.log(` - Market: ${r.market_name} | Open: ${r.open_declare} | Close: ${r.close_declare}`);
    });

    if (res.rows.length > 0) {
        console.log("\nDeleting today's incorrect results...");
        const delRes = await client.query(`DELETE FROM "Results" WHERE date = $1`, [todayIST]);
        console.log(`Deleted ${delRes.rowCount} incorrect records.`);
    } else {
        console.log("\nNo incorrect records found for today.");
    }

  } catch (err) {
    console.error("Database error:", err.message);
  } finally {
    await client.end();
  }
}

run();
