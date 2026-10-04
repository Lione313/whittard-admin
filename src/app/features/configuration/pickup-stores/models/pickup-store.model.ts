export interface PickupStore {
    id: number;
    name: string;
    address: string | null;
    schedule: string | null;
    sort_order: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface PickupStorePayload {
    name: string;
    address?: string | null;
    schedule?: string | null;
    sort_order?: number;
    is_active?: boolean;
}
