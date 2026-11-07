import React, {
	createContext,
	FC,
	ReactNode,
	useEffect,
	useMemo,
	useState,
	useCallback,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAxios } from '../axiosInstance';
import { useTranslation } from 'react-i18next';

/* ================= TYPES ================= */

interface Licence {
	isValid: boolean;
	uniqueID: string | null;
	registrationDate: string | null;
	version: string | null;
	message: string;
	features: string[];
	expiryDate: string | null;
	expirationTimestamp: number | null;
	registration_date: string | null;
	expiry_date: string | null;
	expiration_timestamp: number | null;
	is_valid: boolean;
	unique_id: string | null;
}

interface LicenceContextProps {
	loading: boolean;
	adminExists: boolean | null;
	license: Licence | null;
	version: string | null;
	features: string[];
	uniqueKey: string | null;
	refreshStatus: () => Promise<void>;
	resetLicenceState: () => void;
	hasFeature: (featureKey: string) => boolean;
	hasQrFeature: () => boolean;
	status: Licence | null;
	checkSystemStatus;
	showWarning: boolean;
	warningMessage: string;
	closeWarning: () => void;
	clearLicenceStorage: () => void;
	serverData: any;
}

export const LicenceContext = createContext<LicenceContextProps>({} as LicenceContextProps);

interface Props {
	children: ReactNode;
}

/* ================= PROVIDER ================= */

export const LicenceProvider: FC<Props> = ({ children }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [adminExists, setAdminExists] = useState<boolean | null>(null);
	const [license, setLicense] = useState<Licence | null>(null);
	const [status, setStatus] = useState<Licence | null>(null);
	const [features, setFeatures] = useState<string[]>([]);
	const [uniqueKey, setUniqueKey] = useState<string | null>(null);
	const [serverData, setServerData] = useState<any>(null);
	const [showWarning, setShowWarning] = useState(false);
	const [warningMessage, setWarningMessage] = useState('');

	const SAFE_ROUTES = useMemo(() => ['/login', '/licence_setup', '/admin_setup'], []);

	const WEEKLY_KEY = 'licence_warning_week';
	const DAILY_KEY = 'licence_warning_day';
	const LICENCE_STORAGE_KEYS = ['licence_warning_day', 'licence_warning_week'];
	/* ================= HELPERS ================= */

	const resetLicenceState = () => {
		setFeatures([]);
		setUniqueKey(null);
		setLicense(null);
		setStatus(null);
	};

	const getDaysLeft = (expiryDate: string) => {
		const now = new Date();
		const expiry = new Date(expiryDate);

		// valid till end of expiry day
		expiry.setHours(23, 59, 59, 999);

		return Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 86400000));
	};

	const todayISO = () => new Date().toISOString().split('T')[0];

	const currentWeekKey = () => {
		const d = new Date();
		const first = new Date(d.getFullYear(), 0, 1);
		const week = Math.ceil(
			((d.getTime() - first.getTime()) / 86400000 + first.getDay() + 1) / 7,
		);
		return `${d.getFullYear()}-W${week}`;
	};
	const clearLicenceStorage = () => {
		LICENCE_STORAGE_KEYS.forEach((key) => {
			localStorage.removeItem(key);
		});
	};

	/* ================= API ================= */

	const fetchFeatureStatus = async () => {
		// Mocked to prevent backend calls
		setFeatures([]);
		setStatus({
			is_valid: true,
			unique_id: "mock-license-id",
			version: "1.0.0",
			expiryDate: "2099-12-31",
			features: [],
			registrationDate: "2026-01-01",
			registration_date: "2026-01-01",
			expiry_date: "2099-12-31",
			expirationTimestamp: 4102444799,
			expiration_timestamp: 4102444799,
			message: "Valid",
			isValid: true,
			uniqueID: "mock-license-id",
		} as any);
	};

	const hasFeature = useCallback(
		(featureKey: string) => features.includes(featureKey),
		[features],
	);
	const QR_FEATURE_KEYS = ['email.visitor_email.qr_code_email', 'id_card_print.id_card_qr_code'];

	const hasQrFeature = useCallback((): boolean => {
		return features.some((feature) => QR_FEATURE_KEYS.includes(feature));
	}, [features]);

	const checkSystemStatus = useCallback(async () => {
		try {
			// Mock successful system status check
			const mockData = {
				ip_address: "127.0.0.1",
				port: "8000",
				details: {
					admin_users_exist: true,
				},
				license: {
					is_valid: true,
					unique_id: "mock-license-id",
					version: "1.0.0",
					expiryDate: "2099-12-31",
					features: [],
				}
			};
			const { details, license, ip_address, port } = mockData;
			setServerData({
				ip_address: ip_address ?? null,
				port: port ?? null,
			});
			setAdminExists(details?.admin_users_exist ?? false);

			const uniqueID = license?.unique_id ?? null;

			setLicense({
				...license,
				unique_id: uniqueID,
				registrationDate: "2026-01-01",
				expiryDate: "2099-12-31",
				registration_date: "2026-01-01",
				expiry_date: "2099-12-31",
				expirationTimestamp: 4102444799,
				expiration_timestamp: 4102444799,
				message: "Valid",
				isValid: true,
			} as any);

			// Mock features status to avoid /api/license/status call
			setFeatures([]);
			setStatus({
				is_valid: true,
				unique_id: "mock-license-id",
				version: "1.0.0",
				expiryDate: "2099-12-31",
				features: [],
				registrationDate: "2026-01-01",
				registration_date: "2026-01-01",
				expiry_date: "2099-12-31",
				expirationTimestamp: 4102444799,
				expiration_timestamp: 4102444799,
				message: "Valid",
				isValid: true,
				uniqueID: "mock-license-id",
			} as any);

		} catch (error) {
			console.error('System status check failed:', error);
			resetLicenceState();
		} finally {
			setLoading(false);
		}
	}, [navigate]);

	/* ================= WARNING LOGIC ================= */

	const evaluateLicenceWarning = useCallback(() => {
		if (!status?.expiryDate) return;
		if (SAFE_ROUTES.includes(location.pathname)) return;

		const daysLeft = getDaysLeft(status.expiryDate);

		if (daysLeft === 0) {
			const today = todayISO();
			if (localStorage.getItem(DAILY_KEY) === today) return;

			setWarningMessage(`⚠️ ${t('Licence expires TODAY.')}`);
			setShowWarning(true);
			return;
		}

		// 🔴 DAILY (last 7 days)
		if (daysLeft <= 7) {
			const today = todayISO();
			if (localStorage.getItem(DAILY_KEY) === today) return;

			setWarningMessage(`${t('Licence expires in')} ${daysLeft} ${t('days')}.`);
			setShowWarning(true);
			return;
		}

		// 🟠 WEEKLY (last 30 days)
		if (daysLeft <= 30) {
			const week = currentWeekKey();
			if (localStorage.getItem(WEEKLY_KEY) === week) return;

			setWarningMessage(`${t('Licence expires in')} ${daysLeft} ${t('days')}.`);
			setShowWarning(true);
		}
	}, [status, location.pathname]);

	const closeWarning = useCallback(() => {
		setShowWarning(false);

		if (!status?.expiryDate) return;

		const daysLeft = getDaysLeft(status.expiryDate);

		if (daysLeft <= 7) {
			localStorage.setItem(DAILY_KEY, todayISO());
		} else if (daysLeft <= 30) {
			localStorage.setItem(WEEKLY_KEY, currentWeekKey());
		}
	}, [status]);

	/* ================= EFFECTS ================= */

	useEffect(() => {
		checkSystemStatus();
	}, [checkSystemStatus]);

	useEffect(() => {
		if (status) {
			evaluateLicenceWarning();
		}
	}, [status, evaluateLicenceWarning]);

	/* ================= CONTEXT VALUE ================= */

	const value = useMemo(
		() => ({
			loading,
			adminExists,
			license,
			version: license?.version ?? null,
			features,
			uniqueKey,
			refreshStatus: checkSystemStatus,
			resetLicenceState,
			hasFeature,
			hasQrFeature,
			checkSystemStatus,
			status,
			showWarning,
			warningMessage,
			closeWarning,
			clearLicenceStorage,
			serverData,
		}),
		[
			loading,
			adminExists,
			license,
			features,
			uniqueKey,
			checkSystemStatus,
			hasFeature,
			status,
			showWarning,
			warningMessage,
			closeWarning,
			clearLicenceStorage,
			checkSystemStatus,
			hasQrFeature,
			serverData,
		],
	);

	return <LicenceContext.Provider value={value}>{children}</LicenceContext.Provider>;
};
