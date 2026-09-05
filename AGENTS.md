<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Meova UI & Engineering Rules (MANDATORY)
Strictly follow `UI_RULES.md` for ALL UI and backend changes:
1. **NEVER USE GREY**: Strictly avoid `zinc-400`, `zinc-500`, `neutral-400`, `gray-400`, `bg-zinc-100`, `#f0f0f0`, and any dull/washed-out grey tones. Use only pure white (`bg-white`), deep pitch black (`text-black`, `bg-black`), Meova Royal Purple (`#7C3AED`), and dark text (`text-black/70`).
2. **BACKEND CONNECTIVITY & MANDATORY SCRIPT VERIFICATION**: Never build "just UI" or superficial mock logic. Whenever ANY function, table query, API route, or backend feature is added or modified, you MUST proactively write and run an automated Node.js test script to execute the function and verify live Supabase responses. Never rely on assumptions or visual checks alone—inspect live database column names, data types, and confirm 100% error-free execution with Exit Code 0.
3. **CUSTOM SELECT DROPDOWNS**: Never use native browser `<select>` elements which show unstyled OS popups. Always use `components/CustomSelect.jsx`.
4. **GIGS EXCLUSION**: Gigs are permanently removed from the user interface. Never add gigs cards, tabs, or buttons back into the feed, create modal, or profile.
5. **NO INFORMAL EMOJIS**: Never use unicode emojis in UI headings, badges, or buttons. Use clean vector SVGs from `@/lib/icons` or `lucide-react`.
6. **MOBILE FIRST & ZERO WRAPPING**: Action buttons must have `whitespace-nowrap` and `flex-shrink-0` so text never breaks into 2 lines on mobile screens.
7. **CARD GEOMETRY**: Use `rounded-[26px]` to `rounded-[28px]` for cards, `rounded-[32px]` for modals, and subtle hairline borders (`border-black/10`).
8. **EXCLUSIVE INTER TYPOGRAPHY**: Always use `Inter` font family for all text, headings, buttons, numbers, and micro-labels across the entire platform. Never import or use other fonts.
