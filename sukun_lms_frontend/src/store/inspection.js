import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    inspectionDetail : null,    
};

const InspectionSlice = createSlice({
    name: 'inspection',
    initialState,
    reducers:{
        setInspectionDetail(state,action){
            state.inspectionDetail=action.payload
        },
       


    }
})

export const {setInspectionDetail} = InspectionSlice.actions; 
export default InspectionSlice.reducer;