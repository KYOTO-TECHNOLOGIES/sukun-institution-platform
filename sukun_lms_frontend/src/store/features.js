// _____for usermanagment_____
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pre_reg_forms: null,
};

const FeaturesSlice = createSlice({
  name: "features",
  initialState,
  reducers: {
    addPreRegForms(state, action) {
      state.pre_reg_forms = action.payload;
    },
    addNewPreRegForm(state, action) {
      state.pre_reg_forms = [...state.pre_reg_forms, action.payload];
    },
    editPreRegForm(state, action) {
      state.pre_reg_forms = state.pre_reg_forms.map((data) =>
        data.id === action.payload.id ? action.payload : data
      );
    },
    deletePreRegForm(state, action) {
      state.pre_reg_forms = state.pre_reg_forms.filter(
        (data) => data.id !== action.payload
      );
    },
  },
});

export const {
  addPreRegForms,
  addNewPreRegForm,
  editPreRegForm,
  deletePreRegForm,
} = FeaturesSlice.actions;
export default FeaturesSlice.reducer;
