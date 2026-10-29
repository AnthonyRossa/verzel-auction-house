# Auto Bids

A vehicle auction app where users can list cars, bid, and track their auctions.

**Live app:** [verzel-auction-house-nu.vercel.app](https://verzel-auction-house-nu.vercel.app/)

## Features

- Browse and search vehicle auctions.
- Register, log in, and manage your own listings.
- Place bids, view bid history, and withdraw a leading bid.
- Track total, committed, and available demo balance.

> Balance and bidding are for demonstration only; no real payments are made.

## Built with

React, React Router, and Vite for the frontend; Node.js and Express for the API;
PostgreSQL for storage; JWT and bcrypt for authentication.

## Run locally

You need Node.js, npm, and PostgreSQL. Create a database with the tables
required by the app (the project does not yet include database migrations).

1. Create `backend/.env`:

   ```dotenv
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=auction_house
   PGUSER=auction_app
   PGPASSWORD=your-local-password
   PORT=3000
   JWT_SECRET=your-long-random-secret
   ```

   You can use `DATABASE_URL` instead of the individual `PG*` settings.

2. Start the API:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. In a second terminal, start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Open [http://localhost:3001](http://localhost:3001). Vite proxies API
   requests to `http://localhost:3000`. To use another API URL, set
   `VITE_API_URL` in `frontend/.env.local`, for example:

   ```dotenv
   VITE_API_URL=http://localhost:3000/api
   ```

Keep environment files and secrets private. The backend health check is
available at `http://localhost:3000/api/health`.

## Next steps

Add database migrations and backend tests, improve real-time updates and image
hosting, and replace demo balance with a secure payment provider before handling
real money.
