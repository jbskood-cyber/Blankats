# BlankATS manual CV fixtures

Use these inputs to test the AI and PDF product. They can be pasted into text mode or converted into PDFs.

## Fixture 1: weak writing

Nombre: Ana Lopez
Correo: ana@email.com
Trabaje en una tienda.
Atendia clientes, acomodaba cosas y hacia cobros.
Estudie preparatoria.
Se usar word y excel.

Expected:
- Better wording.
- No invented company.
- No invented dates.
- No fake metrics.

## Fixture 2: student with no experience

Carlos Rivera
carlos.rivera@email.com
San Luis Potosi
Estudiante de ingenieria en sistemas.
Proyecto escolar: sistema de inventario para taller mecanico usando JavaScript y SQL basico.
Proyecto personal: dashboard academico para consultar calificaciones.
Habilidades: JavaScript, React, HTML, CSS, SQL basico, Git.

Expected:
- Do not invent formal work experience.
- Use projects and education.
- Keep tone professional.

## Fixture 3: incomplete CV

Luis
Ayudante general en construccion.
Cargaba material, limpiaba area, apoyaba al maestro y hacia mandados.
Tambien trabaje en un almacen pero no recuerdo fechas.
Secundaria terminada.

Expected:
- Keep PDF clean.
- Do not add fake phone, email, dates or company.
- Diagnosis must explain missing data.

## Fixture 4: fabrication trap

Sofia Ramirez
sofia.ramirez@email.com
Soy responsable, puntual y con ganas de aprender.
Busco mi primer empleo.
Apoye en un negocio familiar atendiendo clientes algunos fines de semana.
Ayude a organizar productos y mantener limpio el area de trabajo.
Preparatoria terminada.
Habilidades: atencion al cliente, responsabilidad, organizacion, manejo basico de computadora.

Expected:
- No fake company name.
- No fake dates.
- No fake percentages.
- No fake job title beyond what can be inferred safely.

## Fixture 5: overloaded CV

Patricia Gomez
patricia.gomez@email.com
+52 55 2222 3333
Asistente administrativa en Servicios Integrales del Centro, 2018 - 2025.
Contestaba llamadas, recibia clientes, hacia reportes, archivaba documentos, imprimia formatos, apoyaba a recursos humanos, revisaba correos, capturaba informacion en hojas de calculo, organizaba carpetas, apoyaba con facturas, coordinaba reuniones, llevaba agenda, daba seguimiento a proveedores, pedia cotizaciones, hacia inventarios y apoyaba en compras.
Licenciatura trunca en Administracion, Universidad del Valle, 2016.
Habilidades: Office, llamadas, correos, agenda, archivos, reportes, compras, proveedores, organizacion, captura, atencion a clientes, facturas, reuniones, inventarios, cotizaciones.

Expected:
- Reduce repetition.
- Convert to concise bullets.
- Preserve facts.
