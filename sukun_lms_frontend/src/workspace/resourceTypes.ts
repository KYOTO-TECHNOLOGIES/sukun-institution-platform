export type Field = {
    key: string; label: string; type?: string; required?: boolean; options?: string[] | [string, string][];
    endpoint?: string; optionLabel?: string; min?: number; step?: string; default?: any; help?: string;
};
export type ResourceAction = { label: string; endpoint: string; fields?: Field[]; payload?: any; visible?: (row: any, role: string) => boolean };
export type Resource = { title: string; subtitle: string; endpoint: string; permission: string; icon: string;
    fields: Field[]; columns: string[]; institution?: boolean; actions?: ResourceAction[]; noDelete?: boolean; readOnly?: boolean; noCreate?: boolean };
const field = (key: string, label: string, type = 'text', required = false): Field => ({ key, label, type, required });
const select = (key: string, label: string, options: string[]): Field => ({key, label, type:'select', options});
const relation = (key: string, label: string, endpoint: string, optionLabel: string, required = false): Field => ({key, label, endpoint, optionLabel, required, type:'relation'});
export { field, select, relation };
