# StudentOS

An AI-powered student success platform. 

## Tech Stack
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS + ShadCN UI
- Backend: Next.js API Routes
- Database: MongoDB Atlas (via Mongoose)

## Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Make sure your `.env` file contains `MONGODB_URI` pointing to your MongoDB instance.
   - Example: `MONGODB_URI=mongodb://localhost:27017/studentos`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.
6. Verify the database connection by navigating to [http://localhost:3000/api/health](http://localhost:3000/api/health).
