import { Pagination } from '@/app/core/models/api.model';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewCustomer {
    name: string;
    email?: string | null;
}

export interface ReviewProductSummary {
    id: string;
    name: string;
    code?: string | null;
}

export interface Review {
    id: string;
    product_id: string;
    product?: ReviewProductSummary | null;
    rating: number;
    title: string | null;
    body: string;
    images: string[] | null;
    is_verified: boolean;
    status: ReviewStatus;
    customer: ReviewCustomer | null;
    created_at: string;
    updated_at?: string;
}

export interface ReviewList {
    items: Review[];
    pagination: Pagination;
}

export interface ReviewFilters {
    page?: number;
    per_page?: number;
    status?: ReviewStatus | null;
    rating?: number | null;
    product_id?: string | null;
}

export interface ReviewModerationPayload {
    status: 'approved' | 'rejected';
}

export const REVIEW_STATUS_OPTIONS: { label: string; value: ReviewStatus; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' }[] = [
    { label: 'Pendientes', value: 'pending', severity: 'warn' },
    { label: 'Aprobadas', value: 'approved', severity: 'success' },
    { label: 'Rechazadas', value: 'rejected', severity: 'danger' }
];

export const REVIEW_RATING_OPTIONS: { label: string; value: number }[] = [1, 2, 3, 4, 5].map((value) => ({ label: `${value} estrella${value > 1 ? 's' : ''}`, value }));
