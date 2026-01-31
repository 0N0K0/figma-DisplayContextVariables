import { imageDatas, layoutGuide, radiusDatas } from "../../../common/types";
import { shuffle, sliceItems } from "../../utils/dataUtils";
import { logger } from "../../utils/logger";
import { elementBuilder } from "../elements/elementBuilder";
import { pageBuilder } from "../pages/pageBuilder";
import { variableBuilder } from "../variables/variableBuilder";
import { componentBuilder } from "./componentBuilder";
import { breakpointsConfig } from "../../utils/systemUtils";
import { imagesDatasHelper } from "../../helpers/imagesDatasHelper";
import { RATIOS } from "../../constants/imagesDatasConstants";
import { ORIENTATIONS } from "../../constants/systemConstants";
import { catchError } from "../../utils/errorUtils";
import { COLLECTIONS } from "../../../common/constants/variablesConstants";

const FILE_NAME = "ImagesBuilder";

export const generateImagesDatas = catchError(
  async (imageDatas: imageDatas, layoutGuide: layoutGuide) => {
    /**
     * Créer les pages
     */
    const imagePage = await imagesDatasHelper.createPages(
      ["DATAS", "    ♢ Image"],
      "    ♢ Image",
      "<ImageDatas>",
    );

    /**
     * Créer le Jeu de composants d'images
     */
    logger.info(
      "[generateImagesDatas] Création du Jeu de composants <ImageDatas>...",
    );
    figma.currentPage = imagePage;

    const imageWidthVariable = await variableBuilder.findVariable(
      COLLECTIONS.breakpoints.name,
      "viewport/width/min-width",
    );

    const imageWidth = imageWidthVariable
      ? ((await variableBuilder.getVariableValueForMode(
          imageWidthVariable,
          "xxl",
          COLLECTIONS.breakpoints.name,
        )) as number)
      : 1920;

    const imageComponents: {
      component: ComponentNode;
      ratio: number;
      name: string;
    }[] = [];
    let xOffset = 0;

    for (const [category, files] of Object.entries(imageDatas)) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const ratio = file.width / file.height;
        const { newWidth, newHeight } =
          await imagesDatasHelper.generateWidthHeight(
            imageWidth,
            layoutGuide.maxContentHeight,
            ratio,
          );

        const bytes =
          file.data && file.data.byteLength
            ? new Uint8Array(file.data)
            : new Uint8Array([]);
        const hash = figma.createImage(bytes).hash;

        // Créer un composant pour l'image
        const imageComponent = (await elementBuilder.createElement(
          `image=${i + 1}, category=${category || "miscellaneous"}`,
          "COMPONENT",
          imagePage,
          {
            fills: [
              {
                type: "IMAGE",
                imageHash: hash,
                scaleMode: "FILL",
              },
            ],
            clipsContent: true,
            x: xOffset,
            y: 0,
          },
          { width: newWidth, height: newHeight },
        )) as ComponentNode;

        xOffset += newWidth + 40;

        imageComponents.push({
          component: imageComponent,
          ratio,
          name: file.name,
        });
      }
    }

    await imagesDatasHelper.createComponentSet(
      "<ImageDatas>",
      imagePage,
      imageComponents,
    );
  },
  `${FILE_NAME}.generateImagesDatas`,
);

export const generateMediaInstance = catchError(
  async (layoutGuide: layoutGuide) => {
    /**
     * Créer les pages
     */
    const mediaPage = await imagesDatasHelper.createPages(
      ["INSTANCES", "    ♢ _Media"],
      "    ♢ _Media",
      "_MediaPlaceHolder",
    );

    /**
     * Créer le composant _MediaPlaceHolder
     */
    logger.info(
      "[generateMediaInstance] Création du composant _MediaPlaceHolder...",
    );
    figma.currentPage = mediaPage;

    const width = 1920;
    const height = layoutGuide.maxContentHeight;

    const mediaComponent = (await elementBuilder.createElement(
      `_MediaPlaceHolder`,
      "COMPONENT",
      mediaPage,
      {
        fills: [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }],
        strokes: [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }],
        strokeWeight: 1,
        strokeAlign: "INSIDE",
        x: 0,
        y: 0,
      },
      { width, height },
    )) as ComponentNode;

    for (let i = 0; i < 2; i++) {
      const line = figma.createLine();
      line.resize(Math.hypot(width, height), 0);
      line.rotation =
        Math.atan2(i === 0 ? height : -height, width) * (180 / Math.PI);
      line.strokes = [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }];
      line.strokeWeight = 1;
      line.x = 0;
      line.y = i === 0 ? height : 0;
      mediaComponent.appendChild(line);
    }

    logger.success(
      "[generateMediaInstance] Composant _MediaPlaceHolder créée avec succès.",
    );
  },
  `${FILE_NAME}.generateMediaInstance`,
);

export const generateMedia = catchError(
  async (radiusDatas: radiusDatas, layoutGuide: layoutGuide) => {
    /**
     * Créer les pages
     */

    const XXLmode = await variableBuilder.getModeFromCollection(
      COLLECTIONS.breakpoints.name,
      "xxl",
    );

    const mediaPage = await imagesDatasHelper.createPages(
      ["COMPONENTS", "↓ Data Display", "    ♢ Media"],
      "    ♢ Media",
      " <Media>",
    );

    const imageWidthVariable = await variableBuilder.findVariable(
      COLLECTIONS.breakpoints.name,
      "viewport/width/min-width",
    );
    const imageWidth =
      imageWidthVariable && XXLmode.mode
        ? ((await variableBuilder.getVariableValueForMode(
            imageWidthVariable,
            "xxl",
            COLLECTIONS.breakpoints.name,
          )) as number)
        : 1920;

    /**
     * Créer le jeu de composants de medias
     */
    logger.info("[generateMedia] Création du Jeu de composants <Media>...");
    figma.currentPage = mediaPage;

    let radiusVariables = await variableBuilder.getCollectionVariables(
      COLLECTIONS.radius.name,
    );
    const radius: Record<string, number> = {};
    if (radiusVariables.length > 0) {
      for (const radiusVariable of radiusVariables) {
        radius[radiusVariable.name] =
          (await variableBuilder.getVariableValueForMode(
            radiusVariable,
          )) as number;
      }
    } else {
      Object.assign(radius, { square: 0, ...radiusDatas, rounded: 9999 });
    }

    const mediaPlaceHolderPage = await pageBuilder.getPage("    ♢ _Media");
    if (!mediaPlaceHolderPage) {
      throw new Error(
        "La page '    ♢ _Media' est introuvable. Veuillez générer l'instance _MediaPlaceHolder avant de générer le composant Media.",
      );
    }
    const mediaPlaceHolder = await elementBuilder.getElement(
      "_MediaPlaceHolder",
      mediaPlaceHolderPage,
    );
    if (!mediaPlaceHolder) {
      throw new Error(
        "Le composant '_MediaPlaceHolder' est introuvable. Veuillez générer l'instance _MediaPlaceHolder avant de générer le composant Media.",
      );
    }

    const mediaComponents = [];

    for (const ratioConfig of RATIOS) {
      const orientationsToUse =
        ratioConfig.name !== "1:1" ? ORIENTATIONS : ["false"];

      for (const orientation of orientationsToUse) {
        for (const [radiusKey, radiusValue] of Object.entries(radius)) {
          let targetRatio = ratioConfig.ratio;
          if (orientation === "portrait") {
            targetRatio = 1 / targetRatio;
          }
          const { newWidth: width, newHeight: height } =
            await imagesDatasHelper.generateWidthHeight(
              imageWidth,
              layoutGuide.maxContentHeight,
              targetRatio,
            );

          const mediaComponent = (await elementBuilder.createElement(
            `ratio=${ratioConfig.name}, orientation=${orientation}, radius=${radiusKey}`,
            "COMPONENT",
            mediaPage,
            {
              cornerRadius: radiusValue,
              clipsContent: true,
              layoutMode: "HORIZONTAL",
              layoutSizingHorizontal: "FIXED",
              layoutSizingVertical: "FIXED",
            },
            { width, height },
            true,
          )) as ComponentNode;

          await componentBuilder.createInstance(
            mediaPlaceHolder as ComponentNode,
            mediaComponent,
            true,
            {
              layoutSizingHorizontal: "FILL",
              layoutSizingVertical: "FILL",
            },
          );

          mediaComponents.push(mediaComponent);
        }
      }
    }

    await imagesDatasHelper.createComponentSet(
      "<Media>",
      mediaPage,
      mediaComponents,
    );
  },
  `${FILE_NAME}.generateMedia`,
);

export const generateGallery = catchError(async (layoutGuide: layoutGuide) => {
  /**
   * Créer les pages
   */
  const galleryPage = await imagesDatasHelper.createPages(
    ["COMPONENTS", "↓ Layout", "    ♢ Gallery"],
    "    ♢ Gallery",
    " <Gallery>",
  );

  /**
   * Créer le Jeu de composants de galeries de medias
   */
  logger.info("[generateGallery] Création du Jeu de composants <Gallery>...");
  figma.currentPage = galleryPage;
  const galleryComponents: ComponentNode[] = [];

  const layouts = ["grid", "masonry", "justified", "carousel"];
  const breakpoints = breakpointsConfig(
    layoutGuide.minColumnWidth,
    layoutGuide.gutter,
    layoutGuide.horizontalBodyPadding,
    layoutGuide.minViewportHeight,
    layoutGuide.horizontalMainPadding,
  );

  const ratiosByOrientations = RATIOS.flatMap((ratio) => {
    if (ratio.name === "1:1") {
      return [{ ratio: ratio.name, orientation: "false" }];
    }
    return ORIENTATIONS.filter((orientation) => orientation !== "false").map(
      (orientation) => ({
        ratio: ratio.name,
        orientation: orientation,
      }),
    );
  });

  const mediaPage = await pageBuilder.getPage("    ♢ Media");
  if (!mediaPage) {
    throw new Error(
      "La page '    ♢ Media' est introuvable. Veuillez générer le composant <Media> avant de générer le composant <Gallery>.",
    );
  }
  const mediaComponentSet = (await elementBuilder.getElement(
    "<Media>",
    mediaPage,
  )) as ComponentSetNode;
  if (!mediaComponentSet) {
    throw new Error(
      "Le composant <Media> est introuvable. Veuillez générer le composant <Media> avant de générer le composant <Gallery>.",
    );
  }
  const mediaComponent = mediaComponentSet.children[0] as ComponentNode;

  for (const layout of layouts) {
    for (const [breakpoint, properties] of Object.entries(breakpoints)) {
      if (breakpoint === "xxl") continue;
      if (properties.columns % 2 !== 0) continue;
      const columns = properties.columns / 2;
      const columnWidth = properties.contentWidth.columns[2].min;
      const galleryComponent: ComponentNode =
        (await elementBuilder.createElement(
          `layout=${layout}, breakpoint=${breakpoint}`,
          "COMPONENT",
          galleryPage,
          {
            layoutMode: layout === "justified" ? "VERTICAL" : "HORIZONTAL",
            primaryAxisSizingMode: layout === "justified" ? "AUTO" : "FIXED",
            counterAxisSizingMode: layout === "justified" ? "FIXED" : "AUTO",
            itemSpacing:
              layout === "justified"
                ? layoutGuide.baselineGrid
                : layoutGuide.gutter,
            counterAxisSpacing:
              layout === "grid" ? layoutGuide.baselineGrid : 0,
            layoutWrap: layout === "grid" ? "WRAP" : "NO_WRAP",
            clipsContent: layout === "carousel",
            overflowDirection: layout === "carousel" ? "HORIZONTAL" : "NONE",
          },
          {
            width: properties.contentWidth.columns[properties.columns].min,
            height: layoutGuide.maxContentHeight,
          },
        )) as ComponentNode;

      const widthVariable = await variableBuilder.findVariable(
        COLLECTIONS.breakpoints.name,
        `content-width/columns/${properties.columns}/min`,
      );
      if (widthVariable) {
        galleryComponent.setBoundVariable("width", widthVariable);
        const breakpointMode = await variableBuilder.getModeFromCollection(
          COLLECTIONS.breakpoints.name,
          breakpoint,
        );
        if (breakpointMode.mode)
          galleryComponent.setExplicitVariableModeForCollection(
            breakpointMode.collection,
            breakpointMode.mode.modeId,
          );
      }

      const mediaInstances = [];
      for (let i = 0; i < 24; i++) {
        const ratioOrientationIndex = i % ratiosByOrientations.length;
        const { ratio, orientation } =
          ratiosByOrientations[ratioOrientationIndex];

        const mediaInstance = await componentBuilder.createInstance(
          mediaComponent,
          undefined,
          false,
        );
        mediaInstance.setProperties({
          ratio,
          orientation,
        });

        mediaInstances.push(mediaInstance);
      }

      if (layout === "masonry" || layout === "justified") {
        const galleryLayoutFramesPropeties: Partial<FrameNode> = {
          primaryAxisSizingMode: "AUTO",
          fills: [],
        };
        if (layout === "masonry") {
          const imagesByColumn = Math.ceil(24 / columns);
          for (let column = 0; column < columns; column++) {
            const columnFrame = (await elementBuilder.createElement(
              `column-${column + 1}`,
              "FRAME",
              galleryComponent,
              {
                layoutMode: "VERTICAL",
                counterAxisSizingMode: "FIXED",
                itemSpacing: layoutGuide.baselineGrid,
                ...galleryLayoutFramesPropeties,
              },
            )) as FrameNode;

            let itemsForColumn = sliceItems(
              column,
              imagesByColumn,
              mediaInstances,
            );
            itemsForColumn = shuffle(itemsForColumn);

            for (const item of itemsForColumn) {
              await elementBuilder.updateElement(item, columnFrame, {
                layoutAlign: "STRETCH",
              });
            }
            await elementBuilder.updateElement(
              columnFrame,
              undefined,
              {},
              { width: columnWidth, height: columnFrame.height },
            );
          }
        } else {
          for (let row = 0; row < Math.ceil(24 / columns); row++) {
            const rowFrame = (await elementBuilder.createElement(
              `row-${row + 1}`,
              "FRAME",
              galleryComponent,
              {
                layoutMode: "HORIZONTAL",
                counterAxisSizingMode: "AUTO",
                itemSpacing: layoutGuide.gutter,
                ...galleryLayoutFramesPropeties,
              },
            )) as FrameNode;

            let itemsForRow = sliceItems(row, columns, mediaInstances);
            const ratios = itemsForRow.map((item) => {
              const w = (item as InstanceNode).width;
              const h = (item as InstanceNode).height;
              return w / h;
            });
            const sumRatios = ratios.reduce((a, b) => a + b, 0);
            const height =
              (galleryComponent.width -
                layoutGuide.gutter * (ratios.length - 1)) /
              sumRatios;
            const widths = ratios.map((r) => r * height);
            itemsForRow = shuffle(itemsForRow);

            for (const [index, item] of itemsForRow.entries()) {
              const sizes = { width: widths[index], height: height };
              await elementBuilder.updateElement(item, rowFrame, {}, sizes);
            }
          }
        }
      } else {
        const shuffledInstances = shuffle(mediaInstances);
        for (const item of shuffledInstances) {
          let width: number;
          let height: number;
          if (layout === "grid") {
            item.setProperties({
              orientation: "false",
              ratio: "1:1",
            });
            height = width = columnWidth;
          } else {
            // carousel
            height = columnWidth;
            width = (columnWidth * item.width) / item.height;
          }
          await elementBuilder.updateElement(
            item,
            galleryComponent,
            {},
            { width, height },
          );
        }
      }

      galleryComponents.push(galleryComponent);
    }
  }
  await imagesDatasHelper.createComponentSet(
    "<Gallery>",
    galleryPage,
    galleryComponents,
  );
}, `${FILE_NAME}.generateGallery`);
