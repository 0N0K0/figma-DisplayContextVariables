/**
 * Utilitaire pour construire des styles Figma
 */

import { TextStyleParams } from "../../types/stylesTypes";
import { logger } from "../../utils/logger";
import { loadFont } from "../../utils/typographyUtils";
import { catchError } from "../../utils/errorUtils";

export class StyleBuilder {
  private className = "StyleBuilder";

  /**
   * Obtient un style par son nom et son type
   */
  getStyle = catchError(
    async (
      name: string,
      type: "effect" | "text" | "paint" | "grid",
    ): Promise<
      PaintStyle | EffectStyle | TextStyle | GridStyle | undefined
    > => {
      let styles: ReadonlyArray<
        PaintStyle | EffectStyle | TextStyle | GridStyle
      >;
      switch (type) {
        case "paint":
          styles = await figma.getLocalPaintStylesAsync();
          break;
        case "effect":
          styles = await figma.getLocalEffectStylesAsync();
          break;
        case "text":
          styles = await figma.getLocalTextStylesAsync();
          break;
        case "grid":
          styles = await figma.getLocalGridStylesAsync();
          break;
      }
      const style = styles.find((s) => s.name === name);
      await logger.info(
        `Style '${name}' de type '${type}' récupéré:`,
        style,
        `${this.className}.getStyle`,
      );
      return style;
    },
    `${this.className}.getStyle`,
    false,
  );

  /**
   * Obtient tous les styles d'un type donné
   */
  getStyles = catchError(
    async (
      type: "effect" | "text" | "paint",
    ): Promise<
      ReadonlyArray<PaintStyle | EffectStyle | TextStyle | GridStyle>
    > => {
      let styles: ReadonlyArray<
        PaintStyle | EffectStyle | TextStyle | GridStyle
      >;
      switch (type) {
        case "paint":
          styles = await figma.getLocalPaintStylesAsync();
          break;
        case "effect":
          styles = await figma.getLocalEffectStylesAsync();
          break;
        case "text":
          styles = await figma.getLocalTextStylesAsync();
          break;
      }
      await logger.info(
        `Styles de type '${type}' récupérés:`,
        styles,
        `${this.className}.getStyles`,
      );
      return styles;
    },
    `${this.className}.getStyles`,
    false,
  );

  /**
   * Crée un style Figma
   */
  private createStyle = catchError(
    async (
      name: string,
      type: "paint" | "text" | "effect",
      params: Paint[] | TextStyleParams | Effect[],
    ): Promise<
      PaintStyle | TextStyle | EffectStyle | GridStyle | undefined
    > => {
      let newStyle;
      switch (type) {
        case "paint":
          newStyle = figma.createPaintStyle();
          break;
        case "effect":
          newStyle = figma.createEffectStyle();
          break;
        case "text":
          newStyle = figma.createTextStyle();
          break;
      }
      newStyle.name = name;
      const newStyleWithValues = await this.setStyleValues(
        newStyle,
        type,
        params,
      );
      return newStyleWithValues;
    },
    `${this.className}.createStyle`,
    false,
  );

  /**
   * Crée ou met à jour un style Figma
   */
  createOrUpdateStyle = catchError(
    async (
      name: string,
      type: "paint" | "text" | "effect",
      params: Paint[] | TextStyleParams | Effect[],
    ): Promise<
      PaintStyle | TextStyle | EffectStyle | GridStyle | undefined
    > => {
      let style = await this.getStyle(name, type);
      if (style) {
        return await this.updateStyle(name, type, params);
      }
      style = await this.createStyle(name, type, params);
      return style;
    },
    `${this.className}.createOrUpdateStyle`,
    false,
  );

  /**
   * Met à jour un style Figma existant
   */
  private updateStyle = catchError(
    async (
      name: string,
      type: "paint" | "text" | "effect",
      params: Paint[] | TextStyleParams | Effect[],
    ): Promise<
      PaintStyle | TextStyle | EffectStyle | GridStyle | undefined
    > => {
      let style = await this.getStyle(name, type);
      if (!style) {
        await logger.warn(
          `Le style '${name}' de type '${type}' n'existe pas.`,
          undefined,
          `${this.className}.updateStyle`,
        );
        return;
      }
      const updatedStyle = await this.setStyleValues(style, type, params);
      return updatedStyle;
    },
    `${this.className}.updateStyle`,
    false,
  );

  /**
   * Définit les valeurs d'un style Figma
   */
  private setStyleValues = catchError(
    async (
      style: PaintStyle | TextStyle | EffectStyle | GridStyle,
      type: "paint" | "text" | "effect",
      params: Paint[] | TextStyleParams | Effect[],
    ): Promise<
      PaintStyle | TextStyle | EffectStyle | GridStyle | undefined
    > => {
      switch (type) {
        case "paint":
          (style as PaintStyle).paints = params as Paint[];
          break;
        case "text":
          const textParams = params as TextStyleParams;
          const fontName = textParams.fontName || {
            family: "Roboto",
            style: "Regular",
          };
          await loadFont(fontName);
          const textStyle = style as TextStyle;
          textStyle.fontName = fontName;
          textStyle.fontSize = textParams.fontSize || 16;
          textStyle.lineHeight = textParams.lineHeight || {
            value: 24,
            unit: "PIXELS",
          };
          textStyle.letterSpacing = textParams.letterSpacing || {
            value: 0,
            unit: "PIXELS",
          };
          textStyle.paragraphSpacing = textParams.paragraphSpacing || 0;
          textStyle.textCase = textParams.textCase || "ORIGINAL";
          textStyle.textDecoration = textParams.textDecoration || "NONE";

          // Bind variables to text style properties if provided
          if (textParams.boundVariables) {
            for (const field of Object.keys(textParams.boundVariables) as Array<
              keyof typeof textParams.boundVariables
            >) {
              const variableAlias = textParams.boundVariables[field];
              // Si ce n'est pas une Variable, mais un alias ou un id, on récupère la Variable
              if (variableAlias) {
                const variable = await figma.variables.getVariableByIdAsync(
                  variableAlias.id,
                );
                if (variable) {
                  textStyle.setBoundVariable(
                    field as VariableBindableTextField,
                    variable,
                  );
                }
              }
            }
          }
          break;
        case "effect":
          (style as EffectStyle).effects = params as Effect[];
          break;
      }
      return style;
    },
    `${this.className}.setStyleValues`,
    false,
  );
}

export const styleBuilder = new StyleBuilder();
