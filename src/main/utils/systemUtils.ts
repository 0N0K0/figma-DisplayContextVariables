import { COLUMNS, ORIENTATIONS, RATIOS } from "../constants/systemConstants";
import {
  COLLECTIONS,
  SHADES,
  THEMES_COLORS,
} from "../../common/constants/variablesConstants";
import { BreakpointsConfig } from "../types/variablesTypes";
import { catchErrorSync } from "./errorUtils";

export const collectionsConfig = catchErrorSync(
  (colorsFamilies: Record<string, string[]>) => {
    for (const [colorFamily, colorRoles] of Object.entries(colorsFamilies)) {
      for (const colorRole of colorRoles) {
        COLLECTIONS.palette.variables[
          colorFamily as keyof typeof COLLECTIONS.palette.variables
        ][colorRole] = SHADES;
        COLLECTIONS.themes.variables[
          colorFamily as keyof typeof COLLECTIONS.themes.variables
        ][colorRole] = THEMES_COLORS[colorRole as keyof typeof THEMES_COLORS];
        COLLECTIONS[colorFamily].modes?.push(colorRole);
      }
    }
  },
  "systemUtils.collectionsConfig",
  false,
);
export const breakpointsConfig = catchErrorSync(
  (
    minColumnWidth: number,
    gutter: number,
    horizontalBodyPadding: number,
    minViewportHeight: number,
    horizontalMainPadding: number,
  ): BreakpointsConfig => {
    const breakpoints: BreakpointsConfig = {};

    for (const [key, value] of Object.entries(COLUMNS)) {
      breakpoints[key as keyof typeof COLUMNS] = {
        columns: value,
        viewportWidth: {
          min: 0,
          max: 0,
        },
        viewportHeight: {},
        contentWidth: {
          divisions: {},
          columns: {},
        },
      };
      if (key === "xxl") {
        breakpoints[key as keyof typeof COLUMNS].viewportWidth.min = 1920;
        breakpoints[key as keyof typeof COLUMNS].viewportWidth.max = 9999;
      }
    }

    /***
     * Calcul des minviewportWidth
     */
    for (const [key, value] of Object.entries(breakpoints)) {
      if (key === "xxl") continue;
      breakpoints[key as keyof typeof breakpoints].viewportWidth.min =
        minColumnWidth * value.columns +
        gutter * (value.columns - 1) +
        horizontalBodyPadding * 2 +
        horizontalMainPadding * 2;
    }

    /***
     * Calcul des maxviewportWidth
     */
    for (const key of Object.keys(breakpoints)) {
      if (key === "xxl") continue;
      const nextKey =
        Object.keys(breakpoints)[Object.keys(breakpoints).indexOf(key) + 1];
      breakpoints[key as keyof typeof breakpoints].viewportWidth!.max =
        breakpoints[nextKey as keyof typeof breakpoints].viewportWidth.min - 1;
    }

    /***
     * Calcul des viewportHeight
     */
    for (const [key, value] of Object.entries(breakpoints)) {
      const viewportHeight: Record<
        string,
        Record<string, Record<string, number>>
      > = {};
      ORIENTATIONS.forEach((orientation) => {
        viewportHeight[orientation] = {};
        RATIOS.forEach((ratio) => {
          viewportHeight[orientation][ratio] = {};
          const [widthRatio, heightRatio] = ratio.split(":").map(Number);
          const calculatedRatio = heightRatio / widthRatio;
          let minHeight: number;
          let maxHeight: number;
          if (orientation === "portrait") {
            minHeight = Math.round(value.viewportWidth.min * calculatedRatio);
            maxHeight = Math.round(value.viewportWidth.max * calculatedRatio);
          } else {
            minHeight = Math.round(value.viewportWidth.min / calculatedRatio);
            maxHeight = Math.round(value.viewportWidth.max / calculatedRatio);
          }
          minHeight = Math.max(minHeight, minViewportHeight);
          maxHeight = Math.max(maxHeight, minViewportHeight);

          viewportHeight[orientation][ratio]["min"] = minHeight;
          viewportHeight[orientation][ratio]["max"] = Math.round(maxHeight);
        });
      });
      breakpoints[key as keyof typeof breakpoints]["viewportHeight"] =
        viewportHeight;
    }

    /***
     * Calcul des maxColumnWidth
     */
    const maxColumnWidth: Record<string, number> = {};
    for (const [key, mode] of Object.entries(breakpoints)) {
      maxColumnWidth[key] =
        (mode.viewportWidth.max -
          horizontalBodyPadding * 2 -
          horizontalMainPadding * 2 -
          gutter * (mode.columns - 1)) /
        mode.columns;
    }

    /***
     * Calcul des contentWidth
     */
    for (const [key, mode] of Object.entries(breakpoints)) {
      const contentWidth: Record<string, any> = {
        columns: {},
        divisions: {},
      };

      // Largeurs pour chaque nombre de colonnes
      for (let i = 1; i <= 12; i++) {
        const maxContentWidth =
          1920 - horizontalBodyPadding * 2 - horizontalMainPadding * 2;

        let minWidth: number;
        if (i > mode.columns) {
          minWidth =
            mode.viewportWidth.max -
            horizontalBodyPadding * 2 -
            horizontalMainPadding * 2;
        } else {
          minWidth = minColumnWidth * i + gutter * (i - 1);
        }

        let maxWidth: number;
        if (i >= mode.columns) {
          maxWidth =
            mode.viewportWidth.max -
            horizontalBodyPadding * 2 -
            horizontalMainPadding * 2;
        } else {
          maxWidth = maxColumnWidth[key] * i + gutter * (i - 1);
        }
        contentWidth["columns"][i] = {
          min: Math.round(Math.min(minWidth, maxContentWidth)),
          max: Math.round(Math.min(maxWidth, maxContentWidth)),
        };
      }

      // Largeurs pour chaque division des colonnes
      const divisions = [4, 3, 2, 1];
      divisions.forEach((division) => {
        let minWidth: number;
        let maxWidth: number;
        if (mode.columns % division === 0) {
          minWidth =
            (minColumnWidth * mode.columns) / division +
            gutter * (mode.columns / division - 1);
          maxWidth =
            (maxColumnWidth[key] * mode.columns) / division +
            gutter * (mode.columns / division - 1);
        } else {
          const validDivision = divisions
            .slice(divisions.indexOf(division) + 1)
            .find((d) => mode.columns % d === 0)!;
          minWidth =
            (minColumnWidth * mode.columns) / validDivision +
            gutter * (mode.columns / validDivision - 1);
          maxWidth =
            (maxColumnWidth[key] * mode.columns) / validDivision +
            gutter * (mode.columns / validDivision - 1);
        }
        contentWidth["divisions"][`1:${division}`] = {
          min: Math.round(minWidth),
          max: Math.round(maxWidth),
        };
      });
      breakpoints[key as keyof typeof breakpoints]["contentWidth"] =
        contentWidth;
    }

    return breakpoints;
  },
  "displayContextUtils.breakpointsConfig",
  false,
);
