import { variableBuilder } from "./variableBuilder";
import datasJson from "../../assets/datas.json";
import { flatten } from "../../utils/dataUtils";
import { logger } from "../../utils/logger";
import { catchError } from "../../utils/errorUtils";
import { SCOPES } from "../../constants/variablesConstants";

export const generateTextDatas = catchError(
  async (textDatas?: Record<string, string>[]): Promise<Variable[]> => {
    let datas: Record<string, string> = {};
    if (!textDatas || textDatas.length === 0) {
      datas = flatten(datasJson);
    } else {
      for (const obj of textDatas) {
        flatten(obj, "", datas);
      }
    }

    const variables: Variable[] = [];

    for (const [name, value] of Object.entries(datas)) {
      variables.push(
        await variableBuilder.createOrUpdateVariable({
          name: name.toLowerCase(),
          collection: "Datas",
          type: "STRING",
          value: value,
          scopes: [SCOPES.STRING.TEXT_CONTENT],
        }),
      );
    }

    await logger.success(
      `${variables.length} variables de données créées ou mises à jour avec succès.`,
      false,
      "TextDatasBuilder.generateTextDatas",
    );
    figma.notify(
      `✅ ${variables.length} variables de données créées ou mises à jour avec succès.`,
    );
    return variables;
  },
  "TextDatasBuilder.generateTextDatas",
);
