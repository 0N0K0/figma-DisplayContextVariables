import { variableBuilder } from "../variables/variableBuilder";
import { catchError } from "../../utils/errorUtils";
import { pageBuilder } from "./pageBuilder";
import { logger } from "../../utils/logger";
import { COLLECTIONS } from "../../../common/constants/variablesConstants";

export const generateViewportsPages = catchError(async () => {
  await pageBuilder.getOrCreatePage("PRESENTATIONS");

  const config = {
    Desktop: { sizes: { Landscape: ["XL", "LG"] }, density: "loose" },
    Tablet: {
      sizes: { Portrait: ["MD", "SM"], Landscape: ["MD"] },
      density: "compact",
    },
    Mobile: {
      sizes: { Portrait: ["XS"], Landscape: ["MD"] },
      density: "tight",
    },
  };

  for (const [deviceName, deviceConfig] of Object.entries(config)) {
    await pageBuilder.createPage(`↓ ${deviceName}`);
    for (const [orientationName, sizeNames] of Object.entries(
      deviceConfig.sizes,
    )) {
      const orientationPage = await pageBuilder.createPage(
        `  ► ${orientationName}`,
      );
      for (const sizeName of sizeNames) {
        const deviceMode = await variableBuilder.getModeFromCollection(
          COLLECTIONS.devices.name,
          `${deviceName}/${orientationName}/${sizeName}`.toLowerCase(),
        );

        const verticalDensityMode = await variableBuilder.getModeFromCollection(
          COLLECTIONS.verticalDensities.name,
          `${deviceConfig.density}`.toLowerCase(),
        );

        if (sizeNames.length > 1) {
          const sizePage = await pageBuilder.createPage(`    ♢ ${sizeName}`);
          if (!deviceMode.mode?.modeId || !verticalDensityMode.mode?.modeId)
            continue;
          await pageBuilder.setModes(sizePage, [
            {
              collection: deviceMode.collection,
              modeId: deviceMode.mode.modeId,
            },
            {
              collection: verticalDensityMode.collection,
              modeId: verticalDensityMode.mode.modeId,
            },
          ]);
        } else if (
          deviceMode.mode?.modeId &&
          verticalDensityMode.mode?.modeId
        ) {
          await pageBuilder.setModes(orientationPage, [
            {
              collection: deviceMode.collection,
              modeId: deviceMode.mode.modeId,
            },
            {
              collection: verticalDensityMode.collection,
              modeId: verticalDensityMode.mode.modeId,
            },
          ]);
        }
      }
    }
  }

  await pageBuilder.createPages(["---", "⚡ DEV ONLY"]);
}, "ViewportsBuilder.generateViewportsPages");
