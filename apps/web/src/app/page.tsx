import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MODELS = [
  {
    name: "Baseline NN",
    key: "baseline_nn",
    description: "Data-only MSE training, no Jacobian guidance",
    loss: "0.129",
    colorClass: "border-t-2 border-t-[var(--color-baseline)]",
    badgeClass:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
    glowStyle: { boxShadow: "0 -1px 8px var(--glow-baseline)" },
  },
  {
    name: "PCINN",
    key: "pcinn",
    description: "Data + Jacobian matching to kinetic model",
    loss: "0.004",
    colorClass: "border-t-2 border-t-[var(--color-pcinn)]",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
    glowStyle: { boxShadow: "0 -1px 8px var(--glow-pcinn)" },
  },
  {
    name: "SA-PCINN",
    key: "sa_pcinn",
    description: "Data + Jacobian matching + soft-anchor to theory predictions",
    loss: "0.003",
    colorClass: "border-t-2 border-t-[var(--color-sa-pcinn)]",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30",
    glowStyle: { boxShadow: "0 -1px 8px var(--glow-sa-pcinn)" },
    best: true,
  },
] as const;

const GLOSSARY = [
  {
    term: "X (Conversion)",
    description:
      "Fraction of monomer converted to polymer. 0 = none reacted, 1 = complete conversion.",
  },
  {
    term: (
      <>
        M<sub>n</sub>
      </>
    ),
    label: "Number-average MW",
    description: "Simple average molecular weight by count of polymer chains.",
  },
  {
    term: (
      <>
        M<sub>w</sub>
      </>
    ),
    label: "Weight-average MW",
    description:
      "Average weighted by mass of each chain. Always \u2265 Mn; sensitive to heavier chains.",
  },
  {
    term: (
      <>
        M<sub>z</sub>
      </>
    ),
    label: "Z-average MW",
    description: "Higher-order average that emphasizes the heaviest chains in the distribution.",
  },
  {
    term: (
      <>
        M<sub>z+1</sub>
      </>
    ),
    label: "Z+1 average MW",
    description: "Even more sensitive to high molecular weight tail than Mz.",
  },
  {
    term: (
      <>
        M<sub>v</sub>
      </>
    ),
    label: "Viscosity-average MW",
    description: "Relates to intrinsic viscosity measurements (Mark-Houwink exponent a = 0.704).",
  },
  {
    term: <>{"\u0110"} (Dispersity)</>,
    description: (
      <>
        M<sub>w</sub>/M<sub>n</sub> ratio. Breadth of the molecular weight distribution. 1 =
        perfectly uniform.
      </>
    ),
  },
] as const;

export default function HomePage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      {/* Hero */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1
            className="text-5xl font-light tracking-[-0.04em] text-[var(--color-chrome)] sm:text-6xl md:text-7xl"
            style={{ textShadow: "0 0 30px oklch(0.82 0.08 85 / 15%)" }}
          >
            PCINN
          </h1>
          <p className="text-muted-foreground font-mono text-lg font-light tracking-wide">
            Polymer Chemistry Informed Neural Network
          </p>
        </div>

        <div className="my-8 h-px bg-gradient-to-r from-[var(--color-chrome)]/40 via-[var(--color-chrome)]/10 to-transparent" />

        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Interactive prediction tool for PMMA free-radical polymerization properties. Three neural
          network variants trained on experimental kinetic data predict conversion, molecular weight
          distributions (M<sub>n</sub>, M<sub>w</sub>, M<sub>z</sub>, M<sub>z+1</sub>, M<sub>v</sub>
          ), and dispersity from reaction conditions.
        </p>

        <p className="text-muted-foreground max-w-2xl font-mono text-xs">
          Ballard et al. (2024) &mdash; Polym. Chem., 15, 4580&ndash;4590. Architecture: 5 &rarr;
          128 &rarr; 64 &rarr; 6 with tanh activations. Fold 8 cross-validation.
        </p>
      </div>

      {/* Model cards */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {MODELS.map((model, i) => (
          <Card
            key={model.key}
            className={`animate-fade-in-up bg-card dark:bg-[oklch(0.14_0.01_260)] ${model.colorClass}`}
            style={{ animationDelay: `${i * 100}ms`, ...model.glowStyle }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={model.badgeClass}>
                  {model.name}
                </Badge>
                {"best" in model ? (
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-[var(--color-sa-pcinn)]" />
                    <span className="font-mono text-[9px] tracking-wider text-orange-600 uppercase dark:text-orange-400">
                      Best
                    </span>
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-xs leading-relaxed">{model.description}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
                  Test Loss
                </span>
                <span className="font-mono text-2xl font-light tabular-nums">{model.loss}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTAs */}
      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="font-mono text-xs tracking-wider uppercase">
          <Link href="/predict">Start Prediction</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="border-[var(--color-chrome)]/40 font-mono text-xs tracking-wider text-[var(--color-chrome)] uppercase hover:bg-[var(--color-chrome)]/10"
        >
          <Link href="/compare">Compare Models</Link>
        </Button>
      </div>

      {/* Glossary — What the Model Predicts */}
      <div className="mt-16 space-y-4">
        <h2 className="section-label text-[var(--color-chrome-muted)]">What the Model Predicts</h2>
        <div className="panel-inset grid gap-px overflow-hidden rounded-lg sm:grid-cols-2">
          {GLOSSARY.map((item, i) => (
            <div
              key={i}
              className="border-border flex flex-col gap-0.5 border-b p-3 last:border-0 sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-foreground font-mono text-xs font-medium">{item.term}</span>
                {"label" in item && item.label ? (
                  <span className="text-muted-foreground text-[10px]">{item.label}</span>
                ) : null}
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture summary */}
      <div className="mt-12 space-y-2">
        <h2 className="section-label text-[var(--color-chrome-muted)]">Network Architecture</h2>
        <div className="panel-inset p-4 font-mono text-sm">
          <span className="text-muted-foreground border-border bg-muted inline-flex items-center rounded border px-2 py-0.5 text-xs dark:bg-[oklch(0.18_0.01_260)]">
            Input(5)
          </span>
          <span className="text-[var(--color-chrome)]/40"> &rarr; </span>
          <span className="border-border bg-muted inline-flex items-center rounded border px-2 py-0.5 text-xs dark:bg-[oklch(0.18_0.01_260)]">
            Linear(5, 128)
          </span>
          <span className="text-[var(--color-chrome)]/40"> &rarr; </span>
          <span className="text-[var(--color-chrome)]">tanh</span>
          <span className="text-[var(--color-chrome)]/40"> &rarr; </span>
          <span className="border-border bg-muted inline-flex items-center rounded border px-2 py-0.5 text-xs dark:bg-[oklch(0.18_0.01_260)]">
            Linear(128, 64)
          </span>
          <span className="text-[var(--color-chrome)]/40"> &rarr; </span>
          <span className="text-[var(--color-chrome)]">tanh</span>
          <span className="text-[var(--color-chrome)]/40"> &rarr; </span>
          <span className="border-border bg-muted inline-flex items-center rounded border px-2 py-0.5 text-xs dark:bg-[oklch(0.18_0.01_260)]">
            Linear(64, 6)
          </span>
        </div>
      </div>

      {/* Input/Output reference */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <h3 className="section-label text-[var(--color-chrome-muted)]">Inputs</h3>
          <div className="panel-inset divide-border divide-y font-mono text-xs">
            {[
              ["[M] Monomer", "0.5\u20135.0 mol/L"],
              ["[S] Solvent", "5.0\u20139.5 mol/L"],
              ["[I] Initiator", "0.005\u20130.1 mol/L"],
              ["Temperature", "50\u201390 \u00b0C"],
              ["Time", "0\u2013600 min"],
            ].map(([label, range]) => (
              <div key={label} className="text-muted-foreground flex justify-between px-3 py-2">
                <span>{label}</span>
                <span className="tabular-nums">{range}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="section-label text-[var(--color-chrome-muted)]">Outputs</h3>
          <div className="panel-inset divide-border divide-y font-mono text-xs">
            {[
              ["Conversion (X)", "0\u20131"],
              [
                <>
                  M<sub>n</sub>, M<sub>w</sub>, M<sub>z</sub>, M<sub>z+1</sub>, M<sub>v</sub>
                </>,
                "Da",
              ],
              [
                <>
                  Dispersity (M<sub>w</sub>/M<sub>n</sub>)
                </>,
                "\u2265 1",
              ],
            ].map(([label, range], i) => (
              <div key={i} className="text-muted-foreground flex justify-between px-3 py-2">
                <span>{label}</span>
                <span>{range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
