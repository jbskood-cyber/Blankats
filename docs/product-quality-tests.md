# BlankATS Product Quality Tests

## Objective

Define the tests needed to produce the best possible paid product: a corrected professional CV in PDF.

The product is not the app. The product is the final PDF CV.

## Product promise

BlankATS turns an existing CV into a clearer, more professional and easier to review PDF for digital hiring processes and recruiters.

Do not promise a job or guaranteed ATS pass.

## Test levels

### Level 1: Input handling

The product must handle these inputs:

1. Good CV with clear sections.
2. Weak CV with poor writing.
3. Incomplete CV.
4. Student CV with no formal experience.
5. Very long CV.
6. Badly formatted PDF.
7. CV pasted as plain text.
8. CV with mixed Spanish and English.

Pass criteria:
- App accepts valid PDF.
- App rejects invalid files clearly.
- Text mode works if present.
- User never gets stuck.

### Level 2: No invention test

The AI must not invent:

- Companies.
- Roles.
- Dates.
- Degrees.
- Certifications.
- Metrics.
- Phone numbers.
- Emails.
- Cities.

Pass criteria:
- Every concrete fact in the final CV exists in the original input.
- Improved wording is allowed.
- Fabricated facts fail the test.

### Level 3: Writing quality test

The final CV must improve weak writing.

Pass criteria:
- Bullets start with action verbs.
- Text is concise.
- No giant paragraphs.
- No informal wording.
- No spelling errors visible.
- Responsibilities are clearer than the original.
- Metrics are not invented.

### Level 4: Structure test

The PDF must have a clean structure.

Required order:

1. Name.
2. Professional title.
3. Contact.
4. Professional summary.
5. Work experience.
6. Education.
7. Skills.
8. Projects, only if useful.
9. Certifications, only if present.

Pass criteria:
- One column.
- No photo.
- No complex tables.
- No skill bars.
- No icons inside the CV body.
- Clear section headings.

### Level 5: PDF visual test

The exported PDF must look professional.

Pass criteria:
- A4 size.
- Good margins.
- Name is easy to see.
- Contact line is readable.
- Sections have enough spacing.
- No text overlaps.
- No content cut off.
- Looks good on phone and desktop.
- Text can be selected or copied from the PDF.

### Level 6: Diagnosis test

The free diagnosis must be useful but not replace the paid product.

Pass criteria:
- Shows score.
- Shows problems.
- Shows missing sections.
- Shows recommendations.
- Does not show the full improved CV for free.
- Uses safe language.

### Level 7: Product value test

The paid PDF must feel worth paying for.

Pass criteria:
- User can quickly see improvement.
- Final CV is cleaner than original.
- Final CV is ready to send.
- No placeholders appear in the final PDF.
- No bracketed suggestions appear in the final PDF.
- If data is missing, the PDF stays clean and the diagnosis explains what is missing.

## Test scorecard

Score each generated CV from 1 to 5:

- Accuracy: no invented facts.
- Clarity: easier to understand.
- Professional tone: stronger wording.
- Structure: clean section order.
- PDF quality: readable and polished.
- User value: feels worth paying for.

Minimum launch threshold:

- No category below 4.
- Accuracy must be 5.

## Launch gate

Do not sell automatically until at least 5 real or realistic CVs pass this test set.

For first sales, manual review is allowed before delivery if quality is not fully stable.
