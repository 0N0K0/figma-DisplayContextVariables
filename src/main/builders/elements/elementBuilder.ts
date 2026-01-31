import { logger } from "../../utils/logger";
import { catchError } from "../../utils/errorUtils";
import { loadFont } from "../../utils/typographyUtils";

export class ElementBuilder {
  /**
   * Obtient un élément par son nom
   */
  getElement = catchError(
    async (
      name: string,
      parent: PageNode | FrameNode | ComponentNode,
    ): Promise<SceneNode | undefined> => {
      const elements = await this.getElements(parent);
      const element = elements.find((e) => e.name === name) as
        | SceneNode
        | undefined;
      if (!element) {
        await logger.info(
          `Element '${name}' non trouvé.`,
          undefined,
          `${this.constructor.name}.getElement`,
        );
        return undefined;
      }
      return element;
    },
    `${this.constructor.name}.getElement`,
    false,
  );

  /**
   * Obtient tous les éléments d'un parent
   */
  getElements = catchError(
    async (
      parent: PageNode | FrameNode | ComponentNode,
    ): Promise<readonly SceneNode[]> => {
      const elements = parent.children;
      await logger.info(
        `Nombre d'éléments trouvés: ${elements.length}`,
        undefined,
        `${this.constructor.name}.getElements`,
      );
      return elements;
    },
    `${this.constructor.name}.getElements`,
    false,
  );

  /**
   * Crée un élément
   */
  createElement = catchError(
    async (
      name: string,
      type: "FRAME" | "COMPONENT" | "TEXT",
      parent: PageNode | FrameNode | ComponentNode,
      properties?: Partial<FrameNode | ComponentNode | TextNode>,
      size?: { width: number; height: number },
      lockAspectRatio?: boolean,
      gridChildPosition?: { row: number; column: number },
      mode?: { collection: VariableCollection; modeId: string },
      fontName?: FontName,
    ): Promise<FrameNode | ComponentNode | TextNode> => {
      let element: FrameNode | ComponentNode | TextNode;
      switch (type) {
        case "FRAME":
          element = figma.createFrame();
          break;
        case "COMPONENT":
          element = figma.createComponent();
          break;
        case "TEXT":
          await loadFont({ family: "Inter", style: "Regular" });
          element = figma.createText();
          if (fontName) {
            await loadFont({ family: fontName.family, style: fontName.style });
          }
          break;
        default:
          throw new Error(`Type d'élément inconnu: ${type}`);
      }

      element.name = name;
      await this.updateElement(
        element,
        parent,
        properties,
        size,
        lockAspectRatio,
        gridChildPosition,
        mode,
      );

      return element;
    },
    `${this.constructor.name}.createElement`,
    false,
  );

  updateElement = catchError(
    async (
      element: FrameNode | ComponentNode | InstanceNode | TextNode,
      parent?: FrameNode | ComponentNode | PageNode,
      properties?: Partial<FrameNode | ComponentNode | InstanceNode | TextNode>,
      size?: { width: number; height: number },
      lockAspectRatio?: boolean,
      gridChildPosition?: { row: number; column: number },
      mode?: { collection: VariableCollection; modeId: string },
    ): Promise<FrameNode | ComponentNode | InstanceNode | TextNode> => {
      if (parent !== undefined) parent.appendChild(element);
      if (size !== undefined && size.width && size.height)
        element.resize(size.width, size.height);
      if (lockAspectRatio) element.lockAspectRatio();
      if (properties !== undefined) Object.assign(element, properties);
      if (gridChildPosition !== undefined) {
        element.setGridChildPosition(
          gridChildPosition.row,
          gridChildPosition.column,
        );
      }
      if (mode !== undefined) {
        element.setExplicitVariableModeForCollection(
          mode.collection,
          mode.modeId,
        );
      }
      return element;
    },
    `${this.constructor.name}.updateElement`,
    false,
  );

  setParent = catchError(
    async (
      element: SceneNode,
      parent: FrameNode | ComponentNode | PageNode,
    ): Promise<void> => {
      parent.appendChild(element);
    },
    `${this.constructor.name}.setParent`,
    false,
  );

  async getOrCreateElement(
    name: string,
    type: "FRAME" | "COMPONENT" | "TEXT",
    parent: PageNode | FrameNode | ComponentNode,
    properties?: Partial<FrameNode | ComponentNode | TextNode>,
    size?: { width: number; height: number },
    lockAspectRatio?: boolean,
    gridChildPosition?: { row: number; column: number },
    mode?: { collection: VariableCollection; modeId: string },
    fontName?: FontName,
  ): Promise<FrameNode | ComponentNode | TextNode> {
    let element = await this.getElement(name, parent);
    if (!element) {
      element = await this.createElement(
        name,
        type,
        parent,
        properties,
        size,
        lockAspectRatio,
        gridChildPosition,
        mode,
        fontName,
      );
    }
    return element as FrameNode | ComponentNode | TextNode;
  }

  /**
   * Supprime un élément par son nom
   */
  removeElement = catchError(
    async (name: string, parent: PageNode | FrameNode): Promise<void> => {
      const element = await this.getElement(name, parent);
      if (!element) {
        await logger.warn(
          `Impossible de supprimer l'élément '${name}': élément non trouvé.`,
          undefined,
          `${this.constructor.name}.removeElement`,
        );
        return;
      }
      element.remove();
    },
    `${this.constructor.name}.removeElement`,
    false,
  );

  /**
   * Distribue les éléments horizontalement avec un espacement donné
   */
  distributeElements = catchError(
    async (
      parent: FrameNode | PageNode,
      spacing: number = 16,
    ): Promise<void> => {
      let currentX = 0;
      for (const element of parent.children) {
        element.x = currentX;
        currentX += element.width + spacing;
      }
    },
    `${this.constructor.name}.distributeElements`,
    false,
  );
}

export const elementBuilder = new ElementBuilder();
