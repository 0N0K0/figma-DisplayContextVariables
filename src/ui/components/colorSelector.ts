import { COLOR_DATA } from "../constants";

/** Mettre à true pour activer les logs de débogage. Toujours false en production. */
const DEBUG = false;

function formatColorName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function createColorGrid(
  popup: HTMLElement,
  onSelectColor: (color: string, source?: HTMLElement) => void,
  onClear: () => void,
  inputId?: string,
): void {
  const gridContainer = popup.querySelector(".color-selector-grid");
  if (!gridContainer) return;

  gridContainer.innerHTML = "";

  // Zone de couleur personnalisée
  const customRow = document.createElement("div");
  customRow.className = "color-custom";

  const customInput = document.createElement("input");
  customInput.type = "text";
  customInput.placeholder = "#ffffff";
  customInput.className = "color-custom-input";

  const applyBtn = document.createElement("button");
  applyBtn.type = "button";
  applyBtn.classList.add("icon-btn");
  applyBtn.innerHTML = `<i class="mdi mdi-check-circle-outline"></i>`;

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.classList.add("icon-btn");
  clearBtn.innerHTML = `<i class="mdi mdi-eyedropper-off"></i>`;
  applyBtn.addEventListener("click", () => {
    const val = customInput.value.trim();
    if (!val) return;
    onSelectColor(val);
  });

  clearBtn.addEventListener("click", () => {
    customInput.value = "";
    onClear();
  });

  customRow.appendChild(customInput);
  customRow.appendChild(applyBtn);
  customRow.appendChild(clearBtn);
  gridContainer.appendChild(customRow);

  // Wrapper pour les swatches (indépendant de la ligne custom)
  const swatchContainer = document.createElement("div");
  swatchContainer.className = "color-swatch-wrapper";
  gridContainer.appendChild(swatchContainer);

  // Créer une colonne par famille de couleur
  const isGreyHue = inputId === "greyHue";

  if (isGreyHue) {
    gridContainer.classList.add("grey-hue-grid");

    Object.entries(COLOR_DATA).forEach(([colorName, shades]) => {
      const shadeEntry = Object.entries(shades).find(([key]) => key === "c20");
      if (!shadeEntry) return;
      const [, hex] = shadeEntry;

      const swatch = document.createElement("div");
      swatch.className = "color-swatch";
      swatch.style.backgroundColor = String(hex);
      swatch.dataset.color = String(hex);
      swatch.title = `${formatColorName(colorName)} c20: ${hex}`;

      swatch.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectColor(String(hex), swatch);
      });

      swatchContainer.appendChild(swatch);
    });

    return;
  }

  Object.entries(COLOR_DATA).forEach(([colorName, shades]) => {
    const shadeEntries = Object.entries(shades);

    if (shadeEntries.length === 0) return;

    const familyDiv = document.createElement("div");
    familyDiv.className = "color-family";

    // Ajouter le label de la famille en haut
    const familyLabel = document.createElement("div");
    familyLabel.className = "color-family-label";
    familyLabel.textContent = formatColorName(colorName);
    familyDiv.appendChild(familyLabel);

    // Wrapper pour tous les swatches de la famille
    const swatchWrapper = document.createElement("div");
    swatchWrapper.className = "color-swatch-wrapper";

    // Swatches de la famille (du plus saturé au moins saturé)
    shadeEntries.forEach(([shade, hex]) => {
      const swatch = document.createElement("div");
      swatch.className = "color-swatch";
      swatch.style.backgroundColor = String(hex);
      swatch.dataset.color = String(hex);
      swatch.title = `${formatColorName(colorName)} ${shade}: ${hex}`;

      swatch.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectColor(String(hex), swatch);
      });

      swatchWrapper.appendChild(swatch);
    });

    familyDiv.appendChild(swatchWrapper);

    swatchContainer.appendChild(familyDiv);
  });
}

export function initColorSelector(wrapper: HTMLElement): void {
  // Éviter les doubles initialisations qui provoquent des toggles successifs
  if (wrapper.dataset.initialized === "true") {
    return;
  }
  wrapper.dataset.initialized = "true";

  const button = wrapper.querySelector<HTMLElement>(".color-selector-btn");
  const popup = wrapper.querySelector<HTMLElement>(".color-selector-popup");
  const preview = wrapper.querySelector<HTMLElement>(".color-preview");
  const text = wrapper.querySelector<HTMLElement>(".color-text");

  if (!button || !popup || !preview || !text) {
    if (DEBUG) console.warn("❌ Color selector elements not found", {
      button: !!button,
      popup: !!popup,
      preview: !!preview,
      text: !!text,
    });
    return;
  }

  const defaultColor = button.dataset.default || "transparent";
  const isTransparent = defaultColor === "transparent";

  // Initialiser la couleur par défaut
  const applyInitialColor = () => {
    preview.style.backgroundColor = defaultColor;
    text.textContent = isTransparent ? "Select Color" : defaultColor;
    if (isTransparent) {
      preview.classList.add("empty");
    } else {
      preview.classList.remove("empty");
    }
  };

  const setCustomInputValue = () => {
    const customInput = popup.querySelector<HTMLInputElement>(
      ".color-custom-input",
    );
    if (customInput && !isTransparent) {
      customInput.value = defaultColor;
    }
  };

  applyInitialColor();

  const setColor = (color: string) => {
    const transparent = color === "transparent";
    preview.style.backgroundColor = color;
    text.textContent = transparent ? "Select Color" : color;
    if (transparent) {
      preview.classList.add("empty");
    } else {
      preview.classList.remove("empty");
    }
  };

  const clearSelection = () => {
    setColor("transparent");
    popup
      .querySelectorAll(".color-swatch")
      .forEach((s) => s.classList.remove("selected"));
  };

  // Créer la grille de couleurs
  createColorGrid(
    popup,
    (color, source) => {
      setColor(color);
      // Mettre à jour le champ custom color
      const customInput = popup.querySelector<HTMLInputElement>(
        ".color-custom-input",
      );
      if (customInput) {
        customInput.value = color;
      }
      popup
        .querySelectorAll(".color-swatch")
        .forEach((s) => s.classList.remove("selected"));
      if (source) source.classList.add("selected");

      // Fermer le popup après sélection
      popup.classList.remove("active");
      button.classList.remove("active");
    },
    () => {
      // clearSelection avec mise à jour du champ custom
      clearSelection();
      const customInput = popup.querySelector<HTMLInputElement>(
        ".color-custom-input",
      );
      if (customInput) {
        customInput.value = "";
      }
    },
    button.dataset.inputId,
  );

  // Mettre à jour le champ custom color avec la valeur par défaut après création
  setCustomInputValue();

  // Toggle popup au clic sur le bouton
  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isActive = popup.classList.contains("active");

    // Fermer tous les autres popups
    document.querySelectorAll(".color-selector-popup.active").forEach((p) => {
      if (p !== popup) {
        p.classList.remove("active");
      }
    });
    document.querySelectorAll(".color-selector-btn.active").forEach((b) => {
      if (b !== button) {
        b.classList.remove("active");
      }
    });

    if (!isActive) {
      popup.classList.add("active");
      button.classList.add("active");
    } else {
      popup.classList.remove("active");
      button.classList.remove("active");
    }
  });

  // Sélection de couleur via swatch (géré dans createColorGrid)
}

export function initAllColorSelectors(): void {
  const wrappers = document.querySelectorAll<HTMLElement>(
    ".color-selector-wrapper",
  );

  if (wrappers.length === 0) {
    console.error("❌ CRITICAL: No color selector wrappers found!");
    if (DEBUG) console.log("Available divs:", document.querySelectorAll("div").length);
    return;
  }

  wrappers.forEach((wrapper, index) => {
    initColorSelector(wrapper);
  });

  // Fermer les popups au clic extérieur
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const isButton = target.closest(".color-selector-btn");
    const isPopup = target.closest(".color-selector-popup");

    if (!isButton && !isPopup) {
      document
        .querySelectorAll(".color-selector-popup.active")
        .forEach((popup) => {
          popup.classList.remove("active");
        });
      document
        .querySelectorAll(".color-selector-btn.active")
        .forEach((button) => {
          button.classList.remove("active");
        });
    }
  });
}