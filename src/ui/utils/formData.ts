

/** Mettre à true pour activer les logs de débogage. Toujours false en production. */
const DEBUG = false;
export interface FormData {
  [key: string]: string | number | File[];
}

export function getFormData(): FormData {
  const data: FormData = {};

  // Récupérer tous les inputs classiques
  document.querySelectorAll<HTMLInputElement>("input[id]").forEach((input) => {
    if (input.type === "number") {
      data[input.id] = input.value === "" ? "" : parseFloat(input.value);
    } else {
      data[input.id] = input.value;
    }
  });

  // Récupérer tous les selects
  document
    .querySelectorAll<HTMLSelectElement>("select[id]")
    .forEach((select) => {
      const value = isNaN(Number(select.value))
        ? select.value
        : Number(select.value);
      data[select.id] = value;
    });

  // Récupérer les couleurs du générateur de palette
  document
    .querySelectorAll<HTMLInputElement>(".palette-hex-input")
    .forEach((input, index) => {
      data[`paletteGenerated_${index}`] = input.value;
    });

  // Récupérer les couleurs des color selectors
  document
    .querySelectorAll<HTMLElement>(".color-selector-btn")
    .forEach((button) => {
      const inputId = button.dataset.inputId;
      if (!inputId) return;

      const colorText = button.querySelector<HTMLElement>(".color-text");
      if (!colorText) return;

      data[inputId] = colorText.textContent || "#000000";
    });

  // Récupérer les labels des color selectors
  document
    .querySelectorAll<HTMLInputElement>(".color-label-input")
    .forEach((input) => {
      const inputId = input.dataset.inputId;
      if (inputId) {
        data[inputId] = input.value || "";
      }
    });

  // Récupérer les valeurs des custom selectors
  document
    .querySelectorAll<HTMLElement>(".custom-selector")
    .forEach((selector) => {
      const inputId = selector.dataset.inputId;
      if (!inputId) return;

      const button = selector.querySelector<HTMLElement>(
        ".custom-selector-btn",
      );
      if (!button) return;

      const value = button.dataset.value;
      if (value !== undefined) {
        // Convertir en nombre si c'est un nombre
        data[inputId] = isNaN(Number(value)) ? value : Number(value);
      }
    });

  // Récupérer les fichiers des file lists
  document
    .querySelectorAll<HTMLElement>(".file-list-items") // ⭐ Chercher directement les conteneurs de liste
    .forEach((container) => {
      const inputId = container.dataset.inputId;

      if (!inputId) return;

      const fileListInstance = window.fileLists?.[inputId];

      if (fileListInstance && typeof fileListInstance.getFiles === "function") {
        const files = fileListInstance.getFiles();
        data[inputId] = files;
      } else {
        if (DEBUG) console.warn(
          "❌ Pas d'instance ou pas de méthode getFiles pour:",
          inputId,
        );
      }
    });

  return data;
}