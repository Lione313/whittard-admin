export interface Attribution {
    id: string;
    name: string;
    image_url: string | null;
    products_count: number;
}

export interface AttributionPayload {
    name: string;
    image_url?: string | null;
}
