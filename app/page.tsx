"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, ReactNode, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  FileUp,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TextCursorInput,
  WandSparkles,
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

const loadingSteps = [
  "Leyendo el contenido original",
  "Revisando estructura y secciones",
  "Evaluando claridad y redaccion",
  "Preparando recomendaciones",
  "Construyendo una version mas limpia",
];

const safeHighlights = [
  "Estructura mas clara",
  "Presentacion profesional",
  "Lista para procesos digitales",
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [useTextMode, setUseTextMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const canAnalyze = useMemo(
    () => Boolean(file || pastedText.trim()),
    [file, pastedText],
  );

  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      acceptFile(droppedFile);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      acceptFile(selectedFile);
    }
  };

  const acceptFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setError("Sube un archivo PDF para mantener el analisis en el formato correcto.");
      return;
    }

    setFile(selectedFile);
    setUseTextMode(false);
    setError(null);
  };

  const fileToBase64 = (selectedFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 1) {
          binary += String.fromCharCode(bytes[i]);
        }
        resolve(btoa(binary));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(selectedFile);
    });
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) {
      setError("Sube tu CV en PDF o pega el texto para iniciar el analisis.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep(0);

    const timer = window.setInterval(() => {
      setLoadingStep((step) => Math.min(step + 1, loadingSteps.length - 1));
    }, 2400);

    try {
      const pdfBase64 = file ? await fileToBase64(file) : undefined;
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          originalText: pastedText.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "No se pudo analizar el CV.");
      }

      const data = (await response.json()) as AnalysisResponse;
      setResult(data);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo completar el analisis. Intenta de nuevo.";
      setError(message);
    } finally {
      window.clearInterval(timer);
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;
      let currentY = 52;

      const ensureSpace = (height: number) => {
        if (currentY + height > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
      };

      const addText = (
        text: string,
        size: number,
        style: "normal" | "bold" | "italic" = "normal",
        spacing = 14,
      ) => {
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, contentWidth);
        ensureSpace(lines.length * spacing);
        lines.forEach((line: string) => {
          doc.text(line, margin, currentY);
          currentY += spacing;
        });
      };

      const addSectionTitle = (title: string) => {
        ensureSpace(34);
        currentY += 9;
        doc.setDrawColor(210, 214, 222);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 18;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(20, 24, 33);
        doc.text(title.toUpperCase(), margin, currentY);
        currentY += 17;
      };

      const cv = result.improvedCV;

      doc.setTextColor(10, 15, 25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text(cv.name.toUpperCase(), margin, currentY);
      currentY += 24;

      if (cv.title) {
        doc.setFontSize(11);
        doc.setTextColor(52, 64, 84);
        addText(cv.title.toUpperCase(), 11, "bold", 15);
      }

      if (cv.contact) {
        doc.setTextColor(80, 89, 105);
        addText(cv.contact, 9, "normal", 13);
      }

      if (cv.summary) {
        addSectionTitle("Resumen profesional");
        doc.setTextColor(43, 50, 64);
        addText(cv.summary, 9.5, "normal", 13.5);
      }

      if (cv.experience?.length) {
        addSectionTitle("Experiencia laboral");
        cv.experience.forEach((item) => {
          ensureSpace(40);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(12, 17, 29);
          doc.text(`${item.role} - ${item.company}`, margin, currentY);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(88, 96, 112);
          doc.text(item.period || "", pageWidth - margin - doc.getTextWidth(item.period || ""), currentY);
          currentY += 14;

          item.description
            .split("\n")
            .filter((line) => line.trim())
            .forEach((line) => {
              const cleanLine = line.replace(/^[-*]\s?/, "").trim();
              const bulletLines = doc.splitTextToSize(cleanLine, contentWidth - 18);
              ensureSpace(bulletLines.length * 12.5);
              doc.setTextColor(55, 63, 78);
              doc.text("-", margin + 8, currentY);
              bulletLines.forEach((bulletLine: string) => {
                doc.text(bulletLine, margin + 18, currentY);
                currentY += 12.5;
              });
            });
          currentY += 7;
        });
      }

      if (cv.education?.length) {
        addSectionTitle("Educacion");
        cv.education.forEach((item) => {
          ensureSpace(30);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(12, 17, 29);
          doc.text(item.degree, margin, currentY);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(88, 96, 112);
          doc.text(item.period || "", pageWidth - margin - doc.getTextWidth(item.period || ""), currentY);
          currentY += 13;
          addText(item.institution, 9, "normal", 12);
          if (item.description) addText(item.description, 9, "italic", 12);
          currentY += 4;
        });
      }

      if (cv.skills?.length) {
        addSectionTitle("Habilidades");
        addText(cv.skills.join(", "), 9, "normal", 13);
      }

      if (cv.projects?.length) {
        addSectionTitle("Proyectos");
        cv.projects.forEach((item) => {
          doc.setTextColor(12, 17, 29);
          addText(`${item.name}${item.period ? ` - ${item.period}` : ""}`, 10, "bold", 13);
          addText(item.description, 9, "normal", 12.5);
          currentY += 4;
        });
      }

      if (cv.certifications?.length) {
        addSectionTitle("Certificaciones");
        cv.certifications.forEach((item) => addText(`- ${item}`, 9, "normal", 12.5));
      }

      doc.save(`CV_BlankATS_${cv.name.replace(/\s+/g, "_")}.pdf`);
    } catch {
      window.alert("Hubo un error al generar el PDF. Intenta de nuevo.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPastedText("");
    setResult(null);
    setError(null);
    setUseTextMode(false);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f8fafc_34rem,#ffffff_70rem)] text-slate-950">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.section
              key="intake"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.34, ease: "easeOut" }}
              className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start"
            >
              <HeroPanel />
              <IntakeCard
                canAnalyze={canAnalyze}
                dragActive={dragActive}
                error={error}
                file={file}
                isLoading={isLoading}
                loadingStep={loadingStep}
                pastedText={pastedText}
                useTextMode={useTextMode}
                onAnalyze={handleAnalyze}
                onDrag={handleDrag}
                onDrop={handleDrop}
                onFileChange={handleFileChange}
                onModeChange={(nextMode) => {
                  setUseTextMode(nextMode);
                  setError(null);
                }}
                onTextChange={setPastedText}
              />
            </motion.section>
          ) : (
            <ResultsView
              result={result}
              onDownload={handleDownloadPDF}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/78 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <BlankATSLogo />
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          Sin pagos ni cuenta en este MVP
        </div>
      </div>
    </header>
  );
}

function BlankATSLogo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/blankats-wordmark.png"
        alt="BlankATS"
        width={820}
        height={240}
        priority
        className="h-10 w-auto max-w-[210px] object-contain sm:h-12"
      />
      <div className="leading-none">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
          CV clarity studio
        </p>
      </div>
    </div>
  );
}

function HeroPanel() {
  return (
    <section className="pt-5 lg:pt-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4 }}
        className="max-w-xl"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Revision inteligente para CVs profesionales
        </div>
        <h1 className="text-balance text-4xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          Convierte tu CV en una lectura clara y confiable.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
          BlankATS analiza tu PDF o texto, detecta oportunidades de mejora y prepara una version mas ordenada, profesional y facil de revisar por reclutadores y procesos digitales.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {safeHighlights.map((item) => (
            <div
              key={item}
              className="rounded-lg border border-white bg-white/72 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

interface IntakeCardProps {
  canAnalyze: boolean;
  dragActive: boolean;
  error: string | null;
  file: File | null;
  isLoading: boolean;
  loadingStep: number;
  pastedText: string;
  useTextMode: boolean;
  onAnalyze: () => void;
  onDrag: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onModeChange: (useTextMode: boolean) => void;
  onTextChange: (value: string) => void;
}

function IntakeCard({
  canAnalyze,
  dragActive,
  error,
  file,
  isLoading,
  loadingStep,
  pastedText,
  useTextMode,
  onAnalyze,
  onDrag,
  onDrop,
  onFileChange,
  onModeChange,
  onTextChange,
}: IntakeCardProps) {
  return (
    <section className="rounded-lg border border-white bg-white/88 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-6 lg:mt-8">
      <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2">
        <div className="grid grid-cols-2 gap-2">
          <ModeButton
            active={!useTextMode}
            icon={<FileUp className="h-4 w-4" />}
            label="PDF"
            onClick={() => onModeChange(false)}
          />
          <ModeButton
            active={useTextMode}
            icon={<TextCursorInput className="h-4 w-4" />}
            label="Texto"
            onClick={() => onModeChange(true)}
          />
        </div>
      </div>

      <div className="mt-5">
        {!useTextMode ? (
          <UploadDropzone
            dragActive={dragActive}
            file={file}
            onDrag={onDrag}
            onDrop={onDrop}
            onFileChange={onFileChange}
          />
        ) : (
          <TextInputArea value={pastedText} onChange={onTextChange} />
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={onAnalyze}
        disabled={isLoading || !canAnalyze}
        className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-lg bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(15,23,42,0.20)] transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Analizando
          </>
        ) : (
          <>
            Analizar mi CV
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      {isLoading && <LoadingState activeStep={loadingStep} />}
    </section>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-black transition ${
        active
          ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
          : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function UploadDropzone({
  dragActive,
  file,
  onDrag,
  onDrop,
  onFileChange,
}: {
  dragActive: boolean;
  file: File | null;
  onDrag: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      onDragEnter={onDrag}
      onDragOver={onDrag}
      onDragLeave={onDrag}
      onDrop={onDrop}
      className={`relative overflow-hidden rounded-lg border border-dashed p-7 text-center transition sm:p-9 ${
        dragActive
          ? "border-blue-400 bg-blue-50"
          : file
            ? "border-emerald-300 bg-emerald-50/70"
            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/35"
      }`}
    >
      <input
        type="file"
        accept="application/pdf"
        onChange={onFileChange}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Subir CV en PDF"
      />
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-slate-950 text-white shadow-lg">
        {file ? <FileCheck2 className="h-7 w-7" /> : <FileUp className="h-7 w-7" />}
      </div>
      <h2 className="mt-5 text-xl font-black tracking-tight text-slate-950">
        {file ? file.name : "Sube tu CV en PDF"}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
        {file
          ? "Archivo listo para analizar. Puedes iniciar cuando quieras."
          : "Arrastra tu archivo aqui o toca para seleccionarlo desde tu dispositivo."}
      </p>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        PDF recomendado
      </p>
    </div>
  );
}

function TextInputArea({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-3 block text-sm font-black text-slate-800">
        Pega el texto de tu CV
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Pega aqui tu experiencia, educacion, habilidades y datos de contacto..."
        className="min-h-72 w-full resize-none rounded-lg border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function LoadingState({ activeStep }: { activeStep: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 rounded-lg border border-blue-100 bg-blue-50/70 p-4"
    >
      <div className="flex items-center gap-3 text-sm font-black text-blue-900">
        <WandSparkles className="h-4 w-4" />
        {loadingSteps[activeStep]}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
        <motion.div
          className="h-full rounded-full bg-blue-600"
          initial={{ width: "8%" }}
          animate={{ width: `${((activeStep + 1) / loadingSteps.length) * 100}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

function ResultsView({
  result,
  onDownload,
  onReset,
}: {
  result: AnalysisResponse;
  onDownload: () => void;
  onReset: () => void;
}) {
  return (
    <motion.section
      key="results"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="rounded-lg border border-white bg-white/88 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-black text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Diagnostico listo
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              Tu CV ya tiene una version mas clara.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Revisa los hallazgos principales, confirma que la informacion sea fiel a tu experiencia y descarga el PDF mejorado.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onReset}
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-300"
            >
              <RefreshCw className="h-4 w-4" />
              Analizar otro
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <DiagnosisPanel result={result} />
        <CVPreview cv={result.improvedCV} />
      </div>
    </motion.section>
  );
}

function DiagnosisPanel({ result }: { result: AnalysisResponse }) {
  const scoreTone =
    result.score >= 80
      ? "text-emerald-600"
      : result.score >= 60
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <aside className="space-y-5">
      <div className="rounded-lg border border-white bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Claridad del documento
        </p>
        <div className="mt-5 flex items-end gap-3">
          <span className={`text-7xl font-black leading-none tracking-tight ${scoreTone}`}>
            {result.score}
          </span>
          <span className="mb-2 text-lg font-black text-slate-400">/100</span>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(result.score, 100))}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-blue-600"
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Esta puntuacion resume legibilidad, estructura y facilidad de revision. No representa una garantia de resultado laboral.
        </p>
      </div>

      <InsightList title="Problemas detectados" tone="rose" items={result.problems} />
      <InsightList title="Secciones a revisar" tone="amber" items={result.missingSections} />
      <InsightList title="Recomendaciones" tone="blue" items={result.recommendations} />
    </aside>
  );
}

function InsightList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "rose" | "amber" | "blue";
  items: string[];
}) {
  const toneClass = {
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    blue: "bg-blue-600",
  }[tone];

  return (
    <div className="rounded-lg border border-white bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${toneClass}`} />
        <h2 className="text-sm font-black text-slate-950">{title}</h2>
      </div>
      {items?.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          No se detectaron puntos criticos en esta categoria.
        </p>
      )}
    </div>
  );
}

function CVPreview({ cv }: { cv: ImprovedCV }) {
  return (
    <article className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-950 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-black">
          <FileText className="h-4 w-4 text-blue-300" />
          Preview del CV mejorado
        </div>
        <p className="text-xs font-semibold text-slate-300">
          Formato limpio, una columna, facil de revisar
        </p>
      </div>
      <div className="max-h-[760px] overflow-y-auto bg-slate-100 p-3 sm:p-6">
        <div className="mx-auto min-h-[680px] max-w-[760px] bg-white px-6 py-8 text-slate-950 shadow-sm sm:px-10 sm:py-12">
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-950">
            {cv.name}
          </h2>
          {cv.title && (
            <p className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-slate-600">
              {cv.title}
            </p>
          )}
          {cv.contact && (
            <p className="mt-3 border-b border-slate-200 pb-5 text-sm leading-6 text-slate-600">
              {cv.contact}
            </p>
          )}

          <CVSection title="Resumen profesional">
            <p className="text-sm leading-7 text-slate-700">{cv.summary}</p>
          </CVSection>

          {cv.experience?.length > 0 && (
            <CVSection title="Experiencia laboral">
              <div className="space-y-5">
                {cv.experience.map((item) => (
                  <div key={`${item.role}-${item.company}-${item.period}`}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <h3 className="text-sm font-black text-slate-950">
                        {item.role} <span className="font-semibold text-slate-500">- {item.company}</span>
                      </h3>
                      <p className="text-xs font-semibold text-slate-500">{item.period}</p>
                    </div>
                    <ul className="mt-2 space-y-1.5 pl-4">
                      {item.description
                        .split("\n")
                        .filter((line) => line.trim())
                        .map((line) => (
                          <li key={line} className="list-disc text-sm leading-6 text-slate-700 marker:text-slate-400">
                            {line.replace(/^[-*]\s?/, "").trim()}
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CVSection>
          )}

          {cv.education?.length > 0 && (
            <CVSection title="Educacion">
              <div className="space-y-4">
                {cv.education.map((item) => (
                  <div key={`${item.degree}-${item.institution}-${item.period}`}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <h3 className="text-sm font-black text-slate-950">{item.degree}</h3>
                      <p className="text-xs font-semibold text-slate-500">{item.period}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.institution}</p>
                    {item.description && (
                      <p className="mt-1 text-sm italic text-slate-600">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CVSection>
          )}

          {cv.skills?.length > 0 && (
            <CVSection title="Habilidades">
              <p className="text-sm leading-7 text-slate-700">{cv.skills.join(" - ")}</p>
            </CVSection>
          )}

          {cv.projects && cv.projects.length > 0 && (
            <CVSection title="Proyectos">
              <div className="space-y-3">
                {cv.projects.map((item) => (
                  <div key={`${item.name}-${item.period || ""}`}>
                    <h3 className="text-sm font-black text-slate-950">
                      {item.name}
                      {item.period ? <span className="font-semibold text-slate-500"> - {item.period}</span> : null}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{item.description}</p>
                  </div>
                ))}
              </div>
            </CVSection>
          )}

          {cv.certifications && cv.certifications.length > 0 && (
            <CVSection title="Certificaciones">
              <ul className="grid gap-2 sm:grid-cols-2">
                {cv.certifications.map((item) => (
                  <li key={item} className="list-inside list-disc text-sm text-slate-700 marker:text-slate-400">
                    {item}
                  </li>
                ))}
              </ul>
            </CVSection>
          )}
        </div>
      </div>
    </article>
  );
}

function CVSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-7 border-t border-slate-200 pt-5">
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-950">
        {title}
      </h3>
      {children}
    </section>
  );
}
