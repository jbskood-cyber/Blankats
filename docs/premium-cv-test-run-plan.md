# Premium CV test run plan

User role: upload PDFs to BlankATS and return the generated results.

Reviewer role: decide test order, evaluate output, identify failures and propose prompt/code improvements.

## Test order

### Round 1: core quality

1. 01_cv_premium_marketing_maria_torres.pdf
2. 02_cv_premium_software_jorge_castillo.pdf
3. 03_cv_premium_uxui_andrea_mendoza.pdf
4. 12_cv_premium_ejecutivo_senior_ricardo_leon.pdf

Purpose:
Check whether BlankATS improves already strong premium CVs without degrading them.

### Round 2: normal employability

5. 04_cv_premium_ventas_automotrices_oscar_molina.pdf
6. 06_cv_premium_logistica_raul_navarro.pdf
7. 08_cv_premium_asistente_admin_patricia_gomez.pdf
8. 10_cv_premium_atencion_cliente_bilingue_camila_ortiz.pdf

Purpose:
Check whether BlankATS improves practical job-seeking profiles.

### Round 3: edge cases

9. 07_cv_premium_estudiante_lucia_campos.pdf
10. 05_cv_premium_finanzas_valeria_soto.pdf
11. 09_cv_premium_salud_fisioterapia_natalia_ruiz.pdf
12. 11_cv_premium_project_manager_elena_vargas.pdf

Purpose:
Check different professions and content structures.

## What to return after each PDF

Return:
- Screenshot of diagnosis.
- Screenshot of generated preview if available.
- Downloaded generated PDF.
- Any error message.

## Evaluation dimensions

Each output is scored from 1 to 5:

- Accuracy.
- Improvement over original.
- Professional tone.
- Structure.
- PDF visual quality.
- Commercial value.

## Hard failure

Any invented fact is a hard failure.

Hard failures include:
- Fake dates.
- Fake metrics.
- Fake company names.
- Fake roles.
- Fake degrees.
- Fake certifications.

## Iteration rule

After every 2 to 3 PDFs, update the AI prompt or PDF template if repeated failures appear.

Do not wait until all 12 are tested if an obvious issue appears early.
