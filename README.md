# Bible Reading Tracker

A web application for tracking daily Bible reading progress, competing with group members, and viewing group leaderboards.

## Features

1. **User Authentication**: Login with name, password, and group name
2. **Reading Log**: Select Bible chapters and log how many chapters you've read
3. **Group Progress**: View reading progress of members in your group
4. **All Groups Leaderboard**: See how all groups are performing

## Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- A Supabase account (free tier works fine)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bible-reading-tracker
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `bible-reading-tracker` (or any name you prefer)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose the closest region
5. Click "Create new project" and wait for it to be ready

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Set Up the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of `scripts/001_create_schema.sql`
4. Click "Run" to execute the SQL script

This will create:
- `groups` table (with 5 default groups)
- `profiles` table (linked to auth.users)
- `readings` table (for tracking daily readings)
- Row Level Security (RLS) policies

### 4. Configure Authentication

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Under "Site URL", add your local development URL: `http://localhost:3000`
3. Under "Redirect URLs", add:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/auth/sign-up-success`

### 5. (Optional) Enable Email Authentication

By default, Supabase requires email confirmation. For development, you can:

1. Go to **Authentication** → **Settings**
2. Under "Email Auth", toggle "Enable email confirmations" OFF (for development only)
3. For production, keep it ON and configure SMTP settings

### 6. Test the Setup

1. Start your development server: `pnpm dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign Up" to create a test account
4. Select a group and complete registration
5. Log in with your credentials

## Project Structure

```
bible-reading-tracker/
├── app/
│   ├── auth/
│   │   ├── login/          # Login page with group selection
│   │   ├── sign-up/         # Registration page
│   │   └── sign-up-success/ # Success page after registration
│   ├── dashboard/           # Main dashboard page
│   └── page.tsx             # Landing page
├── components/
│   ├── dashboard-content.tsx  # Main dashboard component with sidebar and tabs
│   └── ui/                     # Reusable UI components
├── lib/
│   └── supabase/            # Supabase client configuration
├── scripts/
│   └── 001_create_schema.sql # Database schema
└── README.md
```

## Features Breakdown

### 1. Login Page
- Name and password authentication
- Group name selection and validation
- Verifies user belongs to selected group

### 2. Dashboard - Log Reading Tab
- Select Bible chapter from dropdown (all 66 books)
- Enter number of chapters read
- Save reading progress
- View personal statistics and recent readings

### 3. Dashboard - My Group Tab
- View all members in your group
- See each member's total chapters read this month
- Ranked leaderboard within your group

### 4. Dashboard - All Groups Tab
- View all groups' total progress
- Group leaderboard for the current month
- See which group is leading

## Database Schema

### Groups Table
- `id` (UUID, Primary Key)
- `name` (TEXT)
- `created_at` (TIMESTAMP)

### Profiles Table
- `id` (UUID, Primary Key, references auth.users)
- `email` (TEXT)
- `full_name` (TEXT)
- `group_id` (UUID, references groups)
- `created_at` (TIMESTAMP)

### Readings Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, references auth.users)
- `chapters_read` (INTEGER)
- `reading_date` (DATE)
- `created_at` (TIMESTAMP)
- Unique constraint on (user_id, reading_date)

## Row Level Security (RLS)

The database uses Supabase RLS policies:
- **Groups**: Everyone can read all groups
- **Profiles**: Everyone can read, but only update their own
- **Readings**: Everyone can read, but only insert/update/delete their own

## Troubleshooting

### Login Not Working

1. Check that your `.env.local` file has the correct Supabase credentials
2. Verify the user exists in Supabase Auth
3. Ensure the user has a profile in the `profiles` table
4. Check browser console for errors

### Database Errors

1. Make sure you've run the SQL schema script
2. Verify RLS policies are enabled
3. Check that your Supabase project is active

### Build Errors

1. Run `pnpm install` to ensure all dependencies are installed
2. Check that all environment variables are set
3. Verify TypeScript types are correct

## Production Deployment

### Environment Variables

For production, set these environment variables in your hosting platform:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

### Supabase Production Settings

1. Update "Site URL" in Supabase Auth settings to your production URL
2. Add production redirect URLs
3. Enable email confirmations
4. Configure SMTP for production emails

### Build and Deploy

```bash
pnpm build
pnpm start
```

## Technologies Used

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Supabase** - Backend (Auth + Database)
- **Tailwind CSS** - Styling
- **Radix UI** - UI components
- **Lucide React** - Icons

## License

This project is open source and available under the MIT License.

