import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	fields: [],
	editFields: [],
	dataToBeSendToBackEnd: {},
};

const FieldSlice = createSlice({
	name: 'fields',
	initialState,
	reducers: {
		addFields(state, action) {
			state.fields = action.payload;
		},
		addNewFields(state, action) {
			state.fields = [...state.fields, action.payload];
		},
		editFields(state, action) {
			state.fields = state.fields.map((data) =>
				data.id === action.payload.id ? action.payload : data,
			);
		},

		deleteFields(state, action) {
			state.fields = state.fields.filter((data) => data.id !== action.payload);
		},
	},
});

export const { editFields, addNewFields, addFields, deleteFields } = FieldSlice.actions;
export default FieldSlice.reducer;
