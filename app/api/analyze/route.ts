import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Gemini client on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, originalText } = await req.json();

    if (!pdfBase64 && !originalText) {
      return NextResponse.json(
        { error: "Debe proporcionar un archivo PDF en base64 o el texto original del CV." },
        { status: 400 }
      );
    }

    let contents: any[] = [];

    if (pdfBase64) {
      contents.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64,
        },
      });
    }

    contents.push({
      text: `Analiza y optimiza el CV adjunto (o proporcionado a continuación) de forma estrictamente profesional.
      
      ${originalText ? `Texto original del CV:\n"""\n${originalText}\n"""` : ""}

      Sigue rigurosamente las siguientes directrices y reglas críticas de generación:
      
      1. REGLAS DE ESTRUCTURA Y FORMATO:
         - El CV optimizado debe ser limpio, en una sola columna, elegante y facil de revisar por lectores ATS.
         - En la sección "experience", cada logro o función debe devolverse en el array "bullets" como un string independiente.
         - En la sección "projects", cada detalle, contribución o logro debe devolverse en el array "bullets" como un string independiente.
         - NUNCA unas las viñetas (bullets) usando guiones, puntos, ".-", " - " ni saltos de línea dentro de un mismo string. Cada logro va en su propio string dentro del array.

      2. REGLAS CRÍTICAS DE NO CONTAMINACIÓN DEL CV MEJORADO (improvedCV):
         - NUNCA pongas marcadores de posición (placeholders) como "[Agregar fecha]", "pendiente", "N/A", "compañía", "año", ni textos genéricos en el CV final.
         - NUNCA incluyas comentarios de la IA, notas o textos de aclaración dentro de improvedCV.
         - NUNCA incluyas textos entre corchetes como "[Sugerencia: añadir %]" o "[Sugerencia: ...]" en ninguna parte del improvedCV (ni en nombre, contacto, resumen, experiencia, educación, etc.).
         - Las recomendaciones de añadir métricas, porcentajes, periodos de fechas o cualquier elemento que falte DEBEN ponerse ÚNICAMENTE en "recommendations" o "problems" de la diagnosis, NUNCA en el CV mejorado (improvedCV). El CV mejorado debe estar listo para enviarse a un reclutador sin requerir edición posterior.

      3. REGLAS ESTRICTAS DE NO INVENCIÓN (PRESERVACIÓN DE LA VERDAD):
         - NUNCA inventes: empresas, cargos, fechas, períodos de tiempo, métricas, porcentajes de mejora, resultados cuantitativos, instituciones educativas, títulos, certificaciones, correos, teléfonos, ciudades ni enlaces.
         - Preserva de forma 100% íntegra todas las fechas, empresas, cargos, certificaciones y datos numéricos/métricas reales del CV original si están disponibles.
         - Si un dato no existe en el original, NO te lo inventes y NO lo agregues en forma de placeholder. Simplemente omítelo o redáctalo limpiamente sin ese dato.
         - Para CVs que ya son fuertes, pule la redacción y normaliza el formato; no realices reescrituras innecesariamente agresivas.
         - Puedes mejorar: orden, claridad, redacción, jerarquía, tono profesional y los verbos de acción en las viñetas (ej. "Encargado de archivar" -> "Optimicé el sistema de archivado y organización documental"). Puedes construir un "summary" profesional potente si hay información suficiente en el original.

      4. IDIOMA:
         - El idioma de la respuesta completa (tanto diagnosis como improvedCV) debe ser idéntico al idioma predominante del CV original (si el original está en español, responde íntegramente en español).`,
    });

    // Define the models to try in case of transient errors, prioritizing the cheaper and highly reliable gemini-2.5-flash
    const modelsToTry = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-flash-latest"];
    let response;
    let lastError: any = null;
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      // Determine which model to use on this attempt
      const currentModel = modelsToTry[attempt % modelsToTry.length];
      
      try {
        console.log(`Intentando analizar CV con el modelo ${currentModel} (Intento ${attempt + 1}/${maxAttempts})...`);
        response = await ai.models.generateContent({
          model: currentModel,
          contents: contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: {
                  type: Type.INTEGER,
                  description: "Puntuación de claridad del CV del 1 al 100 basada en su legibilidad, redacción y estructura ATS.",
                },
                problems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Problemas específicos detectados en el CV (ej. lenguaje informal, exceso de páginas, formato complejo, falta de resumen profesional).",
                },
                missingSections: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Secciones recomendadas que hacen falta en el CV original.",
                },
                recommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Acciones recomendadas específicas para el candidato, tales como añadir métricas o datos faltantes.",
                },
                improvedCV: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: "Nombre completo del candidato tal como aparece en el original.",
                    },
                    title: {
                      type: Type.STRING,
                      description: "Título profesional resumido y moderno del candidato.",
                    },
                    contact: {
                      type: Type.STRING,
                      description: "Datos de contacto formateados en una sola línea, por ejemplo: 'email@example.com | +34 123 456 789 | Madrid, España | linkedin.com/in/usuario'. Solo usa datos reales del original.",
                    },
                    summary: {
                      type: Type.STRING,
                      description: "Resumen profesional redactado de forma impactante y concisa.",
                    },
                    experience: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          company: { type: Type.STRING, description: "Nombre de la empresa o institución." },
                          role: { type: Type.STRING, description: "Cargo desempeñado." },
                          period: { type: Type.STRING, description: "Periodo trabajado, ej: '2021 - Presente' o 'Ene 2019 - Dic 2020'." },
                          bullets: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Lista de logros y funciones desempeñadas, cada uno redactado como viñeta independiente en un string independiente del array (sin usar guiones ni puntos de inicio)."
                          },
                        },
                        required: ["company", "role", "period", "bullets"],
                      },
                    },
                    education: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          institution: { type: Type.STRING, description: "Nombre de la universidad o institución educativa." },
                          degree: { type: Type.STRING, description: "Título o carrera." },
                          period: { type: Type.STRING, description: "Periodo de estudios o año de graduación." },
                          description: { type: Type.STRING, description: "Detalle adicional opcional sobre especialidad o logros académicos." },
                        },
                        required: ["institution", "degree", "period"],
                      },
                    },
                    skills: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Lista de habilidades (hard skills y soft skills) reorganizadas limpiamente.",
                    },
                    projects: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "Nombre del proyecto." },
                          bullets: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Lista de logros, tecnologías y descripciones del proyecto, cada uno redactado como viñeta independiente en un string independiente."
                          },
                          period: { type: Type.STRING, description: "Periodo u año de realización." },
                        },
                        required: ["name", "bullets"],
                      },
                      description: "Proyectos relevantes si aparecían en el original.",
                    },
                    certifications: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Lista de certificaciones y cursos, si aparecían en el original.",
                    },
                  },
                  required: ["name", "title", "contact", "summary", "experience", "education", "skills"],
                },
              },
              required: ["score", "problems", "missingSections", "recommendations", "improvedCV"],
            },
          },
        });
        
        // If we successfully get a response, break the loop
        break;
      } catch (err: any) {
        attempt++;
        lastError = err;
        console.error(`Error en intento ${attempt} con el modelo ${currentModel}:`, err);

        // Check if the error is a transient/overload error (503, UNAVAILABLE, 429)
        const errStr = JSON.stringify(err);
        const errMessage = err.message || "";
        const isTransient = 
          errMessage.includes("503") || 
          errMessage.includes("UNAVAILABLE") || 
          errMessage.includes("429") ||
          err.status === 503 ||
          err.status === 429 ||
          errStr.includes("503") ||
          errStr.includes("UNAVAILABLE") ||
          errStr.includes("RESOURCE_EXHAUSTED") ||
          errStr.includes("overloaded");

        if (!isTransient || attempt >= maxAttempts) {
          throw err;
        }

        // Exponential backoff delay (1.5s, 3s)
        const delay = Math.pow(2, attempt) * 1500;
        console.log(`Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (!response) {
      throw lastError || new Error("No se pudo obtener respuesta de Gemini tras varios intentos");
    }

    const text = response.text;
    if (!text) {
      throw new Error("No se recibió respuesta de Gemini");
    }

    const data = JSON.parse(text.trim());
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error en la ruta /api/analyze:", error);
    return NextResponse.json(
      { error: "Error al analizar el CV. Por favor, inténtelo de nuevo más tarde. Detalles: " + error.message },
      { status: 500 }
    );
  }
}
