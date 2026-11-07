import { useContext } from 'react';
import AuthContext from '../contexts/authContext';
import type { PagePermissions } from '../types/permissions';

/**
 * Hook for checking page-level permissions.
 *
 * Permissions are fully controlled by the backend `page_permission` object
 * returned from /api/users/profile/. There is no frontend admin bypass —
 * every user including admin must have permissions set via role-permissions.
 *
 * - `can(key)` — returns true only if the permission flag is explicitly true.
 * - `isAdmin`  — true when role.name is 'admin'. UI-only (e.g. show Add Role button).
 * - `permissions` — raw PagePermissions object (or null if not yet loaded).
 */
const usePermissions = () => {
	const { permissions, isAdmin } = useContext(AuthContext);

	const can = (key: keyof PagePermissions): boolean => {
		return permissions?.[key] === true;
	};

	return { permissions, isAdmin, can };
};

export default usePermissions;
