export interface MediaAcceptance {
    extensions: string[];
    maxBytes: number;
}

export const GALLERY_ACCEPTANCE: MediaAcceptance = {
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'mp4', 'webm', 'mov'],
    maxBytes: 100 * 1024 * 1024
};

export const SWATCH_ACCEPTANCE: MediaAcceptance = {
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
    maxBytes: 20 * 1024 * 1024
};

export const BADGE_ACCEPTANCE: MediaAcceptance = {
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
    maxBytes: 20 * 1024 * 1024
};

export function validateMediaFile(file: File, acceptance: MediaAcceptance): string | null {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (!acceptance.extensions.includes(ext)) {
        return `Formato no permitido (${ext}). Permitidos: ${acceptance.extensions.join(', ')}.`;
    }

    if (file.size > acceptance.maxBytes) {
        const maxMb = (acceptance.maxBytes / 1024 / 1024).toFixed(0);

        return `El archivo supera el tamaño máximo de ${maxMb}MB.`;
    }

    return null;
}

export function isVideoFile(file: File): boolean {
    return file.type.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(file.name.split('.').pop()?.toLowerCase() ?? '');
}

export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

export function isImageUrl(url: string | null): boolean {
    if (!url) return false;
    const clean = url.split('?')[0].toLowerCase();

    return /\.(jpg|jpeg|png|webp|gif|svg|avif)$/.test(clean);
}

export function hideBrokenImage(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
}

export function formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;

    return `${bytes}B`;
}
