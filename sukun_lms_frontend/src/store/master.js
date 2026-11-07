import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    banks : null,
    sensors : null,
    rfidCards : null,
    violationTypes : null
}

{/* eslint-disable no-nested-ternary */}

const MasterSlice = createSlice({
    name: 'Master',
    initialState,
    reducers: {
        addBanks(state, action) {
            state.banks = action.payload;
        },
        addNewBanks(state, action) {
            state.banks = [...state.banks, action.payload];
        },
        updateBanks(state, action) {
            state.banks = state.banks.map(bank => bank.id === action.payload.id ? action.payload : bank);
        },
        deleteBanks(state, action) {
            state.banks = state.banks.filter(bank => bank.id !== action.payload.id);
        },
        addSensors(state, action) {
            state.sensors = action.payload;
        },
        addNewSensors(state, action) {
            state.sensors = [...state.sensors, action.payload];
        },
        updateSensors(state, action) {
            state.sensors = state.sensors.map(sensor => sensor.id === action.payload.id ? action.payload : sensor);
        },
        deleteSensors(state, action) {
            state.sensors = state.sensors.filter(sensor => sensor.id !== action.payload.id);
        },
        addRFIDCards(state, action) {
            state.rfidCards = action.payload;
        },
        addNewRFIDCards(state, action) {
            state.rfidCards = [...state.rfidCards, action.payload];
        },
        updateRFIDCards(state, action) {
            state.rfidCards = state.rfidCards.map(rfidCard => rfidCard.id === action.payload.id ? action.payload : rfidCard);
        },
        deleteRFIDCards(state, action) {
            state.rfidCards = state.rfidCards.filter(rfidCard => rfidCard.id !== action.payload.id);
        },
        addViolationTypes(state, action) {
            state.violationTypes = action.payload;
        },
        addNewViolationTypes(state, action) {
            state.violationTypes = [...state.violationTypes, action.payload];
        },
        updateViolationTypes(state, action) {
            state.violationTypes = state.violationTypes.map(violationType => violationType.id === action.payload.id ? action.payload : violationType);
        },
        deleteViolationTypes(state, action) {
            state.violationTypes = state.violationTypes.filter(violationType => violationType.id !== action.payload.id);
        }


    }})

export const {    
    addBanks,
    addNewBanks,
    updateBanks,
    deleteBanks,
    addSensors,
    addNewSensors,
    updateSensors,
    deleteSensors,
    addRFIDCards,
    addNewRFIDCards,
    updateRFIDCards,
    deleteRFIDCards,
    addViolationTypes,
    addNewViolationTypes,
    updateViolationTypes,
    deleteViolationTypes
} = MasterSlice.actions;
export default MasterSlice.reducer;
{/* eslint-enable no-nested-ternary */ }
