export interface Flavor {
    id: string;
    name: string;
    products_count: number;
}

export interface FlavorSummary {
    id: string;
    name: string;
}

export interface FlavorPayload {
    name: string;
}
