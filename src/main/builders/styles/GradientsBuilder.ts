import { ColorsCollection } from "../../types/variablesTypes";
import { angleToTransform } from "../../utils/gradientUtils";
import { logger } from "../../utils/logger";
import { variableBuilder } from "../variables/variableBuilder";
import { styleBuilder } from "./styleBuilder";
import { catchError } from "../../utils/errorUtils";
import { getCombinations } from "../../utils/dataUtils";
import { COLLECTIONS } from "../../../common/constants/variablesConstants";

export const generateGradients = catchError(
  async (brandColors: ColorsCollection): Promise<void> => {
    let colors: Variable[] =
      await variableBuilder.getCollectionVariablesByGroup(
        COLLECTIONS.palette.name,
        "brand",
      );

    const brandColorsKeys = Object.keys(brandColors);
    const combos2 = getCombinations(brandColorsKeys, 2);
    const combos3 = getCombinations(brandColorsKeys, 3);

    for (const key of Object.keys(brandColors)) {
      const gradientStops: ColorStop[] = [];
      const shades = [300, 500, 700];
      for (const shade of shades) {
        gradientStops.push({
          position: shades.indexOf(shade) / (shades.length - 1),
          color: {
            r: 0,
            g: 0,
            b: 0,
            a: 1,
          },
          boundVariables: {
            color: {
              type: "VARIABLE_ALIAS",
              id: colors.find(
                (c) => c.name === `brand/${key}/${shade}`.toLowerCase(),
              )!.id,
            },
          },
        });
      }
      await styleBuilder.createOrUpdateStyle(
        `gradient/${key.toLowerCase()}`,
        "paint",
        [
          {
            type: "GRADIENT_LINEAR",
            gradientTransform: angleToTransform(45) as Transform,
            gradientStops: gradientStops,
          },
        ] as Paint[],
      );
      logger.success(
        `Dégradé pour la couleur '${key}' généré avec succès.`,
        undefined,
        "GradientsBuilder.generateGradients",
      );
    }

    for (const combo of [...combos2, ...combos3]) {
      if (combo.length === 2) {
        const shades = [600, 400];
        const gradientStops: ColorStop[] = [];
        for (let i = 0; i < shades.length; i++) {
          const id = colors.find(
            (c) => c.name === `brand/${combo[i]}/${shades[i]}`.toLowerCase(),
          )!.id;
          gradientStops.push({
            position: i,
            color: { r: 0, g: 0, b: 0, a: 1 },
            boundVariables: {
              color: {
                type: "VARIABLE_ALIAS",
                id,
              },
            },
          });
        }
        styleBuilder.createOrUpdateStyle(
          `gradient/${combo.map((k) => k.toLowerCase()).join("-")}`,
          "paint",
          [
            {
              type: "GRADIENT_LINEAR",
              gradientTransform: angleToTransform(45) as Transform,
              gradientStops: gradientStops,
            },
          ] as Paint[],
        );
        logger.success(
          `Dégradé pour la combinaison '${combo.join(
            "-",
          )}' généré avec succès.`,
          undefined,
          "GradientsBuilder.generateGradients",
        );
      } else if (combo.length === 3) {
        const gradientStops: ColorStop[] = [];
        // 3 couleurs : 600→500→400
        const keys = combo;
        const values = [600, 500, 400];

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const value = values[i];

          gradientStops.push({
            position: i / (keys.length - 1), // 0, 0.5, 1 pour 3 stops
            color: { r: 0, g: 0, b: 0, a: 1 },
            boundVariables: {
              color: {
                type: "VARIABLE_ALIAS",
                id: colors.find(
                  (c) => c.name === `brand/${key}/${value}`.toLowerCase(),
                )!.id,
              },
            },
          });
        }
        styleBuilder.createOrUpdateStyle(
          `gradient/${combo.map((k) => k.toLowerCase()).join("-")}`,
          "paint",
          [
            {
              type: "GRADIENT_LINEAR",
              gradientTransform: angleToTransform(45) as Transform,
              gradientStops: gradientStops,
            },
          ] as Paint[],
        );
        logger.success(
          `Dégradé pour la combinaison '${combo.join(
            "-",
          )}' généré avec succès.`,
          undefined,
          "GradientsBuilder.generateGradients",
        );
      }
    }
    logger.success(
      "Gradients générés avec succès.",
      undefined,
      "GradientsBuilder.generateGradients",
    );
  },
  "GradientsBuilder.generateGradients",
);
