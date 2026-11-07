import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    entityDetail : null,    
};

const EntitySlice = createSlice({
    name: 'entity',
    initialState,
    reducers:{
        setEntityDetail(state,action){
            state.entityDetail=action.payload
        },
        entityUpdateLogo(state, action) {

            state.entityDetail.image = action.payload.image;
          },
          entitydeleteLogo(state, action) {
    
            state.entityDetail.image = null;
          },
          deleteEntityImage(state,action){
            state.entityDetail.images=state.entityDetail.images.filter((data)=>
                data.id !== action.payload.id 
            )
        },
        addEntityImage(state,action){
            state.entityDetail.images=[...state.entityDetail.images,action.payload]
        },
        makeEntityImagePrimary(state,action){
            state.entityDetail.images=state.entityDetail.images.map((data)=>
                data.id === action.payload.id ? {...data,is_primary:true} : {...data,is_primary:false}
                
            )
            const primaryImage=state.entityDetail.images.find((data)=>data.id===action.payload.id)
            const otherImages=state.entityDetail.images.filter((data)=>data.id!==action.payload.id)
            state.entityDetail.images=[primaryImage,...otherImages]
        },
        


    }
})

export const {setEntityDetail,entitydeleteLogo,entityUpdateLogo,deleteEntityImage,addEntityImage,makeEntityImagePrimary} = EntitySlice.actions;
export default EntitySlice.reducer;