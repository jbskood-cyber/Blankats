# Goal: Premium UX/UI for BlankATS MVP

## Objective

Turn the current minimum working app into a polished premium product experience while preserving the functional MVP.

Current MVP:
- Upload PDF or paste CV text.
- Analyze with Gemini.
- Show diagnosis and improved CV.
- Download generated PDF.

## Work scope

This is a UX/UI refinement goal, not a backend expansion goal.

Codex should improve:
- Landing/upload experience.
- Loading/analyzing state.
- Diagnosis/results view.
- Improved CV preview.
- Download actions.
- Empty states, errors and mobile polish.

## Drive references

Before implementation, inspect the Google Drive folder `BlankATS`.

Use:
- `02_UX_UI` for product visual direction.
- `07_Recursos` for logo, mockups and generated screens.

The approved mockups define the visual target. Do not invent a different product style.

## Brand rules

- Use the official BlankATS brand.
- The logo must be consistent on every screen.
- Do not use the generic AI Studio banner or generic app metadata.
- Replace generic metadata with BlankATS metadata.

## Typography rules

All web text must be formatted intentionally.

Use a global font:
- Preferred: Geist Sans.
- Alternative: Inter.
- Optional alternative: Manrope.

Apply clear hierarchy:
- Hero text: large, bold, balanced line height.
- Section titles: strong but not crowded.
- Body copy: readable, calm, high contrast.
- Buttons: medium-bold and visually centered.
- Labels and helper text: smaller, clean and consistent.

Avoid compressed text, random font sizes and default browser typography.

## Motion rules

Add subtle premium animations:
- Fade and slight slide on screen transitions.
- Gentle hover/tap feedback on buttons.
- Smooth loading progress.
- Subtle card entrance.
- No distracting animations.
- Respect mobile performance.

## UX rules

- Mobile-first.
- Clear primary CTA.
- Clear selected file state.
- Clear error state.
- Clear loading state.
- Clear success/download state.
- Do not trap the user.
- Keep actions obvious.

## Copy rules

Avoid risky claims.

Do not say:
- Guaranteed job.
- Guaranteed ATS pass.
- Beat every recruitment system.

Use safer language:
- Clearer structure.
- More professional presentation.
- Easier to review.
- Ready for digital processes and recruiters.

## Do not implement yet

- Supabase.
- Mercado Pago.
- Resend.
- Authentication.
- Admin dashboard.
- Payment flow.

## Expected output

A PR-ready implementation that:
- Looks premium.
- Uses the approved visual direction.
- Keeps the MVP working.
- Has reusable components.
- Has global typography.
- Has subtle animations.
- Passes build or reports exact failures.
