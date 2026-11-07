import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    credit : null,
    payment : null,
    paymentReports: null,
    banks:null
};

const WalletSlice = createSlice({
    name: 'wallet',
    initialState,
    reducers:{
        addCredit(state,action) {
            state.credit=action.payload
        },
        addNewCredit(state,action){
            state.credit=[...state.credit,action.payload]
        },
        editCredit(state,action){
            state.credit=state.credit.map((data) =>
                data.id === action.payload.id ? action.payload : data
            )
        },
        deleteCredit(state,action){
            state.credit=state.credit.filter((data)=>
                data.id !== action.payload
            )
        },
        addPayment(state,action) {
            state.payment=action.payload
        },
        addNewPayment(state,action){
            state.payment=[...state.payment,action.payload]
        },
        editPayment(state,action){
            
            state.payment=state.payment.map((data) =>
                data.id === action.payload.id ? action.payload : data
            )
        },
        deletePayment(state,action){
            
            state.payment=state.payment.filter((data)=>
                data.id !== action.payload 
            )
        },
        addPaymentReport(state,action) {
            state.paymentReports=action.payload
        },
        updatePaymentReport(state,action) {
            state.paymentReports=state.paymentReports.map((data) => 
                data.id !== action.payload.id ? action.payload : data
            )
        },
        addBanks(state,action) {
            state.banks=action.payload
        },
        addNewBanks(state,action){
            state.banks=[...state.banks,action.payload]
        },
        editBanks(state,action){
            state.banks=state.banks.map((data) =>
                data.id === action.payload.id ? action.payload : data
            )
        },
        deleteBanks(state,action){
            state.banks=state.banks.filter((data)=>
                data.id !== action.payload
            )
        },
    }
})

export const {addCredit , addNewCredit , editCredit , deleteCredit , updatePaymentReport,
    addPayment , addNewPayment , editPayment , deletePayment ,addPaymentReport,
    addBanks , addNewBanks , editBanks , deleteBanks } = WalletSlice.actions;
export default WalletSlice.reducer;