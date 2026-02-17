export const inputFieldDescriptions = {
  m_molar:
    "Initial monomer concentration. Higher values increase available reactant for chain growth.",
  s_molar:
    "Initial solvent concentration. Affects dilution and collision frequency throughout polymerization.",
  i_molar:
    "Initial initiator concentration. Controls radical generation rate and influences chain population.",
  temperature_c:
    "Reaction temperature in Celsius. Higher temperature generally accelerates reaction kinetics.",
  time_min:
    "Elapsed reaction time in minutes used for single-point prediction and compare horizon.",
} as const;

export const outputFieldDescriptions = {
  conversion:
    "Fraction of monomer converted to polymer. Served value is physically clipped to the range [0, 1].",
  mn: "Number-average molecular weight. Average chain weight weighted equally by molecule count.",
  mw: "Weight-average molecular weight. Mass-weighted average that emphasizes heavier chains.",
  mz: "Z-average molecular weight. More sensitive to high-molecular-weight tails than Mw.",
  mz_plus_1:
    "(Z+1)-average molecular weight. Strongly emphasizes the heaviest tail of the distribution.",
  mv: "Viscosity-average molecular weight. Correlates with rheological response via Mark-Houwink scaling.",
  dispersity: "Distribution breadth defined as Mw/Mn. Served value is clamped to a minimum of 1.0.",
} as const;
