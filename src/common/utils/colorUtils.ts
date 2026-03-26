import { clampChroma, converter, formatHex, wcagContrast } from "culori";
import { SHADE_STEPS } from "../constants/colorConstants";

/**
 * Génère une palette de teintes (shades) à partir d'une couleur de base en hex.
 *
 * L'algorithme place la couleur de base à l'étape la plus proche de sa luminosité
 * naturelle, puis dérive les autres étapes autour d'elle dans l'espace OKLCH.
 *
 * @param colorHex - Couleur de départ au format hex (#RRGGBB)
 * @returns Tableau trié de { step, color } pour chaque étape définie dans SHADE_STEPS
 */
export function generateShades(
  colorHex: string,
): { step: number; color: string }[] {
  const base = converter("oklch")(colorHex);
  if (!base) return [];
  const { l: baseL, c: CO, h: H0 } = base;
  const lMax = 0.95;
  const lMin = 0.15;
  // Fix: utiliser le spread ES2020 plutôt que Math.min/max.apply (antipattern ES5)
  const stepNumbers = SHADE_STEPS.map(Number);
  const minStep = Math.min(...stepNumbers);
  const maxStep = Math.max(...stepNumbers);

  // Trouve la shade la plus proche de la luminosité de base
  let closestStep = SHADE_STEPS[0];
  let minDiff = Infinity;

  SHADE_STEPS.forEach((step) => {
    const t = (step - minStep) / (maxStep - minStep);
    const l = lMax - Math.pow(t, 1.15) * (lMax - lMin);
    const diff = Math.abs(l - baseL);
    if (diff < minDiff) {
      minDiff = diff;
      closestStep = step;
    }
  });

  // Calculer la position de la couleur de base dans l'échelle
  const closestT = (closestStep - minStep) / (maxStep - minStep);
  const baseLFromFormula = lMax - Math.pow(closestT, 1.15) * (lMax - lMin);
  const luminosityOffset = baseL - baseLFromFormula;

  return SHADE_STEPS.map((step) => {
    // Si c'est la shade la plus proche, on utilise la couleur de départ
    if (step === closestStep) {
      return { step, color: colorHex };
    }

    const t = (step - minStep) / (maxStep - minStep);
    // Appliquer le décalage de luminosité pour adapter le dégradé autour de la couleur de base
    const l = lMax - Math.pow(t, 1.15) * (lMax - lMin) + luminosityOffset;
    const c = CO * Math.pow(Math.sin(Math.PI * t), 0.9);
    const color = clampChroma({ mode: "oklch", l, c, h: H0 });
    return { step, color: formatHex(color) };
  });
}

/**
 * Génère une palette de niveaux de gris pour un ensemble d'étapes données.
 *
 * @param steps  - Valeurs d'étape entre 0 et 1000 (0 = blanc, 1000 = noir)
 * @param hue    - Teinte optionnelle pour un gris légèrement teinté (défaut : 0 = neutre)
 * @returns      Dictionnaire { step → couleur hex }
 */
export function generateGreyShades(
  steps: number[],
  hue: number = 0,
): Record<number, string> {
  const greyShades: Record<number, string> = {};
  for (const step of steps) {
    const t = step / 1000;
    // Fix: clamp lightness dans [0, 1] — si step > 1000, la valeur non clampée
    // serait négative, ce que culori accepte silencieusement avec un rendu indéfini.
    const lightness = Math.max(0, Math.min(1, 1 - t));
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

/**
 * Détermine la couleur de texte (clair ou foncé) offrant le meilleur contraste WCAG
 * sur un fond donné.
 *
 * @param background - Couleur de fond en RGBA Figma (valeurs 0–1)
 * @param light      - Couleur "claire" candidate en RGBA Figma
 * @param dark       - Couleur "foncée" candidate en RGBA Figma
 * @returns "Light" si la couleur claire offre le meilleur contraste, "Dark" sinon
 */
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
