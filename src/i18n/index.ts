import { en } from "./en";
import { zh } from "./zh";

export type Language = "en" | "zh";

export const messages = {
  en,
  zh,
} as const;

export const getLanguage = (language?: string | null): Language => {
  return language === "zh" ? "zh" : "en";
};