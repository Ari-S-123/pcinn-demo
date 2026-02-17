import type { Metadata } from "next";
import { getModels } from "@/lib/api-client";
import { UploadClient } from "./upload-client";

export const metadata: Metadata = {
  title: "Batch Upload",
  description: "Upload CSV or XLSX files for batch polymer property prediction.",
};

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const { models } = await getModels();
  return <UploadClient models={models} />;
}
