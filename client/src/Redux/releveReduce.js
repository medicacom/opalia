import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Configuration from "../configuration";
var token = localStorage.getItem("x-access-token");

export const allReleve = createAsyncThunk("releve/allReleve", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "releve/allReleve", {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-access-token':token
    },
    body:JSON.stringify(action)
  });
  const releve = await response.json();
  return releve;
});
export const exportReleve = createAsyncThunk("releve/exportReleve", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "releve/exportReleve", {
    method: 'POST',
    headers: {          
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-access-token':token
    },
    body:JSON.stringify(action)
  });
  const releve = await response.json();
  return releve;
});
export const cheeckProduit = createAsyncThunk("releve/cheeckProduit", async (action) => { 
  const response = await fetch(Configuration.BACK_BASEURL + "releve/cheeckProduit", {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-access-token':token
    },
    body: JSON.stringify(action)

  });
  const releve = await response.json();
  return releve;
});

//upload BL file
export const saveFile = createAsyncThunk("releve/saveFile", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "releve/saveFile", {
    method: 'POST',
    headers: {
      'Accept': 'application/*',
      'x-access-token':token,
    },
    body:action
  });
  const releve = await response.json();
  return releve;
});
export const extractionsReleve = createAsyncThunk("bl/extractionsReleve", async (action) => {
  const response = await fetch("http://54.36.183.243:91/predict", {
    method: "POST",
    headers: { Accept: "application/*" },
    body: action,
  });
  const releve = await response.json();
  return releve;
});
export const releveAdded = createAsyncThunk("releve/releveAdded", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "releve/releveAdded", {
    method: 'POST',
    headers: {          
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-access-token':token
    },
    body:JSON.stringify(action)
  });
  const releve = await response.json();
  return releve;
});
const releveReduce = createSlice({
  name: "releve",
  initialState: {
    entities: [],
    loading: false,
  },
  reducers: {
   
  },
  extraReducers: {

    [allReleve.pending]: (state, action) => {
      state.loading = true;
    },
    [allReleve.fulfilled]: (state, action) => {
      state.loading = false;
      state.entities = [...state.entities, ...action.payload];
    },
    [allReleve.rejected]: (state, action) => {
      state.loading = false;
    }
  },
});

export const {  } = releveReduce.actions;

export default releveReduce.reducer;
