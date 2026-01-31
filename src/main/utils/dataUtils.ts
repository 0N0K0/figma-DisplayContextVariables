import { catchErrorSync } from "./errorUtils";

const FILE_NAME = "dataUtils";

function flattenImpl(obj: any, prefix = "", out: Record<string, string> = {}) {
  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      flattenImpl(obj[key], prefix + key + "/", out);
    } else {
      out[prefix + key] = String(obj[key]);
    }
  }
  return out;
}

export const flatten = catchErrorSync(
  flattenImpl,
  `${FILE_NAME}.flatten`,
  false,
);

export const shuffle = catchErrorSync(
  <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },
  `${FILE_NAME}.shuffle`,
  false,
);

export const sliceItems = catchErrorSync(
  (index: number, itemsCount: number, array: any[]): any[] => {
    const start = index * itemsCount;
    return array.slice(start, start + itemsCount);
  },
  `${FILE_NAME}.sliceItems`,
  false,
);

function generateCombinationsRecursive<T>(
  array: T[],
  comboLength: number,
  start: number,
  combo: T[],
  results: T[][],
) {
  if (combo.length === comboLength) {
    results.push([...combo]);
    return;
  }
  for (let i = start; i < array.length; i++) {
    combo.push(array[i]);
    generateCombinationsRecursive(array, comboLength, i + 1, combo, results);
    combo.pop();
  }
}

export const getCombinations = catchErrorSync(
  <T>(array: T[], comboLength: number): T[][] => {
    const results: T[][] = [];
    generateCombinationsRecursive(array, comboLength, 0, [], results);
    return results;
  },
  `${FILE_NAME}.getCombinations`,
  false,
);
