/**
 * Point d'entrée principal du plugin Figma
 */

import { toPascalCase } from "../common/utils/textUtils";
import { generateElevationEffects } from "./builders/styles/DropshadowsBuilder";
import {
  generateColorPalette,
  generateNeutralPalette,
} from "./builders/variables/styles/colors/PalettesBuilder";
import {
  generateColorsThemesCollections,
  generateColorThemes,
  generateNeutralThemes,
} from "./builders/variables/styles/colors/ThemesBuilder";
import { generateRadius } from "./builders/variables/styles/RadiusBuilder";
import {
  generateBreakpoints,
  generateContentHeights,
  generateDensities,
  generateDevices,
  generateFontSizes,
} from "./builders/variables/DisplayContextBuilder";
import { generateTypography } from "./builders/variables/styles/TypographyBuilder";
import { generateTextDatas } from "./builders/variables/TextDatasBuilder";
import {
  generateGallery,
  generateImagesDatas,
  generateMedia,
  generateMediaInstance,
} from "./builders/components/ImagesBuilder";
import { generateGradients } from "./builders/styles/GradientsBuilder";
import { generateTypographyStyles } from "./builders/styles/TypographyBuilder";
import { generateViewportsPages } from "./builders/pages/ViewportsBuilder";
import {
  generateGraphicCharterColors,
  generateGraphicCharterGradients,
  generateGraphicCharterNeutral,
  generateGraphicCharterTypography,
} from "./builders/pages/GraphicCharterBuilder";

figma.showUI(__html__, {
  width: 304,
  height: 99999,
  title: "Design System Processor",
  themeColors: true,
});

/**
 * Gère les messages provenant de l'UI
 */
figma.ui.onmessage = async (msg) => {
  const colorFamilies = ["brand", "feedback"];

  for (const key of colorFamilies) {
    if (
      msg.type === `generate${toPascalCase(key)}Colors` ||
      msg.type === "generatePalettes" ||
      msg.type === "generateAll"
    ) {
      const colors = msg.datas?.colorsData?.[key];
      await generateColorPalette(colors, toPascalCase(key));
      if (key === "brand") await generateGradients(colors);
    }
  }
  if (
    msg.type === "generateNeutralColors" ||
    msg.type === "generatePalettes" ||
    msg.type === "generateAll"
  ) {
    const greyHue = msg.datas?.neutralColors?.greyHue;
    await generateNeutralPalette(greyHue ?? "");
  }

  if (
    msg.type === "generateThemes" ||
    msg.type === "generatePalettes" ||
    msg.type === "generateAll"
  ) {
    const themes = msg.datas?.themes;
    const neutralColors = msg.datas?.neutralColors;
    const greyHue = neutralColors?.greyHue;
    for (const key of colorFamilies) {
      const coreThemes = msg.datas?.[`${key}CoreThemes`];
      const colors = msg.datas?.colorsData?.[key];
      await generateColorThemes(coreThemes, themes, toPascalCase(key), greyHue);
      await generateColorsThemesCollections(coreThemes, themes, key, colors);
    }
    await generateNeutralThemes(neutralColors);
  }

  if (
    msg.type === "generateGraphicCharterColors" ||
    msg.type === "generateAll"
  ) {
    await generateGraphicCharterColors("brand");
    await generateGraphicCharterGradients();
    await generateGraphicCharterColors("feedback");
    await generateGraphicCharterNeutral();
  }

  if (msg.type === "generateLayoutGuide" || msg.type === "generateAll") {
    const layoutGuide = msg.datas?.layoutGuide;
    if (layoutGuide === undefined) {
      figma.notify("⚠️ Aucune donnée de guide de mise en page fournie", {
        error: true,
      });
      return;
    } else {
      await generateBreakpoints(layoutGuide);
      await generateDensities(layoutGuide);
      await generateContentHeights(layoutGuide);
      await generateDevices(layoutGuide);
    }
  }

  if (msg.type === "generateViewportsPages" || msg.type === "generateAll") {
    await generateViewportsPages();
  }

  if (msg.type === "generateRadius" || msg.type === "generateAll") {
    const radius = msg.datas?.radius;
    await generateRadius(radius);
  }

  if (
    msg.type === "generateFontSizes" ||
    msg.type === "generateTypography" ||
    msg.type === "generateAll"
  ) {
    const baseFontSize = msg.datas?.baseFontSize;
    await generateFontSizes(baseFontSize);
  }

  if (
    msg.type === "generateFontStyles" ||
    msg.type === "generateTypography" ||
    msg.type === "generateAll"
  ) {
    const fontStyles = msg.datas?.fontStyles;
    const baseFontSize = msg.datas?.baseFontSize;
    const lineGrid = msg.datas?.lineGrid;
    await generateTypography(fontStyles);
    await generateTypographyStyles(fontStyles, baseFontSize, lineGrid);
  }

  if (
    msg.type === "generateGraphicCharterTypography" ||
    msg.type === "generateAll"
  ) {
    await generateGraphicCharterTypography();
  }

  if (
    msg.type === "generateTextDatas" ||
    msg.type === "generateDatas" ||
    msg.type === "generateAll"
  ) {
    const textDatas = msg.datas?.textDatasList;
    await generateTextDatas(textDatas);
  }

  if (
    msg.type === "generateImagesDatas" ||
    msg.type === "generateDatas" ||
    msg.type === "generateAll"
  ) {
    const imagesDatas = msg.datas?.imagesDatasList;
    const radiusDatas = msg.datas?.radius;
    const layoutGuide = msg.datas?.layoutGuide;
    await generateImagesDatas(imagesDatas, layoutGuide);
    await generateMediaInstance(layoutGuide);
    await generateMedia(radiusDatas, layoutGuide);
    await generateGallery(layoutGuide);
  }

  if (msg.type === "generateElevationsEffects" || msg.type === "generateAll") {
    generateElevationEffects();
  }
};
