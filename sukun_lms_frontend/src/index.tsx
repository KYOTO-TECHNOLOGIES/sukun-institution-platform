import React from 'react';
// import ReactDOM from 'react-dom'; // For React 17
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client'; // For React 18
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/styles.scss';
import App from './App/App';
import reportWebVitals from './reportWebVitals';
import { ThemeContextProvider } from './contexts/themeContext';
import { AuthContextProvider } from './contexts/authContext';
import './i18n';

import store from "./store";
import { LicenceProvider } from './contexts/LicenceContext';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			retry: 1,
		},
	},
});

const children = (
	<QueryClientProvider client={queryClient}>
		<Provider store={store}>
			<Router>
				<AuthContextProvider>
					<LicenceProvider>
						<ThemeContextProvider>
							{/* <React.StrictMode> */}
							<App />
							{/* </React.StrictMode> */}
						</ThemeContextProvider>
					</LicenceProvider>
				</AuthContextProvider>
			</Router>
		</Provider>
	</QueryClientProvider>
);

const container = document.getElementById('root');

// ReactDOM.render(children, container); // For React 17
createRoot(container as Element).render(children); // For React 18

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
