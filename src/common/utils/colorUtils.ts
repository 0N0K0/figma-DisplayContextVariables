import { clampChroma, converter, formatHex, wcagContrast } from "culori";
import { SHADES } from "../constants/variablesConstants";

export type Shade = { step: number; color: string };

export function generateShades(colorHex: string): Shade[] {
  const gammaL = 1.2;
  const lMin = 0.15;
  const lMax = 0.95;

  const base = converter("oklch")(colorHex);
  if (!base) return [];
  const { l: baseL, c: baseC, h } = base;
  if (!h) return [];

  return SHADES.map((step) => {
    if (step === 500) return { step, color: colorHex };

    const t = (step - 500) / 400; // -1 à 1

    // Luminosité : cloche exponentielle
    const L =
      baseL +
      (step < 500 ? lMax - baseL : lMin - baseL) *
        Math.pow(Math.abs(t), gammaL);

    // Chroma : proche de baseC, léger ajustement perceptuel
    let C = baseC;
    // optionnel : diminuer très légèrement pour steps extrêmes
    if (step <= 100) C *= 0.95;
    if (step >= 900) C *= 0.9;

    const color = clampChroma({ mode: "oklch", l: L, c: C, h });
    return { step, color: formatHex(color) };
  });
}

export function generateGreyShades(
  steps: number[],
  hue: number = 0,
): Record<number, string> {
  const greyShades: Record<number, string> = {};
  for (const step of steps) {
    const t = step / 1000;
    const lightness = 1 - t * 1;
    greyShades[step] = formatHex({
      mode: "hsl",
      h: hue,
      s: hue ? 0.1 : 0,
      l: lightness,
      alpha: 1,
    });
  }
  return greyShades;
}

export function getContrastColor(
  background: { r: number; g: number; b: number; a: number },
  light: { r: number; g: number; b: number; a: number },
  dark: { r: number; g: number; b: number; a: number },
): string {
  const backgroundHex = formatHex({
    mode: "rgb",
    r: background.r,
    g: background.g,
    b: background.b,
  });
  const lightHex = formatHex({
    mode: "rgb",
    r: light.r,
    g: light.g,
    b: light.b,
  });
  const darkHex = formatHex({
    mode: "rgb",
    r: dark.r,
    g: dark.g,
    b: dark.b,
  });
  const contrastWithLight = wcagContrast(backgroundHex, lightHex);
  const contrastWithDark = wcagContrast(backgroundHex, darkHex);
  return contrastWithLight >= contrastWithDark ? "Light" : "Dark";
}
