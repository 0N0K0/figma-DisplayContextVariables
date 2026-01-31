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
import { logger } from "./utils/logger";
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
      if (!colors) {
        figma.notify(`⚠️ Aucune couleur de ${toPascalCase(key)} fournie`, {
          error: true,
        });
        return;
      }
      await generateColorPalette(colors, toPascalCase(key));
      if (key === "brand") await generateGradients(colors);
      figma.notify(
        `✅ Palette de couleurs de ${toPascalCase(key)} générée avec succès`,
      );
    }
  }
  if (
    msg.type === "generateNeutralColors" ||
    msg.type === "generatePalettes" ||
    msg.type === "generateAll"
  ) {
    const greyHue = msg.datas?.neutralColors?.greyHue;
    await generateNeutralPalette(greyHue ?? "");
    figma.notify("✅ Palette de couleurs Neutral générée avec succès");
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
      if (coreThemes && colors && themes && greyHue) {
        await generateColorThemes(
          coreThemes,
          themes,
          toPascalCase(key),
          greyHue,
        );
        await generateColorsThemesCollections(
          coreThemes,
          themes,
          toPascalCase(key),
          colors,
        );
        figma.notify(
          `✅ Thèmes de couleurs de ${toPascalCase(key)} générés avec succès`,
        );
      }
    }
    if (neutralColors) {
      await generateNeutralThemes(neutralColors);
      figma.notify(`✅ Thèmes de couleurs Neutral générés avec succès`);
    }
  }

  if (
    msg.type === "generateGraphicCharterColors" ||
    msg.type === "generateAll"
  ) {
    await generateGraphicCharterColors("Brand");
    await generateGraphicCharterGradients();
    await generateGraphicCharterColors("Feedback");
    await generateGraphicCharterNeutral();
    figma.notify(`✅ Charte graphique couleurs générée avec succès`);
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
      figma.notify("✅ Guide de mise en page généré avec succès");
    }
  }

  if (msg.type === "generateViewportsPages" || msg.type === "generateAll") {
    await generateViewportsPages();
    figma.notify("✅ Pages de présentations générées avec succès");
  }

  if (msg.type === "generateRadius" || msg.type === "generateAll") {
    const radius = msg.datas?.radius;
    if (radius === undefined) {
      figma.notify("⚠️ Aucune donnée de radius fournie", { error: true });
      return;
    } else {
      await generateRadius(radius);
      figma.notify("✅ Radius générés avec succès");
    }
  }

  if (
    msg.type === "generateFontSizes" ||
    msg.type === "generateTypography" ||
    msg.type === "generateAll"
  ) {
    const baseFontSize = msg.datas?.baseFontSize;
    if (baseFontSize === undefined) {
      figma.notify("⚠️ Aucune donnée de tailles de police fournie", {
        error: true,
      });
      return;
    } else {
      await generateFontSizes(baseFontSize);
      figma.notify("✅ Tailles de police générées avec succès");
    }
  }

  if (
    msg.type === "generateFontStyles" ||
    msg.type === "generateTypography" ||
    msg.type === "generateAll"
  ) {
    const fontStyles = msg.datas?.fontStyles;
    const baseFontSize = msg.datas?.baseFontSize;
    const lineGrid = msg.datas?.lineGrid;
    if (fontStyles === undefined) {
      figma.notify("⚠️ Aucune donnée de styles de typographie fournie", {
        error: true,
      });
      return;
    } else {
      await generateTypography(fontStyles);
      await generateTypographyStyles(fontStyles, baseFontSize, lineGrid);
      figma.notify("✅ Styles de typographie générées avec succès");
    }
  }

  if (
    msg.type === "generateGraphicCharterTypography" ||
    msg.type === "generateAll"
  ) {
    await generateGraphicCharterTypography();
    figma.notify(`✅ Charte graphique typographie générée avec succès`);
  }

  if (
    msg.type === "generateTextDatas" ||
    msg.type === "generateDatas" ||
    msg.type === "generateAll"
  ) {
    await logger.info(
      "Received generateTextDatas message:",
      msg.datas?.textDatasList,
    );
    const textDatas = msg.datas?.textDatasList;
    if (textDatas === undefined) {
      figma.notify(
        "⚠️ Aucune donnée de textes fournie, des données par défaut seront utilisées",
      );
      await generateTextDatas();
    } else {
      await generateTextDatas(textDatas);
      figma.notify("✅ Textes générés avec succès");
    }
  }

  if (
    msg.type === "generateImagesDatas" ||
    msg.type === "generateDatas" ||
    msg.type === "generateAll"
  ) {
    const imagesDatas = msg.datas?.imagesDatasList;
    const radiusDatas = msg.datas?.radius;
    const layoutGuide = msg.datas?.layoutGuide;

    if (imagesDatas === undefined) {
      figma.notify("⚠️ Aucune donnée d'images fournie fournie", {
        error: true,
      });
      return;
    } else {
      await generateImagesDatas(imagesDatas, layoutGuide);
      await generateMediaInstance(layoutGuide);
      await generateMedia(radiusDatas, layoutGuide);
      await generateGallery(layoutGuide);
      figma.notify("✅ Images générées avec succès");
    }
  }

  if (msg.type === "generateElevationsEffects" || msg.type === "generateAll") {
    generateElevationEffects();
    figma.notify("✅ Élévations générées avec succès");
  }
};
