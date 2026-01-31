import {
  splitWords,
  toCamelCase,
  toPascalCase,
} from "../../common/utils/textUtils";
import { FormData, getFormData } from "../utils/formData";
import { debugPanel } from "../components/debugPanel";
import { layoutGuide } from "../../common/types";
import { COLLECTIONS } from "../../common/constants/variablesConstants";

// List of button IDs corresponding to different actions
const btns = [
  "brand-colors",
  "feedback-colors",
  "neutral-colors",
  "palettes",
  "graphic-charter-colors",
  "themes",
  "layout-guide",
  "viewports-pages",
  "radius",
  "font-sizes",
  "font-styles",
  "typography",
  "graphic-charter-typography",
  "text-datas",
  "images-datas",
  "datas",
  "elevations-effects",
  "all",
];

// Helper function to manage colors for a specific color family
function manageColors(
  colorFamily: string,
  formData: FormData,
): Record<string, string> {
  const colors: Record<string, string> = {};
  Object.entries(formData).forEach(([key, value]) => {
    if (
      key.startsWith(colorFamily) &&
      !key.endsWith("-label") &&
      typeof value === "string" &&
      value.startsWith("#")
    ) {
      const labelKey = `${key}-label`;
      const colorName = formData[labelKey] || key;
      if (
        colorName &&
        typeof colorName === "string" &&
        colorName.trim() !== ""
      ) {
        colors[colorName.trim()] = value;
      }
    }
  });
  return colors;
}

function manageCoreThemes(
  colorFamily: string,
  formData: FormData,
): Record<string, Record<string, number>> {
  const coreThemes: Record<string, Record<string, number>> = {};

  // Debug: afficher toutes les clés qui commencent par le colorFamily
  const relevantKeys = Object.keys(formData).filter((k) =>
    k.startsWith(colorFamily),
  );

  Object.entries(formData).forEach(([key, value]) => {
    if (
      key.startsWith(colorFamily) &&
      (key.endsWith("-light") ||
        key.endsWith("-main") ||
        key.endsWith("-dark")) &&
      typeof value === "number"
    ) {
      const [keyBase, shadeName] = splitWords(key);
      const labelKey = `${keyBase}-label`;
      const colorName = formData[labelKey] || key;
      if (
        colorName &&
        typeof colorName === "string" &&
        colorName.trim() !== ""
      ) {
        const colorCCName = toCamelCase(colorName);
        if (!coreThemes[colorCCName]) coreThemes[colorCCName] = {};
        coreThemes[colorCCName][toCamelCase(shadeName)] = value;
      }
    }
  });

  return coreThemes;
}

export function attachButtonListeners() {
  // Attach handlers for all buttons using the map
  btns.forEach((key) => {
    const btn = document.getElementById(`generate-${key}-btn`);
    if (btn) {
      btn.addEventListener("click", async () => {
        // Ouvrir le debug panel automatiquement
        debugPanel.show();

        const formData = getFormData();
        console.log("📋 FormData complète:", formData);

        // Handle Color Families
        const colorsData: Record<string, Record<string, string>> = {};
        for (const colorFamily of ["brand", "feedback"]) {
          colorsData[colorFamily] = manageColors(colorFamily, formData);
        }

        // Handle Neutral Colors
        const neutralColors: Record<string, string | Record<string, number>> = {
          greyHue: formData["greyHue"] as string,
        };
        for (const [property, keys] of Object.entries({
          Text: ["Secondary", "Disabled", "Hovered", "Selected", "Focused"],
          Background: ["Disabled", "Hovered", "Selected", "Focused"],
        })) {
          for (const key of keys) {
            if (!neutralColors[property]) neutralColors[property] = {};
            (neutralColors[property] as Record<string, number>)[key] = formData[
              `neutral${property}${key}`
            ] as number;
          }
        }

        // Handle Themes
        const themes: Record<string, string> = {};
        for (const key of [
          "Enabled",
          "Disabled",
          "Hovered",
          "Selected",
          "Focused",
          "Border",
        ]) {
          themes[key.toLowerCase()] = formData[`themes${key}`] as string;
        }
        const brandCoreThemes = manageCoreThemes("brand", formData);
        const feedbackCoreThemes = manageCoreThemes("feedback", formData);

        // Handle Layout Guide
        const layoutGuide: layoutGuide = {
          minColumnWidth: formData["minColumnWidth"] as number,
          gutter: formData["gutter"] as number,
          horizontalBodyPadding: formData["horizontalBodyPadding"] as number,
          baselineGrid: formData["baselineGrid"] as number,
          minViewportHeight: formData["minViewportHeight"] as number,
          horizontalMainPadding: formData["horizontalMainPadding"] as number,
          maxContentHeight: formData["maxContentHeight"] as number,
          offsetHeight: formData["offsetHeight"] as number,
        };

        // Handle Radius
        const radius: Record<string, string> = {};
        for (const variable of COLLECTIONS.radius.variables as {
          name: string;
          default: number;
        }[]) {
          radius[variable.name] = formData[`radius${variable.name}`] as string;
        }

        // Handle Typography
        const baseFontSize = formData["baseFontSize"] as number;
        const fontStyles: Record<
          string,
          Record<
            string,
            Record<string, string | number | Record<string, string | number>>
          >
        > = {};
        for (const category of ["core", "editorial", "interface"]) {
          if (!fontStyles[category]) fontStyles[category] = {};
          for (const type of [
            "Body",
            "Subtitles",
            "Tech",
            "Heading",
            "Accent",
            "Meta",
          ]) {
            if (!fontStyles[category][type]) fontStyles[category][type] = {};
            for (const property of [
              "FontFamily",
              "FontStyle",
              "LetterSpacing",
            ]) {
              if (category === "editorial" && type === "Heading") {
                if (property === "FontFamily") {
                  fontStyles[category][type][property] = formData[
                    `${category}${type}${property}`
                  ] as string | number;
                } else {
                  for (const size of ["2XL", "XL", "LG", "MD", "SM", "XS"]) {
                    if (!fontStyles[category][type][property])
                      fontStyles[category][type][property] = {};
                    (
                      fontStyles[category][type][property] as Record<
                        string,
                        string | number
                      >
                    )[size] = formData[
                      `${category}${type}${size}${property}`
                    ] as string | number;
                  }
                }
              } else {
                fontStyles[category][type][property] = formData[
                  `${category}${type}${property}`
                ] as string | number;
              }
            }
          }
        }

        // Handle Text Datas
        let textDatasList: Record<string, any>[] = [];
        const textDatasFiles = formData["textDatasFiles"] as File[] | undefined;

        if (textDatasFiles && textDatasFiles.length > 0) {
          try {
            for (const file of textDatasFiles) {
              const jsonText = await file.text();
              const textData = JSON.parse(jsonText);
              textDatasList.push(textData);
            }
          } catch (error) {
            console.error("Failed to parse JSON file:", error);
          }
        }

        // Handle Images Datas
        const imagesDatasList: Record<
          string,
          Array<{
            name: string;
            data: ArrayBuffer;
            width: number;
            height: number;
          }>
        > = {};
        for (const [key, value] of Object.entries(formData)) {
          if (
            key.startsWith("imagesDatasFiles") &&
            !key.endsWith("-label") &&
            Array.isArray(value) &&
            value[0] instanceof File
          ) {
            const labelKey = `${key}-label`;
            const categoryName = formData[labelKey] || key;
            if (
              categoryName &&
              typeof categoryName === "string" &&
              categoryName.trim() !== ""
            ) {
              imagesDatasList[categoryName.trim()] = [];
              if (value && value.length > 0) {
                try {
                  for (const file of value) {
                    const arrayBuffer = await file.arrayBuffer();
                    const { width, height } = await new Promise<{
                      width: number;
                      height: number;
                    }>((resolve, reject) => {
                      const img = new window.Image();
                      img.onload = () =>
                        resolve({ width: img.width, height: img.height });
                      img.onerror = reject;
                      img.src = URL.createObjectURL(file);
                    });
                    imagesDatasList[categoryName.trim()].push({
                      name: file.name,
                      data: arrayBuffer,
                      width,
                      height,
                    });
                  }
                } catch (error) {
                  console.error("Failed to process image files:", error);
                }
              }
            }
          }
        }

        // Send message to plugin
        parent.postMessage(
          {
            pluginMessage: {
              type: `generate${toPascalCase(key)}`,
              datas: {
                colorsData,
                neutralColors,
                themes,
                brandCoreThemes,
                feedbackCoreThemes,
                layoutGuide,
                radius,
                baseFontSize,
                fontStyles,
                textDatasList,
                imagesDatasList,
              },
            },
          },
          "*",
        );
      });
    }
  });
}
