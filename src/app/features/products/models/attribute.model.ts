export interface AttributeOptionValue {
    id?: string;
    value: string;
    image_url?: string | null;
    color_hex?: string | null;
    order?: number;
}

export interface Attribute {
    id: string;
    type: string;
    label: string;
    options: AttributeOptionValue[];
    options_count?: number;
}

export interface AttributePayload {
    type: string;
    label: string;
    options?: AttributeOptionValue[];
}
