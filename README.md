# LeadTrak: Buyer Lead Intake App

LeadTrak is a mini-app to capture, list, and manage buyer leads. It's built with modern web technologies, focusing on a clean user experience, robust validation, and efficient data management.


## Features

- **Lead Management:** Full CRUD (Create, Read, Update, Delete) functionality for buyer leads.
- **Advanced Filtering & Search:** Server-side pagination, URL-synced filters, and an AI-powered debounced search.
- **Data Validation:** Robust validation using Zod on both client and server sides.
- **Concurrency Control:** Prevents data conflicts during edits with a timestamp-based check.
- **Audit History:** Tracks and displays the history of changes for each lead.
- **CSV Operations:** Import leads from a CSV with row-by-row validation and export the current filtered list.
- **Authentication:** A complete authentication flow using Supabase Auth with magic links.
- **Responsive Design:** A professional, responsive layout with a collapsible sidebar and dark mode support.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Styling:** Tailwind CSS with shadcn/ui components
- **Validation:** Zod
- **State Management:** React Hooks & Context API
- **AI:** Genkit for AI-powered search query processing

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm
- A Supabase account and project.

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/riya0704/LeadTrak
    cd LeadTrak
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables from your Supabase project dashboard:

    ```
    # .env
    # Found in: Project Settings > API
    NEXT_PUBLIC_SUPABASE_URL=https://jpqicnkchrjrnsscovup.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcWljbmtjaHJqcm5zc2NvdnB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3NDQyNzIsImV4cCI6MjAzNzMyMDI3Mn0.A2ZJ_yCIz2tA4iOEnvyD-hTBas9iU5-3cW22tA3r3-E

    # Found in: Project Settings > Database > Connection string > URI
    # Make sure to replace [YOUR-PASSWORD] with your actual database password.
    DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.jpqicnkchrjrnsscovup.supabase.co:5432/postgres"
    ```

4. **Set up the database schema:**
    - Navigate to the SQL Editor in your Supabase project dashboard.
    - Create a "New query" and paste the entire contents of the SQL script from the [Database Setup](#database-setup) section below.
    - Click "RUN" to create the tables and security policies.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:9002`. The first user to sign up will be automatically assigned the `ADMIN` role.

## Deployment on Vercel

Yes, this application is fully compatible with Vercel.

1.  **Push your code to a Git repository** (e.g., GitHub, GitLab).
2.  **Import your project into Vercel.**
3.  **Configure Environment Variables:**
    In the Vercel project settings, navigate to "Environment Variables" and add the same variables from your `.env` file:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `DATABASE_URL`

Vercel will automatically build and deploy your application.

## Design & Architecture Notes

### Validation

Validation is a core aspect of this application, handled primarily by **Zod**.

-   **Schema Definition:** Schemas for the `Buyer` model are defined in `src/lib/schema.ts`. These schemas serve as the single source of truth for data validation.
-   **Client-Side:** `react-hook-form` is used for managing forms, with `@hookform/resolvers/zod` to apply Zod schemas directly. This provides instant feedback to the user as they type.
-   **Server-Side:** The same Zod schemas are used within Server Actions (`src/lib/actions.ts`) to validate incoming data before it's processed. This ensures data integrity even if client-side validation is bypassed.

### Authorization and RLS

Authorization is managed through Supabase Auth and PostgreSQL's Row Level Security (RLS).

-   A user's session is managed by the `AuthProvider` (`src/lib/auth.tsx`), which interacts with Supabase.
-   **UI Layer:** In the UI, buttons for editing or deleting are conditionally rendered or disabled based on whether the logged-in user's `id` matches the lead's `ownerId` or if the user has an `ADMIN` role. This is done in `src/components/buyers/buyer-form.tsx`.
-   **Database Layer (RLS):** The authoritative enforcement happens at the database level. The SQL script in the [Database Setup](#database-setup) section defines policies that strictly control who can read, create, or update leads. For example, a user can only update a lead if they are the `owner_id` or an `ADMIN`. This is the most secure layer of protection.

## Database Setup

Run the following SQL in your Supabase project's SQL Editor to create the necessary tables and policies.

```sql
-- Helper function to create an ENUM type only if it doesn't exist
CREATE OR REPLACE FUNCTION create_enum_if_not_exists(type_name text, type_values text[])
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = type_name) THEN
        EXECUTE 'CREATE TYPE ' || quote_ident(type_name) || ' AS ENUM (' || array_to_string(quote_literal(type_values), ',') || ')';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create custom ENUM types safely
SELECT create_enum_if_not_exists('city', ARRAY['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other']);
SELECT create_enum_if_not_exists('property_type', ARRAY['Apartment', 'Villa', 'Plot', 'Office', 'Retail']);
SELECT create_enum_if_not_exists('bhk', ARRAY['1', '2', '3', '4', 'Studio']);
SELECT create_enum_if_not_exists('purpose', ARRAY['Buy', 'Rent']);
SELECT create_enum_if_not_exists('timeline', ARRAY['0-3m', '3-6m', '>6m', 'Exploring']);
SELECT create_enum_if_not_exists('source', ARRAY['Website', 'Referral', 'Walk-in', 'Call', 'Other']);
SELECT create_enum_if_not_exists('status', ARRAY['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped']);
SELECT create_enum_if_not_exists('user_role', ARRAY['USER', 'ADMIN']);

-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."users" (
  "id" text PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "email" varchar(255),
  "role" user_role NOT NULL
);

-- Create the buyers table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."buyers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "full_name" varchar(80) NOT NULL,
  "email" varchar(255),
  "phone" varchar(15) NOT NULL,
  "city" city NOT NULL,
  "property_type" property_type NOT NULL,
  "bhk" bhk,
  "purpose" purpose NOT NULL,
  "budget_min" integer,
  "budget_max" integer,
  "timeline" timeline NOT NULL,
  "source" source NOT NULL,
  "status" status NOT NULL DEFAULT 'New',
  "notes" text,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "owner_id" text NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Create the buyer_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."buyer_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "buyer_id" uuid NOT NULL REFERENCES "public"."buyers"("id") ON DELETE CASCADE,
  "changed_at" timestamp with time zone NOT NULL DEFAULT now(),
  "changed_by" jsonb NOT NULL,
  "diff" jsonb NOT NULL
);

-- Enable Row Level Security (RLS) for the tables
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."buyers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."buyer_history" ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies safely

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Allow individual user access to their own data" ON "public"."users";
CREATE POLICY "Allow individual user access to their own data"
ON "public"."users"
FOR SELECT
USING (auth.uid()::text = id);

-- BUYERS TABLE POLICIES
DROP POLICY IF EXISTS "Allow individual read access" ON "public"."buyers";
CREATE POLICY "Allow individual read access"
ON "public"."buyers"
FOR SELECT
USING (auth.uid()::text = owner_id OR (SELECT role FROM public.users WHERE id = auth.uid()::text) = 'ADMIN');

DROP POLICY IF EXISTS "Allow individual insert access" ON "public"."buyers";
CREATE POLICY "Allow individual insert access"
ON "public"."buyers"
FOR INSERT
WITH CHECK (auth.uid()::text = owner_id);

DROP POLICY IF EXISTS "Allow individual update access" ON "public"."buyers";
CREATE POLICY "Allow individual update access"
ON "public"."buyers"
FOR UPDATE
USING (auth.uid()::text = owner_id OR (SELECT role FROM public.users WHERE id = auth.uid()::text) = 'ADMIN');


-- BUYER_HISTORY TABLE POLICIES
DROP POLICY IF EXISTS "Allow read access to history based on lead access" ON "public"."buyer_history";
CREATE POLICY "Allow read access to history based on lead access"
ON "public"."buyer_history"
FOR SELECT
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()::text) = 'ADMIN' OR
  buyer_id IN (SELECT id FROM public.buyers WHERE owner_id = auth.uid()::text)
);
```
