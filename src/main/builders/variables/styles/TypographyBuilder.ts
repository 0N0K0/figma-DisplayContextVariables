import { toKebabCase } from "../../../../common/utils/textUtils";
import { COLLECTIONS } from "../../../../common/constants/variablesConstants";
import { VariableConfig } from "../../../types/variablesTypes";
import { variableBuilder } from "../variableBuilder";
import { catchError } from "../../../utils/errorUtils";
import { SCOPES } from "../../../constants/variablesConstants";

function createVariable(
  name: string,
  property: string,
  value: string | number | boolean | RGB | RGBA,
): VariableConfig {
  const scopes: VariableScope[] = [];
  let type: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN" = "STRING";
  if (property === "FontFamily") scopes.push(SCOPES.STRING.FONT_FAMILY);
  if (property === "FontStyle") scopes.push(SCOPES.STRING.FONT_STYLE);
  if (property === "LetterSpacing") {
    type = "FLOAT";
    scopes.push(SCOPES.FLOAT.LETTER_SPACING);
  }
  return {
    name,
    collection: COLLECTIONS.typography.name,
    type,
    value,
    scopes,
  };
}
export const generateTypography = catchError(
  async (
    fontStyles: Record<
      string,
      Record<
        string,
        Record<string, string | number | Record<string, string | number>>
      >
    >,
  ): Promise<Variable[]> => {
    const variables: VariableConfig[] = [];
    const variableNames = new Set<string>();
    for (const [category, types] of Object.entries(fontStyles)) {
      for (const [type, properties] of Object.entries(types)) {
        for (const [property, variable] of Object.entries(properties)) {
          if (typeof variable === "string" || typeof variable === "number") {
            // Ignore empty string or undefined/null
            if (variable === "" || variable === undefined || variable === null)
              continue;
            const varName =
              `${category}/${type}/${toKebabCase(property)}`.toLowerCase();
            if (variableNames.has(varName)) continue;
            variableNames.add(varName);
            variables.push(createVariable(varName, property, variable));
          } else if (typeof variable === "object" && variable !== null) {
            for (const [size, value] of Object.entries(variable)) {
              // Ignore empty string or undefined/null
              if (value === "" || value === undefined || value === null)
                continue;
              const varName =
                `${category}/${type}/${size}/${toKebabCase(property)}`.toLowerCase();
              if (variableNames.has(varName)) continue;
              variableNames.add(varName);
              variables.push(createVariable(varName, property, value));
            }
          }
        }
      }
    }

    return await variableBuilder.createOrUpdateVariables(variables);
  },
  "TypographyBuilder.generateTypography",
);

/**
 * Headings
 *  - Black | letter spacing -5%
 *  - H2-H3 : ExtraLight
 *  - H4-H5 : Light
 *  - H6 : Regular
 * Subtitles : Thin italic
 * Body : Light
 * Accent : Regular
 * Meta : Medium
 * Tech : Regular
 */
