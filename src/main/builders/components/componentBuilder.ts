import { catchError } from "../../utils/errorUtils";

export class ComponentBuilder {
  private className = "ComponentBuilder";

  /**
   * Crée un jeu de composants
   */
  createComponentSet = catchError(
    async (
      name: string,
      page: PageNode,
      components: ComponentNode[],
      properties?: Partial<ComponentSetNode>,
    ): Promise<ComponentSetNode> => {
      figma.currentPage = page;
      page.selection = components;
      const componentSet: ComponentSetNode = figma.combineAsVariants(
        components,
        page,
      );
      componentSet.name = name;
      if (properties) {
        Object.assign(componentSet, properties);
      }
      return componentSet;
    },
    `${this.className}.createElement`,
    false,
  );

  createInstance = catchError(
    async (
      mainComponent: ComponentNode,
      parent?: PageNode | FrameNode | ComponentNode,
      instanceSwap?: boolean,
      properties?: Partial<SceneNode>,
      size?: { width: number; height: number },
    ): Promise<InstanceNode> => {
      const instance = mainComponent.createInstance();
      if (parent !== undefined) parent.appendChild(instance);
      if (properties !== undefined) Object.assign(instance, properties);
      if (size !== undefined && size.width && size.height)
        instance.resize(size.width, size.height);
      if (instanceSwap && parent !== undefined && parent.type === "COMPONENT")
        parent.addComponentProperty(
          mainComponent.name,
          "INSTANCE_SWAP",
          mainComponent.id,
          {
            preferredValues: [{ type: "COMPONENT", key: mainComponent.key }],
          },
        );
      return instance;
    },
    `${this.className}.createInstance`,
    false,
  );
}

export const componentBuilder = new ComponentBuilder();
