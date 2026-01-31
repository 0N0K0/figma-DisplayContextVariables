/**
 * Utilitaire pour créer des variables Figma
 * Simplifie la création de variables avec différents types, scopes et collections
 */

import type { VariableConfig } from "../../types/variablesTypes";
import { hexToFigmaRgba } from "../../utils/colorUtils";
import { logger } from "../../utils/logger";
import { catchError } from "../../utils/errorUtils";

export class VariableBuilder {
  private className = "VariableBuilder";

  /**
   * Obtient une collection de variables par nom
   */
  getCollection = catchError(
    async (name: string): Promise<VariableCollection | undefined> => {
      const collections =
        await figma.variables.getLocalVariableCollectionsAsync();
      const collection = collections.find((c) => c.name === name);
      if (!collection) {
        await logger.info(
          `Collection '${name}' introuvable.`,
          undefined,
          `${this.className}.getCollection`,
        );
      }
      return collection;
    },
    `${this.className}.getCollection`,
    false,
  );

  /**
   * Crée une nouvelle collection de variables
   */
  private createCollection = catchError(
    async (name: string): Promise<VariableCollection> => {
      const collection = figma.variables.createVariableCollection(name);
      if (collection.modes.length === 0) {
        collection.addMode("Mode 1");
      }

      return collection;
    },
    `${this.className}.createCollection`,
    false,
  );

  /**
   * Obtient ou crée une collection de variables
   */
  private async getOrCreateCollection(
    name: string,
  ): Promise<VariableCollection> {
    const existing = await this.getCollection(name);
    if (existing) return existing;

    const collection = await this.createCollection(name);
    return collection;
  }

  /**
   * Obtient tous les modes d'une collection
   */
  getModesFromCollection = catchError(
    async (
      collectionName: string,
    ): Promise<
      {
        modeId: string;
        name: string;
      }[]
    > => {
      const collection = await this.getCollection(collectionName);
      if (!collection) {
        return [];
      }
      const modes = collection.modes;
      if (modes.length === 0) {
        await logger.info(
          `Aucun mode trouvé dans la collection '${collectionName}'.`,
          undefined,
          `${this.className}.getModesFromCollection`,
        );

        return [];
      }

      return collection.modes;
    },
    `${this.className}.getModesFromCollection`,
    false,
  );

  /**
   * Obtient un mode d'une collection par nom
   */
  getModeFromCollection = catchError(
    async (
      collectionName: string,
      modeName: string,
    ): Promise<{
      mode: { modeId: string; name: string } | null;
      collection: VariableCollection;
    }> => {
      const collection = await this.getOrCreateCollection(collectionName);
      const mode = collection.modes.find((m) => m.name === modeName);
      if (!mode) {
        await logger.info(
          `Mode '${modeName}' introuvable dans la collection '${collectionName}'.`,
          undefined,
          `${this.className}.getModeFromCollection`,
        );
        return { mode: null, collection };
      }
      return {
        mode,
        collection,
      };
    },
    `${this.className}.getModeFromCollection`,
    false,
  );

  getFirstMode = catchError(
    async (variable: Variable): Promise<string> => {
      return Object.keys(variable.valuesByMode)[0];
    },
    `${this.className}.getFirstMode`,
    false,
  );

  /**
   * Ajoute un mode à une collection
   */
  private addModeToCollection = catchError(
    async (collectionName: string, modeName: string): Promise<string> => {
      const collection = await this.getOrCreateCollection(collectionName);
      const modeId = collection.addMode(modeName);
      if (modeName !== "Mode 1" && modeId)
        await this.removeModeFromCollection(collectionName, "Mode 1");
      return modeId;
    },
    `${this.className}.addModeToCollection`,
    false,
  );

  private async getOrAddModeToCollection(
    collectionName: string,
    modeName: string,
  ): Promise<string> {
    const { mode, collection } = await this.getModeFromCollection(
      collectionName,
      modeName,
    );
    if (!mode) {
      return await this.addModeToCollection(collectionName, modeName);
    }
    return mode.modeId;
  }

  /**
   * Supprime un mode d'une collection
   */
  private removeModeFromCollection = catchError(
    async (collectionName: string, modeName: string): Promise<void> => {
      const { mode, collection } = await this.getModeFromCollection(
        collectionName,
        modeName,
      );
      if (!mode) {
        await logger.info(
          `Impossible de supprimer le mode '${modeName}': mode non trouvé dans la collection '${collectionName}'.`,
          undefined,
          `${this.className}.removeModeFromCollection`,
        );
        return;
      }
      collection.removeMode(mode.modeId);
    },
    `${this.className}.removeModeFromCollection`,
    false,
  );

  /**
   * Trouve une variable par collection et nom (retourne une seule variable)
   */
  findVariable = catchError(
    async (
      collectionName: string,
      variableName: string,
    ): Promise<Variable | undefined> => {
      const variables = await this.getCollectionVariables(collectionName);
      const variable = variables.find((v) => v.name === variableName);
      if (!variable) {
        await logger.info(
          `Variable '${variableName}' introuvable dans la collection '${collectionName}'.`,
          undefined,
          `${this.className}.findVariable`,
        );
        return;
      }
      return variable;
    },
    `${this.className}.findVariable`,
    false,
  );

  async findVariables(
    collectionName: string,
    variableNames: string[],
  ): Promise<Variable[]> {
    const variables: Variable[] = [];
    for (const name of variableNames) {
      const variable = await this.findVariable(collectionName, name);
      if (variable) variables.push(variable);
    }
    return variables;
  }

  /**
   * Obtient toutes les variables d'une collection
   */
  getCollectionVariables = catchError(
    async (collectionName: string): Promise<Variable[]> => {
      const collection = await this.getCollection(collectionName);
      if (!collection) return [];

      const allVariables = await figma.variables.getLocalVariablesAsync();
      const variables = allVariables.filter(
        (v) => v.variableCollectionId === collection.id,
      );
      if (!variables || variables.length === 0) {
        await logger.info(
          `Aucune variable trouvée dans la collection '${collectionName}'.`,
          undefined,
          `${this.className}.getCollectionVariables`,
        );
        return [];
      }
      return variables;
    },
    `${this.className}.getCollectionVariables`,
    false,
  );

  /**
   * Obtient toutes les variables d'une collection par groupe
   */
  async getCollectionVariablesByGroup(
    collectionName: string,
    groupName: string,
  ): Promise<Variable[]> {
    const collection = await this.getCollection(collectionName);
    if (!collection) return [];

    const allVariables = await figma.variables.getLocalVariablesAsync();
    const variables = allVariables.filter(
      (v) =>
        v.variableCollectionId === collection.id &&
        v.name.startsWith(`${groupName}/`),
    );
    if (!variables || variables.length === 0) {
      await logger.info(
        `Aucune variable trouvée dans le groupe '${groupName}' de la collection '${collectionName}'.`,
        undefined,
        `${this.className}.getCollectionVariablesByGroup`,
      );

      return [];
    }
    return variables;
  }

  /**
   * Obtient la valeur d'une variable pour un mode donné
   */
  getVariableValueForMode = catchError(
    async (
      variable: Variable,
      modeName?: string,
      collectionName?: string,
    ): Promise<any | undefined> => {
      if (modeName && collectionName) {
        const mode = await this.getModeFromCollection(collectionName, modeName);
        if (mode.mode?.modeId) return variable.valuesByMode[mode.mode.modeId];
      }
      return variable.valuesByMode[await this.getFirstMode(variable)];
    },
    `${this.className}.getVariableValueForMode`,
    false,
  );

  /**
   * Crée une variable
   */
  createVariable = catchError(
    async (config: VariableConfig): Promise<Variable> => {
      const collection = await this.getOrCreateCollection(config.collection);
      const varName = config.name;

      // Crée la variable avec le type spécifié
      const variable = figma.variables.createVariable(
        varName,
        collection,
        config.type,
      );

      // Trouve ou crée le mode
      let modeId: string = collection.modes[0]?.modeId;
      if (config.mode) {
        modeId = await this.getOrAddModeToCollection(
          config.collection,
          config.mode,
        );
      }

      // Définit les propriétés de la variable
      this.setVariableValue(variable, modeId, config.value, config.alias);
      if (config.scopes) this.setVariableScopes(variable, config.scopes);
      this.setVariableHiddenFromPublishing(variable, config.hidden ?? false);
      if (config.description)
        this.setVariableDescription(variable, config.description);

      return variable;
    },
    `${this.className}.createVariable`,
    false,
  );

  /**
   * Définit la valeur ou l'alias d'une variable pour un mode donné
   */
  private async setVariableValue(
    variable: Variable,
    modeId: string,
    value?: any,
    alias?: string,
  ) {
    if (value !== undefined) {
      // Convertit les valeurs hex en RGB pour les variables de couleur
      let valueToSet = value;
      if (variable.resolvedType === "COLOR" && typeof value === "string") {
        valueToSet = await hexToFigmaRgba(value);
      }
      variable.setValueForMode(modeId, valueToSet);
    }

    if (alias !== undefined) {
      variable.setValueForMode(modeId, {
        type: "VARIABLE_ALIAS",
        id: alias,
      });
    }
  }

  /**
   * Définit les scopes d'une variable
   */
  private async setVariableScopes(variable: Variable, scopes: VariableScope[]) {
    if (variable.resolvedType === "BOOLEAN") {
      await logger.warn(
        `Les variables de type BOOLEAN ne peuvent pas avoir de scopes. La variable '${variable.name}' ne sera pas modifiée.`,
        undefined,
        `${this.className}.setVariableScopes`,
      );
      return;
    }
    variable.scopes = scopes;
  }

  /**
   * Définit la visibilité d'une variable lors de la publication de la bibliothèque
   */
  private setVariableHiddenFromPublishing(variable: Variable, hidden: boolean) {
    variable.hiddenFromPublishing = hidden;
  }

  /**
   * Définit la description d'une variable
   */
  private setVariableDescription(variable: Variable, description: string) {
    variable.description = description;
  }

  /**
   * Crée ou met à jour une variable
   */
  createOrUpdateVariable = catchError(
    async (config: VariableConfig): Promise<Variable> => {
      const variable = await this.findVariable(config.collection, config.name);
      if (!variable) {
        await logger.info(
          `La variable '${config.name}' n'existe pas dans la collection '${config.collection}'. Elle sera créée.`,
          undefined,
          `${this.className}.createOrUpdateVariable`,
        );
        const newVariable = await this.createVariable(config as VariableConfig);
        return newVariable;
      }

      if (config.type !== variable.resolvedType) {
        await logger.warn(
          `Le type de la variable '${config.name}' ne peut pas être modifié de '${variable.resolvedType}' à '${config.type}'. La variable sera recréée.`,
          undefined,
          `${this.className}.createOrUpdateVariable`,
        );
        await this.deleteVariable(config.collection, config.name);
        const newVariable = await this.createVariable(config as VariableConfig);
        return newVariable;
      }

      // Trouver le mode à mettre à jour
      const collection = await this.getOrCreateCollection(config.collection);
      let modeId: string = collection.modes[0]?.modeId;
      if (config.mode) {
        modeId = await this.getOrAddModeToCollection(
          config.collection,
          config.mode,
        );
      }

      if (
        (config.value || config.alias) &&
        modeId &&
        (config.value !== variable.valuesByMode[modeId!] ||
          config.alias !== variable.valuesByMode[modeId])
      )
        this.setVariableValue(variable, modeId, config.value, config.alias);

      if (config.scopes && config.scopes !== variable.scopes)
        this.setVariableScopes(variable, config.scopes);

      if (
        config.hidden !== undefined &&
        config.hidden !== variable.hiddenFromPublishing
      )
        this.setVariableHiddenFromPublishing(variable, config.hidden);

      if (
        config.description !== undefined &&
        config.description !== variable.description
      )
        this.setVariableDescription(variable, config.description);

      return variable;
    },
    `${this.className}.createOrUpdateVariable`,
    false,
  );

  /**
   * Crée ou met à jour plusieurs variables
   */
  async createOrUpdateVariables(
    configs: VariableConfig[],
  ): Promise<Variable[]> {
    const variables: Variable[] = [];
    for (const config of configs) {
      const variable = await this.createOrUpdateVariable(config);
      variables.push(variable);
    }
    return variables;
  }

  /**
   * Supprime une variable
   */
  private deleteVariable = catchError(
    async (collectionName: string, variableName: string): Promise<void> => {
      const variable = await this.findVariable(collectionName, variableName);
      if (!variable) {
        await logger.info(
          `Impossible de supprimer la variable '${variableName}': variable non trouvée dans la collection '${collectionName}'.`,
          undefined,
          `${this.className}.deleteVariable`,
        );
        return;
      }
      variable.remove();
    },
    `${this.className}.deleteVariable`,
    false,
  );
}

// Export singleton par défaut
export const variableBuilder = new VariableBuilder();
