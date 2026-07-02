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

      Sigue rigurosamente las siguientes directrices y reglas de generación:
      1. NO inventes experiencia laboral, empresas, cargos, títulos académicos, fechas, certificaciones ni ningún dato personal o profesional.
      2. Si falta información en los datos originales, no te la inventes. Usa únicamente lo disponible.
      3. Puedes mejorar la redacción, claridad, orden y estructura del texto. Convierte frases débiles en oraciones con verbos de acción fuertes y lenguaje profesional (ej. "Encargado de archivar" -> "Optimicé el sistema de archivado y organización documental").
      4. Si sugieres métricas o logros cuantitativos, hazlo explícitamente indicando que es una sugerencia o plantilla (ej. "[Sugerencia: agregar % de incremento o cantidad lograda]"). No inventes números reales.
      5. La estructura del CV optimizado debe ser limpia, en una sola columna, simple y 100% compatible con lectores ATS (Applicant Tracking Systems).
      6. Toda la salida debe estructurarse según el esquema JSON solicitado. El idioma del CV mejorado y el diagnóstico debe coincidir con el idioma del CV original (si el original está en español, responde en español).
      
      Genera el diagnóstico breve (puntuación del 1 al 100, lista de problemas detectados, secciones cruciales faltantes, y recomendaciones principales) junto con el CV optimizado con las siguientes secciones:
      - Nombre
      - Título profesional
      - Contacto
      - Resumen profesional (párrafo de 3 o 4 líneas potente)
      - Experiencia laboral
      - Educación
      - Habilidades
      - Proyectos (si existen en el original)
      - Certificaciones (si existen en el original)`,
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
                  description: "Acciones recomendadas específicas para el candidato.",
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
                          description: { type: Type.STRING, description: "Logros y funciones principales en formato de viñetas claras (separadas por saltos de línea o usando guiones), redactadas con verbos de acción potentes." },
                        },
                        required: ["company", "role", "period", "description"],
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
                          description: { type: Type.STRING, description: "Descripción breve del proyecto y tecnologías utilizadas." },
                          period: { type: Type.STRING, description: "Periodo u año de realización." },
                        },
                        required: ["name", "description"],
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
