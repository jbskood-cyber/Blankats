"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Download,
  Sparkles,
  RefreshCw,
  FileWarning,
  PlusCircle,
  Info
} from "lucide-react";

interface ImprovedCV {
  name: string;
  title: string;
  contact: string;
  summary: string;
  experience: {
    company: string;
    role: string;
    period: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    period: string;
    description?: string;
  }[];
  skills: string[];
  projects?: {
    name: string;
    description: string;
    period?: string;
  }[];
  certifications?: string[];
}

interface AnalysisResponse {
  score: number;
  problems: string[];
  missingSections: string[];
  recommendations: string[];
  improvedCV: ImprovedCV;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [useTextMode, setUseTextMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  // File drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Por favor, sube únicamente archivos en formato PDF.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Por favor, sube únicamente archivos en formato PDF.");
      }
    }
  };

  // Convert PDF file to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        resolve(btoa(binary));
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Start analysis
  const handleAnalyze = async () => {
    if (!file && !pastedText.trim()) {
      setError("Por favor, sube un archivo PDF o ingresa el texto de tu CV.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep(0);

    // Dynamic loading text updates
    const loadingIntervals = [
      "Extrayendo contenido original...",
      "Analizando estructura de secciones y formato ATS...",
      "Evaluando claridad, redacción y verbos de acción...",
      "Generando diagnóstico y optimizando redacción...",
      "Compilando versión final mejorada..."
    ];

    const timer = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingIntervals.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    try {
      let base64Data = "";
      if (file) {
        base64Data = await fileToBase64(file);
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfBase64: base64Data || undefined,
          originalText: pastedText || undefined,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Ocurrió un error inesperado.");
      }

      const data: AnalysisResponse = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudo completar el análisis del CV.");
    } finally {
      clearInterval(timer);
      setIsLoading(false);
    }
  };

  // Trigger dynamic PDF download using jsPDF client side
  const handleDownloadPDF = async () => {
    if (!result) return;
    
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;
      let currentY = 50;

      // Helper to add clean lines of text and auto-wrap / auto-page-break
      const addText = (text: string, size: number, style: "normal" | "bold" | "italic" = "normal", spacing = 15) => {
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        
        const lines = doc.splitTextToSize(text, contentWidth);
        const totalHeight = lines.length * spacing;
        
        if (currentY + totalHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        
        lines.forEach((line: string) => {
          doc.text(line, margin, currentY);
          currentY += spacing;
        });
      };

      // Helper for clean divider lines
      const addSeparator = (spacingBefore = 8, spacingAfter = 12) => {
        currentY += spacingBefore;
        if (currentY > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.75);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += spacingAfter;
      };

      const cv = result.improvedCV;

      // Name (Main Header)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0);
      const nameText = cv.name.toUpperCase();
      const nameLines = doc.splitTextToSize(nameText, contentWidth);
      nameLines.forEach((line: string) => {
        if (currentY + 25 > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        doc.text(line, margin, currentY);
        currentY += 24;
      });

      // Title
      if (cv.title) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        const titleLines = doc.splitTextToSize(cv.title.toUpperCase(), contentWidth);
        titleLines.forEach((line: string) => {
          if (currentY + 16 > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }
          doc.text(line, margin, currentY);
          currentY += 15;
        });
      }

      // Contact
      if (cv.contact) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        const contactLines = doc.splitTextToSize(cv.contact, contentWidth);
        contactLines.forEach((line: string) => {
          if (currentY + 14 > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }
          doc.text(line, margin, currentY);
          currentY += 13;
        });
      }

      currentY += 5;

      // Professional Summary
      if (cv.summary) {
        addSeparator(5, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("RESUMEN PROFESIONAL", margin, currentY);
        currentY += 15;
        
        addText(cv.summary, 9.5, "normal", 13.5);
      }

      // Work Experience
      if (cv.experience && cv.experience.length > 0) {
        addSeparator(5, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("EXPERIENCIA LABORAL", margin, currentY);
        currentY += 15;

        cv.experience.forEach((exp) => {
          if (currentY + 35 > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }

          // Header: Role & Company
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          const headerText = `${exp.role} — ${exp.company}`;
          doc.text(headerText, margin, currentY);

          // Period (aligned right)
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          const periodText = exp.period || "";
          const periodWidth = doc.getTextWidth(periodText);
          doc.text(periodText, pageWidth - margin - periodWidth, currentY);
          currentY += 14;

          // Description (with bullets)
          const bullets = exp.description.split("\n").filter(b => b.trim().length > 0);
          bullets.forEach((bullet) => {
            let cleanBullet = bullet.trim();
            if (cleanBullet.startsWith("-") || cleanBullet.startsWith("•") || cleanBullet.startsWith("*")) {
              cleanBullet = cleanBullet.substring(1).trim();
            }

            // Bullet symbol
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);
            doc.text("•", margin + 10, currentY);

            // Wrapped bullet text
            const bulletLines = doc.splitTextToSize(cleanBullet, contentWidth - 18);
            if (currentY + (bulletLines.length * 12.5) > pageHeight - margin) {
              doc.addPage();
              currentY = margin;
            }
            bulletLines.forEach((line: string) => {
              doc.text(line, margin + 18, currentY);
              currentY += 12;
            });
          });
          currentY += 6;
        });
      }

      // Education
      if (cv.education && cv.education.length > 0) {
        addSeparator(5, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("EDUCACIÓN", margin, currentY);
        currentY += 15;

        cv.education.forEach((edu) => {
          if (currentY + 25 > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`${edu.degree} — ${edu.institution}`, margin, currentY);

          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          const periodText = edu.period || "";
          const periodWidth = doc.getTextWidth(periodText);
          doc.text(periodText, pageWidth - margin - periodWidth, currentY);
          currentY += 13;

          if (edu.description) {
            addText(edu.description, 9, "normal", 12.5);
            currentY += 4;
          }
          currentY += 4;
        });
      }

      // Skills
      if (cv.skills && cv.skills.length > 0) {
        addSeparator(5, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("HABILIDADES", margin, currentY);
        currentY += 15;

        const skillsJoined = cv.skills.join(", ");
        addText(skillsJoined, 9, "normal", 13);
      }

      // Projects
      if (cv.projects && cv.projects.length > 0) {
        addSeparator(5, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("PROYECTOS", margin, currentY);
        currentY += 15;

        cv.projects.forEach((proj) => {
          if (currentY + 20 > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(proj.name, margin, currentY);

          if (proj.period) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            const pWidth = doc.getTextWidth(proj.period);
            doc.text(proj.period, pageWidth - margin - pWidth, currentY);
          }
          currentY += 13;

          addText(proj.description, 9, "normal", 12.5);
          currentY += 4;
        });
      }

      // Certifications
      if (cv.certifications && cv.certifications.length > 0) {
        addSeparator(5, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("CERTIFICACIONES", margin, currentY);
        currentY += 15;

        cv.certifications.forEach((cert) => {
          if (currentY + 14 > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          doc.text(`• ${cert}`, margin + 10, currentY);
          currentY += 13;
        });
      }

      // Save PDF in browser
      doc.save(`CV_Optimizado_${cv.name.replace(/\s+/g, "_")}.pdf`);
    } catch (e) {
      console.error("Error al descargar PDF:", e);
      alert("Hubo un error al generar tu PDF. Por favor intenta de nuevo.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPastedText("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transform transition-transform hover:scale-110"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M10 13l3 3-3 3" />
                <line x1="8" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Blank<span className="text-blue-600">ATS</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-md hidden sm:inline-block">
              v1.0 (Demo ATS)
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {!result ? (
            /* STAGE 1: UPLOAD / INPUT FORM */
            <motion.div
              key="input-stage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8 md:mb-12">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium mb-4"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Optimización Inteligente para Filtros ATS
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                  Mejora tu CV antes de enviarlo
                </h1>
                <p className="text-base md:text-lg text-slate-600 max-w-lg mx-auto">
                  Sube tu CV en PDF y genera una versión más clara, profesional y lista para superar cualquier sistema de reclutamiento.
                </p>
              </div>

              {/* Selector de modo: Archivo PDF vs Texto Pegado */}
              <div className="flex bg-slate-150 p-1 rounded-xl mb-6 max-w-sm mx-auto border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setUseTextMode(false); setError(null); }}
                  className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
                    !useTextMode
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Sube archivo PDF
                </button>
                <button
                  type="button"
                  onClick={() => { setUseTextMode(true); setError(null); }}
                  className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
                    useTextMode
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pegar texto del CV
                </button>
              </div>

              {/* Area de Carga o Pegado */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/60 mb-6">
                {!useTextMode ? (
                  /* PDF File Dropzone */
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all ${
                      dragActive
                        ? "border-blue-500 bg-blue-50/50"
                        : file
                        ? "border-emerald-400 bg-emerald-50/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      id="cv-upload-input"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />

                    <div className="flex flex-col items-center justify-center">
                      <div className={`p-4 rounded-full mb-4 ${file ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                        <Upload className="w-8 h-8" />
                      </div>

                      {file ? (
                        <div>
                          <p className="text-base font-semibold text-slate-800 break-all px-4">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB • PDF Listo para analizar
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFile(null);
                            }}
                            className="mt-3 text-xs text-rose-500 font-medium hover:underline"
                          >
                            Eliminar archivo
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-base font-semibold text-slate-800">
                            Arrastra tu CV aquí o <span className="text-blue-600 hover:underline">haz clic para explorar</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-1.5">
                            Formato admitido: PDF (máx. 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Text Paste Area */
                  <div>
                    <label htmlFor="pasted-cv-textarea" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Contenido actual de tu CV
                    </label>
                    <textarea
                      id="pasted-cv-textarea"
                      rows={10}
                      className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                      placeholder="Pega aquí toda la información de tu CV (Nombre, Experiencia, Estudios, etc.)..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}

                {/* Mensaje de Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-100"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Error de archivo</p>
                      <p className="text-xs opacity-90">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Botón Principal */}
                <div className="mt-8">
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading || (!file && !pastedText.trim())}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-sm flex items-center justify-center gap-2.5 transition-all text-base md:text-lg ${
                      isLoading
                        ? "bg-blue-400 cursor-not-allowed"
                        : (!file && !pastedText.trim())
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99] hover:shadow-md"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Analizando tu CV...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Analizar mi CV</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Loading State Feedback */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 text-center shadow-inner"
                >
                  <div className="flex justify-center mb-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {loadingStep === 0
                      ? "Analizando estructura, claridad y formato..."
                      : loadingStep === 1
                      ? "Analizando estructura de secciones y formato ATS..."
                      : loadingStep === 2
                      ? "Evaluando claridad, redacción y verbos de acción..."
                      : loadingStep === 3
                      ? "Generando diagnóstico y optimizando redacción..."
                      : "Compilando versión final mejorada..."}
                  </p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden max-w-xs mx-auto">
                    <motion.div
                      className="bg-blue-600 h-full rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${((loadingStep + 1) / 5) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Esto suele tardar unos 10-15 segundos. Por favor espera.
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* STAGE 2: RESULTS & PREVIEW */
            <motion.div
              key="results-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Header de Resultados */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-600 mb-1.5 uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    CV Analizado con Éxito
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Tu CV ha sido optimizado
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Revisa el diagnóstico e introduce tu nuevo CV con formato impecable de lectura directa.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                  <button
                    onClick={handleReset}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 py-3 px-5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Analizar otro</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 py-3 px-6 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar PDF</span>
                  </button>
                </div>
              </div>

              {/* Grid: Diagnóstico e Improved Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Columna Izquierda: Diagnóstico */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Panel de Puntuación */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm text-center">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Puntuación de claridad ATS
                    </span>

                    <div className="relative inline-flex items-center justify-center mb-4">
                      {/* Radial Progress Gauge */}
                      <svg className="w-36 h-36 transform -rotate-90">
                        <circle
                          cx="72"
                          cy="72"
                          r="62"
                          stroke="#e2e8f0"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        <motion.circle
                          cx="72"
                          cy="72"
                          r="62"
                          stroke={result.score >= 80 ? "#10b981" : result.score >= 50 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 62}
                          initial={{ strokeDashoffset: 2 * Math.PI * 62 }}
                          animate={{ strokeDashoffset: (2 * Math.PI * 62) * (1 - result.score / 100) }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-4xl font-extrabold text-slate-900">{result.score}</span>
                        <span className="text-slate-400 text-xs block font-medium">de 100</span>
                      </div>
                    </div>

                    <div className="max-w-xs mx-auto">
                      <p className="text-sm font-semibold text-slate-800">
                        {result.score >= 80
                          ? "¡Excelente calidad!"
                          : result.score >= 60
                          ? "Buen camino, con mejoras pendientes"
                          : "Necesita mejoras estructurales urgentes"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Tu CV original presentaba oportunidades de mejora que han sido resueltas en el documento optimizado.
                      </p>
                    </div>
                  </div>

                  {/* Panel de Diagnóstico */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
                    <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <FileWarning className="w-4 h-4 text-amber-500" />
                      Diagnóstico Profesional
                    </h3>

                    {/* Problemas Detectados */}
                    {result.problems && result.problems.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Problemas Detectados ({result.problems.length})
                        </h4>
                        <ul className="space-y-1.5 pl-3">
                          {result.problems.map((prob, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-rose-500 mt-0.5 font-bold">•</span>
                              <span>{prob}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Secciones Faltantes */}
                    {result.missingSections && result.missingSections.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Secciones Recomendadas Faltantes
                        </h4>
                        <ul className="space-y-1.5 pl-3">
                          {result.missingSections.map((sec, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5 font-bold">•</span>
                              <span>{sec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recomendaciones principales */}
                    {result.recommendations && result.recommendations.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Recomendaciones Principales
                        </h4>
                        <ul className="space-y-1.5 pl-3">
                          {result.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5 font-bold">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2 bg-slate-50 p-3 rounded-lg">
                      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span>
                        <strong>Importante:</strong> BlankATS no inventa experiencia ni cualificaciones. Solo optimiza tu redacción, formatos, y estructura para asegurar la lectura por parte de las plataformas automáticas de recursos humanos.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Vista Previa del CV Optimizado */}
                <div className="lg:col-span-7">
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    {/* Header de la Hoja */}
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-600">
                          VISTA PREVIA DEL CV CORREGIDO
                        </span>
                      </div>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono">
                        Monocromo • 1 Columna • ATS Friendly
                      </span>
                    </div>

                    {/* Hoja de CV Estilo Premium (Monocromático, Limpio) */}
                    <div className="p-8 md:p-12 text-slate-950 bg-white font-serif max-h-[800px] overflow-y-auto shadow-inner leading-relaxed text-sm selection:bg-slate-200 selection:text-black">
                      {/* Nombre */}
                      <h1 className="text-2xl font-extrabold tracking-tight font-sans text-black uppercase mb-1">
                        {result.improvedCV.name}
                      </h1>

                      {/* Título profesional */}
                      {result.improvedCV.title && (
                        <p className="text-xs font-bold text-slate-700 tracking-wider font-sans uppercase mb-1.5">
                          {result.improvedCV.title}
                        </p>
                      )}

                      {/* Contacto */}
                      {result.improvedCV.contact && (
                        <p className="text-[11px] text-slate-600 font-sans border-b border-slate-200 pb-4 mb-4">
                          {result.improvedCV.contact}
                        </p>
                      )}

                      {/* Resumen */}
                      {result.improvedCV.summary && (
                        <div className="mb-6">
                          <h2 className="text-[11px] font-bold text-slate-900 tracking-wider font-sans uppercase mb-1.5">
                            Resumen Profesional
                          </h2>
                          <p className="text-xs text-slate-800 text-justify">
                            {result.improvedCV.summary}
                          </p>
                        </div>
                      )}

                      {/* Experiencia Laboral */}
                      {result.improvedCV.experience && result.improvedCV.experience.length > 0 && (
                        <div className="mb-6">
                          <h2 className="text-[11px] font-bold text-slate-900 tracking-wider font-sans uppercase mb-3 border-t border-slate-100 pt-3">
                            Experiencia Laboral
                          </h2>
                          <div className="space-y-4">
                            {result.improvedCV.experience.map((exp, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs">
                                  <span className="font-bold font-sans text-slate-900">
                                    {exp.role} <span className="font-normal text-slate-500">— {exp.company}</span>
                                  </span>
                                  <span className="text-[11px] font-sans text-slate-500 italic">
                                    {exp.period}
                                  </span>
                                </div>
                                <div className="pl-4 space-y-1">
                                  {exp.description.split("\n").filter(b => b.trim().length > 0).map((bullet, bIdx) => {
                                    let cleanB = bullet.trim();
                                    if (cleanB.startsWith("-") || cleanB.startsWith("•") || cleanB.startsWith("*")) {
                                      cleanB = cleanB.substring(1).trim();
                                    }
                                    return (
                                      <p key={bIdx} className="text-xs text-slate-800 list-item list-disc marker:text-slate-400">
                                        {cleanB}
                                      </p>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Educación */}
                      {result.improvedCV.education && result.improvedCV.education.length > 0 && (
                        <div className="mb-6">
                          <h2 className="text-[11px] font-bold text-slate-900 tracking-wider font-sans uppercase mb-3 border-t border-slate-100 pt-3">
                            Educación
                          </h2>
                          <div className="space-y-3">
                            {result.improvedCV.education.map((edu, idx) => (
                              <div key={idx} className="text-xs space-y-0.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                  <span className="font-bold font-sans text-slate-900">
                                    {edu.degree}
                                  </span>
                                  <span className="text-[11px] font-sans text-slate-500 italic">
                                    {edu.period}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-sans">
                                  {edu.institution}
                                </p>
                                {edu.description && (
                                  <p className="text-[11px] text-slate-700 italic mt-0.5">
                                    {edu.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Habilidades */}
                      {result.improvedCV.skills && result.improvedCV.skills.length > 0 && (
                        <div className="mb-6">
                          <h2 className="text-[11px] font-bold text-slate-900 tracking-wider font-sans uppercase mb-2 border-t border-slate-100 pt-3">
                            Habilidades
                          </h2>
                          <p className="text-xs text-slate-800">
                            {result.improvedCV.skills.join(" • ")}
                          </p>
                        </div>
                      )}

                      {/* Proyectos */}
                      {result.improvedCV.projects && result.improvedCV.projects.length > 0 && (
                        <div className="mb-6">
                          <h2 className="text-[11px] font-bold text-slate-900 tracking-wider font-sans uppercase mb-3 border-t border-slate-100 pt-3">
                            Proyectos Destacados
                          </h2>
                          <div className="space-y-3">
                            {result.improvedCV.projects.map((proj, idx) => (
                              <div key={idx} className="text-xs space-y-0.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                  <span className="font-bold font-sans text-slate-900">
                                    {proj.name}
                                  </span>
                                  {proj.period && (
                                    <span className="text-[11px] font-sans text-slate-500 italic">
                                      {proj.period}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-800">
                                  {proj.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Certificaciones */}
                      {result.improvedCV.certifications && result.improvedCV.certifications.length > 0 && (
                        <div>
                          <h2 className="text-[11px] font-bold text-slate-900 tracking-wider font-sans uppercase mb-2 border-t border-slate-100 pt-3">
                            Certificaciones y Cursos
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-3">
                            {result.improvedCV.certifications.map((cert, idx) => (
                              <div key={idx} className="text-xs text-slate-800 list-item list-disc marker:text-slate-400">
                                {cert}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-20 py-8 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-semibold text-slate-600">
            Blank<span className="text-blue-600">ATS</span> — Herramienta gratuita de optimización de currículums.
          </p>
          <p>
            Diseño premium optimizado. Garantizamos que tus datos originales permanecen 100% verídicos sin inventar experiencia laboral.
          </p>
          <p className="pt-2 text-[10px]">
            &copy; {new Date().getFullYear()} BlankATS. Hecho para profesionales exigentes.
          </p>
        </div>
      </footer>
    </div>
  );
}
