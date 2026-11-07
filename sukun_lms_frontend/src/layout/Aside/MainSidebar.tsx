import React, { useContext, useMemo } from 'react';
import Brand from '../Brand/Brand';
import Navigation, { NavigationLine } from '../Navigation/Navigation';
import User from '../User/User';
import ThemeContext from '../../contexts/themeContext';
import Aside, { AsideBody, AsideFoot, AsideHead } from './Aside';
import { AdminRoutes } from '../../routes/RoutesMenu';
import usePermissions from '../../hooks/usePermissions';

const MainSidebar = () => {
	const { asideStatus, setAsideStatus } = useContext(ThemeContext);
	const { can, isAdmin } = usePermissions();

	/**
	 * Build the nav menu object dynamically.
	 * Each route in AdminRoutes has an optional permissionKey.
	 * - If no permissionKey → always show (e.g. dashboard with no restriction).
	 * - If permissionKey exists → show only when the user has that permission.
	 * Admin users always pass can() so they see the full menu.
	 */
	const visibleMenu = useMemo(() => {
		return Object.fromEntries(
			Object.entries(AdminRoutes).filter(([, route]) => {
				if (!route.permissionKey) return true;
				return can(route.permissionKey);
			}),
		);
	}, [isAdmin, can]);

	return (
		<Aside>
			<AsideHead>
				<Brand asideStatus={asideStatus} setAsideStatus={setAsideStatus} isDark={true} />
			</AsideHead>
			<AsideBody>
				<Navigation menu={visibleMenu} id='aside-dashboard' className='user-select-none' />
				<NavigationLine />
			</AsideBody>
			<AsideFoot>
				<User />
			</AsideFoot>
		</Aside>
	);
};

export default MainSidebar;
