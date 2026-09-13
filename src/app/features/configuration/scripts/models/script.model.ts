export type ConsentType = 'necessary' | 'analytics' | 'marketing' | 'functional';
export type ScriptLocation = 'head' | 'body_start' | 'body_end';

export interface Script {
    id: number;
    name: string;
    identifier: string;
    isActive: boolean;
    consentType: {
        value: ConsentType;
        label: string;
    };
    locations: ScriptLocation[];
    headCode: string | null;
    bodyStartCode: string | null;
    bodyEndCode: string | null;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface ScriptForm {
    name:             string;
    identifier:       string;
    is_active:        boolean;
    consent_type:     ConsentType;
    locations:        ScriptLocation[];
    head_code:        string | null;
    body_start_code:  string | null;
    body_end_code:    string | null;
    order:            number;
}

export const CONSENT_TYPE_OPTIONS: { label: string; value: ConsentType }[] = [
    { label: 'Necesario',  value: 'necessary'  },
    { label: 'Analíticas', value: 'analytics'  },
    { label: 'Marketing',  value: 'marketing'  },
    { label: 'Funcional',  value: 'functional' },
];

export const SCRIPT_LOCATION_OPTIONS: { label: string; value: ScriptLocation }[] = [
    { label: 'Head',        value: 'head'       },
    { label: 'Body inicio', value: 'body_start' },
    { label: 'Body fin',    value: 'body_end'   },
];