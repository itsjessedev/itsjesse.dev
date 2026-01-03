# LinkedIn OAuth Setup for DevScout

**OAuth is OPTIONAL.** Without it, DevScout still works for:
- ✅ Finding job leads (via Apify)
- ✅ Finding posts to engage with (via Apify)
- ✅ Generating AI responses
- ✅ Scheduling posts (marked as "ready" for manual copy/paste)

OAuth is only needed for **auto-posting to LinkedIn** (publishing directly from DevScout).

---

## Requirements

LinkedIn requires:
1. A Company Page linked to your app
2. At least 1 connection on your profile to create a Company Page

If you don't have enough connections yet, skip this setup - everything else works without it.

---

## Setup Steps (for auto-posting only)

### Step 1: Create a LinkedIn Company Page

LinkedIn requires every app to be linked to a Company Page. This takes 2 minutes:

1. Go to https://www.linkedin.com/company/setup/new/
2. Choose **"Company"** (small business works fine)
3. Fill in minimal details:
   - **Name:** "Jesse Eldridge Dev" or your name/brand
   - **Website:** itsjesse.dev
   - **Industry:** Computer Software
   - **Size:** 1 employee (just you)
4. Click **Create page**
5. You can leave the page mostly empty - it just needs to exist

### Step 2: Create LinkedIn App

1. Go to https://www.linkedin.com/developers/apps
2. Click **"Create app"**
3. Fill in the form:
   - **App name:** DevScout (or anything)
   - **LinkedIn Page:** Select the page you just created
   - **App logo:** Optional (can skip)
   - **Legal agreement:** Check the box

4. Click **Create app**

### Step 3: Request API Products

After creating the app, you need to request access to products:

1. Go to your app's page at https://www.linkedin.com/developers/apps
2. Click on your app
3. Go to **Products** tab
4. Request access to:
   - **Share on LinkedIn** (required for posting)
   - **Sign In with LinkedIn using OpenID Connect** (required for auth)

**Note:** These are usually auto-approved instantly, but may take up to 24 hours.

### Step 4: Get Credentials

1. In your app, go to **Auth** tab
2. Copy these values:
   - **Client ID** (looks like: `78abc123xyz`)
   - **Client Secret** (click "show" to reveal, looks like: `AbCdEf123456`)

### Step 5: Configure Redirect URI

1. In the **Auth** tab, scroll to **OAuth 2.0 settings**
2. Under **Authorized redirect URLs for your app**, add:
   ```
   https://devscout.junipr.io/linkedin/callback
   ```
3. Click **Update**

### Step 6: Add Credentials to VPS

SSH to the VPS and add the credentials to DevScout's .env file:

```bash
ssh junipr-vps

# Edit the .env file
nano /home/deploy/devscout/backend/.env
```

Add these lines:
```
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=https://devscout.junipr.io/linkedin/callback
```

Save and exit (Ctrl+X, Y, Enter).

Restart the service:
```bash
sudo systemctl restart devscout
```

### Step 7: Connect LinkedIn in DevScout

1. Open https://devscout.junipr.io
2. Go to **LinkedIn** tab
3. Click **Connect LinkedIn**
4. Authorize the app when LinkedIn prompts
5. You should see "Connected as [Your Name]"

## Token Expiration

- LinkedIn OAuth tokens expire after **60 days**
- DevScout will show a warning when your token has less than 15 days remaining
- When it expires, just click "Reconnect LinkedIn" to re-authorize

## Troubleshooting

### "LinkedIn not authenticated" error
- Make sure credentials are in .env and service was restarted
- Check logs: `ssh junipr-vps "sudo journalctl -u devscout -n 50"`

### "Failed to exchange code for token" error
- Verify redirect URI matches exactly (no trailing slash)
- Check client secret is correct

### OAuth flow doesn't redirect back
- Check browser console for CORS errors
- Verify the redirect URI is whitelisted in LinkedIn app settings
