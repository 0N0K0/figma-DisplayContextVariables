import { componentBuilder } from "../builders/components/componentBuilder";
import { pageBuilder } from "../builders/pages/pageBuilder";
import { logger } from "../utils/logger";
import { catchError } from "../utils/errorUtils";

class ImagesDatasHelper {
  createPages = catchError(
    async (
      pagesNames: string[],
      targetPageName: string,
      componentSetName: string,
    ): Promise<PageNode> => {
      await logger.info(
        `Création ou récupération des pages pour le composant ${componentSetName}...`,
        undefined,
        `${this.constructor.name}.createPages`,
      );

      let targetPage: PageNode;
      for (const pageName of pagesNames) {
        const page = await pageBuilder.getOrCreatePage(pageName);
        if (pageName === targetPageName) targetPage = page;
      }
      await logger.success(
        `Pages pour le composant ${componentSetName} créées ou récupérées avec succès.`,
        undefined,
        `${this.constructor.name}.createPages`,
      );
      return targetPage!;
    },
    `${this.constructor.name}.createPages`,
    false,
  );

  createComponentSet = catchError(
    async (
      componentName: string,
      page: PageNode,
      components:
        | { component: ComponentNode; name: string }[]
        | ComponentNode[],
    ): Promise<void> => {
      const componentSet = await componentBuilder.createComponentSet(
        componentName,
        page,
        "component" in components[0]
          ? (components as { component: ComponentNode; name: string }[]).map(
              (ic) => ic.component,
            )
          : (components as ComponentNode[]),
        {
          layoutMode: "HORIZONTAL",
          layoutSizingHorizontal: "HUG",
          layoutSizingVertical: "HUG",
          itemSpacing: 20,
          paddingLeft: 40,
          paddingRight: 40,
          paddingTop: 40,
          paddingBottom: 40,
          x: 0,
          y: 0,
        },
      );
      figma.viewport.scrollAndZoomIntoView([componentSet]);
      await logger.success(
        `Jeu de composants <${componentName}> créé avec succès.`,
        undefined,
        `${this.constructor.name}.createComponentSet`,
      );
    },
    `${this.constructor.name}.createComponentSet`,
    false,
  );

  generateWidthHeight = catchError(
    async (
      width: number,
      maxHeight: number,
      ratio: number,
    ): Promise<{ newWidth: number; newHeight: number }> => {
      let newWidth = width;
      let newHeight = Math.round(newWidth / ratio);
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = Math.round(newHeight * ratio);
      }
      return { newWidth, newHeight };
    },
    `${this.constructor.name}.generateWidthHeight`,
    false,
  );
}

export const imagesDatasHelper = new ImagesDatasHelper();
