"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Lang, Translations, TRANSLATIONS } from "./i18n";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Exclude<keyof Translations, "examplePrompts">) => string;
  tArr: (key: "examplePrompts") => string[];
}

const LangContext = createContext<LangContextValue>({
  lang: "zh",
  setLang: () => { },
  t: (key) => TRANSLATIONS.zh[key] as string,
  tArr: () => TRANSLATIONS.zh.examplePrompts,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("zh");

  const t = (key: Exclude<keyof Translations, "examplePrompts">): string =>
    TRANSLATIONS[lang][key] as string;

  const tArr = (key: "examplePrompts"): string[] =>
    TRANSLATIONS[lang][key] as string[];

  return (
    <LangContext.Provider value={{ lang, setLang, t, tArr }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
