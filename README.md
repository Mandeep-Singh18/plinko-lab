# 🎯 Plinko Lab — Provably Fair Plinko Game

This is a provably-fair Plinko game built for the **Daphnis Labs Full-Stack Intern Take-Home Assignment**.  
It features:

- ✅ Full **Commit–Reveal Fairness Protocol**
- ✅ **Deterministic, Seed-Replayable** Game Engine
- ✅ Smooth UI with animations & sound
- ✅ Public **Verifier Page** to prove fairness for any round

---

## 🔴 Live Links

| Page | Link |
|------|------|
| **Live Game** | https://YOUR_VERCEL_DEPLOYMENT_URL |
| **Verifier Page** | https://YOUR_VERCEL_DEPLOYMENT_URL/verify |

> Replace these after deployment.

---

## 🧱 Tech Stack

| Layer | Technologies |
|------|--------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Testing** | Vitest |
| **Linting** | ESLint |

---

## 🚀 Local Development

Clone

```
git clone YOUR_GITHUB_REPO_URL
cd plinko-lab
```

Install deps
```
npm install
```

Create .env file
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```
Run Prisma migration
```
npx prisma migrate dev
```

Start dev server
```
npm run dev
```

Visit → http://localhost:3000

Run Tests
```
npm run test
```

## 🏛️ Architecture Overview
```
plinko-lab/
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  └─ rounds/
│  │  │     ├─ commit
│  │  │     ├─ [id]/start
│  │  │     ├─ [id]/reveal
│  │  │     └─ verify
│  ├─ components/
│  │  └─ PlinkoGame.tsx      # UI + gameplay logic
│  └─ lib/
│     ├─ fairness.ts         # Hashing & seed utils
│     ├─ prng.ts             # XorShift32 PRNG
│     └─ engine.ts           # Core deterministic engine
└─ prisma/
   └─ schema.prisma
```

Frontend

- PlinkoGame.tsx handles UI rendering, animations, and user actions.
- /verify page allows public recomputation from seeds.

Backend API Routes
Endpoint	Purpose
- POST /api/rounds/commit	Generates serverSeed, nonce, and commitHex.
- POST /api/rounds/[id]/start	Takes clientSeed + dropColumn, runs engine, stores result.
- POST /api/rounds/[id]/reveal	Reveals hidden serverSeed for fairness proof.
- GET /api/verify	Recomputes result from public seeds to verify fairness.

## 🔐 Fairness Specification

Step 
- Commitment	commitHex = SHA256(serverSeed + ":" + nonce)
- Combined Seed	combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
- PRNG	XorShift32 seeded from first 4 bytes of combinedSeed
- Peg Map Bias	leftBias = 0.5 + (rand() - 0.5) * 0.2 (rounded to 6 decimals)
- Path Decision	Continue consuming same PRNG stream per move
- Final Bin	Number of Right moves → binIndex


## ⏱️ Time Log (Rough)

- 0:00 - 0:45 (Slice 0): Project setup (Next.js, TS, Tailwind), Prisma setup, and PostgreSQL connection.

- 0:45 - 2:30 (Slice 1 & 2): Built the complete backend. Implemented fairness.ts, prng.ts, and engine.ts. Built all four API endpoints (/commit, /start, /reveal, /verify).

- 2:30 - 3:30 (Slice 4): Wrote all unit tests (engine.test.ts) to match the PDF's test vectors. Debugged the engine until all tests passed.

- 3:30 - 5:00 (Slice 3): Built the frontend MVP. Hooked up the PlinkoGame.tsx component to the API, built the controls, and created the /verify page.

- 5:00 - 6:30 (Slice 3 Polish): Implemented the visual Plinko board, pegs, bins, and the CSS-based ball animation. Added react-icons for the mute button.

- 6:30 - 7:15 (Polish): Added sound by wiring up the <audio> tags and useRef. Implemented accessibility (keyboard controls, prefers-reduced-motion).

- 7:15 - 7:45 (Polish): Added the 'T' (Tilt) and 'G' (Debug Grid) easter eggs.

- 7:45 - 8:15 (Slice 5): Wrote this README, performed final testing, and prepared for deployment.

Total Time: ~8.25 hours

## 🎮 Controls & Easter Eggs
Key	Action
```
T	Toggle Tilt Mode (visual only)
G	Toggle peg/bin Debug Grid
M	Toggle sound
```


## 🤖 AI Assistance Disclaimer

- Used AI (Gemini) as a pair programmer for:

- Architectural planning

- Boilerplate code generation

- Debugging API route errors

- Refactoring audio system

All fairness logic, engine correctness, and test validation were written and verified by me.