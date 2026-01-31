/**
 * Constantes des scopes pour les variables Figma
 */
export const SCOPES = {
  FLOAT: {
    ALL: "ALL_SCOPES" as VariableScope,
    TEXT_CONTENT: "TEXT_CONTENT" as VariableScope,
    CORNER_RADIUS: "CORNER_RADIUS" as VariableScope,
    WIDTH_HEIGHT: "WIDTH_HEIGHT" as VariableScope,
    GAP: "GAP" as VariableScope,
    OPACITY: "OPACITY" as VariableScope,
    STROKE_FLOAT: "STROKE_FLOAT" as VariableScope,
    EFFECT_FLOAT: "EFFECT_FLOAT" as VariableScope,
    FONT_WEIGHT: "FONT_WEIGHT" as VariableScope,
    FONT_SIZE: "FONT_SIZE" as VariableScope,
    LINE_HEIGHT: "LINE_HEIGHT" as VariableScope,
    LETTER_SPACING: "LETTER_SPACING" as VariableScope,
    PARAGRAPH_SPACING: "PARAGRAPH_SPACING" as VariableScope,
    PARAGRAPH_INDENT: "PARAGRAPH_INDENT" as VariableScope,
  },
  COLOR: {
    ALL: "ALL_SCOPES" as VariableScope,
    ALL_FILLS: "ALL_FILLS" as VariableScope,
    FRAME_FILL: "FRAME_FILL" as VariableScope,
    SHAPE_FILL: "SHAPE_FILL" as VariableScope,
    TEXT_FILL: "TEXT_FILL" as VariableScope,
    STROKE_COLOR: "STROKE_COLOR" as VariableScope,
    EFFECT_COLOR: "EFFECT_COLOR" as VariableScope,
  },
  STRING: {
    ALL: "ALL_SCOPES" as VariableScope,
    TEXT_CONTENT: "TEXT_CONTENT" as VariableScope,
    FONT_FAMILY: "FONT_FAMILY" as VariableScope,
    FONT_STYLE: "FONT_STYLE" as VariableScope,
  },
} as const;

export const SHADES = [50];
for (let i = 100; i <= 900; i += 100) {
  SHADES.push(i);
}
SHADES.push(950);

const NEUTRAL_SHADES = [0, ...SHADES, 1000];

const OPACITIES = [];
for (let i = 50; i <= 950; i += 50) {
  OPACITIES.push(i);
}

const STATES = ["disabled", "hovered", "selected", "focused"];

const ELEVATIONS = [];
for (let i = 0; i <= 12; i++) {
  ELEVATIONS.push(i);
}

const CONTRAST_COLORS = ["light", "main", "dark"];

export const THEMES_COLORS = {
  opacity: OPACITIES,
  core: [...CONTRAST_COLORS, "border"],
  contrast: CONTRAST_COLORS,
  state: ["enabled", ...STATES],
};

const FONT_STYLES = ["font-family", "font-style", "letter-spacing"];

const SIZES = ["xxl", "xl", "lg", "md", "sm", "xs"];

const RATIOS = ["21:9", "20:9", "18:9", "16:9", "16:10", "4:3", "1:1"];
const ORIENTATIONS = ["portrait", "landscape"];

const WIDTH_HEIGHT = ["min", "max"];

const COLUMNS = [];
for (let i = 1; i <= 12; i++) {
  COLUMNS.push(i);
}

const DIVISIONS = ["1:4", "1:3", "1:2", "2:3", "3:4"];

const PERCENTAGES = [];
for (let i = 50; i <= 100; i += 25) {
  PERCENTAGES.push(`${i}%`);
}

export const COLLECTIONS: Record<
  string,
  {
    name: string;
    modes?: string[];
    variables: Record<string, any> | string[];
  }
> = {
  palette: {
    name: "Style\\Colors\\Palette",
    variables: {
      brand: {}, // filled dynamically by systemUtils
      feedback: {}, // filled dynamically by systemUtils
      neutral: {
        grey: { shade: NEUTRAL_SHADES, opacity: OPACITIES },
        "lightGrey-opacity": OPACITIES,
        "darkGrey-opacity": OPACITIES,
      },
    },
  },
  themes: {
    name: "Style\\Colors\\Themes",
    modes: ["light", "dark"],
    variables: {
      brand: {}, // filled dynamically by systemUtils
      feedback: {}, // filled dynamically by systemUtils
      neutral: {
        border: "border",
        text: {
          core: ["primary", "secondary"],
          state: STATES,
        },
        background: {
          elevation: ELEVATIONS,
          state: STATES,
        },
      },
    },
  },
  brand: {
    name: "Style\\Colors\\Brand",
    modes: [], // filled dynamically by systemUtils
    variables: {}, // filled dynamically
  },
  feedback: {
    name: "Style\\Colors\\Feedback",
    modes: [], // filled dynamically by systemUtils
    variables: {}, // filled dynamically
  },
  radius: {
    name: "Style\\Radius",
    variables: [
      { name: "square", default: 0 },
      { name: "xs", default: 2 },
      { name: "sm", default: 4 },
      { name: "md", default: 8 },
      { name: "lg", default: 16 },
      { name: "xl", default: 24 },
      { name: "xxl", default: 32 },
      { name: "rounded", default: 9999 },
    ],
  },
  typography: {
    name: "Style\\Typography",
    variables: {
      core: {
        body: FONT_STYLES,
        subtitles: FONT_STYLES,
        tech: FONT_STYLES,
      },
      editorial: {
        heading: {}, // filled dynamically
        accent: FONT_STYLES,
      },
      interface: {
        heading: FONT_STYLES,
        meta: FONT_STYLES,
      },
    },
  },
  breakpoints: {
    name: "System\\Breakpoints",
    modes: SIZES,
    variables: {
      viewport: {
        width: WIDTH_HEIGHT,
        height: {}, // filled dynamically
      },
      contentWidth: {
        columns: {}, // filled dynamically
        division: {}, // filled dynamically
      },
    },
  },
  ratios: {
    name: "System\\Ratios",
    modes: RATIOS,
    variables: {
      portrait: [],
      landscape: [],
    },
  },
  orientations: {
    name: "System\\Orientations",
    modes: ORIENTATIONS,
    variables: [],
  },
  verticalDensities: {
    name: "System\\VerticalDensities",
    modes: ["loose", "compact", "tight"],
    variables: {
      viewportHeight: WIDTH_HEIGHT,
      spacing: [], // filled dynamically
      typography: {
        body: {}, // filled dynamically
        heading: {}, // filled dynamically
      },
      positionSticky: "position-sticky",
    },
  },
  contentHeight: { name: "System\\ContentHeight", variables: [] },
  devices: {
    name: "System\\Devices",
    modes: [
      "desktop/xl",
      "desktop/lg",
      "tablet/portrait/md",
      "tablet/portrait/sm",
      "tablet/landscape/md",
      "mobile/portrait/xs",
      "mobile/landscape/md",
    ],
    variables: {
      viewport: ["width", "height"],
      content: {
        width: { columns: COLUMNS, division: DIVISIONS },
        height: { full: PERCENTAGES, minusOffset: PERCENTAGES },
      },
    },
  },
};

for (const [collectionKey, collectionValue] of Object.entries(COLLECTIONS)) {
  if (collectionKey === "brand" || collectionKey === "feedback") {
    collectionValue.variables = {
      shade: SHADES,
      ...THEMES_COLORS,
    };
  } else if (
    collectionKey === "typography" &&
    !Array.isArray(collectionValue.variables)
  ) {
    for (const groupValue of Object.values(
      collectionValue.variables.editorial.heading,
    )) {
      for (const fontSize of SIZES) {
        (groupValue as Record<string, any>)[fontSize] = FONT_STYLES;
      }
    }
  } else if (
    collectionKey === "breakpoints" &&
    !Array.isArray(collectionValue.variables)
  ) {
    for (const orientation of ORIENTATIONS) {
      collectionValue.variables.viewport.height[orientation] = {};
      for (const ratio of RATIOS) {
        collectionValue.variables.viewport.height[orientation][ratio] =
          WIDTH_HEIGHT;
      }
    }
    for (const [groupKey, groupValue] of Object.entries(
      collectionValue.variables.contentWidth,
    )) {
      (groupValue as Record<string, any>)[groupKey.toUpperCase()] =
        WIDTH_HEIGHT;
    }
  } else if (collectionKey === "ratios" || collectionKey === "orientations") {
    const variables = WIDTH_HEIGHT.map((item) => "viewport-height-" + item);
    if (collectionKey === "ratios") {
      for (const groupValue of Object.values(collectionValue.variables)) {
        if (Array.isArray(groupValue)) groupValue.push(...variables);
      }
    } else {
      collectionValue.variables.push(...variables);
    }
  } else if (collectionKey === "verticalDensities") {
    for (const [groupKey, groupValue] of Object.entries(
      collectionValue.variables,
    )) {
      if (groupKey === "spacing") {
        groupValue.push(...["1:4", "1:3", "1:2", "2:3", "3:4"]);
        for (let i = 0; i <= 8; i++) {
          groupValue.push(i);
        }
      } else if (groupKey === "typography") {
        for (const [subgroupKey, subgroupValue] of Object.entries(groupValue)) {
          for (const size of SIZES) {
            if (subgroupKey === "body" && size.includes("xl")) continue;
            (subgroupValue as Record<string, any>)[size] = FONT_STYLES;
          }
        }
      }
    }
  }
}
