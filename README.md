# CourseForge AI

A Next.js application for AI-powered course generation developed during the Hackathon.


## Overview

CourseForge AI Course Generator leverages the Gemini AI model to automatically generate comprehensive courses based on user input. The system breaks down topics into structured units and chapters with rich content.

## Technologies Used

- Next.js 14 (App Router)
- TypeScript
- Google's Gemini AI API
- Prisma with PostgreSQL
- Tailwind CSS / shadcn/ui
- NextAuth.js for authentication

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/lightspeed-hackathon.git
cd lightspeed-hackathon
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```
# Create a .env.local file with:
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_database_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_SECRET=secret
GOOGLE_CLIENT_ID=google_client_id
GOOGLE_CLIENT_SECRET=google_client_secret
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=youtube_api_key
UNSPLASH_API_KEY=unsplash_api_key
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
# or 
yarn dev
```


