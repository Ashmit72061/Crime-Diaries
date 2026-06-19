import app from '../src/app.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const PORT = 3001;

async function runRealCheck() {
  console.log('=== STARTING LIVE API CHECK ===');
  
  // Boot Express server
  const server = app.listen(PORT, async () => {
    console.log(`Live HTTP server listening on http://localhost:${PORT}`);
    
    try {
      // 1. Authenticate over HTTP
      console.log('Sending login request to POST /api/auth/login...');
      const loginRes = await axios.post(`http://localhost:${PORT}/api/auth/login`, {
        badgeNo: 'SA001',
        password: 'test123'
      });
      
      const token = loginRes.data.data.accessToken || loginRes.data.data.token;
      if (!token) {
        throw new Error('Authentication failed: token not found in login response');
      }
      console.log('✅ Authenticated successfully! Received JWT bearer token.');

      const headers = {
        Authorization: `Bearer ${token}`
      };

      // 2. Call preview endpoint
      const previewUrl = `http://localhost:${PORT}/api/daily-diary/records-preview?date=2026-05-28`;
      console.log(`\nCalling GET ${previewUrl}...`);
      const previewRes = await axios.get(previewUrl, { headers });
      
      console.log('✅ Preview API Response Status:', previewRes.status);
      console.log('✅ Preview API Response Data:');
      console.log(JSON.stringify(previewRes.data, null, 2));

      // 3. Call export spreadsheet download endpoint
      const exportUrl = `http://localhost:${PORT}/api/daily-diary/export?date=2026-05-28`;
      console.log(`\nCalling GET ${exportUrl} to download spreadsheet...`);
      const exportRes = await axios.get(exportUrl, {
        headers,
        responseType: 'arraybuffer'
      });

      console.log('✅ Export API Response Status:', exportRes.status);
      console.log('✅ Export API Response Content-Type:', exportRes.headers['content-type']);
      
      const outputDir = path.resolve('scratch');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, 'Real_API_Export_Daily_Diary.xlsx');
      fs.writeFileSync(outputPath, Buffer.from(exportRes.data));
      console.log(`✅ Saved live API download to: ${outputPath}`);

      console.log('\n=== LIVE API CHECK COMPLETE: ALL ENDPOINTS COMPLIED & OPERATING CORRETLY ===');
    } catch (err) {
      console.error('❌ Real API check failed:', err.response ? err.response.data : err.message);
    } finally {
      // Shutdown Express server and close DB
      server.close(() => {
        console.log('Server shut down.');
      });
      const { default: db } = await import('../src/config/db.js');
      await db.destroy();
      console.log('Database connection closed.');
    }
  });
}

runRealCheck().catch(console.error);
