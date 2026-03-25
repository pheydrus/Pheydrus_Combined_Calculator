import { chromium } from 'playwright';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const MANYCHAT_BOT_ID = process.env.MANYCHAT_BOT_ID;
const SESSION_FILE = '.manychat-session.json';

async function loadSession() {
  try {
    const sessionData = fs.readFileSync(SESSION_FILE, 'utf-8');
    return JSON.parse(sessionData);
  } catch {
    console.error(
      `❌ Session file not found (${SESSION_FILE})`,
    );
    console.error('');
    console.error('First, save your authenticated session:');
    console.error(
      '  1. Run: node .github/skills/manychat-automation/scripts/save-session.js',
    );
    console.error('  2. Complete Facebook login + CAPTCHA in the browser');
    console.error('  3. Once saved, future scripts will skip login automatically');
    console.error('');
    process.exit(1);
  }
}

async function main() {
  console.log('📋 Loading saved session...');
  const session = await loadSession();

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: session,
  });
  const page = await context.newPage();

  try {
    console.log('✓ Session loaded - skipping login');
    await page.goto('https://app.manychat.com/fb499728/dashboard', {
      waitUntil: 'networkidle',
    });
    console.log('✓ Navigated to dashboard');
    
    // Now navigate to automations
    console.log('📋 Navigating to automations...');
    await page.goto(`https://app.manychat.com/automations?bot=${MANYCHAT_BOT_ID}`, {
      waitUntil: 'networkidle',
    });
    
    console.log('✓ Logged into ManyChat successfully (via saved session)');
    
    // Navigate to automations
    console.log('📋 Navigating to automations...');
    await page.goto(`https://app.manychat.com/automations?bot=${MANYCHAT_BOT_ID}`, {
      waitUntil: 'networkidle',
    });
    
    await page.waitForSelector('[data-test-id="automation-list"]', { timeout: 10000 });
    console.log('✓ Automations page loaded');
    
    // First, examine the NUMBER workflow
    console.log('🔍 Looking for NUMBER workflow to understand its structure...');
    const workflows = await page.locator('[data-test-id="automation-item"]').all();
    console.log(`Found ${workflows.length} workflows`);
    
    // Take screenshot to see current state
    await page.screenshot({ path: './manychat-automations.png' });
    console.log('📸 Screenshot saved: manychat-automations.png');
    
    // Look for NUMBER workflow
    let numberWorkflow = null;
    for (const workflow of workflows) {
      const text = await workflow.textContent();
      if (text && text.includes('NUMBER')) {
        numberWorkflow = workflow;
        console.log('✓ Found NUMBER workflow');
        break;
      }
    }
    
    if (!numberWorkflow) {
      console.log('⚠️  NUMBER workflow not found. Here are available workflows:');
      for (const workflow of workflows) {
        const text = await workflow.textContent();
        console.log(`  - ${text?.trim()}`);
      }
    }
    
    // Now create a new PROPERTY workflow
    console.log('\n🆕 Creating PROPERTY workflow...');
    
    // Click "Create New Flow" button
    await page.click('button:has-text("Create New Flow")');
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('✓ Create flow dialog opened');
    
    // Fill in flow name
    await page.fill('[placeholder*="name" i]', 'PROPERTY');
    await page.click('button:has-text("Create")');
    
    // Wait for flow editor
    await page.waitForSelector('[data-test-id="flow-editor"]', { timeout: 10000 });
    console.log('✓ Flow editor opened');
    
    // Add trigger for PROPERTY keyword
    console.log('🔑 Setting PROPERTY keyword trigger...');
    await page.click('[data-test-id="trigger-settings"]');
    await page.waitForSelector('[name="trigger-type"]', { timeout: 5000 });
    
    await page.selectOption('[name="trigger-type"]', 'keyword');
    await page.fill('[name="trigger-value"]', 'PROPERTY');
    
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
    console.log('✓ Trigger set to PROPERTY keyword');
    
    // Add message step with "TEST" and the link
    console.log('💬 Adding message step...');
    await page.click('[data-test-id="add-step"]');
    await page.waitForSelector('[data-test-id="step-type-message"]', { timeout: 5000 });
    
    await page.click('[data-test-id="step-type-message"]');
    await page.waitForSelector('[contenteditable="true"]', { timeout: 5000 });
    
    // Type the message
    await page.click('[contenteditable="true"]');
    await page.keyboard.type('TEST');
    await page.keyboard.press('Enter');
    await page.keyboard.type('https://pheydrus.myflodesk.com/pvsi4r03vd');
    
    // Save the step
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
    console.log('✓ Message added: TEST + link');
    
    // Save the flow as draft
    console.log('💾 Saving flow...');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(2000);
    
    // Publish the flow
    console.log('📤 Publishing PROPERTY workflow...');
    await page.click('button:has-text("Publish")');
    await page.waitForSelector('[aria-label*="published"]', { timeout: 10000 });
    
    console.log('✅ PROPERTY workflow created and published!');
    
    // Take final screenshot
    await page.screenshot({ path: './manychat-property-created.png' });
    console.log('📸 Screenshot saved: manychat-property-created.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: './manychat-error.png' });
    console.log('📸 Error screenshot saved: manychat-error.png');
  } finally {
    // Keep browser open for 5 seconds to see final result
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

main();
