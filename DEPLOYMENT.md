# Vercel Deployment Guide

## Overview
This project has been refactored to use Vercel Serverless Functions for secure payment processing. The API key is never exposed to the frontend.

## Deployment Steps

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Refactor to use Vercel Serverless Functions for payments"
git push
```

### 2. Set Environment Variables on Vercel
- Go to your Vercel project settings
- Navigate to **Settings → Environment Variables**
- Add a new environment variable:
  - **Name**: `FASTLIPA_API_KEY`
  - **Value**: Your FastLipa API key
  - **Environments**: Select all (Production, Preview, Development)

### 3. Deploy
```bash
vercel deploy --prod
```

Or simply push to your main branch - Vercel will auto-deploy!

## Architecture

### Frontend Flow
1. User fills in donation form (donate.html)
2. Frontend calls `/api/payment` (internal Vercel function)
3. User sees thank you page

### Backend Flow
1. Vercel function receives request at `/api/payment`
2. Reads `FASTLIPA_API_KEY` from environment variables
3. Calls FastLipa API securely (API key never exposed to frontend)
4. Returns response to frontend

## File Structure
```
/workspaces/memespro/
├── api/
│   └── payment.js           # Vercel Serverless Function
├── donate.html              # Frontend donation page
├── payment.js               # Frontend payment module
├── vercel.json              # Vercel configuration
├── .gitignore               # Git ignore rules
└── ... (other files)
```

## Security Features
✅ API key stored only in Vercel environment variables  
✅ API key never exposed to frontend code  
✅ API key never committed to version control  
✅ CORS-safe internal API calls  
✅ Input validation on backend  
✅ Error handling without exposing sensitive info  

## Testing Locally
1. Create `.env.local` in root directory:
   ```
   FASTLIPA_API_KEY=your_test_api_key
   ```

2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

3. Run locally:
   ```bash
   vercel dev
   ```

## Notes
- `.env` file is removed and never committed
- Environment variables are managed only on Vercel
- All payment logic is server-side for security
- Frontend cannot access the API key
