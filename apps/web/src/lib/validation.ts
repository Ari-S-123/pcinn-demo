import { z } from "zod/v4";

export const predictionSchema = z.object({
  m_molar: z.number().min(0.5, "Min 0.5 mol/L").max(5.0, "Max 5.0 mol/L"),
  s_molar: z.number().min(5.0, "Min 5.0 mol/L").max(9.5, "Max 9.5 mol/L"),
  i_molar: z.number().min(0.005, "Min 0.005 mol/L").max(0.1, "Max 0.1 mol/L"),
  temperature_k: z.number().min(323, "Min 323 K").max(363, "Max 363 K"),
  time_s: z.number().min(1.2, "Min 1.2 s").max(35854, "Max 35854 s"),
});

export type PredictionFormValues = z.infer<typeof predictionSchema>;

export const defaultFormValues: PredictionFormValues = {
  m_molar: 3.326,
  s_molar: 6.674,
  i_molar: 0.0246,
  temperature_k: 333.15,
  time_s: 7200,
};

export function toApiUnits(form: PredictionFormValues) {
  return {
    m_molar: form.m_molar,
    s_molar: form.s_molar,
    i_molar: form.i_molar,
    temperature_k: form.temperature_k,
    time_s: form.time_s,
  };
}
