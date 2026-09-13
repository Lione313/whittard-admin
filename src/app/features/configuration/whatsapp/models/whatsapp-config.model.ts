export interface WhatsappConfig {
    id: number;
    phone_number: string | null;
    welcome_message: string | null;
    hover_text: string | null;
    image_url: string | null;
    is_active: boolean;
    updated_at?: string;
}

export interface WhatsappConfigPayload {
    phone_number?: string;
    welcome_message?: string;
    hover_text?: string;
    image?: File | null;
    is_active?: boolean;
}