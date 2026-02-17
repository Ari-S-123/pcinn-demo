"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CompareResult } from "@/types/prediction";

const conversionConfig = {
  baseline_nn: { label: "Baseline NN", color: "var(--color-baseline)" },
  pcinn: { label: "PCINN", color: "var(--color-pcinn)" },
  sa_pcinn: { label: "SA-PCINN", color: "var(--color-sa-pcinn)" },
} satisfies ChartConfig;

const mwConfig = {
  baseline_nn_mw: { label: "Baseline NN", color: "var(--color-baseline)" },
  pcinn_mw: { label: "PCINN", color: "var(--color-pcinn)" },
  sa_pcinn_mw: { label: "SA-PCINN", color: "var(--color-sa-pcinn)" },
} satisfies ChartConfig;

interface ComparisonChartInnerProps {
  data: CompareResult | null;
}

export function ComparisonChartInner({ data }: ComparisonChartInnerProps) {
  if (!data) return null;

  const chartData = data.times.map((timeValue, i) => ({
    time: +(timeValue / 60).toFixed(1),
    baseline_nn: +data.baseline_nn.conversion[i].toFixed(4),
    pcinn: +data.pcinn.conversion[i].toFixed(4),
    sa_pcinn: +data.sa_pcinn.conversion[i].toFixed(4),
    baseline_nn_mw: +data.baseline_nn.mw[i].toFixed(0),
    pcinn_mw: +data.pcinn.mw[i].toFixed(0),
    sa_pcinn_mw: +data.sa_pcinn.mw[i].toFixed(0),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm">Model Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="conversion">
          <TabsList className="mb-4">
            <TabsTrigger value="conversion" className="font-mono text-xs">
              Conversion vs Time
            </TabsTrigger>
            <TabsTrigger value="mw" className="font-mono text-xs">
              Mw vs Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversion">
            <ChartContainer config={conversionConfig} className="h-[300px] w-full">
              <LineChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="font-mono text-[10px]"
                  label={{
                    value: "Time (min)",
                    position: "insideBottom",
                    offset: -4,
                    fontSize: 10,
                  }}
                />
                <YAxis
                  domain={[0, 1]}
                  tickLine={false}
                  axisLine={false}
                  className="font-mono text-[10px]"
                  width={40}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: "10px", fontFamily: "var(--font-mono)" }}
                />
                <Line
                  dataKey="baseline_nn"
                  name="Baseline NN"
                  type="monotone"
                  stroke="var(--color-baseline_nn)"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
                <Line
                  dataKey="pcinn"
                  name="PCINN"
                  type="monotone"
                  stroke="var(--color-pcinn)"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={800}
                  animationEasing="ease-out"
                  animationBegin={200}
                />
                <Line
                  dataKey="sa_pcinn"
                  name="SA-PCINN"
                  type="monotone"
                  stroke="var(--color-sa_pcinn)"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={800}
                  animationEasing="ease-out"
                  animationBegin={400}
                />
              </LineChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="mw">
            <ChartContainer config={mwConfig} className="h-[300px] w-full">
              <LineChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="font-mono text-[10px]"
                  label={{
                    value: "Time (min)",
                    position: "insideBottom",
                    offset: -4,
                    fontSize: 10,
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="font-mono text-[10px]"
                  width={60}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent formatter={(v) => `${Number(v).toLocaleString()} Da`} />
                  }
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: "10px", fontFamily: "var(--font-mono)" }}
                />
                <Line
                  dataKey="baseline_nn_mw"
                  name="Baseline NN"
                  type="monotone"
                  stroke="var(--color-baseline_nn_mw)"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
                <Line
                  dataKey="pcinn_mw"
                  name="PCINN"
                  type="monotone"
                  stroke="var(--color-pcinn_mw)"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={800}
                  animationEasing="ease-out"
                  animationBegin={200}
                />
                <Line
                  dataKey="sa_pcinn_mw"
                  name="SA-PCINN"
                  type="monotone"
                  stroke="var(--color-sa_pcinn_mw)"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={800}
                  animationEasing="ease-out"
                  animationBegin={400}
                />
              </LineChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
