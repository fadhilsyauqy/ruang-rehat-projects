import { id, type Dictionary } from "./id";
import { en } from "./en";

export const dict = {
  id,
  en,
};

export const dictionaries = dict;

export type Lang = "id" | "en";
export type { Dictionary };

export const getDictionary = (lang: string): Dictionary => {
  return dict[lang as Lang] || dict["id"];
};

export default getDictionary;
