export interface TaxClass {
    id: string;
    name: string;
    code: string;
    rate: number;
    created_at?: string;
    updated_at?: string;
}

export interface TaxClassPayload {
    name: string;
    code: string;
    rate: number;
}
