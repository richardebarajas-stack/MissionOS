# MissionOS Portal — Deployment Guide

## What you need before starting
- GitHub account (github.com)
- Vercel account (vercel.com) — sign up with your GitHub account
- Anthropic API key (console.anthropic.com)

---

## Step 1: Upload to GitHub

1. Go to github.com and log in
2. Click the **+** icon (top right) → **New repository**
3. Name it: `missionos-portal`
4. Set to **Private**
5. Click **Create repository**
6. On the next screen, click **uploading an existing file**
7. Drag and drop ALL files from this folder (keep the folder structure intact):
   - `package.json`
   - `public/index.html`
   - `src/index.js`
   - `src/App.js`
8. Click **Commit changes**

---

## Step 2: Deploy on Vercel

1. Go to vercel.com and log in
2. Click **Add New Project**
3. Find `missionos-portal` in your GitHub repos → click **Import**
4. Framework should auto-detect as **Create React App** — leave defaults
5. Before clicking Deploy, click **Environment Variables** and add:
   - **Name:** `REACT_APP_ANTHROPIC_API_KEY`
   - **Value:** (paste your Anthropic API key here)
6. Click **Deploy**
7. Wait ~2 minutes — Vercel builds and deploys automatically
8. You'll get a live URL like: `missionos-portal.vercel.app`

---

## Step 3: Access on any device

Open your URL in any browser — your work computer, a shared computer at YWCA, your phone.
No login required (you can add one later).

---

## Making updates later

1. Edit `src/App.js` with your changes (Claude can do this for you)
2. Go to your GitHub repo
3. Click on `src/App.js` → click the pencil ✏️ edit icon
4. Paste the updated code → click **Commit changes**
5. Vercel automatically redeploys in ~60 seconds

---

## Cost estimate

| Service | Cost |
|---------|------|
| GitHub | Free |
| Vercel | Free (Hobby plan covers this easily) |
| Anthropic API | ~$5–15/month at normal use |
| **Total** | **~$5–15/month** |

Anthropic API pricing for claude-sonnet:
- Input: $3 per million tokens
- Output: $15 per million tokens
- A typical conversation = ~2,000 tokens = less than $0.04

---

## Questions?
Bring this back to Claude in Cowork and ask for help with any step.
