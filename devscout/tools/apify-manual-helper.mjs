#!/usr/bin/env node
/**
 * Apify Manual Account Helper
 *
 * Generates temp emails and opens browser for you to solve CAPTCHA manually.
 * After you create the account, paste the API key back.
 *
 * Usage: node apify-manual-helper.mjs [count]
 */

import { chromium } from 'playwright';
import * as readline from 'readline';

const MAIL_API = 'https://api.mail.tm';

async function createTempEmail() {
  const domainsRes = await fetch(`${MAIL_API}/domains`);
  const domains = await domainsRes.json();
  const domain = domains['hydra:member'][0].domain;

  const username = `apify${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  const email = `${username}@${domain}`;
  const password = `Pass${Date.now()}!`;

  const createRes = await fetch(`${MAIL_API}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: email, password }),
  });

  if (!createRes.ok) throw new Error(`Failed to create email`);

  const tokenRes = await fetch(`${MAIL_API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: email, password }),
  });

  const { token } = await tokenRes.json();
  return { email, emailPassword: password, token };
}

async function waitForVerificationEmail(token, maxWaitMs = 120000) {
  const startTime = Date.now();
  process.stdout.write('Waiting for verification email');

  while (Date.now() - startTime < maxWaitMs) {
    const res = await fetch(`${MAIL_API}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const messages = await res.json();
    const apifyEmail = messages['hydra:member']?.find(m =>
      m.subject?.toLowerCase().includes('apify') ||
      m.subject?.toLowerCase().includes('verify')
    );

    if (apifyEmail) {
      const msgRes = await fetch(`${MAIL_API}/messages/${apifyEmail.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const msg = await msgRes.json();
      const match = msg.html?.match(/href="(https:\/\/[^"]*(?:verify|confirm)[^"]*)"/i);
      if (match) {
        console.log(' found!');
        return match[1].replace(/&amp;/g, '&');
      }
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log(' timeout');
  return null;
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

async function createAccount(index, total) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Account ${index}/${total}`);
  console.log('='.repeat(50));

  // Create temp email
  const { email, token } = await createTempEmail();
  const apifyPassword = `Apify${Date.now()}!Aa`;

  console.log(`\nTemp Email: ${email}`);
  console.log(`Password to use: ${apifyPassword}`);

  // Open browser (NOT headless)
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  await page.goto('https://console.apify.com/sign-up');

  console.log(`
┌─────────────────────────────────────────────────────┐
│  MANUAL STEPS:                                      │
│  1. Enter email: ${email.padEnd(30)}│
│  2. Click "Next"                                    │
│  3. Solve the CAPTCHA                               │
│  4. Enter password: ${apifyPassword.padEnd(27)}│
│  5. Click "Sign up"                                 │
└─────────────────────────────────────────────────────┘
`);

  // Wait for user to complete signup
  await prompt('Press ENTER after you complete signup and see the dashboard...');

  // Check for verification email
  console.log('\nChecking for verification email...');
  const verifyLink = await waitForVerificationEmail(token);
  if (verifyLink) {
    console.log('Opening verification link...');
    await page.goto(verifyLink);
    await page.waitForTimeout(3000);
  }

  // Navigate to get API key
  await page.goto('https://console.apify.com/account/integrations');
  await page.waitForTimeout(3000);

  console.log(`
┌─────────────────────────────────────────────────────┐
│  GET YOUR API KEY:                                  │
│  1. You should see the Integrations page            │
│  2. Copy the "Personal API token"                   │
│  3. Paste it below                                  │
└─────────────────────────────────────────────────────┘
`);

  const apiKey = await prompt('Paste API key (or press ENTER to skip): ');

  await browser.close();

  if (apiKey && apiKey.startsWith('apify_api_')) {
    console.log(`✅ Account created! API Key: ${apiKey}`);
    return { email, apiKey };
  } else {
    console.log('⚠️ No valid API key provided');
    return null;
  }
}

async function main() {
  const count = parseInt(process.argv[2]) || 1;
  const results = [];

  console.log(`
╔══════════════════════════════════════════════════════╗
║         APIFY MANUAL ACCOUNT CREATOR                ║
║                                                      ║
║  This will help you create ${String(count).padStart(2)} Apify account(s)      ║
║  You just need to solve the CAPTCHAs                ║
╚══════════════════════════════════════════════════════╝
`);

  for (let i = 1; i <= count; i++) {
    try {
      const result = await createAccount(i, count);
      if (result) results.push(result);
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  }

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`Created: ${results.length}/${count} accounts\n`);

  if (results.length > 0) {
    console.log('Add these to your VPS .env file:\n');
    results.forEach((r, i) => {
      console.log(`APIFY_API_KEY_${8 + i}=${r.apiKey}`);
    });

    // Save to file
    const fs = await import('fs');
    const lines = results.map(r => `${r.apiKey}  # ${r.email}`).join('\n');
    fs.appendFileSync('apify-keys.txt', lines + '\n');
    console.log('\nKeys saved to apify-keys.txt');
  }
}

main().catch(console.error);
