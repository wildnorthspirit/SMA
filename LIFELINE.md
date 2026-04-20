# LIFELINE (BEGINNER EXECUTION SYSTEM)

[IDENTITY]
Project: SMA (Social Media App)
Stack: React + TypeScript + Supabase
Goal: Build persistent backend-first system

--------------------------------------------------

[USER - CRITICAL]

User has ZERO computer knowledge.

AI MUST:
- Tell EXACTLY where to click
- Tell EXACTLY what to type
- Tell EXACTLY what to open
- NEVER skip steps
- NEVER assume knowledge

Bad example:
"open terminal"

Correct example:
"Press Windows key → type 'cmd' → click Command Prompt"

--------------------------------------------------

[SYSTEM TYPE]

This is NOT documentation.
This is a LIVE EXECUTION CONTROLLER.

AI must:
- START immediately from CURRENT_TASK
- NOT analyze broadly
- NOT explain theory

--------------------------------------------------

[GLOBAL RULES]

1. Every action must be step-by-step  
2. Every step must be physically doable (click/type)  
3. No skipped steps  
4. No assumptions  
5. No technical shortcuts  
6. Stay ONLY inside CURRENT_TASK  

--------------------------------------------------

[EXECUTION FORMAT - STRICT]

EVERY RESPONSE MUST HAVE:

1. ACTION STEPS  
- Micro steps (click-by-click)

2. CODE  
- Full code
- Tell WHERE to paste
- Tell HOW to save

3. SYSTEM UPDATE  
- Short updates

NO EXTRA TEXT.

--------------------------------------------------

[CURRENT_TASK - HARD START]

FIX POSTS PERSISTENCE (SUPABASE)

START IMMEDIATELY:

- Find post creation code  
- Connect it to Supabase (INSERT)  
- Fetch posts from database  
- Show posts in UI  

STOP after done.

DO NOT:
- explore repo
- redesign system
- add features

--------------------------------------------------

[STATE SNAPSHOT]

Posts:
- Saved in app memory only
- Lost after refresh

Feed:
- Not connected to database

Backend:
- Supabase exists but unused

Missing:
- Insert query
- Fetch query
- UI binding

--------------------------------------------------

[REQUIRED FILES]

If missing → ASK ONLY:

- src/lib/supabase.ts  
- Post creation file  
- Feed display file  

DO NOTHING ELSE.

--------------------------------------------------

[STRICT FLOW]

IF files not given:
→ Ask for files only

IF files given:
→ Immediately:
   - give steps
   - give code
   - give updates

--------------------------------------------------

[FAIL CONDITIONS]

AI FAILED if:
- skips steps
- uses technical words without instruction
- explains instead of guiding
- does not give click-by-click steps

AI must correct before sending.

--------------------------------------------------

[SYSTEM UPDATE FORMAT]

PROJECT_STATE.md
- what changed

TASKS.md
- progress
- next step

LIFELINE.md
- update ONLY if needed

--------------------------------------------------

[EVOLUTION ENGINE]

After every response:
- make steps simpler
- reduce confusion
- improve clarity for beginner

--------------------------------------------------

[SELF-CHECK BEFORE RESPONSE]

AI must confirm:

- Did I give click-by-click steps?  
- Did I avoid assumptions?  
- Did I give full code?  
- Did I stay in CURRENT_TASK?  
- Did I include updates?  

If ANY = NO → FIX

--------------------------------------------------

[MEMORY RULE]

This file is the ONLY memory.

AI must rely ONLY on this.

--------------------------------------------------

[CONTROL COMMAND]

If user says:
"FOLLOW LIFELINE"

AI must obey ALL rules strictly.