import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LicencePayload {
	registration_date: string;
	features: string[];
	unique_id?: string;
	version?: string;
}

interface LicenceState {
	isChecked: boolean; // API was called
	success: boolean; // license valid or not
	message: string;
	isValid?: boolean;
	payload: LicencePayload | null;
}

const initialState: LicenceState = {
	isChecked: false,
	success: false,
	isValid: false,
	message: '',
	payload: null,
};

const licenceSlice = createSlice({
	name: 'licence',
	initialState,
	reducers: {
		setLicenceState: (
			state,
			action: PayloadAction<{
				success: boolean;
				message: string;
				payload: LicencePayload | null;
			}>,
		) => {
			state.isChecked = true;
			state.success = action.payload.success;
			state.message = action.payload.message;
			state.payload = action.payload.payload;
		},
		setLicenceStatus: (
			state,
			action: PayloadAction<{
				isValid: boolean;
				message: string;
				payload: LicencePayload;
			}>,
		) => {
			state.isChecked = true;
			state.isValid = action.payload.isValid;
			state.message = action.payload.message;
			state.payload = action.payload.payload;
		},

		clearLicenceState: () => initialState,
	},
});

export const { setLicenceState, clearLicenceState, setLicenceStatus } = licenceSlice.actions;
export default licenceSlice.reducer;
