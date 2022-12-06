import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Configuration from "../configuration";
var token = localStorage.getItem("x-access-token");

//api scander
export const extractionsBL = createAsyncThunk("bl/fetchBl", async (action) => {
  const response = await fetch(Configuration.API_BASEURL+"/bon-livraison", {
    method: "POST",
    headers: { Accept: "application/*" },
    body: action,
  });
  const bl = await response.json();
  return bl;
});

export const getBlById = createAsyncThunk("bl/getBlById", async (id) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getBlById/"+id, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  });
  const bl = await response.json();
  return bl;
});

//Tableau recupulatif donnèes BL
export const tableProduits = createAsyncThunk("bl/tableProduits", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/tableProduits", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//getAllAnneeLignesBL
export const getAllAnneeLignesBL = createAsyncThunk("bl/getAllAnneeLignesBL", async () => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getAllAnneeLignesBL", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  });
  const bl = await response.json();
  return bl;
});

//verification si numero bl existe ou non
export const blVerif = createAsyncThunk("bl/blVerif", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/blVerif", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//getBl pour validation
export const getBl = createAsyncThunk("bl/getBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getBl", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//getBl annuler
export const getBlAnnuler = createAsyncThunk("bl/getBlAnnuler", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getBlAnnuler", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//getBl pour validation commercial
export const getBlComm = createAsyncThunk("bl/getBlComm", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getBlComm", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//getBl pour visualisation
export const getBlVis = createAsyncThunk("bl/getBlVis", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getBlVis", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

export const getAllClientBl = createAsyncThunk("bl/getAllClientBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getAllClientBl", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//filtre delegue
export const getAllDelegueBl = createAsyncThunk("bl/getAllDelegueBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getAllDelegueBl", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//filtre secteur
export const getAllSecteurBl = createAsyncThunk("bl/getAllSecteurBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getAllSecteurBl", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//filtre produit
export const getAllProduitBl = createAsyncThunk("bl/getAllProduitBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getAllProduitBl", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});
export const getAllProdFourBl = createAsyncThunk("bl/getAllProdFourBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getAllProdFourBl", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//filtre marche
export const getAllMarcheBl = createAsyncThunk("bl/getAllMarcheBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getAllMarcheBl", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//filtre fournisseur
export const getFournisseurBl = createAsyncThunk("bl/getFournisseurBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getFournisseurBl", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//filtre pharmacie
export const getAllParmacieBl = createAsyncThunk("bl/getAllParmacieBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getAllParmacieBl", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});
export const getAllParmaParFour = createAsyncThunk("bl/getAllParmaParFour", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getAllParmaParFour", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//filtre marche from detail
export const getMarcheFromDetail = createAsyncThunk("bl/getMarcheFromDetail", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getMarcheFromDetail", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//filtre ims
export const getAllImsBl = createAsyncThunk("bl/getAllImsBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getAllImsBl", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//filtre pack
export const getAllPackBl = createAsyncThunk("bl/getAllPackBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getAllPackBl", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//comparaisonMarcheIms
export const comparaisonMarcheIms = createAsyncThunk("bl/comparaisonMarcheIms", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/comparaisonMarcheIms", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//comparaisonImsBricks
export const comparaisonImsBricks = createAsyncThunk("bl/comparaisonImsBricks", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/comparaisonImsBricks", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//getDetailBl
export const getDetailBl = createAsyncThunk("bl/getDetailBl", async (id) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getDetailBl/"+id, {
    method: "get",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  });
  const bl = await response.json();
  return bl;
});

//upload BL file
export const saveFile = createAsyncThunk("bl/saveFile", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/saveFile", {
    method: 'POST',
    headers: {
      'Accept': 'application/*',
      'x-access-token':token,
    },
    body:action
  });
  const bl = await response.json();
  return bl;
});
export const saveFile64 = createAsyncThunk("bl/saveFile64", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/saveFile64", {
    method: 'POST',
    headers: {          
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-access-token':token
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});

//changerEtat
export const blChangeEtat = createAsyncThunk("bl/changerEtat", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/changeEtat", {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-access-token':token
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});
export const numeroUpdate = createAsyncThunk("bl/updateNum", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/updateNum/"+action.id, {
    method: 'put',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-access-token':token
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});
/* export const payer = createAsyncThunk("bl/payer", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/payer/"+action.idBl, {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-access-token':token
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
}); */

//getFile
export const getFileBl = createAsyncThunk("bl/getFile", async (file) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getFile/"+file, {
    method: "GET",
    responseType: "blob",    
  }).then(response => response.blob())
  .then(function(myBlob) {
    return((myBlob))
  })
  .catch((error) => {
    console.log(error);
  })
  const files = await response;
  return files;
});
//getBlPayer
export const getDecharge = createAsyncThunk("bl/getDecharge", async (id) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getDecharge/"+id, {
    method: "GET",
    responseType: "blob",    
  }).then(response => response.blob())
  .then(function(myBlob) {
    return((myBlob))
  })
  .catch((error) => {
    console.log(error);
  })
  const files = await response;
  return files;
});
/* export const getDecharge = createAsyncThunk("bl/getDecharge", async (id) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getDecharge/"+id, {
    method: "GET",
    responseType: "blob",    
    type: "application/*",
    //Force to receive data in a Blob Format
  }).then(response =>{{ response.blob()}})
  .then(function(myBlob) {
    return((myBlob))
  })
  .catch((error) => {
    console.log(error);
  })
  const files = await response;
  return files;
}); */
/* export const getDecharge = createAsyncThunk("bl/getDecharge", async (id) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getDecharge/" + id, {
    method: "GET",
    responseType: "blob",
    //Force to receive data in a Blob Format
  })
  .then((response) => {
    return response.url;
  })
  .catch((error) => {
    console.log(error);
  })
  const files = await response;
  return files;
}); */
export const exportBlPayment = createAsyncThunk("bl/exportBlPayment", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/exportBlPayment", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});
export const getBlPayer = createAsyncThunk("bl/getBlPayer", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getBlPayer", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});
export const totalCaByPack = createAsyncThunk("bl/totalCaByPack", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/totalCaByPack", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});
export const getExport = createAsyncThunk("bl/getExport", async () => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/getExport", {
    method: "get",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  });
  const bl = await response.json();
  return bl;
});
export const exportBl = createAsyncThunk("bl/exportBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/exportBl", {
    method: 'POST',
    headers: {          
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-access-token':token
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});
export const blAdded = createAsyncThunk("bl/addBl", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/addBl", {
    method: 'POST',
    headers: {          
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-access-token':token
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});
export const saveDecharge = createAsyncThunk("bl/saveDecharge", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/saveDecharge", {
    method: 'POST',
    headers: {
      'Accept': 'application/*',
      'x-access-token':token
    },
    body:action.fileArray
  });
  const bl = await response.json();
  return bl;
});
export const updateDecharge = createAsyncThunk("bl/updateDecharge", async (action) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/updateDecharge/"+action.idBl, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-access-token':token
    },
    body:JSON.stringify(action)
  });
  const bl = await response.json();
  return bl;
});
export const removeDecharge = createAsyncThunk("bl/removeDecharge", async (id) => {
  const response = await fetch(Configuration.BACK_BASEURL + "bl/removeDecharge/"+id, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-access-token':token
    },
  });
  const bl = await response.json();
  return bl;
});
/* saveDecharge(state, action) {
      
  fetch(Configuration.BACK_BASEURL + "bl/saveDecharge/"+action.payload.idBl, {
    method: 'POST',
    headers: {
      'Accept': 'application/*',
      'x-access-token':token
    },
    body:action.payload.fileArray
  });
} */
const blReduce = createSlice({
  name: "bl",
  initialState: {
    entities: [],
    loading: false,
  },
  reducers: {
    /* blAdded(state, action) {
      fetch(Configuration.BACK_BASEURL + "bl/addBl", {
        method: 'POST',
        headers: {          
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-access-token':token
        },
        body:JSON.stringify(action.payload)
      });
    }, */
    /* exportBl(state, action) {
      fetch(Configuration.BACK_BASEURL + "bl/exportBl", {
        method: 'POST',
        headers: {          
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-access-token':token
        },
        body:JSON.stringify(action.payload)
      });
    }, */
    blDeleted(state, action) {
      const { id } = action.payload;
      fetch(Configuration.BACK_BASEURL + "bl/delete/"+id, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-access-token':token
        },
      });
    },
    
    /* saveDecharge(state, action) {
      
      fetch(Configuration.BACK_BASEURL + "bl/saveDecharge/"+action.payload.idBl, {
        method: 'POST',
        headers: {
          'Accept': 'application/*',
          'x-access-token':token
        },
        body:action.payload.fileArray
      });
    }, */
  },
  extraReducers: {
    [extractionsBL.pending]: (state, action) => {
      state.loading = true;
    },
    [extractionsBL.fulfilled]: (state, action) => {
      state.loading = false;
      state.entities = [...state.entities, ...action.payload];
    },
    [extractionsBL.rejected]: (state, action) => {
      state.loading = false;
    },
  },
});

export const { blDeleted } = blReduce.actions;

export default blReduce.reducer;
