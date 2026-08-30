export interface User {
    id: string | number;
    name: string;
    role?: string;
    email: string;
    is_active: boolean;
    avatar?: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
}
