# Iris Outreach — NJ Contractor Prospect Tracker

A fully static, zero-dependency web app for tracking outreach calls and status for NJ home-service contractor prospects.

## Features
- **Table View** — sortable, filterable list of all prospects
- **Kanban View** — drag-free status board (Not Started → Contacted → In Progress → Follow Up → Won/Lost)
- **Prospect Detail Modal** — full intel card: pain signals, opening angle, FSM tool, ads, contact info
- **Call Log** — log every call with date, outcome (Reached / Voicemail / No Answer / etc.) and notes
- **Status & Next Action** — update inline from table or in detail modal
- **Follow-Up Date** — color-coded (overdue in red, today in yellow, upcoming in green)
- **CSV Export / Import** — export your tracking data, edit in Excel, re-import
- **LocalStorage Persistence** — all data saves in your browser automatically
- **Stats Bar** — live counts for contacted, won, follow-up, overdue, total calls

## Files
```
iris-outreach/
├── index.html      # Main app shell
├── style.css       # Dark-mode styles
├── app.js          # All application logic
├── data.js         # Prospect data (seeded from Google Sheets)
└── README.md       # This file
```

## Quick Start (Local)
1. Unzip this folder
2. Open `index.html` in your browser
3. That’s it — no server needed!

> **Tip:** Chrome/Edge work best for localStorage. If you use Safari in private mode, data won’t persist.

## Deploy to Vercel (1-click)
```bash
npm i -g vercel
cd iris-outreach
vercel --yes
```
Vercel will detect the static site and deploy it. You’ll get a shareable URL like `https://iris-outreach-xyz.vercel.app`.

## Deploy to Netlify (drag-and-drop)
1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag the entire `iris-outreach/` folder onto the deploy zone
3. Done — live URL in seconds

## Deploy to GitHub Pages
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/iris-outreach.git
git push -u origin main
```
Then in GitHub → Settings → Pages → Source: `main` branch, `/ (root)`.

## Updating Prospect Data
If the Google Sheet gets new rows:
1. Re-export to JSON (or update `data.js` manually)
2. Replace `data.js` in the project
3. Click **Reset Data** in the app to reload from the new seed
   > ⚠️ Warning: Reset clears all tracking data (statuses, notes, call logs). Export a CSV backup first!

## Data Model
Each prospect stores:
```json
{
  "id": "p1",
  "rank": 1,
  "score": 11,
  "company": "...",
  "trade": "Landscaping",
  "status": "Not Started",
  "nextAction": "",
  "notes": "",
  "followUpDate": "",
  "callLog": [
    { "date": "2025-01-15", "outcome": "Voicemail", "notes": "Left VM about scheduling" }
  ]
}
```
