export interface UbigeoItem {
    code: string;
    name: string;
    parent_code?: string | null;
    price?: number | null;
    is_active?: boolean;
    has_coverage?: boolean;
    inherited_price?: boolean;
    delivery_zone_id?: number | null;
}

export interface DeliveryZonePayload {
  ubigeo_code: string;
  price: number;
  is_active: boolean;
  level?: 'department' | 'province' | 'district';
  department_code?: string | null;
  province_code?: string | null;
}

export interface DeliveryGlobalConfig {
  min_free_shipping_amount: number;
  min_order_amount: number;
}