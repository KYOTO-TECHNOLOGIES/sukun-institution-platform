import React, { RouteProps } from 'react-router-dom';
import { pagesNotInSideBar } from './RoutesMenu';
import MainSidebar from '../layout/Aside/MainSidebar';

const asides: RouteProps[] = [
	{ path: pagesNotInSideBar.login.path, element: null },
	{ path: '/createsuperadmin', element: null },
	{ path: pagesNotInSideBar.Register.path, element: null },
	{ path: pagesNotInSideBar.ForgotPassword.path, element: null },
	{ path: '/public/token-status', element: null },
	{ path: '/screenstokenstatus/:uuid', element: null },
	{ path: '*', element: <MainSidebar /> },
	{ path: '/public/error', element: null },
	{ path: pagesNotInSideBar.PrivacyPolicy.path, element: null },
	{ path: pagesNotInSideBar.TermsAndConditions.path, element: null },
	{ path: pagesNotInSideBar.AdminSetup.path, element: null },
	{ path: pagesNotInSideBar.LicenceSetup.path, element: null },


];

export default asides;
