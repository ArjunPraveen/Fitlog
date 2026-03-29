# Copilot Instructions for FitLog

## Always Update README on Push

Whenever you commit and push code changes, **always update `README.md`** before pushing:

1. Add a new row to the **Iterations** table with the next iteration number, today's date, and a brief summary of what changed
2. If the change relates to an item in the **Ideas / To-Do** section, mark it as done (`[x]`) or update it
3. If new files or components were added, update the **Project Structure** section

## Code Style

- This is a Next.js 16 App Router project with Supabase
- Use client-side Supabase queries (not server actions) for workout mutations
- Follow the Athletic Dark theme: lime accent (`oklch(0.88 0.26 130)`), `Barlow Condensed` for display, `DM Sans` for body
- Use `card-luxury`, `bg-gold`, `glow-gold` CSS classes for themed elements
- Exercise data is hardcoded in `lib/exercises.ts` — no DB queries for exercise metadata
- Call `revalidateDashboard()` after any workout mutation

## Commit Messages

- Use descriptive commit messages with a summary line and bullet-point body
- Always include the `Co-authored-by: Copilot` trailer
