const express = require("express");
const router = express.Router();
var releve = require("../models/releve");
var ligneReleve = require("../models/ligne_releve");
var produit = require("../models/produit");
var user = require("../models/user");
var fournisseur = require("../models/fournisseur");
const auth = require("../middlewares/passport");
const jwt = require("jsonwebtoken");
const privateKey = "mySecretKeyabs";
const multer = require("multer");
var fs = require("fs");

// all releve grossiste
router.post("/allReleve",auth, (req, res) => {
  var token =(req.headers["x-access-token"])
  const decoded = jwt.verify(token, privateKey);
  var idrole = decoded.userauth.idrole;
  var id = req.body.id;
  var annee = req.body.annee;
  where={annee:annee};
  if(idrole==2) where ={id_delegue:id,annee:annee}
  ligneReleve.findAll({include:[ {
    model: releve,
    as: "releves",
    where:where,
    include:["users",'fournisseurs']
  },'produits'],}).then(function (r) {
    return res.status(200).send(r);
  });
});
//file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./releve");
  },
  filename: function (req, file, cb) {
    var splitF = file.originalname.split(".");
    var extensionFile = splitF[1];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + extensionFile);
  },
});
const upload = multer({ storage: storage });
router.post("/saveFile", auth, upload.single("file"), (req, res) => {
  res.send({ filename: req.file.filename });
});
router.post("/releveAdded", auth, async(req, res) => {
  var token =(req.headers["x-access-token"])
  const decoded = jwt.verify(token, privateKey);
  var id_delegue = decoded.userauth.id;
 
  releve.create({
    id_fournisseur: req.body.four, 
    file: req.body.filename,
    id_delegue: id_delegue,
    annee:req.body.annee 
  })
    .then((r) => {
      req.body.ligneReleve.forEach((e) => {
        ligneReleve.create({
          id_releve: r.id,
          id_produit: e.idProduit,
          stock: e.stock,
          total: e.total,
          jan: e.jan,
          fev: e.fev,
          mars: e.mars,
          avr: e.avr,
          mai: e.mai,
          juin: e.juin,
          juillet: e.juillet,
          aout: e.aout,
          sep: e.sep,
          oct: e.oct,
          nov: e.nov,
          dec: e.dec
        });
      });
    
      return res.status(200).send(true); 
    })
    .catch((error) => {
      console.log(error)
      return res.status(403).send(error);
    });
});

router.post("/cheeckProduit", auth, async(req, res) => {
  var jsondata = req.body;
  produit.findAll({ where: { etat: 1 } }).then(async function (rowsdes) {
    if (!rowsdes) {
      return res.status(403).send(false);
    } else {
      var arrayDes = [];
      var arrayId = [];
      var arrayCode = [];
      var arrayDesFinal = [];
      var notif =0;
      for (i = 0; i < rowsdes.length; i++) {
        arrayDes[rowsdes[i].id]=(rowsdes[i].dataValues.designation).toLowerCase();
        arrayCode[rowsdes[i].id]=rowsdes[i].dataValues.code;
        arrayId[rowsdes[i].id]=rowsdes[i].dataValues.parent;
      }
      /* for (i = 0; i < jsondata.length; i++) { */
      for (const i in jsondata) {    
        if (jsondata[i].code != "" && jsondata[i].code != null && arrayCode.indexOf(jsondata[i].code) >= 0) {
          var index=arrayCode.indexOf(jsondata[i].code);
          var idParent = arrayId[index];
          if(arrayCode.indexOf(jsondata[i].code)>=0)
            arrayDesFinal.push([arrayDes[index].toUpperCase(),100,idParent]);
            /* arrayDesFinal.push([arrayDes[index].toUpperCase(),100,index]); */
        } else {
          if (jsondata[i].designation != "" && jsondata[i].designation != null && arrayDes.indexOf(jsondata[i].designation.toLowerCase()) >= 0) { 
            
            var index=arrayDes.indexOf(jsondata[i].designation.toLowerCase());
            var idParent = arrayId[index];
            /* arrayDesFinal.push([jsondata[i].Designation.toUpperCase(),100,index]); */
            arrayDesFinal.push([jsondata[i].designation.toUpperCase(),100,idParent]);
       
          } else {
            if(jsondata[i].code != null || jsondata[i].designation !=null ){
              options = {
                scorer: fuzz.ratio, // Any function that takes two values and returns a score, default: ratio
                limit: 2, // Max number of top results to return, default: no limit / 0. 
                cutoff: 85, // Lowest score to return, default: 0
                nsorted: false, // Results won't be sorted if true, default: false. If true limit will be ignored.
              };
                var arrayScore = fuzz.extract(
                  jsondata[i].designation.toLowerCase(),
                  arrayDes,options
                )[0];
                arrayDesFinal.push(
                  arrayScore
                );
              
            }
          }
        }
      }
      return res.send(arrayDesFinal);
    }
  });
});

module.exports = router;
