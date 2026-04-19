# LIFELINE (PRIMARY CONTROL SYSTEM)

[IDENTITY]
Project: SMA (Social Media System)
Type: Large-scale social platform
Goal: Build scalable, multi-platform system with future expansion (AI, governance, intelligent database)

--------------------------------------------------

[USER_PROFILE]
- No coding knowledge
- Needs step-by-step (click-by-click)
- Wants short, efficient answers
- Prefers fastest methods (one-command if possible)
- Learns by doing (test → fix → repeat)
- Prefers automation over manual work

--------------------------------------------------

[LEARNING_RULE]
- Continuously observe user behavior
- Improve instruction style over time
- Add new preferences when discovered

--------------------------------------------------

[CORE_SYSTEM_DESIGN]
System includes:
- Global feed (posts, replies, threads)
- Profiles (followers, metadata)
- Chat system (DM + future anonymous)
- Groups (public + private + governance)
- Voice spaces (future)
- Random chat (anonymous system)

--------------------------------------------------

[DATA_RULE]
- ALL features must persist in database
- NO frontend-only logic
- Supabase = single source of truth

--------------------------------------------------

[CURRENT_STATE]
- UI built and functional visually
- Backend not properly connected
- Posts not persistent
- Chat session-only
- Groups partial
- Random chat not working

--------------------------------------------------

[CURRENT_TASK]
- Fix posts persistence (Supabase)

--------------------------------------------------

[DEVELOPMENT_PHASES]
Phase 1:
- Auth (basic)
- Posts persistence
- Feed real data

Phase 2:
- Replies/comments persistence
- Messaging persistence

Phase 3:
- Groups backend

Phase 4:
- Random chat
- Spaces

Phase 5:
- Advanced systems (AI clones, governance, intelligent DB)

--------------------------------------------------

[FUTURE_COMPATIBILITY]
System must support:
- AI user clones
- Democratic moderation systems
- Advanced data analysis
- Cross-platform apps (Web → Android → iOS)

--------------------------------------------------

[EXECUTION_RULES]
- Always give exact step-by-step instructions
- Prefer fastest/automated methods
- No assumptions about user knowledge
- No unnecessary explanations
- Never break scalability
- Backend-first development only

--------------------------------------------------

[FILE_TARGETING_RULE]
Before making changes:
1. Identify relevant files
2. Prioritize:
   - src/lib/supabase.ts
   - src/App.tsx
   - UI components in src
3. Read code before suggesting changes
4. If unsure → ask user

--------------------------------------------------

[REFERENCE]
- PROJECT_STATE.md → detailed state
- TASKS.md → execution plan
- ARCHITECTURE.md → system design
- WEBAPP.txt → full feature plan (reference only)
- PHY.txt → optional strategy reference

--------------------------------------------------

[EVOLUTION_SYSTEM]
- System must evolve after every step
- AI must track:
  - progress
  - behavior patterns
  - improvements
- Updates must be generated automatically in each response

--------------------------------------------------

[MANDATORY_OUTPUT_PROTOCOL]

EVERY response MUST include:

1. ACTION STEPS
- Exact steps for user

2. CODE CHANGES
- Full code (ready to paste)

3. SYSTEM UPDATE (MANDATORY)
- PROJECT_STATE.md update
- TASKS.md update
- LIFELINE.md update (if needed)

Rules:
- Never skip SYSTEM UPDATE
- Never wait for user to ask
- Keep updates short and structured

--------------------------------------------------

[INSTRUCTION_TO_AI]

- Read LIFELINE.md first
- Then read TASKS.md
- Continue ONLY from CURRENT_TASK
- Do NOT restart system
- Do NOT redesign system
- Do NOT overload memory
- Always follow MANDATORY_OUTPUT_PROTOCOL
- Always optimize for speed, clarity, and scalability