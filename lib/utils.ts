import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateColorFromAddress = (address: string) => {
  const stringToHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  };

  const hash1 = stringToHash(`color1-${address}`);
  const hash2 = stringToHash(`color2-${address}`);

  const color1 = `#${((hash1 >>> 0) & 0xffffff).toString(16).padStart(6, "0")}`;
  const color2 = `#${((hash2 >>> 0) & 0xffffff).toString(16).padStart(6, "0")}`;

  return `linear-gradient(45deg, ${color1}, ${color2})`;
};
