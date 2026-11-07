import React, { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ErrorPage from '../../pages/PublicPages/ErrorPage';
import Login from '../../pages/Auth/Login';
import Registration from '../../pages/Auth/Registration';
import AuthContext from '../../contexts/authContext';
import Unauthorized from '../../pages/PublicPages/Unauthorized';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import RouteConfig from '../../routes/contentRoutes';
import ProtectedRoute from './ProtectedRoute';
import Activation from '../../pages/Auth/CreateOrganization';
import AdminSetup from '../../pages/Auth/AdminSetup';
import LicenceSetup from '../../pages/Auth/LicenceSetup';
import TokenStatusPage from '../../pages/PublicPages/TokenStatusPage';

import ScreenTokenStatusPage from '../../pages/PublicPages/ScreenTokenStatusPage';
import LoaderPreview from '../../pages/PublicPages/LoaderPreview';
const ContentRoutes = () => {
	const { userData, permissions } = useContext(AuthContext);

	if (userData === null) {
		return <KyotoLoader />;
	}

	const isAuthenticated = Boolean(userData && Object.keys(userData).length > 0);

	const canAccessRoute = (permissionKey?: string): boolean => {
		if (!permissionKey) return true;
		if (!permissions) return false;
		return (permissions as any)[permissionKey] === true;
	};

	return (
		<Routes>
			{/* Public Routes */}
			<Route path='/loader-preview' element={<LoaderPreview />} />
			<Route path='/login' element={<Login />} />
			<Route path='/admin_setup' element={<AdminSetup />} />
			<Route path='/customer-login' element={<Login />} />
			<Route path='/createsuperadmin' element={<Activation />} />
			<Route path='/public/activation/:string' element={<Registration />} />
			<Route path='/public/error' element={<ErrorPage />} />
			<Route path='/public/token-status' element={<TokenStatusPage />} />
			<Route path='/screenstokenstatus/:uuid' element={<ScreenTokenStatusPage />} />
		<Route path='/licence_setup' element={<LicenceSetup />} />

			{/* Protected Routes */}
			{RouteConfig.map((page) => {
				if (!isAuthenticated) {
					return (
						<Route
							path={page.path}
							element={<Navigate to='/login' replace />}
							key={page.path}
						/>
					);
				}
				if (canAccessRoute(page.permissionKey)) {
					return (
						<Route
							path={page.path}
							element={<ProtectedRoute element={page.element} />}
							key={page.path}
						/>
					);
				}
				return <Route path={page.path} element={<Unauthorized />} key={page.path} />;
			})}

			<Route path='*' element={<Navigate to='/public/error' />} />
		</Routes>
	);
};

export default ContentRoutes;
