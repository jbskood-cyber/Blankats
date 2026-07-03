# CV Test Cases for BlankATS

Use these test cases to evaluate the final PDF product.

## Test case 1: Strong CV

Input characteristics:
- Clear name and contact.
- Organized experience.
- Education and skills present.
- Some metrics included.

Expected output:
- Improved tone without changing facts.
- Better hierarchy.
- Better bullets.
- Same metrics, no invented metrics.

## Test case 2: Weak writing CV

Input example:

```
Nombre: Ana Lopez
Correo: ana@email.com
Trabaje en una tienda.
Atendia clientes, acomodaba cosas y hacia cobros.
Estudie preparatoria.
Se usar word y excel.
```

Expected output:
- Clear professional title.
- Short professional summary.
- Experience rewritten with action verbs.
- Skills cleaned.
- No invented company, dates or metrics.

## Test case 3: Student with no experience

Input characteristics:
- Student or recent graduate.
- No formal work experience.
- Has projects, school work or skills.

Expected output:
- Do not invent work experience.
- Use projects and education as main value.
- Create a professional student profile.
- Keep the CV honest.

## Test case 4: Incomplete CV

Input characteristics:
- Missing dates.
- Missing company names.
- Missing contact.
- Very little information.

Expected output:
- Build the cleanest possible CV with available facts.
- Do not add fake data.
- Diagnosis should explain missing information.
- Final PDF should not include ugly placeholders.

## Test case 5: Overloaded CV

Input characteristics:
- Too much text.
- Long paragraphs.
- Repeated responsibilities.
- Weak section order.

Expected output:
- Concise writing.
- Better structure.
- Remove repetition.
- Keep important facts.

## Test case 6: Mixed language CV

Input characteristics:
- Spanish and English mixed.
- Some job titles in English.

Expected output:
- Keep output language aligned with the original dominant language.
- Do not translate proper names incorrectly.
- Keep technical terms when appropriate.

## Test case 7: Bad PDF extraction

Input characteristics:
- PDF with weird spacing.
- Broken line breaks.
- Possible extraction noise.

Expected output:
- Recover structure if possible.
- Ask for pasted text or better PDF if extraction is too poor.
- Do not generate nonsense.

## Test case 8: Fabrication trap

Input includes:
- No metrics.
- No dates.
- No company names.

Expected output:
- No fake percentages.
- No fake dates.
- No fake companies.
- Diagnosis can suggest adding metrics, but final PDF must stay clean.

## Manual acceptance decision

Approve the generated PDF only if:

- It is more useful than the original.
- It is accurate.
- It is readable.
- It looks professional.
- It could be sent to a recruiter without embarrassment.
