import Swal from 'sweetalert2';

/**
 * Gets the appropriate target element for SweetAlert2 based on fullscreen status.
 * Uses the same logic as Portal component: checks if we're in fullscreen mode.
 * When in fullscreen, modals must be rendered inside the fullscreen element to be visible.
 * @returns {HTMLElement} The target element for SweetAlert2
 */
const getSwalTarget = () => {
	// Use the same logic as Portal component: check if portal-root-fullscreen exists
	// and if we're actually in fullscreen mode (same check Portal would do with fullScreenStatus)
	const fullscreenPortal = document.getElementById('portal-root-fullscreen');
	// Use bracket notation to access vendor-prefixed fullscreen properties (for TypeScript compatibility)
	const isFullscreen = !!(
		document.fullscreenElement ||
		document['webkitFullscreenElement'] ||
		document['mozFullScreenElement'] ||
		document['msFullscreenElement']
	);
	
	// If we're in fullscreen and the portal exists, use it (same as Portal component does)
	if (isFullscreen && fullscreenPortal) {
		return fullscreenPortal;
	}
	
	// Otherwise, use document.body (default behavior)
	return document.body;
};

/**
 * Wrapper for Swal.fire that automatically sets the correct target based on fullscreen status.
 * Use this instead of Swal.fire directly to ensure modals are visible in fullscreen mode.
 * Prevents layout shifts (footer moving) by disabling heightAuto.
 * @param {Object} options - SweetAlert2 options
 * @returns {Promise} SweetAlert2 result promise
 */
export const swalFire = (options = {}) => {
	return Swal.fire({
		...options,
		target: getSwalTarget(),
		// Prevent SweetAlert2 from modifying html/body height which causes layout shifts
		heightAuto: false,
	});
};

export default swalFire;
