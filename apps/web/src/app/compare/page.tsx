import type { Metadata } from "next";
import { CompareClient } from "./compare-client";

export const metadata: Metadata = {
  title: "Compare Models",
  description: "Side-by-side comparison of Baseline NN, PCINN, and SA-PCINN predictions.",
};

export default function ComparePage() {
  return <CompareClient />;
}
