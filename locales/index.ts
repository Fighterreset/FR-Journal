import hu from "./hu";
import en from "./en";

export const translations = {
  hu,
  en,
};

export type Language = keyof typeof translations;