import { Shadow } from "../../types/stylesTypes";
import { variableBuilder } from "../variables/variableBuilder";
import { styleBuilder } from "./styleBuilder";
import { catchError } from "../../utils/errorUtils";
import { COLLECTIONS } from "../../../common/constants/variablesConstants";

/**
 * Génère les ombres pour les 24 niveaux d'élévation MUI
 *
 * X = 0;
 * Color = {
 *  layer 1 : "#00000010",
 *  layer 2 : "#00000015",
 *  layer 3 : "#00000020"
 * }
 *
 * for i = 1 ; i <= 24 ; i++
 *   layer 1 :
 *     Y = arrondi( i * 2.6)
 *     Blur = arrondi( i * 2)
 *     Spread = arrondi( i * 0.13)
 *   layer 2 :
 *     Y = i
 *     Blur = arrondi inférieur( i * 1.6)
 *     Spread = arrondi inférieur( i / 6.3)
 *   layer 3 :
 *     Y = arrondi( i / 2)
 *     Blur = arrondi supérieur( i * 1.65)
 *     Spread = -arrondi supérieur( i / -3.5)
 */

export const generateElevationEffects = catchError(async (): Promise<void> => {
  const group = "neutral/darkGrey/opacity/";
  const colors = await variableBuilder.findVariables(COLLECTIONS.palette.name, [
    `${group}100`,
    `${group}150`,
    `${group}200`,
  ]);
  // Créer les 24 effect styles
  for (let level = 1; level <= 12; level++) {
    const shadows: Shadow[] = [
      {
        x: 0,
        y: Math.round(level * 2.6),
        blur: Math.round(level * 2),
        spread: Math.round(level * 0.13),
        color: (await variableBuilder.getVariableValueForMode(
          colors[0],
        )) as RGBA,
        boundVariables: {
          color: {
            type: "VARIABLE_ALIAS",
            id: colors[0].id,
          },
        },
      },
      {
        x: 0,
        y: level,
        blur: Math.floor(level * 1.6),
        spread: Math.floor(level / 6.3),
        color: (await variableBuilder.getVariableValueForMode(
          colors[1],
        )) as RGBA,
        boundVariables: {
          color: {
            type: "VARIABLE_ALIAS",
            id: colors[1].id,
          },
        },
      },
      {
        x: 0,
        y: Math.round(level / 2),
        blur: Math.ceil(level * 1.65),
        spread: -Math.ceil(level / -3.5),
        color: (await variableBuilder.getVariableValueForMode(
          colors[2],
        )) as RGBA,
        boundVariables: {
          color: {
            type: "VARIABLE_ALIAS",
            id: colors[2].id,
          },
        },
      },
    ];

    const effects: Effect[] = shadows.map((shadow) => ({
      type: "DROP_SHADOW",
      visible: true,
      blendMode: "NORMAL",
      color: shadow.color,
      offset: { x: shadow.x, y: shadow.y },
      radius: shadow.blur,
      spread: shadow.spread,
      boundVariables: shadow.boundVariables,
    }));

    await styleBuilder.createOrUpdateStyle(
      `elevation/${level}`,
      "effect",
      effects,
    );
  }
}, "DropshadowsBuilder.generateElevationEffects");
