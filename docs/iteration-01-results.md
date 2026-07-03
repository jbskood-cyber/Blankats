# Iteration 01 results - first 6 generated PDFs

## Inputs tested

The first 6 generated outputs reviewed:

1. Maria Torres - Marketing.
2. Jorge Castillo - Frontend.
3. Andrea Mendoza - UX/UI.
4. Oscar Molina - Ventas automotrices.
5. Valeria Soto - Finanzas.
6. Raul Navarro - Logistica.

## Overall verdict

Not ready for paid automatic delivery yet.

The system is functional, but the final PDF product has quality issues that must be fixed before continuing large-scale tests.

## Main failures found

### 1. Bullets are merging incorrectly

Several outputs merge multiple bullets into one paragraph using `.-` or ` - ` instead of separate bullet lines.

Affected examples:
- Jorge Castillo.
- Andrea Mendoza.
- Valeria Soto.
- Raul Navarro.

Likely cause:
The AI returns experience descriptions as a single string, and the renderer splits only on line breaks. When the AI uses hyphen separators, they stay inside the same bullet.

Required fix:
Change schema from `description: string` to `bullets: string[]` for experience and projects.

### 2. Suggestions appear inside final paid PDF

Valeria Soto output included a bracketed suggestion in the final CV: `[Sugerencia: añadir %]`.

This is a hard failure.

Required fix:
Final PDF must never include bracketed suggestions, placeholders or AI comments. Suggestions belong only in diagnosis.

### 3. Premium inputs are visually downgraded

The generated PDFs are clean but too plain compared with the premium input CVs. They feel more like raw ATS text than a paid product.

Required fix:
Keep ATS-safe one-column output, but improve the PDF template with better spacing, hierarchy and subtle premium styling.

### 4. Some dates or details may be dropped

Raul Navarro output shows current role as `Actualidad` without a visible start date.

Required fix:
Preserve original dates whenever present. If date is uncertain, do not invent, but avoid dropping information that exists.

## What worked

- Most factual names, roles, companies and contact data are preserved.
- Maria Torres output is the strongest of the group.
- Oscar Molina output is acceptable but visually plain.
- The app successfully processed and exported PDFs.

## Required next changes

### AI schema changes

Replace:

```
description: string
```

With:

```
bullets: string[]
```

For:
- experience items
- project items if needed

### Prompt changes

Add explicit rules:

- Never include `[Sugerencia: ...]` in improvedCV.
- Never include placeholders in improvedCV.
- If something is missing, report it in diagnosis only.
- Preserve all original metrics and dates when present.
- For strong CVs, polish and normalize; do not over-rewrite.
- Each bullet must be an independent string.
- Each bullet must be 1 to 2 lines max when rendered.

### Renderer changes

- Render bullet arrays directly.
- Do not rely on splitting text by newline.
- Add fallback sanitizer to split accidental `.-` or ` - ` separators before rendering.
- Remove bracketed suggestions from final PDF as a safety net.

## Next test plan

Do not test all remaining PDFs yet.

First fix:
1. Bullet array schema.
2. No suggestions in final PDF.
3. Better PDF template.

Then rerun:
- Jorge Castillo.
- Andrea Mendoza.
- Valeria Soto.
- Raul Navarro.

These are the best regression cases because they revealed the current failures.
