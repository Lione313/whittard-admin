export type ChatbotActionType = 'whatsapp' | 'url';

export interface ChatbotAction {
    type: ChatbotActionType;
    url: string;
    label: string;
}

export interface ChatbotOption {
    id: string;
    label: string;
    nextStepId: string | null;
}

export interface ChatbotStep {
    id: string;
    question: string;
    options?: ChatbotOption[];
    action?: ChatbotAction | null;
}

export type ChatbotFlow = Record<string, ChatbotStep>;

export interface ChatbotConfig {
    id: number;
    flow: ChatbotFlow;
    is_active: boolean;
    updated_at: string | null;
}

export interface ChatbotConfigPayload {
    flow: ChatbotFlow;
    is_active: boolean;
}

export const CHATBOT_ACTION_OPTIONS: { label: string; value: ChatbotActionType }[] = [
    { label: 'WhatsApp', value: 'whatsapp' },
    { label: 'Enlace (URL)', value: 'url' }
];
