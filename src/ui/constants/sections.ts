import { converter, formatHex8 } from "culori";
import {
  generateGreyShades,
  generateShades,
} from "../../common/utils/colorUtils";
import type { SectionConfig, TabConfig, InputConfig } from "../types";
import { toCamelCase, toKebabCase } from "../../common/utils/textUtils";
import {
  COLLECTIONS,
  OPACITIES,
  SHADES,
} from "../../common/constants/variablesConstants";

// Générer les options d'opacité avec color indicators
const neutralOpacityOptions = OPACITIES.map((opacity) => {
  // Gris avec luminosité 50
  const greyShade = generateGreyShades(SHADES)[50];
  const greyShadeRGB = converter("rgb")(greyShade);
  if (!greyShadeRGB) {
    return { value: opacity, label: String(opacity) };
  } else {
    greyShadeRGB.alpha = opacity / 1000;
    return {
      value: opacity,
      label: String(opacity),
      color: formatHex8(greyShadeRGB),
    };
  }
});
const colorOpacityOptions = OPACITIES.map((opacity) => {
  const shade =
    generateShades("#0DB9F2").find((s) => s.step === 300)?.color || "#0DB9F2";
  const shadeRGB = converter("rgb")(shade);
  if (!shadeRGB) {
    return { value: opacity, label: String(opacity) };
  }
  shadeRGB.alpha = opacity / 1000;
  return {
    value: opacity,
    label: String(opacity),
    color: formatHex8(shadeRGB),
  };
});

/**
 * Helper functions for creating common configuration objects
 */

// Generate button factory
const btn = (label: string): InputConfig => {
  return {
    id: `${toKebabCase(label)}-btn`,
    type: "button",
    label,
    action: toCamelCase(label),
    class: "generate-btn",
  };
};

// Number input factory
const numInput = (
  id: string,
  label: string,
  defaultValue: number,
  min = 0,
  max?: number,
): InputConfig => ({
  id,
  label,
  type: "number",
  defaultValue,
  min,
  ...(max !== undefined && { max }),
});

// Text input factory
const textInput = (
  id: string,
  label: string,
  defaultValue: string,
): InputConfig => ({
  id,
  label,
  type: "text",
  defaultValue,
});

// Custom selector factory
const selector = (
  id: string,
  label: string,
  defaultValue: number,
  options: typeof neutralOpacityOptions | typeof colorOpacityOptions,
): InputConfig => ({
  id,
  label,
  type: "customSelector",
  defaultValue,
  options,
});

// File input factory
const fileInput = (id: string, label: string, accept: string): InputConfig => ({
  id,
  label,
  type: "file",
  accept,
  multiple: true,
  fileList: true,
});

// Image category input factory
const imageCategoryInput = (
  id: string,
  label: string,
  accept: string,
): InputConfig => ({
  id,
  label,
  type: "imageCategory",
  accept,
  multiple: true,
  imageCategory: true,
});

// Color collection factory
const colorCollection = (
  id: string,
  maxColors: number,
  initialColors: Array<{
    inputId: string;
    label: string;
    defaultColor: string;
  }>,
) => ({
  id,
  maxColors,
  initialColors,
});

/**
 * Tab configurations
 */

export const TABS: TabConfig[] = [
  {
    title: "Palette",
    sections: [
      {
        title: "Palette Generator",
        paletteGenerator: true,
      },
      {
        title: "Brand",
        colorCollection: colorCollection("brand", 10, [
          { inputId: "brand01", label: "Core", defaultColor: "#0db9f2" },
          { inputId: "brand02", label: "Support", defaultColor: "#4db2a1" },
          { inputId: "brand03", label: "Accent", defaultColor: "#a68659" },
        ]),
        inputs: [btn("Generate Brand Colors")],
      },
      {
        title: "Feedback",
        colorCollection: colorCollection("feedback", 10, [
          { inputId: "feedback01", label: "Info", defaultColor: "#00a6cb" },
          { inputId: "feedback02", label: "Success", defaultColor: "#a9c800" },
          { inputId: "feedback03", label: "Warning", defaultColor: "#e09f00" },
          { inputId: "feedback04", label: "Error", defaultColor: "#de3f26" },
        ]),
        inputs: [btn("Generate Feedback Colors")],
      },
      {
        title: "Neutral",
        subsections: [
          {
            colorSelectors: [
              { inputId: "greyHue", label: "Grey Hue", editableLabel: false },
            ],
          },
          {
            title: "Text opacities",
            inputs: [
              selector(
                "neutralTextSecondary",
                "Secondary",
                700,
                neutralOpacityOptions,
              ),
              selector(
                "neutralTextDisabled",
                "Disabled",
                300,
                neutralOpacityOptions,
              ),
              selector(
                "neutralTextHovered",
                "Hovered",
                400,
                neutralOpacityOptions,
              ),
              selector(
                "neutralTextSelected",
                "Selected",
                500,
                neutralOpacityOptions,
              ),
              selector(
                "neutralTextFocused",
                "Focused",
                500,
                neutralOpacityOptions,
              ),
            ],
          },
          {
            title: "Background opacities",
            inputs: [
              selector("neutralBgActive", "Active", 600, neutralOpacityOptions),
              selector(
                "neutralBackgroundDisabled",
                "Disabled",
                100,
                neutralOpacityOptions,
              ),
              selector(
                "neutralBackgroundHovered",
                "Hovered",
                200,
                neutralOpacityOptions,
              ),
              selector(
                "neutralBackgroundSelected",
                "Selected",
                300,
                neutralOpacityOptions,
              ),
              selector(
                "neutralBackgroundFocused",
                "Focused",
                300,
                neutralOpacityOptions,
              ),
            ],
          },
        ],
        inputs: [btn("Generate Neutral Colors")],
      },

      {
        inputs: [btn("Generate Palettes")],
      },
    ],
  },
  {
    title: "Themes",
    sections: [
      {
        title: "Themes Background Opacities",
        inputs: [
          selector("themesEnabled", "Enabled", 200, colorOpacityOptions),
          selector("themesDisabled", "Disabled", 100, colorOpacityOptions),
          selector("themesHovered", "Hovered", 50, colorOpacityOptions),
          selector("themesSelected", "Selected", 150, colorOpacityOptions),
          selector("themesFocused", "Focused", 300, colorOpacityOptions),
        ],
      },
      {
        inputs: [selector("themesBorder", "Border", 500, colorOpacityOptions)],
      },
      {
        inputs: [
          btn("Generate Themes"),
          btn("Generate Graphic Charter Colors"),
        ],
      },
    ],
  },
  {
    title: "Radius",
    sections: [
      {
        inputs: [
          ...(
            COLLECTIONS.radius.variables as {
              name: string;
              default: number;
            }[]
          )
            .filter(
              (radius) => radius.name !== "rounded" && radius.name !== "square",
            )
            .map((radius) =>
              numInput(
                `radius${radius.name}`,
                radius.name,
                radius.default,
                0,
                9999,
              ),
            ),
          btn("Generate Radius"),
        ] as InputConfig[],
      },
    ],
  },
  {
    title: "Typography",
    sections: [
      {
        inputs: [
          numInput("baseFontSize", "Base Font Size", 16, 8, 32),
          btn("Generate Font Sizes"),
        ],
      },
      {
        title: "Font Styles",
        subsections: [
          {
            title: "Body",
            inputs: [
              textInput("coreBodyFontFamily", "Family", "Roboto"),
              textInput("coreBodyFontStyle", "Style", "Light"),
              numInput("coreBodyLetterSpacing", "Letter Spacing", 0),
            ],
          },
          {
            title: "Subtitles",
            inputs: [
              textInput("coreSubtitlesFontFamily", "Family", "Roboto"),
              textInput("coreSubtitlesFontStyle", "Style", "Thin Italic"),
              numInput("coreSubtitlesLetterSpacing", "Letter Spacing", 0),
            ],
          },
          {
            title: "Tech",
            inputs: [
              textInput("coreTechFontFamily", "Family", "Roboto Mono"),
              textInput("coreTechFontStyle", "Style", "Regular"),
              numInput("coreTechLetterSpacing", "Letter Spacing", -5),
            ],
          },

          {
            title: "Editorial",
            subsections: [
              {
                title: "Heading",
                subsections: [
                  {
                    inputs: [
                      textInput(
                        "editorialHeadingFontFamily",
                        "Family",
                        "Roboto Condensed",
                      ),
                    ],
                  },
                  {
                    title: "2XL",
                    inputs: [
                      textInput(
                        "editorialHeading2XLFontStyle",
                        "Style",
                        "Black",
                      ),
                      numInput(
                        "editorialHeading2XLLetterSpacing",
                        "Letter Spacing",
                        -5,
                      ),
                    ],
                  },
                  {
                    title: "XL",
                    inputs: [
                      textInput(
                        "editorialHeadingXLFontStyle",
                        "Style",
                        "ExtraLight",
                      ),
                      numInput(
                        "editorialHeadingXLLetterSpacing",
                        "Letter Spacing",
                        0,
                      ),
                    ],
                  },
                  {
                    title: "LG",
                    inputs: [
                      textInput(
                        "editorialHeadingLGFontStyle",
                        "Style",
                        "ExtraLight",
                      ),
                      numInput(
                        "editorialHeadingLGLetterSpacing",
                        "Letter Spacing",
                        0,
                      ),
                    ],
                  },
                  {
                    title: "MD",
                    inputs: [
                      textInput(
                        "editorialHeadingMDFontStyle",
                        "Style",
                        "Light",
                      ),
                      numInput(
                        "editorialHeadingMDLetterSpacing",
                        "Letter Spacing",
                        0,
                      ),
                    ],
                  },
                  {
                    title: "SM",
                    inputs: [
                      textInput(
                        "editorialHeadingSMFontStyle",
                        "Style",
                        "Light",
                      ),
                      numInput(
                        "editorialHeadingSMLetterSpacing",
                        "Letter Spacing",
                        0,
                      ),
                    ],
                  },
                  {
                    title: "XS",
                    inputs: [
                      textInput(
                        "editorialHeadingXSFontStyle",
                        "Style",
                        "Regular",
                      ),
                      numInput(
                        "editorialHeadingXSLetterSpacing",
                        "Letter Spacing",
                        0,
                      ),
                    ],
                  },
                ],
              },
              {
                title: "Accent",
                inputs: [
                  textInput(
                    "editorialAccentFontFamily",
                    "Family",
                    "Parisienne",
                  ),
                  textInput("editorialAccentFontStyle", "Style", "Regular"),
                  numInput("editorialAccentLetterSpacing", "Letter Spacing", 0),
                ],
              },
            ],
          },
          {
            title: "Interface",
            subsections: [
              {
                title: "Headings",
                inputs: [
                  textInput(
                    "interfaceHeadingFontFamily",
                    "Family",
                    "Roboto Condensed",
                  ),
                  textInput("interfaceHeadingFontStyle", "Style", "Black"),
                  numInput(
                    "interfaceHeadingLetterSpacing",
                    "Letter Spacing",
                    -5,
                  ),
                ],
              },
              {
                title: "Meta",
                inputs: [
                  textInput(
                    "interfaceMetaFontFamily",
                    "Family",
                    "Roboto Condensed",
                  ),
                  textInput("interfaceMetaFontStyle", "Style", "Medium"),
                  numInput("interfaceMetaLetterSpacing", "Letter Spacing", 0),
                ],
              },
            ],
          },
        ],
        inputs: [
          btn("Generate Font Styles"),
          btn("Generate Graphic Charter Typography"),
        ],
      },
      {
        inputs: [btn("Generate Typography")],
      },
    ],
  },
  {
    title: "Effects",
    sections: [
      {
        inputs: [btn("Generate Elevations Effects")],
      },
    ],
  },
  {
    title: "Layout guide",
    sections: [
      {
        title: "Grid Settings",
        inputs: [
          numInput("minColumnWidth", "Min Column Width", 96),
          numInput("gutter", "Gutter", 16),
          numInput("horizontalBodyPadding", "Horizontal Body Padding", 32),
          numInput("baselineGrid", "Baseline Grid", 24),
          numInput("minViewportHeight", "Min Viewport Height", 312),
        ],
      },
      {
        title: "Content Settings",
        inputs: [
          numInput("horizontalMainPadding", "Horizontal Main Padding", 0),
          numInput("maxContentHeight", "Max Content Height", 1080),
          numInput("offsetHeight", "Offset Height", 96),
        ],
      },
      {
        inputs: [btn("Generate Layout Guide"), btn("Generate Viewports Pages")],
      },
    ],
  },
  {
    title: "Datas",
    sections: [
      {
        inputs: [
          fileInput("textDatasFiles", "Text", "application/json"),
          btn("Generate Text Datas"),
        ],
      },
      {
        inputs: [
          imageCategoryInput("imagesDatasFiles", "Images", "image/*"),
          btn("Generate Images Datas"),
        ],
      },
      {
        inputs: [btn("Generate Datas")],
      },
    ],
  },
];

// Rétro-compatibilité: exporter les sections à plat
export const SECTIONS: SectionConfig[] = TABS.flatMap((tab) => tab.sections);
