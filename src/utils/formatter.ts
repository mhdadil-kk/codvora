import { format } from "prettier/standalone";
import * as parserBabel from "prettier/plugins/babel";
import * as parserEstree from "prettier/plugins/estree";
import { Language } from "../types";

export const formatCode = async (code: string, language: Language): Promise<string> => {
    try {
        if (language === 'javascript' || language === 'react' || language === 'nodejs' || language === 'mongodb') {
            return await format(code, {
                parser: "babel",
                plugins: [parserBabel, parserEstree] as any[],
                semi: true,
                singleQuote: true,
            });
        }
        // Add other languages here if plugins are available
        return code;
    } catch (error) {
        console.error("Formatting failed:", error);
        return code;
    }
};

export const isFormatSupported = (language: Language): boolean => {
    return ['javascript', 'react', 'nodejs', 'mongodb'].includes(language);
};
