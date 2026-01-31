import { COLLECTIONS, SCOPES } from "../../../constants/variablesConstants";
import { logger } from "../../../utils/logger";
import { variableBuilder } from "../variableBuilder";
import { catchError } from "../../../utils/errorUtils";

export const generateRadius = catchError(
  async (radius: Record<string, number>): Promise<Variable[]> => {
    logger.debug(
      "@param radius Record<string, number>:",
      radius,
      "RadiusBuilder.generateRadius",
    );
    const variables: Variable[] = [];

    for (const variable of COLLECTIONS.radius.variables as {
      name: string;
      default: number;
    }[]) {
      variables.push(
        await variableBuilder.createOrUpdateVariable({
          name: variable.name,
          collection: COLLECTIONS.radius.name,
          type: "FLOAT",
          value: radius[variable.name]
            ? radius[variable.name]
            : variable.default,
          scopes: [SCOPES.FLOAT.CORNER_RADIUS],
        }),
      );
    }

    if (variables.length === 0) {
      await logger.error(
        "Aucune variable de radius créée ou mise à jour.",
        undefined,
        "RadiusBuilder.generateRadius",
      );
      throw new Error("Aucune variable de radius créée ou mise à jour.");
    }
    await logger.success(
      `${variables.length} variables de radius créées ou mises à jour avec succès.`,
      undefined,
      "RadiusBuilder.generateRadius",
    );
    return variables;
  },
  "RadiusBuilder.generateRadius",
);
