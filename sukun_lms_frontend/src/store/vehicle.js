import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    vehicle : null,
};

const VehicleSlice = createSlice({
    name: 'vehicle',
    initialState,
    reducers:{
        addVehicle(state,action) {
            state.vehicle=action.payload
        },
        addNewVehicle(state,action){
            state.vehicle=[...state.vehicle,action.payload]
        },
        editVehicle(state,action){
            state.vehicle=state.vehicle.map((data) =>
                data.id === action.payload.id ? action.payload : data
            )
        },
        deleteVehicle(state,action){
            state.vehicle=state.vehicle.filter((data)=>
                data.id !== action.payload
            )
        },
    }
})

export const {addVehicle , addNewVehicle , editVehicle , deleteVehicle } = VehicleSlice.actions;
export default VehicleSlice.reducer;