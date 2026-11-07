import { authAxios } from '../axiosInstance';
import type { PaginatedResponse } from './screensManagementApi';

export interface ScreenTemplateRef {
	id: number;
	name: string;
}

export interface ScreenTemplateAssignment {
	id: number;
	screen: number;
	template: number | ScreenTemplateRef;
	interval: number;
	order: number;
	created_at?: string;
	updated_at?: string;
}

export interface CreateScreenTemplatePayload {
	screen: number;
	template: number;
	interval: number;
	order: number;
}

export interface UpdateScreenTemplatePayload {
	interval?: number;
	order?: number;
}

const unwrap = <T>(request: Promise<{ data: T }>) => request.then((response) => response.data);

export const getScreenTemplateName = (assignment: ScreenTemplateAssignment): string => {
	if (typeof assignment.template === 'object' && assignment.template?.name) {
		return assignment.template.name;
	}
	return `Template #${assignment.template}`;
};

export const getScreenTemplateId = (assignment: ScreenTemplateAssignment): number => {
	return typeof assignment.template === 'object' ? assignment.template.id : assignment.template;
};

export const screenTemplatesApi = {
	list: (params?: { screen?: number; page?: number; page_size?: number }) =>
		unwrap<PaginatedResponse<ScreenTemplateAssignment>>(
			authAxios.get('api/screens/templates/', { params }),
		),
	get: (id: number) => unwrap<ScreenTemplateAssignment>(authAxios.get(`api/screens/templates/${id}/`)),
	create: (payload: CreateScreenTemplatePayload) =>
		unwrap<ScreenTemplateAssignment>(authAxios.post('api/screens/templates/', payload)),
	update: (id: number, payload: UpdateScreenTemplatePayload) =>
		unwrap<ScreenTemplateAssignment>(authAxios.put(`api/screens/templates/${id}/`, payload)),
	patch: (id: number, payload: UpdateScreenTemplatePayload) =>
		unwrap<ScreenTemplateAssignment>(authAxios.patch(`api/screens/templates/${id}/`, payload)),
	remove: (id: number) => authAxios.delete(`api/screens/templates/${id}/`),
};
