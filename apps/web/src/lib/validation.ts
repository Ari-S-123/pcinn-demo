import { z } from "zod/v4";

export const predictionSchema = z.object({
  m_molar: z.number().min(0.5, "Min 0.5 mol/L").max(5.0, "Max 5.0 mol/L"),
  s_molar: z.number().min(5.0, "Min 5.0 mol/L").max(9.5, "Max 9.5 mol/L"),
  i_molar: z.number().min(0.005, "Min 0.005 mol/L").max(0.1, "Max 0.1 mol/L"),
  temperature_c: z.number().min(50, "Min 50 °C").max(90, "Max 90 °C"),
  time_min: z.number().min(0.02, "Min 0.02 min").max(597.57, "Max 597.57 min"),
});

export type PredictionFormValues = z.infer<typeof predictionSchema>;

export const defaultFormValues: PredictionFormValues = {
  m_molar: 3.326,
  s_molar: 6.674,
  i_molar: 0.0246,
  temperature_c: 60,
  time_min: 120,
};

export function toApiUnits(form: PredictionFormValues) {
  return {
    m_molar: form.m_molar,
    s_molar: form.s_molar,
    i_molar: form.i_molar,
    temperature_k: form.temperature_c + 273.15,
    time_s: form.time_min * 60,
  };
}
