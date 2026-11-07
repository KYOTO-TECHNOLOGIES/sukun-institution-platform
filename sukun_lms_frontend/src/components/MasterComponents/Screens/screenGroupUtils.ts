import type { Screen, ScreenGroupScreenRef } from '../../../services/screensManagementApi';

/** Map group membership row to `Screen` for shared card UI. */
export function groupScreenRefToScreen(ref: ScreenGroupScreenRef): Screen {
	return {
		id: ref.id,
		uuid: ref.uuid,
		name: ref.name,
		location: ref.location ?? '',
		description: ref.description ?? undefined,
		is_active: ref.is_active,
		is_online: ref.is_online,
		last_heartbeat: ref.last_heartbeat ?? undefined,
	};
}
