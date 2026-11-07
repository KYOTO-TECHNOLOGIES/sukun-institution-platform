import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    driver : null,
    vehicle : null,
};

const DriverSlice = createSlice({
    name: 'driver',
    initialState,
    reducers:{
        addDriver(state,action) {
            state.driver=action.payload
        },
        addNewDriver(state,action){
            state.driver=[...state.driver,action.payload]
        },
        editDriver(state,action){
            state.driver=state.driver.map((data) =>
                data.id === action.payload.id ? action.payload : data
            )
        },
        deleteDriver(state,action){

            state.driver=state.driver.filter((data)=>
                data.id !== action.payload
            )
        },
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

export const {addDriver , addNewDriver , editDriver , deleteDriver  , 
    addVehicle , addNewVehicle , editVehicle , deleteVehicle} = DriverSlice.actions;
export default DriverSlice.reducer;