import { VariableConfig } from "../../types/variablesTypes";
import { variableBuilder } from "./variableBuilder";
import datas from "../../assets/datas.json";
import { flatten } from "../../utils/dataUtils";
import { logger } from "../../utils/logger";
import { catchError } from "../../utils/errorUtils";
import { SCOPES } from "../../constants/variablesConstants";

export const generateTextDatas = catchError(
  async (textDatas?: Record<string, string>[]): Promise<Variable[]> => {
    let merged: Record<string, string> = {};
    if (!textDatas || textDatas.length === 0) {
      merged = flatten(datas);
    } else {
      for (const obj of textDatas) {
        flatten(obj, "", merged);
      }
    }

    const variables: VariableConfig[] = [];

    for (const [name, value] of Object.entries(merged)) {
      variables.push({
        name: name.toLowerCase(),
        collection: "Datas",
        type: "STRING",
        value: value,
        scopes: [SCOPES.STRING.TEXT_CONTENT],
      });
    }

    const newVariables =
      await variableBuilder.createOrUpdateVariables(variables);

    await logger.success(
      `[generateTextDatas] ${newVariables.length} variables de données créées ou mises à jour avec succès.`,
    );
    return newVariables;
  },
  "TextDatasBuilder.generateTextDatas",
);
