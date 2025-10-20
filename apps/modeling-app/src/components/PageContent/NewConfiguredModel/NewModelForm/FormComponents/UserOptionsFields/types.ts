export type OptionConfig = {
    type?: string;
    title?: string;
    description?: string;
    default?: unknown;
    enum?: unknown[];
    items?: OptionConfig;
    anyOf?: OptionConfig[];
};

export type FieldProps = {
    name: string;
    config: OptionConfig;
};
