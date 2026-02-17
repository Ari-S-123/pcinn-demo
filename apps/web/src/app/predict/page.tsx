import type { Metadata } from "next";
import { PredictClient } from "./predict-client";

export const metadata: Metadata = {
  title: "Predict",
  description: "Single-model prediction of polymer properties from reaction conditions.",
};

export default function PredictPage() {
  return <PredictClient />;
}
