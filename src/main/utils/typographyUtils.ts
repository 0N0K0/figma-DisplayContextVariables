import { catchError } from "./errorUtils";

export const loadFont = catchError(
  async (fontName: FontName): Promise<void> => {
    await figma.loadFontAsync(fontName);
  },
  "typographyUtils.loadFont",
);
