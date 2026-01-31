import { variableBuilder } from "../variables/variableBuilder";
import { catchError } from "../../utils/errorUtils";
import { graphicCharterHelper } from "../../helpers/graphicCharterHelper";
import { pageBuilder } from "./pageBuilder";
import {
  COLOR_KEYWORDS,
  LAYOUT_MODES,
  NODE_META,
  LIGHT_MODE_NAME,
} from "../../constants/graphicCharterConstants";
import { styleBuilder } from "../styles/styleBuilder";
import { elementBuilder } from "../elements/elementBuilder";
import { loadFont } from "../../utils/typographyUtils";
import { COLLECTIONS } from "../../../common/constants/variablesConstants";

const FILE_NAME = "GraphicCharterBuilder";

export const generateGraphicCharterColors = catchError(
  async (category: string): Promise<void> => {
    const themesCollection = await variableBuilder.getCollection(
      COLLECTIONS.themes.name,
    );
    if (!themesCollection) return;
    const themesModes = await variableBuilder.getModesFromCollection(
      COLLECTIONS.themes.name,
    );

    const collectionName =
      COLLECTIONS[category as keyof typeof COLLECTIONS].name;
    const categoryCollection =
      await variableBuilder.getCollection(collectionName);
    if (!categoryCollection) return;
    const categoryModes =
      await variableBuilder.getModesFromCollection(collectionName);
    const categoryColors =
      await variableBuilder.getCollectionVariables(collectionName);
    const coreColors = categoryColors.filter((color) =>
      color.name.toLowerCase().includes(COLOR_KEYWORDS.shade),
    );
    const themeColors = categoryColors
      .filter(
        (color) =>
          !color.name.toLowerCase().includes(COLOR_KEYWORDS.shade) &&
          !color.name.toLowerCase().includes(COLOR_KEYWORDS.opacity),
      )
      .sort((a, b) => a.name.localeCompare(b.name, undefined));

    const paletteFrame = await graphicCharterHelper.generateFrame(
      `${category}\\Palettes`,
      LIGHT_MODE_NAME,
      LAYOUT_MODES.grid,
      {
        y: 0,
        gridColumnCount: categoryModes.length + 1,
        gridRowCount: coreColors.length + 1,
        gridRowSizes: new Array(coreColors.length + 1).fill({
          type: "HUG",
        }),
      },
    );

    for (let i = 0; i < coreColors.length; i++) {
      const color = coreColors[i];
      for (let j = 0; j < categoryModes.length; j++) {
        const mode = categoryModes[j];
        if (i === 0) {
          await graphicCharterHelper.generateText(
            paletteFrame,
            mode.name,
            NODE_META,
            0,
            j + 1,
          );
        }

        await graphicCharterHelper.generateColorFrame(
          color,
          i + 1,
          categoryCollection,
          paletteFrame,
          mode,
          j,
        );
      }
    }

    for (const theme of themesModes) {
      const themeColorFrame = await graphicCharterHelper.generateFrame(
        `${category}\\${theme.name}`,
        theme.name.toLowerCase(),
        LAYOUT_MODES.grid,
        {
          y: 0,
          gridColumnCount: categoryModes.length + 1,
          gridRowCount: themeColors.length + 1,
          gridRowSizes: new Array(themeColors.length + 1).fill({
            type: "HUG",
          }),
        },
      );

      for (let i = 0; i < categoryModes.length; i++) {
        const mode = categoryModes[i];
        await graphicCharterHelper.generateText(
          themeColorFrame,
          mode.name,
          NODE_META,
          0,
          i + 1,
        );

        for (let j = 0; j < themeColors.length; j++) {
          const color = themeColors[j];
          await graphicCharterHelper.generateColorFrame(
            color,
            j + 1,
            categoryCollection,
            themeColorFrame,
            mode,
            i,
            theme,
          );
        }
      }
    }

    pageBuilder.distributePages();
  },
  `${FILE_NAME}.generateGraphicCharterColors`,
);

export const generateGraphicCharterGradients = catchError(async () => {
  const gradientStyles = await styleBuilder.getStyles("paint");
  if (!gradientStyles) return;

  const gradientsFrame = await graphicCharterHelper.generateFrame(
    "Style\\Colors\\Gradients",
    LIGHT_MODE_NAME,
    LAYOUT_MODES.grid,
    {
      y: 0,
      gridColumnCount: 2,
      gridRowCount: gradientStyles.length,
      gridRowSizes: new Array(gradientStyles.length).fill({
        type: "HUG",
      }),
    },
  );

  for (let i = 0; i < gradientStyles.length; i++) {
    const style = gradientStyles[i];
    await graphicCharterHelper.generateText(
      gradientsFrame,
      style.name,
      NODE_META,
      i,
      0,
    );

    await elementBuilder.createElement(
      style.name,
      "FRAME",
      gradientsFrame,
      {
        fillStyleId: style.id,
      },
      { width: 72, height: 72 },
      false,
      {
        row: i,
        column: 1,
      },
    );
  }

  pageBuilder.distributePages();
}, `${FILE_NAME}.generateGraphicCharterGradients`);

export const generateGraphicCharterNeutral = catchError(
  async (): Promise<void> => {
    const themesCollection = await variableBuilder.getCollection(
      COLLECTIONS.themes.name,
    );
    if (!themesCollection) return;
    const themesModes = await variableBuilder.getModesFromCollection(
      COLLECTIONS.themes.name,
    );
    const themeColors = await variableBuilder.getCollectionVariables(
      COLLECTIONS.themes.name,
    );
    const neutralColors = themeColors
      .filter((color) =>
        color.name.toLowerCase().includes(COLOR_KEYWORDS.neutral),
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );

    const themesFrame = await graphicCharterHelper.generateFrame(
      COLOR_KEYWORDS.neutral,
      LIGHT_MODE_NAME,
      LAYOUT_MODES.horizontal,
    );

    for (const theme of themesModes) {
      const themeColorFrame = (await elementBuilder.getOrCreateElement(
        theme.name,
        "FRAME",
        themesFrame,
        {
          fills: [
            {
              type: "SOLID",
              color: {
                r: theme.name === "Light" ? 1 : 0,
                g: theme.name === "Light" ? 1 : 0,
                b: theme.name === "Light" ? 1 : 0,
              },
            },
          ],
          layoutMode: "GRID",
          counterAxisSizingMode: "AUTO",
          gridColumnGap: 16,
          gridRowGap: 24,
          paddingTop: 48,
          paddingBottom: 48,
          paddingLeft: 32,
          paddingRight: 32,
          gridColumnCount: 2,
          gridRowCount: neutralColors.length,
          gridColumnSizes: [{ type: "FLEX" }, { type: "FLEX" }],
          gridRowSizes: new Array(neutralColors.length).fill({ type: "HUG" }),
        },
        { width: 960, height: 1080 },
        false,
        {
          row: 0,
          column: 0,
        },
        { collection: themesCollection, modeId: theme.modeId },
      )) as FrameNode;

      for (let i = 0; i < neutralColors.length; i++) {
        const color = neutralColors[i];
        await graphicCharterHelper.generateColorFrame(
          color,
          i,
          themesCollection,
          themeColorFrame,
          undefined,
          undefined,
          theme,
        );
      }
    }

    pageBuilder.distributePages();
  },
  `${FILE_NAME}.generateGraphicCharterNeutral`,
);

export const generateGraphicCharterTypography = catchError(
  async (): Promise<void> => {
    const textStyles = await styleBuilder.getStyles("text");
    if (!textStyles) return;

    await loadFont({
      family: "Inter",
      style: "Regular",
    });

    const typographyFrame = await graphicCharterHelper.generateFrame(
      COLLECTIONS.typography.name,
      LIGHT_MODE_NAME,
      LAYOUT_MODES.grid,
      {
        y: 0,
        gridColumnCount: 2,
        gridRowCount: textStyles.length,
        gridRowSizes: new Array(textStyles.length).fill({
          type: "HUG",
        }),
        gridColumnSizes: [{ type: "FLEX" }, { type: "HUG" }],
      },
    );

    const uniqueFonts = [
      ...new Set(
        textStyles
          .filter((style): style is TextStyle => "fontName" in style)
          .map((style) => style.fontName),
      ),
    ];
    await Promise.all(uniqueFonts.map((font) => loadFont(font)));

    for (let i = 0; i < textStyles.length; i++) {
      const style = textStyles[i];

      await graphicCharterHelper.generateText(
        typographyFrame,
        style.name,
        NODE_META,
        i,
        0,
      );

      await elementBuilder.createElement(
        style.name,
        "TEXT",
        typographyFrame,
        {
          textStyleId: style.id,
          characters: "The quick brown fox jumps over the lazy dog.",
        },
        undefined,
        false,
        {
          row: i,
          column: 1,
        },
      );
    }

    pageBuilder.distributePages();
  },
  `${FILE_NAME}.generateGraphicCharterTypography`,
);
