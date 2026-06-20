import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

const baseURL = 'http://localhost:39999/api/v1';

async function main() {
  try {
    // We need to login as DCP first to get a token
    const dcpRes = await axios.post(`${baseURL}/auth/login`, { badge_no: 'DO001', password: 'Test@1234' });
    const dcpToken = dcpRes.data.data.accessToken;
    
    // Find the last record ID
    const { default: db } = await import('../src/config/db.js');
    const lastRecord = await db('records').orderBy('created_at', 'desc').first();
    console.log('Last Record ID from DB:', lastRecord.id);
    
    // Call GET /records/:id
    const res = await axios.get(`${baseURL}/records/${lastRecord.id}`, {
      headers: { Authorization: `Bearer ${dcpToken}` }
    });
    
    console.log('HTTP GET Status:', res.status);
    console.log('HTTP GET Data:', JSON.stringify(res.data.data, null, 2));
  } catch (err) {
    console.error('Error during HTTP fetch:', err.message, err.response?.data);
  } finally {
    process.exit();
  }
}

// We will start a temp server if needed, but since verify_pharos starts one, let's run this script *while* the test server is NOT running.
// Wait! To make sure the server is running, let's start the server programmatically in this script.
import { createServer } from 'http';
import app from '../src/app.js';
const server = app.listen(39999, () => {
  main();
});
