import config from "@/data/ui-config.json";

export const ui = config;
export type SentimentKey = keyof typeof config.sentiment;
export type EventTypeKey = keyof typeof config.event_types;
export type SeverityKey = keyof typeof config.severity;
