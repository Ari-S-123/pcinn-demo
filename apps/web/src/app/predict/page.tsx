import type { Metadata } from "next";
import { getModels } from "@/lib/api-client";
import type { ModelInfo } from "@/types/prediction";
import { PredictClient } from "./predict-client";

export const metadata: Metadata = {
  title: "Predict",
  description: "Single-model prediction of polymer properties from reaction conditions.",
};

export const dynamic = "force-dynamic";

async function getPredictPageModels(): Promise<ModelInfo[]> {
  const { models } = await getModels();
  return models;
}

export default async function PredictPage() {
  const models = await getPredictPageModels();

  return <PredictClient models={models} />;
}
