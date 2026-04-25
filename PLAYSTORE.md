# 🚀 NutriAI — Play Store Publishing Guide

## Overview
NutriAI is a PWA (Progressive Web App). Google Play fully supports PWAs via a wrapper
called a Trusted Web Activity (TWA). The tool that automates this is PWABuilder — free,
no Android experience needed.

---

## Step 1 — Deploy your app first
Complete the Vercel deployment in README.md before continuing here.
Your app must be live at an HTTPS URL (e.g. https://nutriai.vercel.app).

---

## Step 2 — Verify PWA score
1. Open your deployed URL in Chrome on desktop
2. Open DevTools → Lighthouse tab
3. Run audit → check "Progressive Web App" category
4. You need a green score. Common fixes:
   - Icons missing → run `node scripts/generate-icons.js`
   - HTTPS issues → Vercel handles this automatically
   - Manifest errors → check browser console for warnings

---

## Step 3 — Generate Android APK with PWABuilder (20 min, free)

1. Go to https://www.pwabuilder.com
2. Enter your deployed URL → click Start
3. PWABuilder analyses your manifest + service worker automatically
4. Click **Package for Stores** → select **Google Play**
5. Fill in:
   - App name: NutriAI
   - Package ID: com.yourdomain.nutriai  (make this unique — you can't change it later)
   - App version: 1
   - App version string: 1.0.0
6. Click **Download** — you get a .zip with:
   - `app-release-bundle.aab`  ← upload this to Play Store
   - `signing.keystore`        ← SAVE THIS FILE FOREVER (you need it for every update)
   - `assetlinks.json`         ← read Step 4

---

## Step 4 — Link your domain (Digital Asset Links)

This tells Android "this website and this app are the same thing" so the TWA
shows no browser chrome (no address bar).

1. In the PWABuilder download zip, find `assetlinks.json`
2. Host it at: `https://YOUR_DOMAIN/.well-known/assetlinks.json`

   To do this on Vercel, create `frontend/public/.well-known/assetlinks.json`
   and paste the contents from PWABuilder. The file looks like:
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.yourdomain.nutriai",
       "sha256_cert_fingerprints": ["AA:BB:CC:...your fingerprint..."]
     }
   }]
   ```
3. Redeploy to Vercel
4. Verify it's accessible: https://YOUR_DOMAIN/.well-known/assetlinks.json

---

## Step 5 — Create Google Play Developer Account

1. Go to https://play.google.com/console
2. Sign in with your Google account
3. Pay the one-time $25 registration fee
4. Complete identity verification (takes 1–2 days)

---

## Step 6 — Create your Play Store listing

1. Play Console → Create app
2. Fill in:
   - App name: NutriAI
   - Default language: English
   - App or game: App
   - Free or paid: Free
3. Complete the store listing:
   - Short description (80 chars): "AI calorie & macro tracker — just describe your food"
   - Full description: see template below
   - Screenshots: take 2–5 screenshots on an Android phone or emulator
   - Feature graphic: 1024×500px banner (create free at Canva)
   - App icon: 512×512px (use your icon-512.png)

### Store description template:
```
NutriAI makes calorie tracking effortless. Instead of searching through
food databases, just describe what you ate in plain language — our AI
estimates the calories and macros instantly.

✦ AI-powered food logging — describe meals naturally
✦ Workout calorie tracking — describe your session or paste smartwatch data
✦ Full macro breakdown — protein, carbs, fat
✦ Net calorie deficit calculator — know exactly where you stand
✦ Personal TDEE calculator — based on your height, weight, age & activity
✦ Secure — your data is yours, protected with Google Sign-In

How it works:
1. Set up your profile (height, weight, goal)
2. Tap Log Food → describe your meal → AI estimates macros
3. Tap Log Workout → describe your session → AI estimates burn
4. Dashboard shows your daily deficit in real time

Best results: weigh your food with a kitchen scale and describe
portions accurately. For workouts, include duration and intensity.
```

---

## Step 7 — Upload your AAB and publish

1. Play Console → your app → Production → Create new release
2. Upload `app-release-bundle.aab`
3. Add release notes: "Initial release"
4. Click Review release → Start rollout to Production
5. Google reviews take 1–3 days for new apps

---

## Step 8 — Updates (for every future code change)

1. Deploy updated code to Vercel (the app updates instantly — no store review needed!)
2. If you change the manifest or native Android config:
   - Increment version in PWABuilder
   - Re-upload .aab to Play Console
   - New review takes ~1 day

**The beauty of PWA: most updates (UI, features, bug fixes) go live the
moment you push to Vercel — no Play Store review required.**

---

## User Login & Sessions

Supabase Auth sessions last **1 week** by default and auto-refresh.
- Users log in once → stay logged in for a week
- After 1 week of inactivity → they need to sign in again with Google (one tap)
- To extend sessions: Supabase dashboard → Auth → Settings → JWT expiry

To make sessions last even longer (e.g. 30 days):
- Supabase dashboard → Authentication → Settings
- Set "JWT expiry" to 2592000 (30 days in seconds)

---

## Data Privacy & User Data

- All user data is stored in YOUR Supabase project (Postgres database)
- Only you can access it via the Supabase dashboard
- Each user can only see their own data (Row Level Security enforced)
- No data is sold or shared with third parties
- Food/workout descriptions are sent to Groq's API for processing
  → Add this to your Play Store privacy policy

### Required: Privacy Policy
Google requires a privacy policy URL. You can:
1. Use https://www.privacypolicygenerator.info (free)
2. Host the generated policy at e.g. https://YOUR_DOMAIN/privacy
3. Add it in Play Console → App content → Privacy policy

---

## Free Tier Limits Summary

| Service    | Free Limit                          | Cost if exceeded        |
|------------|-------------------------------------|-------------------------|
| Vercel     | 100GB bandwidth, unlimited deploys  | $20/month Pro           |
| Supabase   | 500MB DB, 50,000 monthly users      | $25/month Pro           |
| Groq       | 14,400 req/day, 30 req/min          | Pay-per-token (tiny)    |
| Play Store | $25 one-time registration           | —                       |

For a personal or small app, you will stay on free tiers indefinitely.
