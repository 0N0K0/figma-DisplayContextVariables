import { converter } from "culori";
import { catchError } from "./errorUtils";

/**
 * Convertit une couleur hexadécimale en objet RGBA Figma
 */
export const hexToFigmaRgba = catchError(
  async (hex: string, alpha: number = 1): Promise<RGBA> => {
    const rgb = converter("rgb")(hex);

    if (!rgb) {
      throw new Error(`Format de couleur invalide: ${hex}`);
    }
    const figmaRgba = {
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      a: alpha,
    };
    return figmaRgba;
  },
  "colorUtils.hexToFigmaRgba",
  false,
);
