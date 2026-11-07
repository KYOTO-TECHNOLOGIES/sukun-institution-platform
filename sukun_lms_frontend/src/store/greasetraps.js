import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    greaseTraps : null,
    fixture : null,
    entityFixture : null,
    totalDumping : null
};

const GreaseTrapsSlice = createSlice({
    name: 'greasetraps',
    initialState,
    reducers:{
        addGreaseTraps(state,action) {
            state.greaseTraps=action.payload
        },
        addNewGreaseTraps(state,action){
            state.greaseTraps=[...state.greaseTraps,action.payload]
        },
        editGreaseTraps(state,action){
            state.greaseTraps=state.greaseTraps.map((data) =>
                data.id === action.payload.id ? action.payload : data
            )
        },
        deleteGreaseTraps(state,action){
            state.greaseTraps=state.greaseTraps.filter((data)=>
                data.id !== action.payload
            )
        },
        addFixture(state,action) {
            state.fixture=action.payload
        },
        addNewFixture(state,action){
            state.fixture=[...state.fixture,action.payload]
        },
        editFixture(state,action){
            state.fixture=state.fixture.map((data) =>
                data.id === action.payload.id ? action.payload : data
            )
        },
        deleteFixture(state,action){
            state.fixture=state.fixture.filter((data)=>
                data.id !== action.payload
            )
        },
        addEntityFixture(state,action) {
            state.entityFixture=action.payload
        },
        addNewEntityFixture(state,action){
            state.entityFixture=[...state.entityFixture,action.payload]
        },
        editEntityFixture(state,action){
            state.entityFixture=state.entityFixture.map((data) =>
                data.id === action.payload.id ? action.payload : data
            )
        },
        deleteEntityFixture(state,action){
            state.entityFixture=state.entityFixture.filter((data)=>
                data.id !== action.payload
            )
        },
        removeFixtureImage(state,action){
            
            const { data_id, image_index } = action.payload;
  
            const entityFixtureToUpdate = state.entityFixture[data_id];
            
            const updatedImages = entityFixtureToUpdate.entity_fixture_images.filter(
              (_, index) => index !== image_index
            );
            
            // Update the entity fixture in the state with the new images array
            state.entityFixture[data_id] = {
              ...entityFixtureToUpdate,
              entity_fixture_images: updatedImages,
            };
            // state.entityFixture[action.payload.data_id] = {...state.entityFixture[action.payload.data_id],entity_fixture_images:state.entityFixture[action.payload.data_id].entity_fixture_images.filter((data,index) => index !== action.payload.image_index)}
        },
        addTotalDumping(state,action){
            state.totalDumping = action.payload
        }
    }
})

export const {addGreaseTraps , addNewGreaseTraps , editGreaseTraps , deleteGreaseTraps ,
                addFixture , addNewFixture , editFixture , deleteFixture , addTotalDumping,
                addEntityFixture , addNewEntityFixture , editEntityFixture , deleteEntityFixture,removeFixtureImage
            } = GreaseTrapsSlice.actions;
export default GreaseTrapsSlice.reducer;