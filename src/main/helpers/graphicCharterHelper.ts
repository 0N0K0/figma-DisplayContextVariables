import { formatHex8, formatHsl, formatRgb, Rgb } from "culori";
import { variableBuilder } from "../builders/variables/variableBuilder";
import { catchError } from "../utils/errorUtils";
import { pageBuilder } from "../builders/pages/pageBuilder";
import { elementBuilder } from "../builders/elements/elementBuilder";
import { styleBuilder } from "../builders/styles/styleBuilder";
import { COLLECTIONS } from "../../common/constants/variablesConstants";

class GraphicCharterHelper {
  generateFrame = catchError(
    async (
      name: string,
      theme: string,
      layout: "GRID" | "HORIZONTAL",
      properties?: Partial<FrameNode>,
      mode?: { collection: VariableCollection; modeId: string },
    ): Promise<FrameNode> => {
      const graphicCharterPage =
        await pageBuilder.getOrCreatePage("GRAPHIC CHARTER");
      // Créer une frame pour les couleurs
      const newProperties: Partial<FrameNode> = {
        fills: [
          {
            type: "SOLID",
            color: {
              r: theme === "light" ? 1 : 0,
              g: theme === "light" ? 1 : 0,
              b: theme === "light" ? 1 : 0,
            },
          },
        ],
        layoutMode: layout,
        primaryAxisSizingMode: "FIXED",
        counterAxisSizingMode: "AUTO",
        itemSpacing: 16,
        paddingTop: 48,
        paddingBottom: 48,
        paddingLeft: 32,
        paddingRight: 32,
        x: 0,
      };
      if (layout === "GRID") {
        newProperties.gridColumnGap = 16;
        newProperties.gridRowGap = 24;
        newProperties.paddingTop = 48;
        newProperties.paddingBottom = 48;
        newProperties.paddingLeft = 32;
        newProperties.paddingRight = 32;
      } else {
        newProperties.itemSpacing = 0;
      }
      let frame = (await elementBuilder.getOrCreateElement(
        name,
        "FRAME",
        graphicCharterPage,
        { ...newProperties, ...properties },
        { width: 1920, height: 1080 },
        false,
        undefined,
        mode,
      )) as FrameNode;
      return frame;
    },
    `${this.constructor.name}.generateFrame`,
    false,
  );

  generateColorFrame = catchError(
    async (
      color: Variable,
      colorIndex: number,
      collection: VariableCollection,
      parent: FrameNode,
      mode?: {
        modeId: string;
        name: string;
      },
      modeIndex?: number,
      themeMode?: {
        modeId: string;
        name: string;
      },
    ): Promise<void> => {
      // Générer title
      await this.generateText(parent, color.name, "meta", colorIndex, 0);

      let colorTargetValue: VariableValue | undefined = mode
        ? await variableBuilder.getVariableValueForMode(
            color,
            mode.name,
            collection.name,
          )
        : await variableBuilder.getVariableValueForMode(color);
      let maxDepth = 10;
      while (
        colorTargetValue &&
        typeof colorTargetValue === "object" &&
        "type" in colorTargetValue &&
        maxDepth-- > 0
      ) {
        const alias = await figma.variables.getVariableByIdAsync(
          colorTargetValue.id,
        );
        if (!alias) break;
        const firstAliasMode = await variableBuilder.getFirstMode(alias);
        const possiblesModes = themeMode
          ? [themeMode.modeId, firstAliasMode]
          : [firstAliasMode];
        for (const possibleMode of possiblesModes) {
          const value = alias.valuesByMode[possibleMode];
          if (value) {
            colorTargetValue = value;
            break;
          }
        }
      }
      if (
        typeof colorTargetValue === "object" &&
        colorTargetValue !== null &&
        "a" in colorTargetValue
      ) {
        const RGB: Rgb = {
          mode: "rgb",
          r: colorTargetValue.r,
          g: colorTargetValue.g,
          b: colorTargetValue.b,
          alpha: colorTargetValue.a,
        };

        const colorValuesFrame = (await elementBuilder.getOrCreateElement(
          `${color.name}-values`,
          "FRAME",
          parent,
          {
            fills: [],
            layoutMode: "VERTICAL",
            primaryAxisSizingMode: "AUTO",
            counterAxisSizingMode: "AUTO",
            itemSpacing: 0,
          },
          undefined,
          false,
          { row: colorIndex, column: modeIndex ? modeIndex + 1 : 1 },
        )) as FrameNode;

        const colorFrame = (await elementBuilder.getOrCreateElement(
          color.name,
          "FRAME",
          colorValuesFrame,
          {
            fills: [],
            layoutMode: "HORIZONTAL",
            primaryAxisSizingMode: "AUTO",
            counterAxisSizingMode: "AUTO",
            itemSpacing: 8,
          },
        )) as FrameNode;

        const rect = figma.createRectangle();
        rect.resize(72, 72);
        Object.assign(rect, {
          name: "Color Preview",
          fills: [
            {
              type: "SOLID",
              color: {
                r: colorTargetValue.r,
                g: colorTargetValue.g,
                b: colorTargetValue.b,
              },
              opacity: colorTargetValue.a,
              boundVariables: {
                color: {
                  id: color.id,
                  type: "VARIABLE_ALIAS",
                },
              },
            },
          ],
          cornerRadius: 4,
        });
        if (mode) {
          rect.setExplicitVariableModeForCollection(collection, mode.modeId);
        }
        colorFrame.appendChild(rect);

        await this.generateText(colorValuesFrame, formatHex8(RGB), "body");
        await this.generateText(colorValuesFrame, formatRgb(RGB), "body");
        await this.generateText(colorValuesFrame, formatHsl(RGB), "body");
      }
    },
    `${this.constructor.name}.generateColorFrame`,
    false,
  );

  generateText = catchError(
    async (
      parent: FrameNode,
      name: string,
      typography: "meta" | "body",
      rowIndex?: number,
      colIndex?: number,
    ) => {
      const textColor = await variableBuilder.findVariable(
        COLLECTIONS.themes.name,
        "neutral/text/core/secondary",
      );
      const textStyle = (await styleBuilder.getStyle(
        typography === "meta" ? "interface/meta/sm" : "core/body/sm",
        "text",
      )) as TextStyle | undefined;
      if (!textStyle) return;
      await elementBuilder.getOrCreateElement(
        name,
        "TEXT",
        parent,
        {
          characters: name,
          textStyleId: textStyle ? textStyle.id : "",
          fills: textColor
            ? [
                {
                  type: "SOLID",
                  color: { r: 0, g: 0, b: 0 },
                  boundVariables: {
                    color: {
                      id: textColor.id,
                      type: "VARIABLE_ALIAS",
                    },
                  },
                },
              ]
            : [],
        },
        undefined,
        false,
        rowIndex !== undefined && colIndex !== undefined
          ? { row: rowIndex, column: colIndex }
          : undefined,
        undefined,
        textStyle.fontName as FontName,
      );
    },
    `${this.constructor.name}.generateText`,
    false,
  );
}

export const graphicCharterHelper = new GraphicCharterHelper();
