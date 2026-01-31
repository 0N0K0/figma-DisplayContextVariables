import { logger } from "../../utils/logger";
import { catchError } from "../../utils/errorUtils";

export class PageBuilder {
  private className = "PageBuilder";

  /**
   * Obtient une page par son nom
   */
  getPage = catchError(
    async (name: string): Promise<PageNode | undefined> => {
      const pages = await this.getPages();
      const page = pages.find((p) => p.name === name) as PageNode | undefined;
      if (!page) {
        await logger.info(
          `Page '${name}' non trouvée.`,
          undefined,
          `${this.className}.getPage`,
        );
        return undefined;
      }
      await logger.info(
        `Page '${name}' trouvée.`,
        undefined,
        `${this.className}.getPage`,
      );
      figma.currentPage = page;
      return page;
    },
    `${this.className}.getPage`,
    false,
  );

  /**
   * Obtient toutes les pages
   */
  getPages = catchError(
    async (): Promise<PageNode[]> => {
      const pages = figma.root.children as PageNode[];
      await logger.info(
        `Nombre de pages trouvées: ${pages.length}`,
        undefined,
        `${this.className}.getPages`,
      );
      return pages;
    },
    `${this.className}.getPages`,
    false,
  );

  /**
   * Crée une page
   */
  createPage = catchError(
    async (name: string): Promise<PageNode> => {
      const page = figma.createPage();
      page.name = name;
      figma.currentPage = page;
      return page;
    },
    `${this.className}.createPage`,
    false,
  );

  /**
   * Crée plusieurs pages
   */
  createPages = catchError(
    async (names: string[]): Promise<PageNode[]> => {
      const pages: PageNode[] = [];
      for (const name of names) {
        const page = await this.createPage(name);
        pages.push(page);
      }
      return pages;
    },
    `${this.className}.createPages`,
    false,
  );

  getOrCreatePage = catchError(
    async (name: string): Promise<PageNode> => {
      let page = await this.getPage(name);
      if (!page) {
        page = await this.createPage(name);
      }
      return page;
    },
    `${this.className}.getOrCreatePage`,
    false,
  );

  setModes = catchError(
    async (
      page: PageNode,
      modes: { collection: VariableCollection; modeId: string }[],
    ): Promise<void> => {
      for (const mode of modes) {
        page.setExplicitVariableModeForCollection(mode.collection, mode.modeId);
      }
    },
    `${this.className}.setModes`,
    false,
  );

  /**
   * Supprime une page par son nom
   */
  removePage = catchError(
    async (name: string): Promise<void> => {
      const page = await this.getPage(name);
      if (!page) {
        await logger.warn(
          `Impossible de supprimer la page '${name}': page non trouvée.`,
          undefined,
          `${this.className}.removePage`,
        );
        return;
      }
      page.remove();
    },
    `${this.className}.removePage`,
    false,
  );

  /**
   * Distribue les pages horizontalement avec un espacement fixe
   */
  distributePages() {
    const gap = 80;

    const nodes = figma.currentPage.children;
    // Point de départ
    let cursorX = nodes[0]?.x ?? 0;
    const baseY = nodes[0]?.y ?? 0;

    for (const node of nodes) {
      node.x = cursorX;
      node.y = baseY;
      cursorX += node.width + gap;
    }
  }
}

export const pageBuilder = new PageBuilder();
