import { createSlice } from "@reduxjs/toolkit";
import moment from "moment";

const initialState = {
    gtcc : null,
    report : null,
    gtccDetail: null,
    gtccAssigned : null,
    contractList : null,
};

const GTCCSlice = createSlice({
    name: 'gtcc',
    initialState,
    reducers:{
        addGtcc(state,action) {
            state.gtcc=action.payload
        },
        addNewGtcc(state,action){
            state.gtcc=[...state.gtcc,action.payload]
        },
        editGtcc(state,action){
            state.gtcc=state.gtcc.map((data) =>
                data.id === action.payload.id ? action.payload : data
            )
        },
        deleteGtcc(state,action){
            state.gtcc=state.gtcc.filter((data)=>
                data.id !== action.payload.id 
            )
        },
        deleteGtccImage(state,action){
            state.gtccDetail.images=state.gtccDetail.images.filter((data)=>
                data.id !== action.payload.id 
            )
        },
        addGtccImage(state,action){
            state.gtccDetail.images=[...state.gtccDetail.images,action.payload]
        },
        makeGtccImagePrimary(state,action){
            state.gtccDetail.images=state.gtccDetail.images.map((data)=>
                data.id === action.payload.id ? {...data,is_primary:true} : {...data,is_primary:false}
                
            )
            const primaryImage=state.gtccDetail.images.find((data)=>data.id===action.payload.id)
            const otherImages=state.gtccDetail.images.filter((data)=>data.id!==action.payload.id)
            state.gtccDetail.images=[primaryImage,...otherImages]
        },
        addReport(state,action) {
            state.report=action.payload
        },
        addGtccDetail(state,action) {
            state.gtccDetail=action.payload
        },
        editCreditGtccDetails(state,action) {
            // console.log(action)
            state.gtccDetail={...state.gtccDetail,credit_available:action.payload}
        },
        addGtccAssigned(state,action) {
            state.gtccAssigned=action.payload
        },
        addNewGtccAssigned(state,action){
            const date=moment().format('YYYY-MM-DD')
            const temp=[...state.gtccAssigned,action.payload]
            state.gtccAssigned=temp.map((data) => 
            
            data.id !== action.payload.id && data.status==='Active' ? {...data,status:'Expired',contract_end_date:date}: data
            )
        },
        editGtccAssigned(state,action){
            state.gtccAssigned=state.gtccAssigned.map((data) =>
                data.id === action.payload.id ? action.payload : data
            )
        },
        deleteGtccAssigned(state,action){
            state.gtccAssigned=state.gtccAssigned.filter((data)=>
                data.id !== action.payload.id 
            )
        },
        addGtccContractList(state,action) {
            state.contractList=action.payload
        },
        addNewGtccContractList(state,action){
            state.contractList=[...state.gtccAssigned,action.payload]
        },
        editGtccContractList(state,action){
            state.contractList=state.contractList.map((data) =>
                data.id === action.payload.id ? action.payload : data
            )
        },
        deleteGtccContractList(state,action){
            state.contractList=state.contractList.filter((data)=>
                data.id !== action.payload.id 
            )
        },
        gtccUpdateLogo(state, action) {

            state.gtccDetail.image = action.payload.image;
          },
        gtccdeleteLogo(state) {

        state.gtccDetail.image = null;
        },

        // addNewReport(state,action){
        //     state.Report=[...state.Report,action.payload]
        // },
        // editReport(state,action){
        //     state.Report=state.Report.map((data) =>
        //         data.id === action.payload.id ? action.payload : data
        //     )
        // },
        // deleteReport(state,action){
        //     state.Report=state.Report.filter((data)=>
        //         data.id !== action.payload.id 
        //     )
        // },
    }
})

export const {addGtcc , addNewGtcc , editGtcc , deleteGtcc , addReport , addGtccDetail , editCreditGtccDetails,
                addGtccAssigned ,addNewGtccAssigned , editGtccAssigned , deleteGtccAssigned,gtccdeleteLogo,gtccUpdateLogo,
                deleteGtccContractList , editGtccContractList , addNewGtccContractList , addGtccContractList,
                deleteGtccImage, addGtccImage, makeGtccImagePrimary
            } = GTCCSlice.actions;
export default GTCCSlice.reducer;