# UI/UX Design Rules
## 1. No Emojis
Do not use emojis anywhere in the UI — not in headings, subheadings, buttons, 
labels, tooltips, notifications, or any text content. Use plain text or proper 
icon components (like SVG icons) instead, never emoji characters.
## 2. Minimal Design
Keep every page visually minimal and clean:
- Avoid unnecessary decorative elements, extra shadows, gradients, or borders.
- Avoid cluttering a component with more information than needed.
- Prioritize whitespace and simplicity over dense visuals.
## 3. Short, Context-Aware Text (Max 3-4 Words for Headings/Labels)
Never write long, descriptive labels when a short word/phrase is enough.
- Headings, labels, button texts, and card titles must be **at most 3-4 words**.
- Example: "Enter Binary Sequence" → "Binary Sequence"
- Example: "Select a scheme to simulate" → "Pick a scheme"
## 4. Single-Line Descriptions on Mobile (Max 1 Line)
Any descriptive/helper text (subtext under a heading, empty-state message, 
tooltip, card description, etc.) must be **at most 1 line long** on mobile 
(320px–400px width).
- Rewrite long explanations into concise single-line phrases.
- Example: "Converts binary data into voltage signals"
- Example: "Returns to 0V mid-bit for 1, stays 0V for 0"
## 5. Fully Mobile Responsive
- All boxes, cards, containers, and text must resize/scale properly based 
  on screen width (mobile, tablet, desktop).
- Padding, font-size, and spacing should adapt using responsive units 
  (%, rem, clamp(), media queries, etc.) instead of fixed pixel values 
  wherever possible.
## 6. CRITICAL RULE — No Unwanted Line Breaks in Short UI Text
No text label, heading, badge, counter, chip, or button text may exceed 
one line on a 375px-wide mobile screen. If it doesn't fit, shorten the 
text first, then reduce font-size as a last resort — never allow wrapping 
for short labels/headings.
- Always use whitespace-nowrap or appropriate clamp sizing on labels, 
  chips, buttons, and short status indicators.
## 7. Moderate Border Radius (No Excessive Rounding) & Clean Alignment
Do not make boxes, cards, containers, or buttons excessively rounded (avoid extreme rounded shapes like `rounded-[2.2rem]`, `rounded-3xl`, or aggressive pill shapes where rectangular buttons look cartoonish).
- Use clean, modern border radius like `rounded-xl` or `rounded-2xl` for cards, boxes, chips, and buttons.
- All internal elements inside cards (avatar, name, badges, interest chips, action buttons) must be perfectly aligned, centered, and proportional without awkward vertical gaps or clunky pill buttons.