import { variableBuilder } from "../builders/variables/variableBuilder";
import { COLLECTIONS } from "../../common/constants/variablesConstants";
import { catchError } from "../utils/errorUtils";

class ThemesHelper {
  getTargetValue = catchError(
    async (
      targetVariableName: string,
      collection: string,
    ): Promise<{
      alias: string | undefined;
      targetValue: { r: number; g: number; b: number; a: number } | undefined;
      targetVariable: Variable | undefined;
    }> => {
      let targetVariable = await variableBuilder.findVariable(
        collection,
        targetVariableName,
      );

      let targetValue = targetVariable
        ? await variableBuilder.getVariableValueForMode(targetVariable)
        : undefined;
      let alias = targetVariable ? targetVariable.id : undefined;

      return {
        alias,
        targetValue: targetValue as
          | { r: number; g: number; b: number; a: number }
          | undefined,
        targetVariable,
      };
    },
    `${this.constructor.name}.getTargetValue`,
    false,
  );

  getTargetColor = catchError(
    async (
      targetVariableName: string,
      colorFamily: string,
      collection: string,
    ): Promise<{
      alias: string | undefined;
      targetValue: { r: number; g: number; b: number; a: number } | undefined;
    }> => {
      let { alias, targetValue, targetVariable } = await this.getTargetValue(
        targetVariableName,
        collection,
      );

      if (!targetVariable) {
        throw new Error(
          `La variable cible '${targetVariableName}' n'existe pas dans la palette de couleurs ${colorFamily}.`,
        );
      }

      return {
        alias,
        targetValue,
      };
    },
    `${this.constructor.name}.getTargetColor`,
    false,
  );

  getTargetNeutralColor = catchError(
    async (
      targetVariableName: string,
    ): Promise<{
      alias: string | undefined;
      targetValue: { r: number; g: number; b: number; a: number } | undefined;
    }> => {
      let { alias, targetValue, targetVariable } = await this.getTargetValue(
        targetVariableName,
        COLLECTIONS.palette.name,
      );

      if (!targetVariable) {
        throw new Error(
          `La variable cible '${targetVariableName}' n'existe pas dans la palette de couleurs Neutral.`,
        );
      }

      return {
        alias,
        targetValue,
      };
    },
    `${this.constructor.name}.getTargetNeutralColor`,
    false,
  );
}

export const themesHelper = new ThemesHelper();
