import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SESSION_FILE = '.manychat-session.json';

/**
 * Login to ManyChat once manually and save the session
 * Run this once: node save-session.js
 * Then future scripts can reuse the session without CAPTCHA
 */
async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔐 Navigate to ManyChat login...');
    console.log('ℹ️  Complete the Facebook login + CAPTCHA manually in the browser window');
    console.log('ℹ️  Once you see the dashboard, the session will be saved automatically\n');

    await page.goto('https://manychat.com/login');

    // Wait for user to complete login and reach dashboard
    console.log('⏳ Waiting for successful login...');
    await page.waitForURL('https://app.manychat.com/**', { timeout: 300000 }); // 5 minute timeout

    console.log('✓ Login detected!');

    // Save the authenticated session
    const cookies = await context.cookies();
    const localStorage = await page.evaluate(() => {
      const ls = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        ls[key] = window.localStorage.getItem(key);
      }
      return ls;
    });

    const session = {
      cookies,
      localStorage,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
    console.log(`✅ Session saved to ${SESSION_FILE}`);
    console.log('📝 You can now use this session in automation scripts!');
    console.log('\nYour session is valid for future scripts. They will:');
    console.log('1. Load this session');
    console.log('2. Skip the Facebook login + CAPTCHA');
    console.log('3. Go directly to automations');
    console.log('4. Create/modify workflows');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();
