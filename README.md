# SMP Launch MVP

This is the launch-focused web version of your app.

It is designed to use:

- `Vercel` for hosting the website
- `Supabase` for the online database
- `PostgreSQL` as the database engine under Supabase

## What this app currently includes

- mobile-friendly layout
- colorful gradient UI
- 20 seeded test accounts for practical multi-device testing
- account creation
- global feed
- hashtags
- icon buttons for like, comment, repost, views, and bookmark
- direct messages with shared Supabase conversations/messages and media URL attachments
- guest and signed-in random chat flow with Supabase-backed queue/conversation tables
- public and private groups with membership states, group posts, and admin moderation actions
- spaces
- profile menu
- settings
- bookmarks
- notifications

## Important truth

This project is `ready` for Vercel + Supabase, but it becomes truly online only after you create your own Supabase and Vercel projects and connect them.

## Important after recent changes

Because the SQL files were changed during development, if you already set up Supabase earlier, do this now:

1. Open `Supabase`
2. Go to `SQL Editor`
3. Run `web-app/supabase/schema.sql` again
4. Run `web-app/supabase/seed.sql` again

Because the app code was also changed, if your site is already on Vercel, do this too:

1. Push the latest code to GitHub
2. Open `Vercel`
3. Open your project
4. Click `Redeploy`

If you changed only SQL files:

- `Supabase` must be updated
- `Vercel` does not need new environment variables

If you changed app code:

- `Vercel` must be redeployed

If you changed `.env` values:

- update local `.env`
- update the same values in `Vercel` environment variables
- restart local dev server
- redeploy in Vercel

## Database choice

This project uses `Supabase`.

Why:

- free starter plan
- PostgreSQL underneath
- works for web, Android, and iOS later
- easier to grow and change later than many locked-in options

## What is already connected to Supabase in this code

If you add real Supabase keys, this app can already:

- read `profiles`
- read `posts`
- read `groups`
- read `spaces`
- read `notifications`
- read `threads`
- read `thread_messages`
- read `comments`
- read `follows`
- read `direct_threads`
- read `direct_messages`
- read `direct_thread_reads`
- read `bookmarks` for the logged-in viewer
- read `random_chat_messages` for the active session
- insert new `profiles`
- insert new `posts`
- insert new `groups`
- insert new `comments`
- add and remove `follows`
- create or reuse `direct_threads`
- update existing `profiles`
- insert sent `direct_messages`
- update `direct_thread_reads`
- insert `random_chat_sessions`
- insert `random_chat_messages`
- add and remove `bookmarks`
- write `activity_log` entries for key actions

## What is still local-only right now

These parts are still partial or simplified right now:

- direct-message media uses shared URL attachments, not full uploads/storage buckets yet
- full auth and security rules
- advanced moderation/governance flows

## Project files

- `src/App.tsx` = main app UI and launch logic
- `src/App.css` = page styling
- `src/index.css` = global colors and theme
- `src/types.ts` = shared TypeScript types
- `src/data/seed.ts` = demo data
- `src/lib/supabase.ts` = Supabase client connection
- `supabase/schema.sql` = database tables
- `supabase/seed.sql` = starter database records
- `.env.example` = environment variable example

## Part 1: Run it on your computer first

Open Cursor terminal and run:

```bash
cd /Users/varun/Downloads/SMAPP/web-app
npm install
npm run dev
```

Then open the local link in Chrome.

## Part 2: Create Supabase account

1. Open [https://supabase.com](https://supabase.com)
2. Click `Start your project`
3. Sign in with GitHub, Google, or email
4. After logging in, click `New project`
5. Choose your organization
6. Fill these fields:
   - `Project name`: `smapp-launch`
   - `Database Password`: create a strong password and save it somewhere safe
   - `Region`: choose the region closest to you
7. Click `Create new project`
8. Wait until Supabase finishes setting up

## Part 3: Create the database tables

After the Supabase project opens:

1. In the left menu, click `SQL Editor`
2. Click `New query`
3. Open the file `web-app/supabase/schema.sql`
4. Copy all of its contents
5. Paste it into the Supabase SQL Editor
6. Click `Run`
7. Wait for success message

If you already ran the old version before, run this updated schema again so the new indexes are added too.

If Supabase asks whether to run SQL again, that is okay. This schema uses `if not exists` in many places so re-running is expected during updates.

This creates the tables for:

- profiles
- posts
- groups
- spaces
- threads
- thread messages
- notifications
- bookmarks
- follows
- comments
- post reactions
- random chat sessions
- random chat messages
- activity log

## Part 4: Add starter data

1. Still in Supabase, click `SQL Editor`
2. Click `New query`
3. Open the file `web-app/supabase/seed.sql`
4. Copy all of its contents
5. Paste it into Supabase
6. Click `Run`

If you already used the older seed before, run the updated seed again so the newest demo rows exist for the current app version.

This adds starter records like:

- 3 profiles
- sample posts
- groups
- spaces
- notifications
- thread data
- comments
- follows

## Part 5: Get Supabase URL and key

1. In Supabase left menu, click `Project Settings`
2. Click `API`
3. Find these two values:
   - `Project URL`
   - `anon public key`

You will use those in the next steps.

## Part 6: Connect Supabase to your local app

1. Inside `web-app`, create a new file named `.env`
2. Copy the contents of `.env.example`
3. Replace the values with your real Supabase values

Your `.env` should look like this:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-real-anon-key
```

4. Save the file
5. Stop the dev server if it is running
6. Run again:

```bash
npm run dev
```

Now the app should connect to Supabase.

## Part 7: Check if the database is really working

Do this simple test:

1. Open the app
2. Create a new account
3. Create a new post
4. Create a new group
5. Open `Settings` and change the profile
6. Save the profile
7. Open `Messages` and send a message
8. Bookmark a post or profile

Then check Supabase:

1. Click `Table Editor`
2. Open `profiles`
3. Open `posts`
4. Open `groups`
5. Open `thread_messages`
6. Open `bookmarks`
7. Open `activity_log`

You should see your new records there.

If you see them there, then yes, your app is storing real data in the online database.

## Part 8: Create Vercel account

1. Open [https://vercel.com](https://vercel.com)
2. Click `Sign Up`
3. The easiest option is `Continue with GitHub`
4. Finish signup

## Part 9: Put your code on GitHub

Vercel works easiest if your project is on GitHub.

If you do not already have a GitHub repository:

1. Open [https://github.com](https://github.com)
2. Click `New repository`
3. Repository name: `smapp-web`
4. Click `Create repository`

Then in Cursor terminal run:

```bash
cd /Users/varun/Downloads/SMAPP/web-app
git init
git add .
git commit -m "Initial SMAPP launch MVP"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the URL GitHub gives you.

## Part 10: Deploy to Vercel

1. Open Vercel dashboard
2. Click `Add New...`
3. Click `Project`
4. Import your GitHub repository
5. Select the `web-app` project if asked
6. Vercel will detect `Vite`
7. Before clicking deploy, add environment variables

## Part 11: Add environment variables in Vercel

Inside the Vercel project setup screen:

1. Find `Environment Variables`
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Paste the same values you used in your local `.env`
4. Click `Deploy`

After that, Vercel will build and publish your site.

If the project is already deployed and you only changed code:

1. Push the new code to GitHub
2. Open the Vercel project
3. Click `Deployments`
4. Click `Redeploy` on the newest commit

If you changed environment variables:

1. Open Vercel project
2. Click `Settings`
3. Click `Environment Variables`
4. Update the values
5. Redeploy the project

## Part 12: Test the live website

After deployment:

1. Open your Vercel project URL
2. Create a test account
3. Create a test post
4. Create a test group
5. Go back to Supabase Table Editor
6. Confirm the new data appears in:
   - `profiles`
   - `posts`
   - `groups`

If yes, then:

- website is hosted on `Vercel`
- data is stored in `Supabase PostgreSQL`

## Part 13: Where the data lives

When fully connected:

- website files live on `Vercel`
- user/profile/post/group/space data live in `Supabase`
- database engine is `PostgreSQL`

When not connected:

- the app falls back to demo/local behavior

## Part 14: What to click in the app

After signing in:

- click left navigation for `Feed`, `Messages`, `Groups`, `Spaces`
- click the top-right profile icon for:
  - `Profile`
  - `Bookmarks`
  - `Activity`
  - `Settings`
- click feed icons for:
  - comment
  - repost
  - like
  - views
  - bookmark

The details panel on the right will show more information when you click some action icons.

## Part 15: Before public launch

This is still an MVP. Before a real public launch, you should still add:

- proper sign-in/auth system
- Supabase Row Level Security rules
- real follow system
- real private message syncing from database
- real guest random chat matching system
- reporting and moderation handling
- media uploads for images and videos
- abuse protection and rate limiting
- proper authentication instead of the current lightweight viewer model

## Part 16: Best simple hosting answer

If someone asks you:

`Where is this hosted?`

Answer:

- `Frontend`: Vercel
- `Database`: Supabase
- `Database type`: PostgreSQL

## Part 17: If something does not work

Check these first:

1. Did you create `.env` in `web-app`?
2. Did you paste the correct Supabase URL?
3. Did you paste the correct anon key?
4. Did you run the newest `schema.sql` after recent changes?
5. Did you run the newest `seed.sql` after recent changes?
6. Did you restart `npm run dev` after changing `.env`?
7. Did you add the same env values inside Vercel?
8. Did you redeploy Vercel after code changes?

## Part 18: Useful commands

Run locally:

```bash
cd /Users/varun/Downloads/SMAPP/web-app
npm install
npm run dev
```

Build check:

```bash
npm run build
```
