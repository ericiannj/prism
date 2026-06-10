import { type ReactNode } from "react";
import { Link } from "react-router-dom";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-5">
      {children}
      <span className="flex-1 h-px bg-primary/20" />
    </p>
  );
}

const sources = [
  {
    emoji: "🧠",
    colorVar: "--source-parametric",
    title: "Model knowledge",
    description: "What the LLM learned during training. Broad, fast, and always available.",
  },
  {
    emoji: "📄",
    colorVar: "--source-document",
    title: "Your documents",
    description:
      "PDFs and text files you upload, chunked and indexed with pgvector for precise retrieval.",
  },
  {
    emoji: "🌐",
    colorVar: "--source-web",
    title: "Live web",
    description:
      "Real-time search via Tavily. Useful when training data is stale or documents don't cover the topic.",
  },
];

const steps = [
  {
    title: "Upload your documents",
    description:
      "Drop any PDF or text file. Prism chunks it, generates embeddings, and stores them in your personal vector store.",
  },
  {
    title: "Ask anything in chat",
    description:
      "The model decides which sources to use — your documents, the web, or its own knowledge — based on the question.",
  },
  {
    title: "See where the answer came from",
    description:
      "Every response includes a source badge. Expand it to see the exact retrieved passages or web results that informed the reply.",
  },
];

const heroTags = [
  { label: "Parametric memory", colorVar: "--source-parametric" },
  { label: "Your documents", colorVar: "--source-document" },
  { label: "Live web search", colorVar: "--source-web" },
];

export function HomePage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="max-w-[680px] mx-auto px-8 pt-[96px] pb-[96px] flex flex-col items-center text-center gap-6">
        <div className="inline-flex items-center gap-2 border border-primary/30 rounded-full px-[14px] py-[5px] text-[11px] font-semibold tracking-[0.06em] text-primary bg-primary/[0.06]">
          <span className="w-[6px] h-[6px] rounded-full bg-primary flex-shrink-0" />
          RAG · Transparency · Telemetry
        </div>

        <h1 className="text-[52px] font-extrabold leading-[1.1] tracking-[-1.5px] text-foreground max-w-[580px]">
          Questions. Answers.{" "}
          <span
            className="not-italic"
            style={{
              background: "linear-gradient(110deg, hsl(263,75%,72%), hsl(295,65%,74%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            With origin.
          </span>
        </h1>

        <p className="text-[17px] text-muted-foreground leading-[1.65] max-w-[480px]">
          Prism connects your questions to three distinct sources and always tells you exactly where
          each answer came from.
        </p>

        <div className="flex gap-2 flex-wrap justify-center">
          {heroTags.map(({ label, colorVar }) => (
            <span
              key={label}
              className="text-[11px] font-semibold px-3 py-1 rounded-full border"
              style={{
                color: `hsl(var(${colorVar}))`,
                borderColor: `hsl(var(${colorVar}) / 0.3)`,
                backgroundColor: `hsl(var(${colorVar}) / 0.08)`,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <Link
          to="/documents"
          className="mt-2 bg-primary text-primary-foreground px-7 py-[13px] rounded-lg text-[14px] font-semibold tracking-[0.01em] hover:bg-primary/90 transition-colors"
        >
          Get started with documents →
        </Link>
      </section>

      <hr className="border-t border-border" />

      {/* ── What is Prism ── */}
      <section className="max-w-[680px] mx-auto px-8 py-[80px]">
        <SectionLabel>What is Prism</SectionLabel>
        <h2 className="text-[30px] font-extrabold tracking-[-0.6px] leading-[1.2] text-foreground mb-4">
          A RAG platform built for clarity.
        </h2>
        <p className="text-[15px] text-muted-foreground leading-[1.75]">
          Most AI assistants give you answers but keep the reasoning opaque. You don't know if the
          model is recalling training data, hallucinating, or pulling from something real.
        </p>
        <p className="text-[15px] text-muted-foreground leading-[1.75] mt-[14px]">
          Prism makes the source visible. Every response is tagged — parametric knowledge, your own
          uploaded documents, or live web results. No guessing.
        </p>
      </section>

      <hr className="border-t border-border" />

      {/* ── Three Sources ── */}
      <section className="max-w-[680px] mx-auto px-8 py-[80px]">
        <SectionLabel>Three sources</SectionLabel>
        <h2 className="text-[30px] font-extrabold tracking-[-0.6px] leading-[1.2] text-foreground mb-4">
          Every answer has a home.
        </h2>
        <p className="text-[15px] text-muted-foreground leading-[1.75] mb-12">
          Prism retrieves from three distinct layers and marks each response with its origin — so
          you always know what you're reading.
        </p>
        <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
          {sources.map(({ emoji, colorVar, title, description }) => (
            <div key={title} className="bg-card p-6">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base mb-4"
                style={{
                  backgroundColor: `hsl(var(${colorVar}) / 0.12)`,
                }}
              >
                {emoji}
              </div>
              <h3 className="text-[13px] font-bold text-foreground mb-2">{title}</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-t border-border" />

      {/* ── How it Works ── */}
      <section className="max-w-[680px] mx-auto px-8 py-[80px]">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="text-[30px] font-extrabold tracking-[-0.6px] leading-[1.2] text-foreground mb-4">
          Simple by design.
        </h2>
        <p className="text-[15px] text-muted-foreground leading-[1.75] mb-12">
          Three steps from a file to an answer you can trust.
        </p>
        <div>
          {steps.map(({ title, description }, i) => (
            <div
              key={title}
              className={`grid grid-cols-[40px_1fr] gap-5 py-6 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <div className="w-7 h-7 rounded-[6px] bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-bold text-primary mt-0.5 flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-foreground mb-1.5">{title}</h3>
                <p className="text-[13px] text-muted-foreground leading-[1.65]">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-t border-border" />

      {/* ── Final CTA ── */}
      <section className="max-w-[680px] mx-auto px-8 pt-[96px] pb-[96px] flex flex-col items-center text-center gap-5">
        <h2 className="text-[34px] font-extrabold tracking-[-0.8px] leading-[1.2] text-foreground">
          Ready to try it?
        </h2>
        <p className="text-[15px] text-muted-foreground leading-[1.65] max-w-[420px]">
          Start by uploading a document. The rest follows naturally.
        </p>
        <Link
          to="/documents"
          className="bg-primary text-primary-foreground px-7 py-[13px] rounded-lg text-[14px] font-semibold tracking-[0.01em] hover:bg-primary/90 transition-colors"
        >
          Go to Documents →
        </Link>
      </section>
    </div>
  );
}
