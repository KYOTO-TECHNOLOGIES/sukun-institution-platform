import { authAxios } from '../axiosInstance';

export async function allRecords(url: string) {
    const items: any[] = [];
    let next: string | null = url + (url.includes('?') ? '&' : '?') + 'limit=100';
    for (let page = 0; next && page < 100; page++) {
        const { data } = await authAxios.get(next);
        if (Array.isArray(data)) return data;
        items.push(...data.results);
        next = data.next ? new URL(data.next, window.location.origin).pathname + new URL(data.next, window.location.origin).search : null;
    }
    if (next) throw new Error('Too many options to load. Narrow the records first.');
    return items;
}

export function errorMessage(error: any): string {
    const data = error?.response?.data;
    if (!data) return error?.message || 'The request could not be completed.';
    if (typeof data === 'string') return 'The server could not complete this request.';
    return Object.entries(data).map(([key, value]) => (key === 'detail' ? '' : key.replace(/_/g, ' ') + ': ') +
        (Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value))).join(' · ');
}
