import { catchErrorSync } from "./errorUtils";

const FILE_NAME = "gradientUtils";

export const angleToTransform = catchErrorSync(
  (deg: number): number[][] => {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return [
      [cos, sin, 0],
      [-sin, cos, 0],
    ];
  },
  `${FILE_NAME}.angleToTransform`,
  false,
);
