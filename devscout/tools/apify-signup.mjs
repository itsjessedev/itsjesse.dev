#!/usr/bin/env node
/**
 * Apify Account Creator
 *
 * Automates creating new Apify accounts with temp emails.
 * Each account gets $5 free monthly credits.
 *
 * Usage: node apify-signup.mjs [count]
 * Example: node apify-signup.mjs 5
 */

import { chromium } from 'playwright';

const MAIL_API = 'https://api.mail.tm';

async function createTempEmail() {
  const domainsRes = await fetch(`${MAIL_API}/domains`);
  const domains = await domainsRes.json();
  const domain = domains['hydra:member'][0].domain;

  const username = `dev${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const email = `${username}@${domain}`;
  const password = `Pass${Date.now()}!`;

  const createRes = await fetch(`${MAIL_API}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: email, password }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create temp email: ${await createRes.text()}`);
  }

  const tokenRes = await fetch(`${MAIL_API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: email, password }),
  });

  const { token } = await tokenRes.json();
  return { email, password, token };
}

async function waitForVerificationEmail(token, maxWaitMs = 90000) {
  const startTime = Date.now();
  console.log('Checking for verification email...');

  while (Date.now() - startTime < maxWaitMs) {
    const messagesRes = await fetch(`${MAIL_API}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const messages = await messagesRes.json();
    const apifyEmail = messages['hydra:member']?.find(m =>
      m.from?.address?.includes('apify') ||
      m.subject?.toLowerCase().includes('verify') ||
      m.subject?.toLowerCase().includes('confirm') ||
      m.subject?.toLowerCase().includes('apify')
    );

    if (apifyEmail) {
      console.log(`Found email: ${apifyEmail.subject}`);
      const msgRes = await fetch(`${MAIL_API}/messages/${apifyEmail.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const fullMsg = await msgRes.json();

      // Find verification link
      const htmlContent = fullMsg.html || '';
      const textContent = fullMsg.text || '';

      const linkPatterns = [
        /href="(https:\/\/[^"]*verify[^"]*)"/gi,
        /href="(https:\/\/[^"]*confirm[^"]*)"/gi,
        /href="(https:\/\/console\.apify\.com[^"]*)"/gi,
        /(https:\/\/[^\s<>"]*verify[^\s<>"]*)/gi,
        /(https:\/\/[^\s<>"]*confirm[^\s<>"]*)/gi,
      ];

      for (const pattern of linkPatterns) {
        const match = htmlContent.match(pattern) || textContent.match(pattern);
        if (match) {
          let link = match[0].replace(/^href="/, '').replace(/"$/, '');
          link = link.replace(/&amp;/g, '&');
          if (link.includes('apify') || link.includes('verify') || link.includes('confirm')) {
            return link;
          }
        }
      }
    }

    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(' timeout');
  return null;
}

async function createApifyAccount() {
  console.log('\n--- Creating temp email ---');
  const { email, token: mailToken } = await createTempEmail();
  console.log(`Email: ${email}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const apifyPassword = `Apify${Date.now()}!Aa`;

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    // Step 1: Go to signup page
    console.log('\n--- Step 1: Loading signup page ---');
    await page.goto('https://console.apify.com/sign-up', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(2000);

    // Try GitHub OAuth (might skip CAPTCHA)
    console.log('--- Step 2: Trying GitHub OAuth ---');
    const githubBtn = await page.$('button:has-text("GitHub"), button:has-text("Continue with GitHub")');

    if (githubBtn) {
      await githubBtn.click();
      await page.waitForTimeout(3000);

      // Check if we're on GitHub login
      const currentUrl = page.url();
      if (currentUrl.includes('github.com')) {
        console.log('Redirected to GitHub - need GitHub account');
        console.log('GitHub OAuth requires pre-created GitHub accounts');
        console.log('Falling back to email signup...');
      }
    }

    // Fall back to email signup
    console.log('--- Step 3: Entering email ---');
    await page.goto('https://console.apify.com/sign-up', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(2000);

    await page.waitForSelector('input[placeholder="Email"], input[name="email"], input[type="email"]', { timeout: 15000 });
    await page.fill('input[placeholder="Email"], input[name="email"], input[type="email"]', email);
    await page.waitForTimeout(500);

    // Click Next button
    console.log('--- Step 4: Clicking Next ---');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);

    // Check for CAPTCHA
    await page.screenshot({ path: '/tmp/apify-after-next.png' });
    const pageContent = await page.content();

    if (pageContent.includes('recaptcha') || pageContent.includes('Select all')) {
      console.log('\n⚠️  CAPTCHA DETECTED - Cannot automate past this');
      console.log('Screenshots saved to /tmp/apify-*.png');
      return null;
    }

    // Check for actual error messages about existing accounts
    if (pageContent.toLowerCase().includes('email already') ||
        pageContent.toLowerCase().includes('account already exists') ||
        pageContent.toLowerCase().includes('already registered')) {
      console.log('Email already registered, trying another...');
      return null;
    }

    // Step 5: Enter password
    console.log('--- Step 5: Entering password ---');
    try {
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.fill('input[type="password"]', apifyPassword);
      await page.waitForTimeout(500);
    } catch (e) {
      console.log('No password field found, taking screenshot...');
      await page.screenshot({ path: '/tmp/apify-step5.png' });
      return null;
    }

    // Step 6: Click Sign up / Create account button
    console.log('--- Step 6: Submitting signup ---');
    const signupBtn = await page.$('button:has-text("Sign up"), button:has-text("Create"), button[type="submit"]');
    if (signupBtn) {
      await signupBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/apify-after-signup.png' });

    // Check for CAPTCHA again
    const afterContent = await page.content();
    if (afterContent.includes('recaptcha') || afterContent.includes('Select all')) {
      console.log('\n⚠️  CAPTCHA DETECTED during signup');
      return null;
    }

    // Step 7: Check for email verification requirement
    if (afterContent.toLowerCase().includes('verify') ||
        afterContent.toLowerCase().includes('check your email') ||
        afterContent.toLowerCase().includes('confirmation')) {
      console.log('--- Step 7: Email verification required ---');
      const verifyLink = await waitForVerificationEmail(mailToken);

      if (verifyLink) {
        console.log(`\nClicking verification link: ${verifyLink.substring(0, 60)}...`);
        await page.goto(verifyLink, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);
      } else {
        console.log('No verification email received');
      }
    }

    // Step 8: Navigate to integrations to get API key
    console.log('--- Step 7: Getting API key ---');
    await page.goto('https://console.apify.com/account/integrations', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/apify-integrations.png' });

    // Try to find API token
    let apiKey = null;

    // Method 1: Look for visible token input
    const tokenInput = await page.$('input[value*="apify_api"]');
    if (tokenInput) {
      apiKey = await tokenInput.getAttribute('value');
    }

    // Method 2: Search page content
    if (!apiKey) {
      const intContent = await page.content();
      const keyMatch = intContent.match(/apify_api_[a-zA-Z0-9_]+/);
      if (keyMatch) {
        apiKey = keyMatch[0];
      }
    }

    // Method 3: Click "Show" button if exists
    if (!apiKey) {
      const showBtn = await page.$('button:has-text("Show"), button:has-text("Reveal")');
      if (showBtn) {
        await showBtn.click();
        await page.waitForTimeout(1000);
        const intContent = await page.content();
        const keyMatch = intContent.match(/apify_api_[a-zA-Z0-9_]+/);
        if (keyMatch) {
          apiKey = keyMatch[0];
        }
      }
    }

    if (apiKey) {
      console.log(`\n✅ SUCCESS!`);
      console.log(`API Key: ${apiKey}`);
      return { email, password: apifyPassword, apiKey };
    } else {
      console.log('Could not find API key');
      console.log('Screenshots saved to /tmp/apify-*.png');
      return null;
    }

  } finally {
    await browser.close();
  }
}

async function main() {
  const count = parseInt(process.argv[2]) || 1;
  const results = [];

  console.log(`\n========== Creating ${count} Apify account(s) ==========`);

  for (let i = 0; i < count; i++) {
    console.log(`\n\n========== Account ${i + 1}/${count} ==========`);
    try {
      const result = await createApifyAccount();
      if (result) {
        results.push(result);
      }
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }

    if (i < count - 1) {
      console.log('\nWaiting 15s before next account...');
      await new Promise(r => setTimeout(r, 15000));
    }
  }

  console.log('\n\n========== SUMMARY ==========');
  console.log(`Created ${results.length}/${count} accounts\n`);

  if (results.length > 0) {
    console.log('Add to your .env file:\n');
    results.forEach((r, i) => {
      console.log(`APIFY_API_KEY_${8 + i}=${r.apiKey}`);
    });

    // Save to file
    const fs = await import('fs');
    const keyLines = results.map(r => `${r.apiKey}  # ${r.email}`).join('\n');
    fs.appendFileSync('apify-keys.txt', keyLines + '\n');
    console.log('\nKeys appended to apify-keys.txt');
  }
}

main().catch(console.error);
