/**
 * Génère les palettes de couleurs et crée les variables Figma
 */

import {
  generateGreyShades,
  generateShades,
} from "../../../../../common/utils/colorUtils";
import { variableBuilder } from "../../variableBuilder";
import {
  COLLECTIONS,
  NEUTRAL_SHADES,
  OPACITIES,
} from "../../../../../common/constants/variablesConstants";
import {
  ColorsCollection,
  VariableConfig,
} from "../../../../types/variablesTypes";
import { hexToFigmaRgba } from "../../../../utils/colorUtils";
import { converter } from "culori";
import { logger } from "../../../../utils/logger";
import { catchError } from "../../../../utils/errorUtils";
import { SCOPES } from "../../../../constants/variablesConstants";

const FILE_NAME = "PalettesBuilder";

/**
 * Génère les palettes de couleurs pour Brand et Feedback dans une seule collection
 */
export const generateColorPalette = catchError(
  async (
    colors: ColorsCollection,
    colorFamily: string,
  ): Promise<Variable[]> => {
    const variables: VariableConfig[] = [];
    for (const [name, baseColor] of Object.entries(colors)) {
      const shades = generateShades(baseColor);
      shades.forEach(({ step, color }) => {
        variables.push({
          name: `${colorFamily}/${name}/${step}`.toLowerCase(),
          collection: COLLECTIONS.palette.name,
          type: "COLOR",
          value: color,
          scopes: [SCOPES.COLOR.ALL],
        });
      });
    }
    const newVariables =
      await variableBuilder.createOrUpdateVariables(variables);
    await logger.success(
      `Palette de couleurs ${colorFamily} générée avec succès.`,
      undefined,
      `${FILE_NAME}.generateColorPalette`,
    );
    return newVariables;
  },
  `${FILE_NAME}.generateColorPalette`,
);

/**
 * Génère la palette de couleurs Neutral
 */
export const generateNeutralPalette = catchError(
  async (greyHue: string | undefined): Promise<Variable[]> => {
    let hue = 0;
    if (greyHue !== undefined && greyHue !== "") {
      hue = converter("hsl")(greyHue)?.h || 0;
    }
    const shadeSteps = NEUTRAL_SHADES;
    const shades = generateGreyShades(shadeSteps, hue);
    const colorVariables: VariableConfig[] = [];

    for (const [step, color] of Object.entries(shades)) {
      colorVariables.push({
        name: `neutral/grey/shade/${step}`,
        collection: COLLECTIONS.palette.name,
        type: "COLOR",
        value: color,
        scopes: [SCOPES.COLOR.ALL],
      });
    }

    for (const key of ["grey", "lightGrey", "darkGrey"] as const) {
      const baseColor =
        shades[key === "grey" ? 500 : key === "lightGrey" ? 50 : 950];
      OPACITIES.forEach(async (opacity) => {
        const color = await hexToFigmaRgba(baseColor, opacity / 1000);
        colorVariables.push({
          name: `neutral/${key}/opacity/${opacity}`,
          collection: COLLECTIONS.palette.name,
          type: "COLOR",
          value: color,
          scopes: [SCOPES.COLOR.ALL],
        });
      });
    }

    // Crée toutes les variables dans une seule collection
    const newVariables =
      await variableBuilder.createOrUpdateVariables(colorVariables);

    return newVariables;
  },
  `${FILE_NAME}.generateNeutralPalette`,
);
