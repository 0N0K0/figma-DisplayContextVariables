import { ColorCollection } from "../components/colorCollection";
import { generateGreyShades } from "../../common/utils/colorUtils";
import { converter, formatHex8 } from "culori";
import type { SelectOption, TabConfig } from "../types";
import { customSelectors } from "../state/selectors";
import { OPACITIES, SHADES } from "../../common/constants/variablesConstants";

declare global {
  interface Window {
    __TABS_CONFIG__: TabConfig[];
  }
}

export function initColorCollections() {
  const containers =
    document.querySelectorAll<HTMLElement>(".color-collection");

  containers.forEach((container) => {
    const collectionId = container.dataset.collectionId;

    let initialColors: any[] = [];
    if (window.__TABS_CONFIG__) {
      for (const tab of window.__TABS_CONFIG__) {
        for (const section of tab.sections) {
          if (section.colorCollection?.id === collectionId) {
            initialColors = section.colorCollection?.initialColors || [];
            break;
          }
        }
      }
    }

    new ColorCollection(container, initialColors);
  });
}

export function buildOpacityOptionsWithHue(
  baseHex?: string,
): SelectOption<number>[] {
  const oklch = baseHex ? converter("oklch")(baseHex) : null;
  const hue = oklch?.h ?? 0;
  const greyShade = generateGreyShades(SHADES, hue)[50];
  const greyRGB = converter("rgb")(greyShade);

  if (!greyRGB) {
    return OPACITIES.map((opacity) => ({
      value: opacity,
      label: String(opacity),
    }));
  }

  return OPACITIES.map((opacity) => {
    const colorWithAlpha = { ...greyRGB, alpha: opacity / 1000 };
    return {
      value: opacity,
      label: String(opacity),
      color: formatHex8(colorWithAlpha),
    };
  });
}

export function updateOpacitySelectors(baseHex?: string): void {
  const options = buildOpacityOptionsWithHue(baseHex);
  const targetIds = [];
  for (const key of [
    "TextSecondary",
    "TextHovered",
    "TextSelected",
    "TextFocused",
    "TextDisabled",
    "BgActive",
    "BgHovered",
    "BgSelected",
    "BgFocused",
    "BgDisabled",
  ]) {
    const neutralKey = `neutral${key}Op`;
    targetIds.push(neutralKey);
  }

  targetIds.forEach((id) => {
    const selector = customSelectors.get(id);
    if (!selector) return;
    const currentValue = selector.getValue();
    selector.updateOptions(options);
    selector.setValue(currentValue);
  });
}

export function watchGreyHueChanges(): void {
  const btn = document.querySelector<HTMLElement>(
    '.color-selector-btn[data-input-id="greyHue"]',
  );
  const text = btn?.querySelector<HTMLElement>(".color-text");
  if (!text) return;

  const applyUpdate = () => {
    const value = text.textContent || "";
    const baseHex = value.startsWith("#") ? value : undefined;
    updateOpacitySelectors(baseHex);
  };

  applyUpdate();

  const observer = new MutationObserver(() => applyUpdate());
  observer.observe(text, {
    childList: true,
    characterData: true,
    subtree: true,
  });
}
