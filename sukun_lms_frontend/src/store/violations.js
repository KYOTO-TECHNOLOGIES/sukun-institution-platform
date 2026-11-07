import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    violationDetail : null,
};

const ViolationSlice = createSlice({
    name: 'violation',
    initialState,
    reducers:{
        setViolationDetail(state,action) {
            state.violationDetail=action.payload
        },
        updateViolationDetail(state,action) {
            state.violationDetail=action.payload
        },

       
    }
})

export const {
    setViolationDetail  
    } = ViolationSlice.actions;
export default ViolationSlice.reducer;