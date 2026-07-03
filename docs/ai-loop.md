# BlankATS AI iteration loop

Purpose: improve the CV processing prompt until the final paid PDF is consistently good.

## Target

Optimize the instructions used by app/api/analyze/route.ts.

The output must be:
- accurate
- clear
- professional
- cleanly structured
- useful enough to sell

## Loop

1. Pick one test CV.
2. Upload it to the app.
3. Generate the improved CV.
4. Download the PDF.
5. Score the result using docs/product-quality-tests.md.
6. Identify the failure.
7. Adjust the AI prompt or schema.
8. Test the same CV again.
9. Compare before and after.

## Common failures

Fabrication:
The AI invents companies, dates, roles, degrees or metrics.
Fix: strengthen no-invention rules.

Weak writing:
The output sounds too similar to the original.
Fix: require stronger action verbs and concise bullets.

Bad structure:
Sections are wrong, missing or disordered.
Fix: tighten required section order.

Bad PDF value:
The final PDF has placeholders, bracketed suggestions or looks unfinished.
Fix: move suggestions to diagnosis only and keep final PDF clean.

## Rule

Diagnosis can suggest changes. Final PDF must be ready to send.

## Approval

At least 5 realistic CVs must pass with Accuracy 5/5 and no category below 4/5.
