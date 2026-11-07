import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    gate : null,
};

const GateSlice = createSlice({
    name: 'gate',
    initialState,
    reducers:{
        addGate(state,action) {
            state.gate=action.payload
        },
        addNewGate(state,action){
            state.gate=[...state.gate,action.payload]
        },
        editGate(state,action){
            state.gate=state.gate.map((data) =>
                data.id === action.payload.id ? action.payload : data
            )
        },
        deleteGate(state,action){
            state.gate=state.gate.filter((data)=>
                data.id !== action.payload
            )
        },
       
    }
})

export const {deleteGate , addNewGate , editGate , addGate } = GateSlice.actions;
export default GateSlice.reducer;