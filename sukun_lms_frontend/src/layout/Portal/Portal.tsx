import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { FC, ReactNode, useContext } from 'react';
import ThemeContext from '../../contexts/themeContext';

interface IPortalProps {
	children: ReactNode;
	id?: string;
}
// @ts-ignore
const Portal: FC<IPortalProps> = ({ id, children }) => {
	const { fullScreenStatus } = useContext(ThemeContext);

	// In both fullscreen and non-fullscreen, we want to render
	// outside of the header/container so modals aren't clipped.
	// We still respect the provided `id`, and optionally allow a
	// dedicated fullscreen root if you add it to the DOM.
	const targetId = fullScreenStatus ? 'portal-root-fullscreen' : id;
	// @ts-ignore
	let mount = document.getElementById(targetId || id);
	// Fallback to original id if fullscreen-specific mount is missing
	if (!mount && targetId && targetId !== id) {
		// @ts-ignore
		mount = document.getElementById(id);
	}

	if (mount) {
		return ReactDOM.createPortal(children, mount);
	}

	return null;
};
Portal.propTypes = {
	// @ts-ignore
	children: PropTypes.node.isRequired,
	id: PropTypes.string,
};
Portal.defaultProps = {
	id: 'portal-root',
};

export default Portal;
