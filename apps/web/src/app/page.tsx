import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const MODELS = [
  {
    name: "Baseline NN",
    key: "baseline_nn",
    description: "Data-only MSE training, no Jacobian guidance",
    loss: "0.129",
    colorClass: "border-green-500/30 bg-green-500/5",
    badgeClass: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  {
    name: "PCINN",
    key: "pcinn",
    description: "Data + Jacobian matching to kinetic model",
    loss: "0.004",
    colorClass: "border-blue-500/30 bg-blue-500/5",
    badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    name: "SA-PCINN",
    key: "sa_pcinn",
    description: "Data + Jacobian matching + soft-anchor to theory predictions",
    loss: "0.003",
    colorClass: "border-orange-500/30 bg-orange-500/5",
    badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    best: true,
  },
] as const;

export default function HomePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      {/* Hero */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="font-mono text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            PCINN
          </h1>
          <p className="text-muted-foreground font-mono text-lg tracking-tight">
            Polymer Chemistry Informed Neural Network
          </p>
        </div>

        <Separator className="my-6" />

        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Interactive prediction tool for PMMA free-radical polymerization properties. Three neural
          network variants trained on experimental kinetic data predict conversion, molecular weight
          distributions (M<sub>n</sub>, M<sub>w</sub>, M<sub>z</sub>, M<sub>z+1</sub>, M<sub>v</sub>
          ), and dispersity from reaction conditions.
        </p>

        <p className="text-muted-foreground max-w-2xl text-xs">
          Based on Ballard (2024) &mdash; Physics-constrained neural networks for polymer reaction
          engineering. Architecture: 5 &rarr; 128 &rarr; 64 &rarr; 6 with tanh activations. Fold 8
          cross-validation.
        </p>
      </div>

      {/* Model cards */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {MODELS.map((model, i) => (
          <Card
            key={model.key}
            className={`animate-fade-in-up ${model.colorClass}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={model.badgeClass}>
                  {model.name}
                </Badge>
                {"best" in model ? (
                  <span className="font-mono text-[10px] text-orange-400">BEST</span>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-xs leading-relaxed">{model.description}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
                  Test Loss
                </span>
                <span className="font-mono text-sm font-semibold">{model.loss}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTAs */}
      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="font-mono">
          <Link href="/predict">Start Prediction</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="font-mono">
          <Link href="/compare">Compare Models</Link>
        </Button>
      </div>

      {/* Architecture summary */}
      <div className="mt-16 space-y-2">
        <h2 className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
          Network Architecture
        </h2>
        <div className="bg-muted/50 rounded-md border p-4 font-mono text-sm">
          <span className="text-muted-foreground">Input(5)</span>
          <span className="text-muted-foreground/50"> &rarr; </span>
          <span>Linear(5, 128)</span>
          <span className="text-muted-foreground/50"> &rarr; </span>
          <span className="text-orange-400">tanh</span>
          <span className="text-muted-foreground/50"> &rarr; </span>
          <span>Linear(128, 64)</span>
          <span className="text-muted-foreground/50"> &rarr; </span>
          <span className="text-orange-400">tanh</span>
          <span className="text-muted-foreground/50"> &rarr; </span>
          <span>Linear(64, 6)</span>
        </div>
      </div>

      {/* Input/Output reference */}
      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
            Inputs
          </h3>
          <div className="space-y-1 font-mono text-xs">
            {[
              ["[M] Monomer", "0.5\u20135.0 mol/L"],
              ["[S] Solvent", "5.0\u20139.5 mol/L"],
              ["[I] Initiator", "0.005\u20130.1 mol/L"],
              ["Temperature", "50\u201390 \u00b0C"],
              ["Time", "0\u2013600 min"],
            ].map(([label, range]) => (
              <div key={label} className="text-muted-foreground flex justify-between">
                <span>{label}</span>
                <span>{range}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
            Outputs
          </h3>
          <div className="space-y-1 font-mono text-xs">
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
              <div key={i} className="text-muted-foreground flex justify-between">
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
