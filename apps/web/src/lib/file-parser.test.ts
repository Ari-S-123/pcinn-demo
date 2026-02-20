import { describe, expect, it } from "bun:test";
import { parseUploadFile } from "./file-parser";

function createCsvFile(
  headers: string[],
  rows: Array<Array<number | string>>,
  name = "upload.csv",
) {
  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  return new File([csv], name, { type: "text/csv" });
}

describe("parseUploadFile", () => {
  it("parses rows when headers are exact canonical names", async () => {
    const file = createCsvFile(
      ["m_molar", "s_molar", "i_molar", "temperature_k", "time_s"],
      [[1.5, 7.2, 0.02, 333.15, 7200]],
    );

    const result = await parseUploadFile(file);

    expect(result.error).toBeNull();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({
      rowIndex: 2,
      m_molar: 1.5,
      s_molar: 7.2,
      i_molar: 0.02,
      temperature_k: 333.15,
      time_s: 7200,
    });
  });

  it("rejects Celsius headers", async () => {
    const file = createCsvFile(
      ["m_molar", "s_molar", "i_molar", "temperature_c", "time_s"],
      [[1.5, 7.2, 0.02, 60, 7200]],
    );

    const result = await parseUploadFile(file);

    expect(result.rows).toHaveLength(0);
    expect(result.error).toContain("Missing required columns: temperature_k");
    expect(result.error).toContain(
      "Temperature and time headers must be exactly temperature_k and time_s.",
    );
  });

  it("rejects minute headers", async () => {
    const file = createCsvFile(
      ["m_molar", "s_molar", "i_molar", "temperature_k", "time_min"],
      [[1.5, 7.2, 0.02, 333.15, 120]],
    );

    const result = await parseUploadFile(file);

    expect(result.rows).toHaveLength(0);
    expect(result.error).toContain("Missing required columns: time_s");
  });

  it("rejects ambiguous temperature/time headers", async () => {
    const file = createCsvFile(
      ["m_molar", "s_molar", "i_molar", "temperature", "time"],
      [[1.5, 7.2, 0.02, 333.15, 7200]],
    );

    const result = await parseUploadFile(file);

    expect(result.rows).toHaveLength(0);
    expect(result.error).toContain("Missing required columns: temperature_k, time_s");
  });

  it("rejects Kelvin/seconds aliases", async () => {
    const file = createCsvFile(
      ["m_molar", "s_molar", "i_molar", "temp_k", "time (s)"],
      [[1.5, 7.2, 0.02, 333.15, 7200]],
    );

    const result = await parseUploadFile(file);

    expect(result.rows).toHaveLength(0);
    expect(result.error).toContain("Missing required columns: temperature_k, time_s");
  });

  it("accepts concentration aliases when temperature/time headers are canonical", async () => {
    const file = createCsvFile(
      ["[M]", "[S]", "[I]", "temperature_k", "time_s"],
      [[1.5, 7.2, 0.02, 333.15, 7200]],
    );

    const result = await parseUploadFile(file);

    expect(result.error).toBeNull();
    expect(result.rows).toHaveLength(1);
  });
});
