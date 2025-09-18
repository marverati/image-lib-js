import examplesRaw from "./examples_raw.json";

export const examples = {} as Record<string, string>;
for (const [key, code] of Object.entries(examplesRaw as Record<string, string>)) {
    examples[key] = code as string;
}
