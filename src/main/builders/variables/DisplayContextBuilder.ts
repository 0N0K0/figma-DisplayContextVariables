import { COLLECTIONS } from "../../../common/constants/variablesConstants";
import { COLUMNS, ORIENTATIONS, RATIOS } from "../../constants/systemConstants";
import {
  DensitiesConfig,
  DensitiesMode,
  VariableConfig,
} from "../../types/variablesTypes";
import { variableBuilder } from "./variableBuilder";
import { layoutGuide } from "../../../common/types";
import { breakpointsConfig } from "../../utils/systemUtils";
import { catchError } from "../../utils/errorUtils";
import { SCOPES } from "../../constants/variablesConstants";

const FILE_NAME = "DisplayContextBuilder";

export const generateBreakpoints = catchError(
  async ({
    minColumnWidth,
    gutter,
    horizontalBodyPadding,
    minViewportHeight,
    horizontalMainPadding,
  }: layoutGuide): Promise<Variable[]> => {
    const newVariables: Variable[] = [];

    const breackpointsVariables: VariableConfig[] = [];

    const modesConfig = breakpointsConfig(
      minColumnWidth,
      gutter,
      horizontalBodyPadding,
      minViewportHeight,
      horizontalMainPadding,
    );
    for (const [modeName, mode] of Object.entries(modesConfig)) {
      for (const [sizeType, value] of Object.entries(mode.viewportWidth)) {
        // Viewport Width
        breackpointsVariables.push({
          name: `viewport/width/${sizeType}`,
          collection: COLLECTIONS.breakpoints.name,
          type: "FLOAT",
          mode: modeName,
          value,
          hidden: true,
          scopes: [SCOPES.FLOAT.WIDTH_HEIGHT],
        });
      }

      // Viewport Height
      for (const [orientation, ratios] of Object.entries(mode.viewportHeight)) {
        for (const [ratio, dimensions] of Object.entries(ratios)) {
          for (const [sizeType, value] of Object.entries(dimensions)) {
            breackpointsVariables.push({
              name: `viewport/height/${orientation}/${ratio}/${sizeType}`,
              collection: COLLECTIONS.breakpoints.name,
              type: "FLOAT",
              mode: modeName,
              value,
              hidden: true,
            });
          }
        }
      }

      // Content Width
      for (const [type, dimensions] of Object.entries(mode.contentWidth)) {
        for (const [dimension, values] of Object.entries(dimensions)) {
          for (const [sizeType, value] of Object.entries(values)) {
            breackpointsVariables.push({
              name: `content-width/${type}/${dimension}/${sizeType}`,
              collection: COLLECTIONS.breakpoints.name,
              type: "FLOAT",
              mode: modeName,
              value,
              hidden: true,
              scopes: [SCOPES.FLOAT.WIDTH_HEIGHT],
            });
          }
        }
      }
    }

    newVariables.push(
      ...(await variableBuilder.createOrUpdateVariables(breackpointsVariables)),
    );

    /**
     * Génération des Ratios
     */

    const ratiosVariables: VariableConfig[] = [];

    for (const ratio of RATIOS) {
      for (const orientation of ORIENTATIONS) {
        for (const type of ["min", "max"]) {
          const targetVariable = await variableBuilder.findVariable(
            COLLECTIONS.breakpoints.name,
            `viewport/height/${orientation}/${ratio}/${type}`,
          );
          let alias: string | undefined = undefined;
          if (targetVariable) {
            alias = targetVariable.id;
          }
          ratiosVariables.push({
            name: `${orientation}/viewport-height/${type}`,
            collection: COLLECTIONS.ratios.name,
            type: "FLOAT",
            mode: ratio,
            alias,
            value: alias ? undefined : 0,
            hidden: true,
          });
        }
      }
    }

    newVariables.push(
      ...(await variableBuilder.createOrUpdateVariables(ratiosVariables)),
    );

    /**
     * Génération des Orientations
     */

    for (const orientation of ORIENTATIONS) {
      for (const type of ["min", "max"]) {
        const targetVariable = await variableBuilder.findVariable(
          COLLECTIONS.ratios.name,
          `${orientation}/viewport-height/${type}`,
        );
        let alias: string | undefined = undefined;
        if (targetVariable) {
          alias = targetVariable.id;
        }
        ratiosVariables.push({
          name: `viewport-height/${type}`,
          type: "FLOAT",
          collection: COLLECTIONS.orientations.name,
          mode: orientation,
          scopes: [SCOPES.FLOAT.WIDTH_HEIGHT],
          alias,
          value: alias ? undefined : 0,
        });
      }
    }

    newVariables.push(
      ...(await variableBuilder.createOrUpdateVariables(ratiosVariables)),
    );

    return newVariables;
  },
  `${FILE_NAME}.generateBreakpoints`,
);

export const generateDensities = catchError(
  async ({ baselineGrid }: layoutGuide): Promise<Variable[]> => {
    const modes: DensitiesMode[] = ["tight", "compact", "loose"];

    // Échelle d'espacement (multiplicateurs de BASELINE_GRID)
    const baseSpacing: Record<string, number> = {
      "1:4": 1 / 4,
      "1:3": 1 / 3,
      "1:2": 1 / 2,
      "1": 1,
      "2": 2,
      "3": 3,
      "4": 4,
      "5": 5,
      "6": 6,
      "7": 7,
      "8": 8,
    };

    const config: DensitiesConfig = {
      tight: {
        minHeight: baselineGrid * 13,
        maxSpacing: 4,
        positionSticky: false,
      },
      compact: {
        minHeight: baselineGrid * 23,
        maxSpacing: 6,
        positionSticky: true,
      },
      loose: {
        minHeight: baselineGrid * 33,
        spacing: baseSpacing,
        positionSticky: true,
      },
    };

    const variables: VariableConfig[] = [];
    const newVariables: Variable[] = [];

    for (const [index, [mode, values]] of Object.entries(config).entries()) {
      // Min Height
      variables.push({
        name: `viewport-height/min`,
        type: "FLOAT",
        collection: COLLECTIONS.verticalDensities.name,
        mode,
        value: values.minHeight,
        scopes: [SCOPES.FLOAT.WIDTH_HEIGHT],
      });

      // Max Height
      const nextMode = modes[index + 1] as DensitiesMode | undefined;
      let maxHeight: number = 9999;
      if (nextMode) {
        maxHeight = config[nextMode].minHeight - 1;
      }
      variables.push({
        name: `viewport-height/max`,
        type: "FLOAT",
        collection: COLLECTIONS.verticalDensities.name,
        mode,
        value: maxHeight,
        scopes: [SCOPES.FLOAT.WIDTH_HEIGHT],
      });

      // Spacing
      for (const [key, multiplier] of Object.entries(baseSpacing)) {
        const shouldAlias =
          "maxSpacing" in values && multiplier > values.maxSpacing;

        let alias: string | undefined = undefined;
        if (shouldAlias) {
          const targetVariable = await variableBuilder.findVariable(
            COLLECTIONS.verticalDensities.name,
            `spacing/${values.maxSpacing}`,
          );
          alias = targetVariable ? targetVariable.id : undefined;
        }
        newVariables.push(
          await variableBuilder.createOrUpdateVariable({
            name: `spacing/${key}`,
            type: "FLOAT",
            collection: COLLECTIONS.verticalDensities.name,
            mode,
            alias,
            value: alias ? undefined : baselineGrid * multiplier,
            scopes: [SCOPES.FLOAT.GAP, SCOPES.FLOAT.PARAGRAPH_SPACING],
          }),
        );
      }

      // Position Sticky
      variables.push({
        name: `position-sticky`,
        type: "BOOLEAN",
        collection: COLLECTIONS.verticalDensities.name,
        mode,
        value: values.positionSticky,
      });
    }

    newVariables.push(
      ...(await variableBuilder.createOrUpdateVariables(variables)),
    );

    return newVariables;
  },
  `${FILE_NAME}.generateDensities`,
);

export const generateFontSizes = catchError(
  async (
    baseFontSize: number = 16,
    baselineGrid: number = 24,
  ): Promise<Variable[]> => {
    const newVariables: Variable[] = [];

    const typographyScales = {
      body: { lg: 2, md: 1.25, sm: 1, xs: 0.75 },
      heading: { "2xl": 5, xl: 4, lg: 3, md: 2.5, sm: 2, xs: 1.5 },
    };

    // Génération des valeurs de typographie avec lineHeight calculée (arrondie au multiple de BASELINE_GRID supérieur)
    const baseTypography: Record<string, Record<string, [number, number]>> = {};
    for (const [category, sizes] of Object.entries(typographyScales)) {
      baseTypography[category] = {};
      for (const [size, fontScale] of Object.entries(sizes)) {
        const fontSize = baseFontSize * fontScale;
        const lineHeight = Math.ceil(fontSize / baselineGrid) * baselineGrid;
        baseTypography[category][size] = [fontSize, lineHeight];
      }
    }

    const config = {
      loose: "",
      compact: "md",
      tight: "sm",
    };

    for (const [mode, maxTypography] of Object.entries(config)) {
      const sizeOrder = ["xl", "lg", "md", "sm", "xs"];

      const maxTypoIndex = maxTypography
        ? sizeOrder.indexOf(maxTypography)
        : -1;

      for (const [category, sizes] of Object.entries(baseTypography)) {
        for (const [size, [fontSize, lineHeight]] of Object.entries(sizes)) {
          const currentIndex = sizeOrder.indexOf(size);
          const shouldAlias = maxTypoIndex >= 0 && currentIndex < maxTypoIndex;

          if (shouldAlias && maxTypography) {
            const targetVariablesGroup = `typography/${category}/${maxTypography}/`;
            const targetVariablesTypes = [`font-size`, `line-height`];
            const aliases: Record<string, Variable | undefined> = {};
            for (const targetVariableType of targetVariablesTypes) {
              const alias = await variableBuilder.findVariable(
                COLLECTIONS.verticalDensities.name,
                `${targetVariablesGroup}${targetVariableType}`,
              );
              aliases[targetVariableType] = alias;
            }
            for (const [type, alias] of Object.entries(aliases)) {
              const newVariable: VariableConfig = {
                name: `typography/${category}/${size}/${type}`,
                collection: COLLECTIONS.verticalDensities.name,
                mode,
                type: "FLOAT",
                value: alias ? undefined : 0,
                alias: alias?.id,
                scopes:
                  type === "font-size"
                    ? [SCOPES.FLOAT.FONT_SIZE]
                    : [SCOPES.FLOAT.LINE_HEIGHT],
              };
              newVariables.push(
                await variableBuilder.createOrUpdateVariable(newVariable),
              );
            }
          } else {
            const fontSizeVariable: VariableConfig = {
              name: `typography/${category}/${size}/font-size`,
              collection: COLLECTIONS.verticalDensities.name,
              mode,
              type: "FLOAT",
              value: fontSize,
              scopes: [SCOPES.FLOAT.FONT_SIZE],
            };
            const lineHeightVariable: VariableConfig = {
              name: `typography/${category}/${size}/line-height`,
              collection: COLLECTIONS.verticalDensities.name,
              mode,
              type: "FLOAT",
              value: lineHeight,
              scopes: [SCOPES.FLOAT.LINE_HEIGHT],
            };
            newVariables.push(
              ...(await variableBuilder.createOrUpdateVariables([
                fontSizeVariable,
                lineHeightVariable,
              ])),
            );
          }
        }
      }
    }

    return newVariables;
  },
  `${FILE_NAME}.generateFontSizes`,
);

export const generateContentHeights = catchError(
  async ({
    baselineGrid,
    maxContentHeight,
  }: layoutGuide): Promise<Variable[]> => {
    const variables: VariableConfig[] = [];

    for (let i = baselineGrid; i <= maxContentHeight; i += baselineGrid) {
      const index = i / baselineGrid;
      variables.push({
        name: String(index),
        collection: COLLECTIONS.contentHeight.name,
        type: "FLOAT",
        value: i,
        scopes: [SCOPES.FLOAT.WIDTH_HEIGHT],
      });
    }

    return await variableBuilder.createOrUpdateVariables(variables);
  },
  `${FILE_NAME}.generateContentHeights`,
);

export const generateDevices = catchError(
  async ({
    gutter,
    horizontalBodyPadding,
    horizontalMainPadding,
    baselineGrid,
    offsetHeight,
  }: layoutGuide): Promise<Variable[]> => {
    const variables: VariableConfig[] = [];

    const config: Record<
      string,
      Record<string, number | Record<string, number>>
    > = {
      desktop: {
        landscape: {
          xl: 1536,
          lg: 1280,
        },
        ratio: 16 / 10,
      },
      tablet: {
        portrait: {
          md: 720,
          sm: 640,
        },
        landscape: {
          md: 1024,
        },
        ratio: 16 / 10,
      },
      mobile: {
        portrait: {
          xs: 432,
        },
        landscape: {
          md: 960,
        },
        ratio: 20 / 9,
      },
    };

    for (const [device, modes] of Object.entries(config)) {
      for (const [mode, values] of Object.entries(modes)) {
        if (mode === "ratio") continue;
        const heights: Record<string, number> = {};
        for (const [size, value] of Object.entries(
          values as Record<string, number>,
        )) {
          heights[mode] =
            mode === "landscape"
              ? value / (modes["ratio"] as number)
              : value * (modes["ratio"] as number);
          variables.push({
            name: `viewport/width`,
            mode: `${device}/${mode}/${size}`,
            collection: COLLECTIONS.devices.name,
            type: "FLOAT",
            value,
            scopes: [SCOPES.FLOAT.WIDTH_HEIGHT],
          });
          variables.push({
            name: `viewport/height`,
            mode: `${device}/${mode}/${size}`,
            collection: COLLECTIONS.devices.name,
            type: "FLOAT",
            value: heights[mode],
            scopes: [SCOPES.FLOAT.WIDTH_HEIGHT],
          });

          const columns = COLUMNS[size as keyof typeof COLUMNS];
          const columnWidth =
            Math.floor(
              value -
                horizontalBodyPadding * 2 -
                horizontalMainPadding * 2 -
                gutter * (columns - 1),
            ) / columns;

          // Largeurs du contenu pour chaque nombre de colonnes
          for (let i = 1; i <= 12; i++) {
            let width: number;
            if (i > columns) {
              width =
                value - horizontalBodyPadding * 2 - horizontalMainPadding * 2;
            } else {
              width = columnWidth * i + gutter * (i - 1);
            }

            variables.push({
              name: `content/width/columns/${i}`,
              mode: `${device}/${mode}/${size}`,
              collection: COLLECTIONS.devices.name,
              type: "FLOAT",
              value: Math.min(
                width,
                value - horizontalBodyPadding * 2 - horizontalMainPadding * 2,
              ),
              scopes: [SCOPES.FLOAT.WIDTH_HEIGHT],
            });
          }

          // Largeurs du contenu pour chaque division
          const divisions = [4, 3, 2, 1];
          divisions.forEach((division) => {
            let width: number;
            if (columns % division === 0) {
              width =
                (columnWidth * columns) / division +
                gutter * (columns / division - 1);
            } else {
              const validDivision = divisions
                .slice(divisions.indexOf(division) + 1)
                .find((d) => columns % d === 0)!;
              width =
                (columnWidth * columns) / validDivision +
                gutter * (columns / validDivision - 1);
            }
            variables.push({
              name: `content/widths/divisions/1:${division}`,
              mode: `${device}/${mode}/${size}`,
              collection: COLLECTIONS.devices.name,
              type: "FLOAT",
              value: Math.min(
                width,
                value - horizontalBodyPadding * 2 - horizontalMainPadding * 2,
              ),
            });
          });

          // Hauteurs du contenu dynamiques
          const pourcentages = [100, 75, 50];
          pourcentages.forEach((pourcentage) => {
            const fullHeight = Math.round((heights[mode] * pourcentage) / 100);
            variables.push({
              name: `content/height/full/${pourcentage}%`,
              mode: `${device}/${mode}/${size}`,
              collection: COLLECTIONS.devices.name,
              type: "FLOAT",
              value: fullHeight,
            });

            const minusOffsetHeight = Math.round(
              ((heights[mode] - offsetHeight - baselineGrid * 2) *
                pourcentage) /
                100,
            );
            variables.push({
              name: `content/height/minus-offset/${pourcentage}%`,
              mode: `${device}/${mode}/${size}`,
              collection: COLLECTIONS.devices.name,
              type: "FLOAT",
              value: minusOffsetHeight,
            });
          });
        }
      }
    }

    // À implémenter
    return await variableBuilder.createOrUpdateVariables(variables);
  },
  `${FILE_NAME}.generateDevices`,
);
