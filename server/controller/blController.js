const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const privateKey = "mySecretKeyabs";
/** start import model **/
var bl = require("../models/bl");
var exportBl = require("../models/exportBl");
var ims = require("../models/ims");
var produit = require("../models/produit");
var marcheIms = require("../models/marcheIms");
var ligneBl = require("../models/ligneBl");
var detailsims = require("../models/detailsims");
var user = require("../models/user");
var pharmacie = require("../models/pharmacie");
var secteur = require("../models/secteur");
var pack = require("../models/pack");
var notification = require("../models/notification");
/** end import model **/
const auth = require("../middlewares/passport");
const multer = require("multer");
var fs = require("fs");
var configuration = require("../config");
const { Op } = require("sequelize");
var Sequelize = require("sequelize");
const SaveBase64 = require("node-base64-to-image");
var FormData = require("form-data");
const fetch = require("node-fetch");
const sequelize = new Sequelize(
  configuration.connection.base,
  configuration.connection.root,
  configuration.connection.password,
  {
    host: configuration.connection.host,
    port: configuration.connection.port,
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    operatorsAliases: false,
  }
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./bl");
  },
  filename: function (req, file, cb) {
    var splitF = file.originalname.split(".");
    var extensionFile = splitF[1];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + extensionFile);
  },
});
const upload = multer({ storage: storage });
//Decharge
const storageDecharge = multer.diskStorage({
  destination: function (req, file, cb) { 
    cb(null, "./decharge");
   
  },
  filename: function (req, file, cb) {
    /* cb(null, file.originalname); */
    var splitF = file.originalname.split(".");
    var extensionFile = splitF[1];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "decharge-" + uniqueSuffix + "." + extensionFile);
  },
});
const decharge = multer({ storage: storageDecharge });

var path = require("path");
var public = path.join(__dirname, "bl");
router.post("/saveFile", auth, upload.single("file"), (req, res) => {
  res.send({ filename: req.file.filename });
});
async function sendFile(file) {
  const filepath = path.join(file)
  const image = fs.createReadStream(filepath);
  var name = file.split("bl/");
  var form = new FormData();
  form.append("file", image);
  form.append("name", name[1]);
  const response = await fetch(
    "http://164.132.56.71:8080/bon-livraison",
    {
      method: "POST",
      headers: form.getHeaders(),
      body: form,
    }
  ).then();
  const data = await response.json();
  return data;
  /* res.send({ data: data }); */
}

/* router.get("/blVerifById/:id", auth, (req, res) => { */

async function blVerifById(id) {
  
  return new Promise((resolve, reject)=>{
    var where = {};
    bl.findOne({
      where:{
        id: id
      }
    }).then(val=>{
      if(val){
        where = {
          numeroBL: val.dataValues.numeroBL,
          fournisseur: val.dataValues.fournisseur, 
          etat:1,
          id: { [Op.ne]: id },
        }
        bl.findAll({
          where: where,
        }).then(async function (r) {
          var test = false;
          var montantBl = await ligneBl.sum("montant", {
            where: { idbielle: id },
            include: {
              model: bl,
              as: "bls",
            },
          });
          if (r.length != 0) {
            r.forEach(async (e, k) => {
              var montant = await ligneBl.sum("montant", {
                where: { idbielle: e.dataValues.id },
                include: {
                  model: bl,
                  as: "bls",
                },
              });
              if (parseFloat(montant).toFixed(3) == parseFloat(montantBl).toFixed(3)) {
                test = true;
              }
              console.log("blVerifById",test)
              if (k + 1 === r.length) return resolve(test);
            });
          } else {
            console.log("blVerifById1",test)
            return resolve(test);
          }
        });
        
      }
    })
    .catch((error) => {
      return reject(error);
    });
  });
};
router.post("/saveFile64", auth, async(req, res) => {
  const base64Data = req.body.imageSrc;
  var img = base64Data.indexOf("data:image/png");
  var ext = img == 0 ?"png":"jpg"
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const imageNameWithPath = `./bl/${uniqueSuffix}.${ext}`;
  var fileName = `${uniqueSuffix}.${ext}`;
  SaveBase64(base64Data, imageNameWithPath, ext);
  var data = await sendFile(imageNameWithPath);
  return res.status(200).send({data,fileName});
});
router.post("/addBl", auth, async(req, res) => {
  var date1 = new Date(); // Or the date you'd like converted.
  var date = new Date(date1.getTime() - (date1.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
  var token =(req.headers["x-access-token"])
  const decoded = jwt.verify(token, privateKey);
  var line = decoded.userauth.line;
  var getUserByLine = await user.findAll({
    where:{
      line:line,
      idrole:1
    }
  });  
  var entities = Object.values(JSON.parse(JSON.stringify(getUserByLine)));
  bl.create({
    client: req.body.bl.Client, 
    id_gouvernorat: req.body.bl.idIms,
    numBl: req.body.bl.numeroBL,
    numeroBL: req.body.bl.numeroBL,
    dateBl: req.body.bl.dateBL,
    fournisseur: req.body.bl.Fournisseur,
    adresseClient: req.body.bl.Adresse,
    iduser: req.body.bl.iduser,
    id_pack: req.body.bl.id_pack,
    file: req.body.bl.file,
    etat: 0,
    dateInsertion:date
  })
    .then((r) => {
      req.body.ligneBl.forEach((e) => {
        ligneBl.create({
          idbielle: r.id,
          montant: e.Montant,
          idproduit: e.idProduit,
          quantite: e.Quantite,
        });
      });
      entities.forEach(e=>{
        notification.create({
          id_user:e.id,
          etat:1,
          text:"Nouveau bl: "+req.body.bl.numeroBL
        })
      })
      return res.status(200).send(true); 
    })
    .catch((error) => {
      console.log(error)
      return res.status(403).send(error);
    });
});
router.post("/getAllAnneeLignesBL", auth, (req, res) => {
  bl.findAll({
    attributes: [[sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"]],
    group: ["annee"],
  }).then(function (b) {
    return res.status(200).send(b);
  });
});
router.post("/tableProduits", auth, (req, res) => {
  const annee = req.body.annee;
  const trimestre = req.body.trimestre;
  const idLine = req.body.idLine;
  const idRole = req.body.idRole;
  const tab = [];
  tab.push(" b.etat = 1 ");
  switch (trimestre) {
    case 1:
      tab.push(" DATE_FORMAT(b.dateBl,'%c') in (1,2,3) ");
      break;
    case 2:
      tab.push(" DATE_FORMAT(b.dateBl,'%c') in (4,5,6) ");
      break;
    case 3:
      tab.push(" DATE_FORMAT(b.dateBl,'%c') in (7,8,9) ");
      break;
    case 4:
      tab.push(" DATE_FORMAT(b.dateBl,'%c') in (10,11,12) ");
      break;
  }
  if (idRole != 0 && idRole != 4 && idRole != 5) {
    tab.push(` u.line = ${idLine} `);
  }
  tab.push(` year(b.dateBl) = ${annee} `);
  var condition = tab.join(" and ");
  var sql = `SELECT b.id as idBl,b.numeroBL,b.bonification, b.dateBl,u.nomU as nomDelegue, u.type,
  i.libelle as ims,b.client,cl.nom as nomClt, pp.nom as pack, pp.id as idPack,b.fournisseur,
  p.designation as designation , li.montant as mnt,li.quantite as qte ,cl.code ,
  DATE_FORMAT(b.dateBl,'%Y') as annee , 
  DATE_FORMAT(b.dateBl,'%b') as month ,
  DATE_FORMAT(b.dateBl,'%e') as day
  FROM bls b 
  left join lignebls li on b.id = li.idbielle
  left join pharmacies cl on cl.id = b.client
  left join users u on u.id = b.iduser
  left join produits p on p.id = li.idproduit
  left join packs pp on pp.id = b.id_pack
  left join ims i on i.id = b.id_gouvernorat
  where ${condition}
  ORDER BY dateBl desc`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        return res.status(200).json(r1);
      }
    });
});

router.post("/blVerif", auth, (req, res) => {
  var where = {
    numeroBL: req.body.numeroBL,
    fournisseur: req.body.fournisseur,
  };
  if (typeof req.body.id != "undefined")
    where = {
      numeroBL: req.body.numeroBL,
      fournisseur: req.body.fournisseur, 
      id: { [Op.ne]: req.body.id },
    };
  bl.findAll({
    where: where,
  }).then(async function (r) {
    var test = false;
    if (r.length != 0) {
      r.forEach(async (e, k) => {
        var montant = await ligneBl.sum("montant", {
          where: { idbielle: e.dataValues.id },
          include: {
            model: bl,
            as: "bls",
          },
        });
        if (parseFloat(montant).toFixed(3) == parseFloat(req.body.somme)) {
          test = true;
        }
        if (k + 1 === r.length) return res.status(200).send(test);
      });
    } else {
      return res.status(200).send(test);
    }
  });
});

router.post("/getBlBack", auth, (req, res) => {
  var where = {};
  var whereU = {};
  if (req.body.idRole == 1) {
    where = { etat: 0 };
    ///whereU = { line: req.body.idLine };
    if (req.body.id > 0) whereU = { line: req.body.idLine, id: req.body.id };
  } else where = { etat: [0, 2] };
  /* bl.findAll({
    where: {
      [Op.and]: [
        sequelize.where(
          sequelize.fn("year", sequelize.col("dateBl")), 
          req.body.year
        ),
        where,
      ],
    },
    include: [
      { model: user, as: "users", where: whereU },
      "pharmacies",
      "packs",
    ],
    order: [["etat", "DESC"]],
  }).then(function (r) {
    return res.status(200).send(r);
  }); */
  ligneBl
    .findAll({
      attributes: [[sequelize.fn("sum", sequelize.col("montant")), "mnt"]],
      group: ["idbielle"],
      include: {
        model: bl,
        as: "bls",
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              req.body.year
            ),
            where,
          ],
        },
        include: [
          {
            model: user,
            as: "users",
            where: whereU,
          },
          "pharmacies",
          "packs",
          "ims",
        ],
        order: [["etat", "DESC"]],
      },
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});

router.post("/getBl", auth, (req, res) => {
  var where = {};
  var whereU = {};
  /* if (req.body.idRole == 1) {
    where = { etat: 0 };
    whereU = { line: req.body.idLine };
  } else {
    where = { etat: [0, 2] };  
    whereU = { id:req.body.id};  
  } */
  
  if (req.body.idRole == 1 || req.body.idRole == 2) {
    whereU = { line: req.body.idLine  };
    if(req.body.idRole == 1) if (req.body.idDelegue != 0) where = { etat: 0,iduser: req.body.idDelegue };
    else where = { etat: 0}
    if(req.body.idRole == 2) if (req.body.idDelegue != 0) where = { etat: [0, 2],iduser: req.body.idDelegue };
    else where = { etat: [0, 2]}
  } else {
    if (req.body.idDelegue != 0) where = { iduser: req.body.idDelegue };
  }
  ligneBl.findAll({
      attributes: [[sequelize.fn("sum", sequelize.col("montant")), "mnt"]],
      group: ["idbielle"],
      include: {
        model: bl,
        as: "bls",
        where: {
          [Op.and]: [
            sequelize.where(sequelize.fn("year", sequelize.col("dateBl")),req.body.year),
            where
          ],
        },
        include: [
          {
            model: user,
            as: "users",
            where: whereU,
          },
          "pharmacies",
          "packs",
          "ims",
        ],
      },
      order: [["idbielle", "DESC"]],
    })
    .then(function (data) {
      var array = [];
      data.forEach((e, key) => {
        var bls = e.dataValues.bls;
        var ext = bls.file.split(".");
        array.push({
          id: bls.id,
          pharmacie: bls.pharmacies.nom,
          users: bls.users.nomU+" "+bls.users.prenomU,
          pack: bls.packs.nom,
          bonification: bls.packs.bonification,
          date: bls.dateBl,
          fileURL: null,
          etat: bls.etat,
          mnt: parseFloat(e.dataValues.mnt).toFixed(3),
          numeroBl: bls.numeroBL,
          ext: ext[1],
          file: bls.file,
          fournisseur: bls.fournisseur,
          commentaire: bls.commentaire,
          ims: bls.ims.libelle,
        });
      });
      return res.status(200).send(array);
    });
});
router.post("/getBlVis", auth, (req, res) => {
  const client = req.body.client;
  const idDelegue = req.body.idDelegue;
  const idLine = parseInt(req.body.idLine);
  const idRole = parseInt(req.body.idRole);
  const year = parseInt(req.body.year);
  var whereD = {};
  var whereC = {};
  var whereU = {};
  if (idRole == 1 || idRole == 2) {
    whereU = { line: idLine };
    if (idDelegue != 0) whereD = { iduser: idDelegue };
  } else {
    if (idDelegue != 0) whereD = { iduser: idDelegue };
  }
  if (client != 0) whereC = { client: client };
  ligneBl
    .findAll({
      attributes: [[sequelize.fn("sum", sequelize.col("montant")), "mnt"]],
      group: ["idbielle"],
      include: {
        model: bl,
        as: "bls",
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            { etat: 1, payer: 0 },
            whereC,
            whereD,
          ],
        },
        include: [
          { model: user, as: "users", where: whereU },
          "pharmacies",
          "packs",
          "ims",
        ],
        /* order: [["id", "DESC"]], */
      },
      order: [["idbielle", "DESC"]],
    })
    .then(function (r) {
      var array = [];
      r.forEach((e, key) => {
        var bls = e.dataValues.bls;
        var ext = "";
        var file  = "";
        if(bls.file != null)
       { ext = bls.file.split("."); 
        file = ext[1]}
        array.push({
          id: bls.id,
          pharmacie: bls.pharmacies.nom,
          users: bls.users.nomU+" "+bls.users.prenomU,
          pack: bls.users.type == 0?bls.packs.nom:"Vente direct",
          bonification: bls.bonification, 
          payer: bls.payer, 
          date: bls.dateBl,
          fileURL: null,
          etat: bls.etat,
          mnt: parseFloat(e.dataValues.mnt).toFixed(3),
          numeroBl: bls.numeroBL,
          ext: file,
          file: bls.file,
          fournisseur: bls.fournisseur,
          ims: bls.ims.libelle,
        });
      });
      return res.status(200).send(array);
    });
});
router.post("/totalCA", auth, async (req, res) => {
  const year = req.body.year;
  const mois = req.body.mois;
  const idLine = req.body.idLine;
  const idRole = req.body.idRole;
  var where = {};
  if (idRole != 0 && idRole != 4 && idRole != 5) where = { line: idLine };
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  var montant = await ligneBl.sum("montant", {
    include: {
      model: bl,
      as: "bls",
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn("year", sequelize.col("dateBl")), year),
          whereMois,
          { etat: 1 },
        ],
      },
      include: {
        model: user,
        as: "users",
        where: where,
      },
    },
  });
  var totalBl = await bl.count({
    distinct: true,
    col: "id",
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("year", sequelize.col("dateBl")), year),
        whereMois,
        { etat: 1 },
      ],
    },
    include: {
      model: user,
      as: "users",
      where: where,
    },
  });
  var totalClient = await bl.count({
    distinct: true,
    col: "client",
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("year", sequelize.col("dateBl")), year),
        whereMois,
        { etat: 1 },
      ],
    },
    include: {
      model: user,
      as: "users",
      where: where,
    },
  });
  montant = montant == null ? 0 : montant;
  totalClient = totalClient == null ? 0 : totalClient;
  totalBl = totalBl == null ? 0 : totalBl;
  return res
    .status(200)
    .send({ montant: montant.toFixed(3), totalBl, totalClient });
});
router.post("/totalCaByPack", auth, async (req, res) => {
  const idPack = req.body.idPacks;
  const idLine = req.body.idLine;
  const dateDebut = req.body.dateDebut;
  const dateFin = req.body.dateFin;
  /* var where = {};
  if (idRole != 0 && idRole != 4 && idRole != 5) where = { line: idLine };
  var whereMois = null;
  if (mois != 0) { 
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  } */
  /* var montant = await ligneBl.sum("montant", {
    include: {
      model: bl,
      as: "bls",
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn("year", sequelize.col("dateBl")), year),
          { etat: 1,id_pack:idPack },
        ],
      }
    },
  }); */
  var countBl = await bl.findAll({
      where: {
        [Op.and]:[
          {etat: 1},
          {id_pack:idPack},
          {dateBl: { [Op.gte]: dateDebut }}, 
          {dateBl: { [Op.lte]: dateFin }} 
        ]
        /* etat: 1,
        id_pack:idPack,
         dateBl: { [Op.gte]: dateDebut }, 
         dateBl: { [Op.lte]: dateFin }   */   
      },
      include:{
        model: user,
        as: "users",
        where: {line:idLine}
      }
  });
  return res.status(200).send({ countBl:countBl.length });
});
router.post("/changeEtat", auth, async(req, res) => {
  console.log("changeEtat")
  var id = req.body.id;
  var etat = req.body.etat;
  var bonification = req.body.bonification;
  var commentaire = req.body.commentaire;
  var date1 = new Date(); // Or the date you'd like converted.
  var dateValidation = new Date(date1.getTime() - (date1.getTimezoneOffset() * 60000)).toISOString().slice(0, 10)

  var getBlByUser = await bl.findOne({ where: { id: id }, include: ["users"] });
  /* var getUserById = await user.findOne({
    where: { id: getBlByUser.dataValues.iduser }
  }); */
  var txt ="";
  var etatNotif=0;
  if(etat == 1 ) {
    txt="Bl accepter : "+getBlByUser.dataValues.numeroBL;
    etatNotif = 2;
  }
  else{
    txt="Bl refuser : "+getBlByUser.dataValues.numeroBL;
    etatNotif = 3;
  }
  
  notification.create({
    id_user:getBlByUser.dataValues.iduser,
    etat:etatNotif,
    text:txt
  })
  if(etat !=1){
    bl.update(
      {
        etat: etat,
        bonification: bonification,
        dateValidation:dateValidation,
        commentaire:commentaire
      },
      { where: { id: id } }
    )
      .then((r2) => {
        return res.status(200).send(true);
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  }else {
    var verifNum = await blVerifById(id);
    if(!verifNum){
      
      bl.update(
        {
          etat: etat,
          bonification: bonification,
          dateValidation:dateValidation,
          commentaire:commentaire
        },
        { where: { id: id } }
      )
        .then((r2) => {
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
      }else {
        return res.status(200).send(false);
      }
  }
});
router.delete("/delete/:id", auth, async (req, res) => {
  var id = req.params.id;
  var blFind = await bl.findOne({ where: { id: req.params.id } });
  if (blFind != null) {
    var file = blFind.dataValues.file;
    if (file != "")
      if (fs.existsSync("./bl/" + file)) fs.unlinkSync("./bl/" + file);
    ligneBl
      .destroy({ where: { idbielle: id } })
      .then((r2) => {
        bl.destroy({ where: { id: id } }).then((r2) => {
          return res.status(200).send(true);
        });
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  }
});
router.put("/updateNum/:id", auth, async (req, res) => {
  var id = req.params.id;
  var numeroBL = req.body.numeroBL;
  var blFind = await bl.findOne({ where: { id: req.params.id } });
  if (blFind != null) {
    bl.update(
      {
        numeroBL: numeroBL,
      },
      { where: { id: id } }
    )
      .then((r2) => {
        return res.status(200).send(true);
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  }
});
router.put("/payer/:id", auth, async (req, res) => {
  var id = req.params.id;
  var date = new Date(); // Or the date you'd like converted.
  var datePayement = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
  var blFind = await bl.findOne({ where: { id: id } });
  if (blFind != null) {
    bl.update(
      {
        datePayement: datePayement,
        payer:1
      },
      { where: { id: id } }
    )
    .then(() => {
      return res.status(200).send(true);
    })
    .catch((error) => {
      return res.status(403).send(false);
    });
  }
});
router.get("/getFile/:id", async(req, res) => {
  
  var id = req.params.id;
  var blFind = await bl.findOne({ where: { id: id } });
  if (blFind != null) {
    var file = blFind.dataValues.file;
    if(file){
      if (fs.existsSync("./bl/" + file)) { 
        var file = fs.createReadStream("./bl/" + file);
        file.pipe(res);
      } else return res.status(403).json({ message: false });
    } else {      
      return res.status(403).json({ message: false });
    }
  }
  /* if (fs.existsSync("./bl/" + req.params.file)) {
    var file = fs.createReadStream("./bl/" + req.params.file);
    file.pipe(res);
  } else return res.status(403).json({ message: false }); */
});
router.post("/getAllClientBl", auth, (req, res) => {
  var where = {};
  var whereL = {};
  var year = req.body.anneeLocal;
  if (req.body.idRole == 2) {
    if (req.body.idUser > 0) where = { etat: 1, iduser: req.body.idUser };
  } else if (req.body.idRole == 1) {
    if (req.body.idLine > 0) whereL = { line: req.body.idLine };
  } else {
    where = { etat: 1 };
  }

  bl.findAll({
    where: {
      [Op.and]: [
        sequelize.where(
          sequelize.fn("year", sequelize.col("bls.dateBl")),
          year
        ),
        where,
      ],
    },
    include: [
      {
        model: user,
        as: "users",
        where: {
          [Op.and]: [
            whereL,
          ],
        },
      },
      "pharmacies",
    ],
    order: [["id", "DESC"]],
    group: ["client"],
  }).then(function (r) {
    return res.status(200).send(r);
  });
});

router.post("/getAllDelegueBl", auth, (req, res) => {
  var whereL = {};
  var year = req.body.anneeLocal;
  if (req.body.idRole == 1) {
    if (req.body.idLine > 0) whereL = { line: req.body.idLine };
  }
  bl.findAll({
    attributes: ["iduser","dateBl","etat"],
    where: {
      [Op.and]: [
        sequelize.where(
          sequelize.fn("year", sequelize.col("dateBl")),
          year
        ),
      ],
    },

    include: [
      {
        attributes: ["id", "nomU", "prenomU"],
        model: user,
        as: "users",
        where: whereL
        /* where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            whereL,
          ],
        }, */
      },
    ],
    order: [["id", "DESC"]],
    group: ["iduser"],
  }).then(function (r) {
    return res.status(200).send(r);
  });
});

router.post("/getAllProduitBl", auth, (req, res) => {
  var whereL = {};
  var year = req.body.anneeLocal;
  if (req.body.idRole == 1) {
    if (req.body.idLine > 0) whereL = { line: req.body.idLine };
  }
  ligneBl
    .findAll({
      include: ["produits",
        {
          model: bl,
          as: "bls",
          where: {
            [Op.and]: [
              sequelize.where(
                sequelize.fn("year", sequelize.col("dateBl")),
                year
              ),
            ],
          },
          include: [
            {
              model: user,
              as: "users",
              where: whereL
            },
          ],
        },
      ],
      group: ["idproduit"],
    })
    .then(function (p) {
      var arrayOption = [];   
      p.forEach((elem) => {   //console.log('ici',elem)
       if(elem.produits!=null){ arrayOption.push({
          value: elem.produits.id,
          label: elem.produits.designation,
        });}
      });
      return res.status(200).send(arrayOption);
    })
});
router.post("/getAllMarcheBl", auth, (req, res) => {  
  var whereL = {};
  var year = req.body.anneeLocal;

  if (req.body.idRole == 1) {
    if (req.body.idLine > 0) whereL = { line: req.body.idLine };
  }
  ligneBl
    .findAll({
      include: [
        {
          attributes: ["id", "desigims"],
          model: produit,
          as: "produits",
          include: {
            attributes: ["id", "lib"],
            model: marcheIms,
            as: "marcheims",
          },
        },
        {
          model: bl,
          as: "bls",
          where: {
            [Op.and]: [
              sequelize.where(
                sequelize.fn("year", sequelize.col("dateBl")),
                year
              ),
            ],
          },
          include: [
            {
              model: user,
              as: "users",
              where:whereL
            },
          ],
        },
      ]
    })
    .then(function (r) {
      var arrayOption = [];
      r.forEach((elem) => {
        if (elem.produits!=null)
          arrayOption.push({
            value: elem.produits.marcheims.id,
            label: elem.produits.marcheims.lib,
          });
      });
      return res.status(200).send(arrayOption);
    })
});

router.post("/getAllSecteurBl", auth, (req, res) => {
  var whereL = {};
  var idLine = req.body.idLine;
  var year = req.body.anneeLocal;
  if (req.body.idRole == 1) {
    if (idLine > 0) whereL = { line: idLine };
  }

  bl.findAll({
    where: {
      [Op.and]: [
        sequelize.where(
          sequelize.fn("year", sequelize.col("dateBl")),
          year
        ),
      ],
    },
    include: [
      {
        attributes: ["idsect"],
        model: user,
        as: "users",
        where: whereL,
        include: [
          {
            attributes: ["libelleSect", "id"],
            model: secteur,
            as: "secteurs",
          },
        ],
      },
    ],
    order: [["id", "DESC"]],
    group: ["users.idsect"],
  }).then(function (r) {
    return res.status(200).send(r);
  });
});
router.post("/getAllParmacieBl", auth, (req, res) => {
  /* var whereL = {};
  var idLine = req.body.idLine;
  if (req.body.idRole == 1) {
    if (idLine > 0) whereL = { line: idLine };
  } */
  var year = req.body.anneeLocal;
  var where = {};
  var whereL = {};
  if (req.body.idRole == 2) {
    if (req.body.idUser > 0) where = { etat: 1, iduser: req.body.idUser };
  } else if (req.body.idRole == 1) {
    if (req.body.idLine > 0) whereL = { line: req.body.idLine };
  } else {
    where = { etat: 1 };
  }
  bl.findAll({
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("year", sequelize.col("dateBl")), year),
        where,
      ],
    },
    include: [
      {
        model: user,
        as: "users",
        where: whereL,
      },
      {
        attributes: ["id", "nom"],
        model: pharmacie,
        as: "pharmacies",
      },
    ],
    group: ["client"],
  }).then(function (client) {
    var arrayOption = [];
    client.forEach((elem) => {
      arrayOption.push({
        value: elem.pharmacies.id,
        label: elem.pharmacies.nom,
      });
    });
    return res.status(200).send(arrayOption);
  });
});
router.post("/getMarcheFromDetail", auth, (req, res) => {
  detailsims
    .findAll({
      group: ["chef_produit"],
      order: [["chef_produit", "DESC"]],
    })
    .then(function (data) {
      var arrayOption = [];
      data.forEach((elem) => {
        arrayOption.push({
          value: elem.chef_produit,
          label: elem.chef_produit,
        });
      });
      return res.status(200).send(arrayOption);
    });
});
router.post("/getAllImsBl", auth, (req, res) => {
  var whereL = {};
  var year = req.body.anneeLocal;
  if (req.body.idRole == 1) {
    if (req.body.idLine > 0) whereL = { line: req.body.idLine };
  }
  bl.findAll({
    where: {
      [Op.and]: [
        sequelize.where(
          sequelize.fn("year", sequelize.col("dateBl")),
          year
        ),
      ],
    },
    include: [
      {
        attributes: ["id", "nomU", "prenomU"],
        model: user,
        as: "users",
        where: whereL
      },
      {
        attributes: ["id", "libelle"],
        model: ims,
        as: "ims",
      },
    ],
    group: ["id_gouvernorat"],
  }).then(function (bricks) {
    var arrayOption = [{ value: 0, label: "Tous" }];
    bricks.forEach((elem) => {
      arrayOption.push({
        value: elem.ims.id,
        label: elem.ims.libelle,
      });
    });
    return res.status(200).send(arrayOption);
  });
});
router.post("/getAllPackBl", auth, (req, res) => {
  bl.findAll({
    attributes: ["id", "id_pack"],
    include: [
      {
        attributes: ["id", "nom"],
        model: pack,
        as: "packs",
      },
    ],
    group: ["id_pack"],
  }).then(function (data) {
    var arrayOption = [];
    data.forEach((elem) => {
      arrayOption.push({
        value: elem.packs.id,
        label: elem.packs.nom,
      });
    });
    return res.status(200).send(arrayOption);
  });
});
router.post("/comparaisonImsBricks", auth, (req, res) => {
  var year = req.body.year;
  const mois = req.body.mois;
  var whereMois = null;
  var whereMois1 = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
    whereMois1 = sequelize.where(
      sequelize.fn("month", sequelize.col("date")),
      mois
    );
  }
  ims
    .findAll({
      where: { etat: 1,id: { [Op.ne]: 0 }  },
    })
    .then(function (r) {
      var list = [];
      if(r)
        r.forEach(async (e, k) => {
          // sum mnt from bl
          var mntBl = await ligneBl.sum("montant", {
            group: ["idbielle"],
            include: {
              model: bl,
              as: "bls",
              where: {
                [Op.and]: [
                  sequelize.where(
                    sequelize.fn("year", sequelize.col("dateBl")),
                    year
                  ),
                  { id_gouvernorat: e.dataValues.id },
                  { etat: 1 },
                  whereMois,
                ],
              },
            },
          });

          // qte from bl
          var qteBl = await ligneBl.sum("quantite", {
            group: ["idbielle"],
            include: {
              model: bl,
              as: "bls",
              where: {
                [Op.and]: [
                  sequelize.where(
                    sequelize.fn("year", sequelize.col("dateBl")),
                    year
                  ),
                  { id_gouvernorat: e.dataValues.id },
                  { etat: 1 },
                  whereMois,
                ],
              },
            },
          });

          // sum mnt from Detail
          var mntDetail = await detailsims.sum("total", {
            group: ["idIms"],
            where: {
              [Op.and]: [
                sequelize.where(
                  sequelize.fn("year", sequelize.col("date")),
                  year
                ),
                { idIms: e.dataValues.id },
                whereMois1,
              ],
            },
          });

          // qte from Detail
          var qteDetail = await detailsims.sum("volume", {
            group: ["idIms"],
            where: {
              [Op.and]: [
                sequelize.where(
                  sequelize.fn("year", sequelize.col("date")),
                  year
                ),
                { idIms: e.dataValues.id },
                whereMois1,
              ],
            },
          });
          mntBl = mntBl === null ? 0 : mntBl;
          qteBl = qteBl === null ? 0 : qteBl;
          mntDetail = mntDetail === null ? 0 : mntDetail;
          qteDetail = qteDetail === null ? 0 : qteDetail;

          list.push({
            ims: e.dataValues.libelle,
            idIms: e.dataValues.id,
            mntBl: mntBl.toFixed(3),
            qteBl: qteBl,
            mntDetail: mntDetail.toFixed(3),
            qteDetail: qteDetail,
          });
          if (k + 1 === r.length) return res.status(200).send({ list });
        });
      else
        return res.status(403).send(list);
        
    });
});
router.post("/comparaisonMarcheIms", auth, (req, res) => {
  var year = req.body.year;
  const mois = req.body.mois;
  var whereMois = null;
  var whereMois1 = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
    whereMois1 = sequelize.where(
      sequelize.fn("month", sequelize.col("date")),
      mois
    );
  }
  marcheIms.findAll({ where: { etat: 1 } }).then(function (r) {
    var list = [];
    if(r)
      r.forEach(async (e, k) => {
        // total montant bl
        var mntBl = await ligneBl.sum("montant", {
          include: {
            model: bl,
            as: "bls",
            where: {
              [Op.and]: [
                sequelize.where(
                  sequelize.fn("year", sequelize.col("dateBl")),
                  year
                ),
                { etat: 1 },
                whereMois,
              ],
            },
          },
          include: {
            model: produit,
            as: "produits",
            where: { desigims: e.dataValues.id },
            group: ["desigims"],
          },
        });
        // total quantite bl
        var qteBl = await ligneBl.sum("quantite", {
          include: {
            model: bl,
            as: "bls",
            where: {
              [Op.and]: [
                sequelize.where(
                  sequelize.fn("year", sequelize.col("dateBl")),
                  year
                ),
                { etat: 1 },
                whereMois,
              ],
            },
          },
          include: {
            model: produit,
            as: "produits",
            where: { desigims: e.dataValues.id },
            group: ["desigims"],
          },
        });

        // sum mnt from Detail
        var mntDetail = await detailsims.sum("total", {
          group: ["chef_produit"],
          where: {
            [Op.and]: [
              sequelize.where(sequelize.fn("year", sequelize.col("date")), year),
              { chef_produit: e.dataValues.lib },
              whereMois1,
            ],
          },
        });

        // qte from Detail
        var qteDetail = await detailsims.sum("volume", {
          group: ["chef_produit"],
          where: {
            [Op.and]: [
              sequelize.where(sequelize.fn("year", sequelize.col("date")), year),
              { chef_produit: e.dataValues.lib },
              whereMois1,
            ],
          },
        });
        mntBl = mntBl === null ? 0 : mntBl;
        qteBl = qteBl === null ? 0 : qteBl;
        mntDetail = mntDetail === null ? 0 : mntDetail;
        qteDetail = qteDetail === null ? 0 : qteDetail;

        list.push({
          marche: e.dataValues.lib,
          idMarche: e.dataValues.id,
          mntBl: mntBl.toFixed(3),
          qteBl: qteBl,
          mntDetail: mntDetail.toFixed(3),
          qteDetail: qteDetail,
        });
        if (k + 1 === r.length) return res.status(200).send({ list });
      });
    else
      return res.status(403).send(list);
  });
});

router.post("/suiviMensuelBack", auth, (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  const idClient = req.body.idClient;
  const idLine = req.body.idLine;
  const idUser = req.body.idUser;
  var whereMois = null;
  var whereLine = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  if (idLine != 0) whereLine = { line: idLine };
  ligneBl
    .findAll({
      attributes: [[sequelize.fn("sum", sequelize.col("montant")), "mnt"]],
      include: {
        model: bl,
        as: "bls",
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
          [sequelize.fn("MONTH", sequelize.col("dateBl")), "mois"],
        ],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            whereMois,
            { etat: 1 },
          ],
        },
        include: [
          {
            model: user,
            as: "users",
          },
          {
            model: pharmacie,
            as: "pharmacies",
          },
        ],
      },
      group: [
        [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
        [sequelize.fn("MONTH", sequelize.col("dateBl")), "mois"],
      ],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});

//Évolution du CA généré par BL && Suivi mensuel du CA généré par BL
router.post("/suiviMensuel", auth, (req, res) => {
  const qteCA = req.body.qteCA;
  const idLine = req.body.idLine;
  const idUser = req.body.idUser;
  const year = req.body.year;
  const lastYear = year - 1;
  var where = ` where b.etat = 1 and DATE_FORMAT(b.dateBl,'%Y') IN (${year} , ${lastYear}) `;

  if (idLine != 0) {
    where += ` and u.line=${idLine}`;
  }
  if (idUser != 0) {
    where += ` and b.iduser=${idUser}`;
  }
  var valQteCA = "";
  var order = "";
  if (qteCA == 1) {
    valQteCA = " sum(li.quantite) as qteCA";
    order = "qteCA";
  } else {
    valQteCA = " sum(li.montant) as qteCA";
    order = "qteCA";
  }
  var sql = `SELECT  ${valQteCA},
      DATE_FORMAT(b.dateBl,'%b') as mounth ,
      DATE_FORMAT(b.dateBl,'%Y') as annee
      FROM bls b 
      left join lignebls li on  b.id =li.idbielle  
      left join users u on b.iduser = u.id
      ${where}
      group by mounth,annee order by ${order}  DESC`;

  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        return res.status(200).json(r1);
      }
    });
});

//CA généré par les BL selon le secteur
router.post("/chiffreParSecteur", auth, (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  const idLine = req.body.idLine;
  const idRole = req.body.idRole;
  const secteurs = req.body.secteur;
  const limit = req.body.limit;
  var whereU = {};
  if (secteurs.length != 0 && idRole != 0 && idRole != 4 && idRole != 5) {
    whereU = [{ idsect: secteurs, line: idLine }];
  } else if (idRole != 0 && idRole != 4 && idRole != 5) {
    whereU = [{ line: idLine }];
  } else if (secteurs.length != 0) {
    whereU = [{ idsect: secteurs }];
  }
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  /* if (idRole != 0) whereLine = { line: idLine }; */
  var valQteCA = "";
  if (qteCA == 1) {
    valQteCA = "quantite";
    order = "qteCA";
  } else {
    valQteCA = "montant";
    order = "qteCA";
  }
  ligneBl
    .findAll({
      limit: limit,
      attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"]],
      include: {
        model: bl,
        as: "bls",
        attributes: [[sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"]],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            whereMois,
            { etat: 1 },
          ],
        },
        include: [
          {
            model: user,
            as: "users",
            where: whereU,
            include: {
              model: secteur,
              as: "secteurs",
            },
          },
        ],
      },
      group: [["bls.users.idsect"]],
      order: [[sequelize.fn("sum", sequelize.col(valQteCA)), "DESC"]],
    })
    .then(function (data) {
      var arraySect = [];
      var arrayMnt = [];
      var arrayOption = [];
      data.forEach((d, k) => {
        var som =
          qteCA == 1 ? d.dataValues.qteCA : d.dataValues.qteCA.toFixed(3);
        arrayMnt.push(som);
        arraySect.push(d.dataValues.bls.users.secteurs.libelleSect);
        arrayOption.push({
          value: d.dataValues.bls.users.secteurs.id,
          label: d.dataValues.bls.users.secteurs.libelleSect,
        });
      });
      return res.status(200).send({ arraySect, arrayMnt, arrayOption });
    });
});

//CA géneré par les BL selon délégué
router.post("/venteBLParDelegue", auth, (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  const idLine = req.body.idLine;
  const idRole = req.body.idRole;
  const users = req.body.user;
  const limit = req.body.limit;
  var whereU = {};
  if (users.length != 0 && idRole != 0 && idRole != 4 && idRole != 5) {
    whereU = [{ id: users, line: idLine }];
  } else if (idRole != 0 && idRole != 4 && idRole != 5) {
    whereU = [{ line: idLine }];
  } else if (users.length != 0) {
    whereU = [{ id: users }];
  }
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  /* if (idRole != 0) whereLine = { line: idLine }; */
  var valQteCA = "";
  if (qteCA == 1) {
    valQteCA = "quantite";
    order = "qteCA";
  } else {
    valQteCA = "montant";
    order = "qteCA";
  }
  ligneBl
    .findAll({
      limit: limit,
      attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"]],
      include: {
        model: bl,
        as: "bls",
        attributes: [[sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"]],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            whereMois,
            { etat: 1 },
          ],
        },
        include: [
          {
            model: user,
            as: "users",
            where: whereU,
          },
        ],
      },
      order: [[sequelize.fn("sum", sequelize.col(valQteCA)), "DESC"]],
      group: [["bls.users.id"]],
    })
    .then(function (data) {
      var arrayUser = [];
      var arrayOption = [];
      var arrayMnt = [];
      data.forEach((d) => {
        var som =
          qteCA == 1 ? d.dataValues.qteCA : d.dataValues.qteCA.toFixed(3);
        arrayMnt.push(som);
        arrayUser.push(
          d.dataValues.bls.users.nomU + " " + d.dataValues.bls.users.prenomU
        );
        arrayOption.push({
          value: d.dataValues.bls.users.id,
          label:
            d.dataValues.bls.users.nomU + " " + d.dataValues.bls.users.prenomU,
        });
      });
      return res.status(200).send({ arrayUser, arrayMnt, arrayOption });
    });
});

//CA des produits extraits des BL
router.post("/produitMarche", auth, (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  const idLine = req.body.idLine;
  const idRole = req.body.idRole;
  const marches = req.body.marche;
  var limit = req.body.limit;
  var whereU = {};
  if (idRole != 0 && idRole != 4 && idRole != 5) whereU = { line: idLine };
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  var whereProd = {};
  if (marches.length != 0) whereProd = { desigims: marches };
  var valQteCA = "";
  if (qteCA == 1) {
    valQteCA = "quantite";
    order = "qteCA";
  } else {
    valQteCA = "montant";
    order = "qteCA";
  }
  ligneBl
    .findAll({
      limit: limit,
      attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"]],
      include: [
        {
          model: bl,
          as: "bls",
          attributes: [
            [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
          ],
          where: {
            [Op.and]: [
              sequelize.where(
                sequelize.fn("year", sequelize.col("dateBl")),
                year
              ),
              whereMois,
              { etat: 1 },
            ],
          },
          include: [
            {
              attributes: ["id", "line"],
              model: user,
              as: "users",
              where: whereU,
            },
          ],
        },
        {
          attributes: ["id", "designation"],
          model: produit,
          as: "produits",
          where: whereProd,
          include: {
            attributes: ["id", "lib"],
            model: marcheIms,
            as: "marcheims",
            where: { id: { [Op.ne]: 0 } },
          },
        },
      ],
      group: [["produits.marcheims.lib"]],
      order: [[sequelize.fn("sum", sequelize.col(valQteCA)), "DESC"]],
    })
    .then(function (data) {
      var arrayMarche = [];
      var arrayOption = [];
      var arrayMnt = [];
      data.forEach((d) => {
        var som =
          qteCA == 1 ? d.dataValues.qteCA : d.dataValues.qteCA.toFixed(3);
        arrayMnt.push(som);
        arrayMarche.push(d.dataValues.produits.marcheims.lib);
        arrayOption.push({
          value: d.dataValues.produits.marcheims.id,
          label: d.dataValues.produits.marcheims.lib,
        });
      });
      return res.status(200).send({ arrayMarche, arrayMnt, arrayOption });
    });
});

//CA BL par produit
router.post("/venteBLProduit", auth, (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  const idLine = req.body.idLine;
  const idRole = req.body.idRole;
  const produits = req.body.produit;
  var limit = req.body.limit;
  var whereU = {};
  if (idRole != 0 && idRole != 4 && idRole != 5) whereU = { line: idLine };
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  var whereProd = {};
  if (produits.length != 0) whereProd = { id: produits };
  var valQteCA = "";
  if (qteCA == 1) {
    valQteCA = "quantite";
    order = "qteCA";
  } else {
    valQteCA = "montant";
    order = "qteCA";
  }
  ligneBl
    .findAll({
      limit: limit,
      attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"]],
      include: [
        {
          model: bl,
          as: "bls",
          attributes: [
            [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
          ],
          where: {
            [Op.and]: [
              sequelize.where(
                sequelize.fn("year", sequelize.col("dateBl")),
                year
              ),
              whereMois,
              { etat: 1 },
            ],
          },
          include: [
            {
              attributes: ["id", "line"],
              model: user,
              as: "users",
              where: whereU,
            },
          ],
        },
        {
          attributes: ["id", "designation"],
          model: produit,
          as: "produits",
          where: whereProd,
          include: {
            model: marcheIms,
            as: "marcheims",
          },
        },
      ],
      group: [["produits.designation"]],
      order: [[sequelize.fn("sum", sequelize.col(valQteCA)), "DESC"]],
    })
    .then(function (data) {
      var arrayProd = [];
      var arrayOption = [];
      var arrayMnt = [];
      data.forEach((d) => {
        var som =
          qteCA == 1 ? d.dataValues.qteCA : d.dataValues.qteCA.toFixed(3);
        arrayMnt.push(som);
        arrayProd.push(d.dataValues.produits.designation);
        arrayOption.push({
          value: d.dataValues.produits.id,
          label: d.dataValues.produits.designation,
        });
      });
      return res.status(200).send({ arrayProd, arrayMnt, arrayOption });
    });
});

//CA BL par pharmacie
router.post("/venteBLPharmacie", auth, (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  const idLine = req.body.idLine;
  const idRole = req.body.idRole;
  const pharmacies = req.body.pharmacie;
  const idUser = req.body.idUser;
  var limit = req.body.limit;
  var whereU = {};
  if (idRole != 0 && idRole != 4 && idRole != 5) whereU = { line: idLine };
  var whereUser = {};
  if (idUser != 0) whereUser = { iduser: idUser };
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  var wherePharmacie = {};
  if (pharmacies.length != 0) wherePharmacie = { id: pharmacies };
  var valQteCA = "";
  if (qteCA == 1) {
    valQteCA = "quantite";
    order = "qteCA";
  } else {
    valQteCA = "montant";
    order = "qteCA";
  }
  ligneBl
    .findAll({
      limit: limit,
      attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"]],
      include: [
        {
          model: bl,
          as: "bls",
          attributes: [
            [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
            /* [sequelize.fn("DISTINCT", sequelize.col("id_gouvernorat")), "id_gouvernorat"], */
          ],
          where: {
            [Op.and]: [
              sequelize.where(
                sequelize.fn("year", sequelize.col("dateBl")),
                year
              ),
              whereMois,
              whereUser,
              { etat: 1 },
            ],
          },
          include: [
            {
              attributes: ["id", "line"],
              model: user,
              as: "users",
              where: whereU,
            },
            {
              model: pharmacie,
              attributes: ["id", "nom"],
              as: "pharmacies",
              where: wherePharmacie,
            },
          ],
        },
      ],
      group: [["bls.pharmacies.nom"]],
      order: [[sequelize.fn("sum", sequelize.col(valQteCA)), "DESC"]],
    })
    .then(function (data) {
      var arrayPharmacie = [];
      var arrayOption = [];
      var arrayMnt = [];
      data.forEach((d) => {
        var som =
          qteCA == 1 ? d.dataValues.qteCA : d.dataValues.qteCA.toFixed(3);
        arrayMnt.push(som);
        arrayPharmacie.push(d.dataValues.bls.pharmacies.nom);
        arrayOption.push({
          value: d.dataValues.bls.pharmacies.id,
          label: d.dataValues.bls.pharmacies.nom,
        });
      });
      return res
        .status(200)
        .send({ data, arrayPharmacie, arrayMnt, arrayOption });
    });
});

//CA par pharmacies par bricks (Top 15)
router.post("/chartPharmacieBricks", auth, (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  const idLine = req.body.idLine;
  const idRole = req.body.idRole;
  const idBriks = req.body.idBriks;
  var where = "";
  if (mois != 0) {
    where += `and month(b.dateBl) ='${mois}'`;
  }

  if (idRole != 0 && idRole != 4 && idRole != 5) {
    where += `and u.line=${idLine}`;
  }
  var valIdBriks = "";
  if (idBriks != 0) {
    valIdBriks = "and i.id = " + idBriks;
  }

  var valQteCA = "";
  var order = "";
  if (qteCA == 1) {
    valQteCA = " sum(li.quantite) as mnt";
    order = "mnt";
  } else {
    valQteCA = " sum(li.montant) as mnt";
    order = "mnt";
  }
  var sql = `SELECT distinct(i.libelle) as libelleIms,c.nom as nomClient,i.id ,
  ${valQteCA} ,year(b.dateBl) as annee,b.client
  FROM bls b 
  left join lignebls li on  b.id =li.idbielle 
  left join pharmacies c on  c.id =b.client 
  left join ims i on  i.id =c.idIms
  left join users u on b.iduser = u.id
  where b.etat = 1 and 
  year(b.dateBl)=${year} 
  ${where} ${valIdBriks}
  group by b.client order by ${order} DESC limit 15`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (dataBL) {
      if (!dataBL) {
        return res.status(403).send(false);
      } else {
        var arrayIms = [];
        var arrayMnt = [];
        dataBL.forEach((data2) => {
          arrayIms.push(data2.nomClient);
          arrayMnt.push(parseFloat(data2.mnt).toFixed(3));
        });
        return res.status(200).json({ arrayIms, arrayMnt });
      }
    });
});

//CA des BL par Bricks
router.post("/chiffreParIms", auth, (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  const idLine = req.body.idLine;
  const idRole = req.body.idRole;
  const idBriks = req.body.idBriks;
  var limit = req.body.limit;
  var whereU = {};
  if (idRole != 0 && idRole != 4 && idRole != 5) whereU = { line: idLine };
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  var whereBriks = {};
  if (idBriks.length != 0) whereBriks = { id: idBriks };
  var valQteCA = "";
  if (qteCA == 1) {
    valQteCA = "quantite";
    order = "qteCA";
  } else {
    valQteCA = "montant";
    order = "qteCA";
  }
  ligneBl
    .findAll({
      limit: limit,
      attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"]],
      include: [
        {
          model: bl,
          as: "bls",
          attributes: [
            [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
            "id_gouvernorat",
          ],
          where: {
            [Op.and]: [
              sequelize.where(
                sequelize.fn("year", sequelize.col("dateBl")),
                year
              ),
              whereMois,
              { etat: 1 },
            ],
          },
          include: [
            {
              attributes: ["id", "line"],
              model: user,
              as: "users",
              where: whereU,
            },
            {
              model: ims,
              as: "ims",
              attributes: ["id", "libelle"],
              where: whereBriks,
            },
          ],
        },
      ],
      group: [["bls.id_gouvernorat"]],
      order: [[sequelize.fn("sum", sequelize.col(valQteCA)), "DESC"]],
    })
    .then(function (data) {
      var arrayIms = [];
      var arrayOption = [];
      var arrayMnt = [];
      data.forEach((d) => {
        var som =
          qteCA == 1 ? d.dataValues.qteCA : d.dataValues.qteCA.toFixed(3);
        arrayMnt.push(som);
        arrayIms.push(d.dataValues.bls.ims.libelle);
        arrayOption.push({
          value: d.dataValues.bls.ims.id,
          label: d.dataValues.bls.ims.libelle,
        });
      });
      return res.status(200).send({ arrayIms, arrayMnt, arrayOption });
    });
});

//CA (IMS) d'Opalia par rapport au total du marché par bricks
router.post("/detailsImsBricks", auth, async (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const idBriks = req.body.idBriks;
  const mois = req.body.mois;
  var arrayMarket = [];
  var arrayOpalia = [];
  var arrayIms = [];
  var whereBriks = null;
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("date")),
      mois
    );
  }
  var whereBriks = {};
  if (idBriks.length != 0) whereBriks = { idIms: idBriks };
  if (qteCA == 1) {
    valQteCA = "volume";
    order = "qteCA";
  } else {
    valQteCA = "total";
    order = "qteCA";
  }
  var opalia = await detailsims.findAll({
    limit: 10,
    attributes: [
      [sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"],
      "date",
      "total",
      "volume",
      "idIms",
      "produit",
    ],
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("year", sequelize.col("date")), year),
        whereMois,
        whereBriks,
        { produit: { [Op.like]: "%OPALIA TOTAL%" } },
      ],
    },
    include: ["ims"],
    group: [["idIms"]],
  });
  var market = await detailsims.findAll({
    limit: 10,
    attributes: [
      [sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"],
      "date",
      "total",
      "volume",
      "idIms",
      "produit",
    ],
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("year", sequelize.col("date")), year),
        whereMois,
        whereBriks,
        { produit: { [Op.like]: "%TOTAL MARKET%" } },
      ],
    },
    include: ["ims"],
    group: [["idIms"]],
  });
  var j = 0;
  opalia.forEach((e) => {
    arrayOpalia[j] = e.dataValues.qteCA;
    arrayIms[j] = e.dataValues.ims.libelle;
    j++;
  });
  var j1 = 0;
  market.forEach((e) => {
    arrayMarket[j1] = e.dataValues.qteCA;
    j1++;
  });
  return res.status(200).send({ arrayIms, opalia, arrayOpalia, arrayMarket });
});

//CA (IMS) produit opalia par rapport au marché total
router.post("/detailsImsMarche", auth, async (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const idMarche = req.body.idMarche;
  const mois = req.body.mois;
  var arrayMarket = [];
  var arrayOpalia = [];
  var arrayMarche = [];
  var whereMarche = null;
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("date")),
      mois
    );
  }
  var whereMarche = {};
  if (idMarche.length != 0) whereMarche = { chef_produit: idMarche };
  if (qteCA == 1) {
    valQteCA = "volume";
    order = "qteCA";
  } else {
    valQteCA = "total";
    order = "qteCA";
  }
  var opalia = await detailsims.findAll({
    limit: 10,
    attributes: [
      [sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"],
      "date",
      "total",
      "volume",
      "idIms",
      "chef_produit",
    ],
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("year", sequelize.col("date")), year),
        whereMois,
        whereMarche,
        { chef_produit: { [Op.ne]: "opalia total" } },
      ],
    },
    group: [["chef_produit"]],
    order: [["chef_produit", "DESC"]],
  });
  var market = await detailsims.findAll({
    limit: 10,
    attributes: [
      [sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"],
      "date",
      "total",
      "volume",
      "idIms",
      "chef_produit",
    ],
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("year", sequelize.col("date")), year),
        whereMois,
        whereMarche,
        { etat: 1 },
      ],
    },
    group: [["chef_produit"]],
    order: [["chef_produit", "DESC"]],
  });
  var j = 0;
  opalia.forEach((e) => {
    arrayOpalia[j] = e.dataValues.qteCA;
    arrayMarche[j] = e.dataValues.chef_produit;
    j++;
  });
  var j1 = 0;
  market.forEach((e) => {
    arrayMarket[j1] = e.dataValues.qteCA;
    j1++;
  });
  return res
    .status(200)
    .send({ arrayMarche, opalia, arrayOpalia, arrayMarket });
});

//Distrubition du CA des packs par bricks
router.post("/getPackBriks", auth, async (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const idBriks = req.body.idBriks;
  const idPack = req.body.idPack;
  const mois = req.body.mois;
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  var whereBriks = {};
  if (idBriks.length != 0) whereBriks = { id: idBriks };

  var wherePack = {};
  if (idPack.length != 0) wherePack = { id_pack: idPack };
  var valQteCA = "";
  if (qteCA == 1) {
    valQteCA = "quantite";
    order = "qteCA";
  } else {
    valQteCA = "montant";
    order = "qteCA";
  }

  var packs = await ligneBl.findAll({
    limit: 10,
    attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"]],
    include: [
      {
        model: bl,
        as: "bls",
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
          "id_gouvernorat",
        ],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            whereMois,
            wherePack,
            { etat: 1 },
          ],
        },
        include: [
          {
            model: ims,
            as: "ims",
            attributes: ["id", "libelle"],
            where: whereBriks,
          },
        ],
      },
    ],
    group: [["bls.id_gouvernorat"]],
    order: [[sequelize.fn("sum", sequelize.col(valQteCA)), "DESC"]],
  });

  var som = await ligneBl.findOne({
    attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"]],
    include: [
      {
        model: bl,
        as: "bls",
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
          "id_gouvernorat",
        ],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            whereMois,
            wherePack,
            { etat: 1 },
          ],
        },
      },
    ],
  });
  var pie = [];
  var pieVal = [];
  var minus = som.dataValues.qteCA;
  var arraySelect = [];

  packs.forEach((e) => {
    var moy = 0;
    arraySelect.push({
      value: e.dataValues.bls.ims.id,
      label: e.dataValues.bls.ims.libelle,
    });
    moy =
      (Math.round(e.dataValues.qteCA) * 100) / Math.round(som.dataValues.qteCA);
    pieVal.push(Math.round(moy));
    minus -= e.dataValues.qteCA;
    pie.push(e.dataValues.bls.ims.libelle + "(" + Math.round(moy) + "%)");
  });
  minus = (Math.round(minus) * 100) / Math.round(som.dataValues.qteCA);
  if (som.dataValues.qteCA == null) {
    pie.push("Reste" + "(100%)");
    pieVal.push(100);
  } else if (minus != 0) {
    pie.push("Reste" + "(" + Math.round(minus) + "%)");
    pieVal.push(Math.round(minus));
  }
  return res.status(200).send({ arraySelect, pieVal, pie });
});
router.post("/getBriksPack", auth, async (req, res) => {
  const year = req.body.year;
  const idBriks = req.body.idBriks;
  const mois = req.body.mois;
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  var whereBriks = {};
  if (idBriks.length != 0) whereBriks = { id_gouvernorat: idBriks };

  var packs = await bl.findAll({
    limit: 10,
    attributes: [
      [sequelize.fn("count", sequelize.col("id_pack")), "totpack"],
      "id_gouvernorat",
      "id_pack",
      "dateBl",
    ],
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("year", sequelize.col("dateBl")), year),
        whereMois,
        whereBriks,
        { etat: 1 },
      ],
    },
    include: [
      {
        model: pack,
        as: "packs",
      },
      {
        model: ims,
        as: "ims",
      },
    ],
    group: [["id_gouvernorat"], ["id_pack"]],
    order: sequelize.literal("count(id_pack) DESC"),
  });
  var arrayPack = [];
  var arrayTot = [];
  packs.forEach((data2) => {
    arrayPack.push(data2.dataValues.packs.nom);
    arrayTot.push(data2.dataValues.totpack);
  });
  return res.status(200).send({ packs, arrayPack, arrayTot });
});
router.post("/distinct", async (req, res) => {
  var packs = await bl.findAll({
    attributes: [
      [Sequelize.literal("DISTINCT `id_gouvernorat`"), "id_gouvernorat"],
      "id_pack",
    ],
  });
  return res.status(200).send(packs);
});

//CA du total des packs vendus en %
router.post("/getTotalPack", auth, async (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  var valQteCA = "";
  if (qteCA == 1) {
    valQteCA = "quantite";
    order = "qteCA";
  } else {
    valQteCA = "montant";
    order = "qteCA";
  }

  var somPacks = await ligneBl.findOne({
    limit: 10,
    attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "total"]],
    include: [
      {
        model: bl,
        as: "bls",
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
          "id_pack",
          "dateBl",
        ],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            whereMois,
            { etat: 1 },
          ],
        },
        include: [
          {
            model: pack,
            as: "packs",
          },
        ],
      },
    ],
    order: [[sequelize.fn("sum", sequelize.col(valQteCA)), "DESC"]],
  });
  var packs = await ligneBl.findAll({
    limit: 10,
    attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"]],
    include: [
      {
        model: bl,
        as: "bls",
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
          "id_pack",
          "dateBl",
        ],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            whereMois,
            { etat: 1 },
          ],
        },
        include: [
          {
            model: pack,
            as: "packs",
          },
        ],
      },
    ],
    group: [["bls.id_pack"]],
    order: [[sequelize.fn("sum", sequelize.col(valQteCA)), "DESC"]],
  });
  var tabpack = [];
  var valpack = [];
  packs.forEach((e) => {
    var moy =
      (parseInt(e.dataValues.qteCA) * 100) /
      parseInt(somPacks.dataValues.total);
    if (Math.round(moy) != 0) tabpack.push(Math.round(moy));

    var nom = e.dataValues.bls.packs.nom;
    if (Math.round(moy) != 0) valpack.push(nom + "(" + Math.round(moy) + "%)");
  });
  var countNoPack = await bl.findAll({
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("year", sequelize.col("dateBl")), year),
        whereMois,
        { id_pack: 0 },
      ],
    },
  });
  if (countNoPack.length == 0) {
    tabpack.push(0);
    valpack.push("No pack (0)%");
  }
  return res.status(200).send({ valpack, tabpack });
});
router.get("/getDetailBl/:id", auth, async (req, res) => {
  var l = await ligneBl.findAll({
    where: { idbielle: req.params.id },
    include: [
      /* {
        model:bl,
        as:"bls",
        include:{
          model:user,
          as:"users"
        }
      }, */
      "produits"
    ],
  });
  return res.status(200).send(l);
});
router.post("/saveDecharge", auth, decharge.single("file"), (req, res) => {
  res.send({ filename: req.file.filename });
});
router.put("/updateDecharge/:id", auth,async(req, res) => {
  var id = req.params.id;
  var decharge = req.body.dechargeName;
  var date = new Date(); // Or the date you'd like converted.
  var datePayement = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
  var blFind = await bl.findOne({ where: { id: id } });
  if (blFind != null) {
    bl.update(
      {
        datePayement: datePayement,
        payer:1,
        decharge:decharge
      },
      { where: { id: id } }
    )
    .then(() => {
      return res.status(200).send(true);
    })
    .catch((error) => {
      return res.status(403).send(false);
    });
  } 
});
router.put("/removeDecharge/:id", auth,async(req, res) => {
  var id = req.params.id;
  var blFind = await bl.findOne({ where: { id: id } });
  if (blFind != null) {
    bl.update(
      {
        decharge:null
      },
      { where: { id: id } }
    )
    .then(() => {
      return res.status(200).send(true);
    })
    .catch((error) => {
      return res.status(403).send(false);
    });
  } 
});
//bl payer
router.post("/getBlPayer", auth, (req, res) => {
  const client = req.body.client;
  const idDelegue = req.body.idDelegue;
  const idLine = parseInt(req.body.idLine);
  const idRole = parseInt(req.body.idRole);
  const year = parseInt(req.body.year);
  var whereD = {};
  var whereC = {};
  var whereU = {};
  if (idRole != 0 && idRole != 3) {
    whereU = { line: idLine };
    if (idDelegue != 0) whereD = { iduser: idDelegue };
  } else {
    if (idDelegue != 0) whereD = { iduser: idDelegue };
  }
  if (client != 0) whereC = { client: client };
  ligneBl
    .findAll({
      attributes: [[sequelize.fn("sum", sequelize.col("montant")), "mnt"]],
      group: ["idbielle"],
      include: {
        model: bl,
        as: "bls",
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            { etat: 1, payer: { [Op.eq]: 1 } },
            whereC,
            whereD,
          ],
        },
        include: [
          { model: user, as: "users", where: whereU },
          "pharmacies",
          "packs",
          "ims",
        ],
        /* order: [["etat", "DESC"]], */
      },
      order: [["idbielle", "DESC"]],
    })
    .then(function (r) {
      var array = [];
      r.forEach((e, key) => {
        var bls = e.dataValues.bls;
        var ext = "";
        var file  = "";
        if(bls.file != null)
        { ext = bls.file.split("."); 
        file = ext[1]}
        array.push({
          id: bls.id,
          pharmacie: bls.pharmacies.nom,
          users: bls.users.nomU+" "+bls.users.prenomU,
          pack: bls.users.type == 0?bls.packs.nom:"Vente direct",
          bonification: bls.bonification, 
          payer: bls.payer, 
          date: bls.dateBl,
          fileURL: null,
          etat: bls.etat,
          mnt: parseFloat(e.dataValues.mnt).toFixed(3),
          numeroBl: bls.numeroBL,
          ext: file,
          file: bls.file,
          fournisseur: bls.fournisseur,
          ims: bls.ims.libelle,
          decharge: bls.decharge,
        });
      });
      return res.status(200).send(array);
    });
});
router.get("/getDecharge/:id", async(req, res) => { 
  var id = req.params.id;
  var blFind = await bl.findOne({ where: { id: id } });
  if (blFind != null) {
    var file = blFind.dataValues.decharge;
    if(file){
      if (fs.existsSync("./decharge/" + file)) { 
        var file = fs.createReadStream("./decharge/" + file);
        file.pipe(res);
      } else return res.status(403).json({ message: false });
    } else {      
      return res.status(403).json({ message: false });
    }
  }
});
// save bl extracter
router.post("/exportBl", auth, (req, res) => {
  var token =(req.headers["x-access-token"]);
  const decoded = jwt.verify(token, privateKey);
  var idUser = decoded.userauth.id;

  exportBl.create({
    idUser: idUser, 
  })
  .then((r) => {
    return res.status(200).send(true);
  })
  .catch((error) => {
    return res.status(403).send(false);
  });
});
router.get("/getExport", auth, async(req, res) => {
  var blExport = await exportBl.findAll({include:["users"]});
  return res.status(200).send(blExport);
});
router.get("/getBlById/:id", auth, async(req, res) => {
  var blExport = await bl.findOne({where:{id:req.params.id},include:["users","pharmacies","ims","packs"]});
  return res.status(200).send(blExport);
});

//export bl payement
router.post("/exportBlPayment", auth, (req, res) => {
  const client = req.body.client;
  const idDelegue = req.body.idDelegue;
  const idLine = parseInt(req.body.idLine);
  const idRole = parseInt(req.body.idRole);
  const year = parseInt(req.body.year);
  var whereD = {};
  var whereC = {};
  var whereU = {};
  if (idRole != 0 && idRole != 3) {
    whereU = { line: idLine };
    if (idDelegue != 0) whereD = { iduser: idDelegue };
  }
  if (client != 0) whereC = { client: client };
  ligneBl
    .findAll({
      attributes: [[sequelize.fn("sum", sequelize.col("montant")), "mnt"]],
      group: ["idbielle"],
      include: {
        model: bl,
        as: "bls",
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            { etat: 1 },
            whereC,
            whereD,
          ],
        },
        include: [
          { model: user, as: "users", where: whereU },
          "pharmacies",
          "packs",
          "ims",
        ],
        /* order: [["etat", "DESC"]], */
      },
      order: [["idbielle", "DESC"]],
    })
    .then(function (r) {
      var array = [];
      r.forEach((e, key) => {
        var bls = e.dataValues.bls;
        array.push({
          id: bls.id,
          pharmacie: bls.pharmacies.nom,
          users: bls.users.nomU+" "+bls.users.prenomU,
          pack: bls.users.type == 0?bls.packs.nom:"Vente direct",
          bonification: bls.bonification, 
          payer: bls.payer ===0?"Non payé":"Payé", 
          date: bls.dateBl,
          mnt: parseFloat(e.dataValues.mnt).toFixed(3),
          numeroBl: bls.numeroBL,
          fournisseur: bls.fournisseur,
          ims: bls.ims.libelle,
          datePayement: bls.datePayement,
          dateInsertion: bls.dateInsertion
        });
      });
      return res.status(200).send(array);
    });
});

//comercial
router.post("/getBlComm", auth, (req, res) => {
  const year = parseInt(req.body.year);
  /* const client = req.body.client;
  const idDelegue = req.body.idDelegue;
  const idLine = parseInt(req.body.idLine);
  const idRole = parseInt(req.body.idRole);
  
  var whereD = {};
  var whereC = {};
  var whereU = {};
  if (idRole == 1 || idRole == 2) {
    whereU = { line: idLine };
    if (idDelegue != 0) whereD = { iduser: idDelegue };
  } else {
    if (idDelegue != 0) whereD = { iduser: idDelegue };
  }
  if (client != 0) whereC = { client: client }; */
  ligneBl
    .findAll({
      attributes: [[sequelize.fn("sum", sequelize.col("montant")), "mnt"]],
      group: ["idbielle"],
      include: {
        model: bl,
        as: "bls",
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("bls.dateBl")),
              year
            ),
            { etat: 3 },
          ],
        },
        include: [
          { model: user, as: "users" },
          "pharmacies",
          "packs",
          "ims",
        ],
        /* order: [["id", "DESC"]], */
      },
      order: [["idbielle", "DESC"]],
    })
    .then(function (r) {
      var array = [];
      r.forEach((e, key) => {
        var bls = e.dataValues.bls;
        array.push({
          id: bls.id,
          pharmacie: bls.pharmacies.nom,
          users: bls.users.nomU+" "+bls.users.prenomU,
          /* payer: bls.payer, */ 
          date: bls.dateBl,
          /* etat: bls.etat, */
          mnt: parseFloat(e.dataValues.mnt).toFixed(3),
          numeroBl: bls.numeroBL,
          ims: bls.ims.libelle,
        });
      });
      return res.status(200).send(array);
    });
});


// start dashboard chef

router.post("/getAllProdFourBl", auth, (req, res) => {
  var whereL = {};
  var year = req.body.anneeLocal;
  var fournisseur = req.body.fournisseur;
  var where = {};
  if(fournisseur !=0) {
    where = { fournisseur:fournisseur }
  }
  ligneBl
    .findAll({
      attributes: ["id", "idproduit"],
      include: [
        {
          attributes: ["id", "designation"],
          model: produit,
          as: "produits",
        },
        {
          model: bl,
          as: "bls",
          where: {
            [Op.and]: [
              sequelize.where(sequelize.fn("year", sequelize.col("dateBl")),year),
              where,
            ],
          },
          include: [
            {
              model: user,
              as: "users",
              where: whereL
            },
          ],
        },
      ],
      group: ["lignebls.idproduit"],
    })
    .then(function (prod) {
      var arrayOption = [];
      prod.forEach((elem) => {
        if (elem.produits!=null) 
        arrayOption.push({
          value: elem.produits.id,
          label: elem.produits.designation,
        });
      });
      return res.status(200).send(arrayOption);
    }).catch(err=>{
      return res.status(403).send(err);
    });
});

router.post("/getAllParmaParFour", auth, (req, res) => {
  var year = req.body.anneeLocal;
  var fournisseur = req.body.fournisseur;
  var where = {};
  if(fournisseur !=0) {
    where = { fournisseur:fournisseur }
  }
  bl.findAll({
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("year", sequelize.col("dateBl")), year),
        where,
      ],
    },
    include: [
      {
        model: user,
        as: "users",
      },
      {
        attributes: ["id", "nom"],
        model: pharmacie,
        as: "pharmacies",
      },
    ],
    group: ["client"],
  }).then(function (client) {
    var arrayOption = [];
    client.forEach((elem) => {
      arrayOption.push({
        value: elem.pharmacies.id,
        label: elem.pharmacies.nom,
      });
    });
    return res.status(200).send(arrayOption);
  });
});

router.post("/getFournisseurBl", auth, (req, res) => {
  bl
    .findAll({
      group: ["fournisseur"],
      order: [["fournisseur", "DESC"]],
    })
    .then(function (data) {
      var arrayOption = [];
      arrayOption.push({
        value: 0,
        label: "Tous",
      });
      data.forEach((elem) => {
        arrayOption.push({
          value: elem.fournisseur,
          label: elem.fournisseur,
        });
      });
      return res.status(200).send(arrayOption);
    });
});

router.post("/chiffreParFournisseur", auth, (req, res) => {
  const annee = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  var condition = ` b.etat = 1 and year(b.dateBl) = ${annee} `;
  if (mois != 0){
    condition += " and month(b.dateBl) = "+mois;
  }
  var order = "";
  var valQteCA = "";
  if(qteCA == 1){
    valQteCA = " sum(li.quantite) as mnt";
    order ="mnt"
  } else {
    valQteCA = " sum(li.montant) as mnt";
    order ="mnt"
  }
  var sql = `SELECT ${valQteCA}, b.id as idBl,b.fournisseur
  FROM bls b 
  left join lignebls li on b.id = li.idbielle
  where ${condition}
  group by b.fournisseur
  ORDER BY ${order} desc`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        return res.status(200).json(r1);
      }
    });
})

router.post("/chartFourPharma", auth, (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  const fournisseur = req.body.fournisseur;
  const idPharmacie = req.body.idPharmacie;
  const limit = req.body.limit;
  var condition = ` b.etat = 1 and year(b.dateBl) = ${year} `;
  if (mois != 0) {
    condition += `and month(b.dateBl) ='${mois}'`;
  }

  /* var valIdProduit = ""; */
  if (idPharmacie != "") {
    condition += " and p.id in " + idPharmacie;
  }

  var group = " b.client";
  if(fournisseur !=0){
    condition += " and b.fournisseur = '"+fournisseur+"'";
    group =" b.fournisseur,b.client"
  }

  var valQteCA = "";
  var order = "";
  if (qteCA == 1) {
    valQteCA = " sum(li.quantite) as mnt";
    order = "mnt";
  } else {
    valQteCA = " sum(li.montant) as mnt";
    order = "mnt";
  }
  var sql = `SELECT p.nom as libelleClient, p.id as idClient,
  ${valQteCA} ,year(b.dateBl) as annee,b.fournisseur
  FROM bls b 
  left join lignebls li on  b.id =li.idbielle 
  left join pharmacies p on p.id =b.client
  left join users u on b.iduser = u.id
  where ${condition}
  group by ${group} order by ${order} DESC limit ${limit}`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (dataBL) {
      if (!dataBL) {
        return res.status(403).send(false);
      } else {
        var arrayFour = [];
        var arrayOption = [];
        var arrayMnt = [];
        dataBL.forEach((data2) => {
          var som = qteCA == 1 ? data2.mnt : data2.mnt.toFixed(3);
          arrayMnt.push(som);
          arrayFour.push(data2.libelleClient);
          arrayOption.push({
            value: data2.idClient,
            label: data2.libelleClient,
          });
        });
        return res.status(200).json({ arrayOption,arrayFour, arrayMnt });
      }
    });
});

router.post("/chartFourProd", auth, (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  const fournisseur = req.body.fournisseur;
  const idProduit = req.body.idProduit; 
  var condition = ` b.etat = 1 and year(b.dateBl) = ${year} `;
  if (mois != 0) {
    condition += `and month(b.dateBl) ='${mois}'`;
  }
  
  if (idProduit != "") {
    condition += " and p.id in " + idProduit;
  }
  var group = " li.idproduit";
  if(fournisseur !=0){
    condition += " and b.fournisseur = '"+fournisseur+"'";
    group =" b.fournisseur,li.idproduit"
  }
  var valQteCA = ""; 
  var order = "";
  if (qteCA == 1) {
    valQteCA = " sum(li.quantite) as mnt";
    order = "mnt";
  } else {
    valQteCA = " sum(li.montant) as mnt";
    order = "mnt";
  }
  var sql = `SELECT p.designation as designation ,p.id as idProd ,
  ${valQteCA} ,
  DATE_FORMAT(b.dateBl,'%Y') as annee ,
  b.fournisseur
  FROM bls b 
  left join lignebls li on b.id =li.idbielle     
  left join produits p on p.id =li.idproduit 
  where ${condition}
  GROUP by ${group} 
  ORDER BY ${order} DESC limit 15`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (dataBL) {
      if (!dataBL) {
        return res.status(403).send(false);
      } else {
        var arrayFour = [];
        var arrayOption = [];
        var arrayMnt = [];
        dataBL.forEach((data2) => {
          var som = qteCA == 1 ? data2.mnt : data2.mnt.toFixed(3);
          arrayMnt.push(som);
          arrayFour.push(data2.designation);
          arrayOption.push({
            value: data2.idProd,
            label: data2.designation,
          });
        });
        return res.status(200).json({ arrayFour, arrayMnt, arrayOption });
      }
    });
});

router.post("/suiviMensuelFour", auth, (req, res) => {
  const qteCA = req.body.qteCA;
  const year = req.body.year;
  const fournisseur = req.body.fournisseur;
  var where = ` where b.etat = 1 and DATE_FORMAT(b.dateBl,'%Y') IN (${year}) `;
  var valQteCA = "";
  var order = "";
  if (qteCA == 1) {
    valQteCA = " sum(li.quantite) as qteCA";
    order = "qteCA";
  } else {
    valQteCA = " sum(li.montant) as qteCA";
    order = "qteCA";
  }
  var group = "mounth,annee"
  if(fournisseur !=0){
    where += " and b.fournisseur = '"+fournisseur+"'";
    group =" b.fournisseur,mounth,annee"
  }
  var sql = `SELECT ${valQteCA},
      DATE_FORMAT(b.dateBl,'%b') as mounth ,
      DATE_FORMAT(b.dateBl,'%Y') as annee
      FROM bls b 
      left join lignebls li on  b.id =li.idbielle  
      left join users u on b.iduser = u.id
      ${where}
      group by ${group} order by ${order} DESC`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        return res.status(200).json(r1);
      }
    });
});

router.post("/getTotalPackFour", auth, async (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const mois = req.body.mois;
  const fournisseur = req.body.fournisseur;
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  var valQteCA = "";
  if (qteCA == 1) {
    valQteCA = "quantite";
    order = "qteCA";
  } else {
    valQteCA = "montant";
    order = "qteCA";
  }
  var whereFour = {};
  if(fournisseur !=0){
    whereFour = {fournisseur:fournisseur};
  }

  var somPacks = await ligneBl.findOne({
    limit: 10,
    attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "total"]],
    include: [
      {
        model: bl,
        as: "bls",
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
          "id_pack",
          "dateBl",
        ],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            whereMois,
            whereFour,
            { etat: 1 },
          ],
        },
        include: [
          {
            model: pack,
            as: "packs",
          },
        ],
      },
    ],
    order: [[sequelize.fn("sum", sequelize.col(valQteCA)), "DESC"]],
  });
  var packs = await ligneBl.findAll({
    limit: 10,
    attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"]],
    include: [
      {
        model: bl,
        as: "bls",
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
          "id_pack",
          "dateBl",
        ],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            whereMois,
            whereFour,
            { etat: 1 },
          ],
        },
        include: [
          {
            model: pack,
            as: "packs",
          },
        ],
      },
    ],
    group: [["bls.id_pack"]],
    order: [[sequelize.fn("sum", sequelize.col(valQteCA)), "DESC"]],
  });

  var tabpack = [];
  var valpack = [];
  packs.forEach((e) => {
    var moy =
      (parseInt(e.dataValues.qteCA) * 100) /
      parseInt(somPacks.dataValues.total);
    if (Math.round(moy) != 0) tabpack.push(Math.round(moy));

    var nom = e.dataValues.bls.packs.nom;
    if (Math.round(moy) != 0) valpack.push(nom + "(" + Math.round(moy) + "%)");
  });
  var countNoPack = await bl.findAll({
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("year", sequelize.col("dateBl")), year),
        whereMois,
        { id_pack: 0 },
      ],
    },
  });
  if (countNoPack.length == 0) {
    tabpack.push(0);
    valpack.push("No pack (0)%");
  }
  return res.status(200).send({ valpack, tabpack });
});
// end dashboard chef


router.post("/getDeleguePharmacie", auth, async (req, res) => {
  const year = req.body.year;
  const qteCA = req.body.qteCA;
  const idUser = req.body.idUser;
  const idPharmacie = req.body.idPharmacie;
  const idRole = req.body.idRole;
  const idLine = req.body.idLine;
  const mois = req.body.mois;
  var whereMois = null;
  if (mois != 0) {
    whereMois = sequelize.where(
      sequelize.fn("month", sequelize.col("dateBl")),
      mois
    );
  }
  var whereUser = {};
  if (idUser != 0) whereUser = { iduser: idUser };

  var wherePharmacie = {};
  if (idPharmacie.length != 0) wherePharmacie = { client: idPharmacie };
  var valQteCA = "";
  if (qteCA == 1) {
    valQteCA = "quantite";
    order = "qteCA";
  } else {
    valQteCA = "montant";
    order = "qteCA";
  }

  var whereD = {};
  if (idRole != 0) {
    whereD = { line: idLine };
  }

  var packs = await ligneBl.findAll({
    limit: 10,
    attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"]],
    include: [
      {
        model: bl,
        as: "bls",
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            whereMois,
            whereUser,
            wherePharmacie,
            { etat: 1 },
          ],
        },
        include: [
          { model: user, as: "users", where: whereD },
        ],
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
          "iduser",
          "client",
        ],
        include:["pharmacies"],
        
      },
    ],
    group: [["bls.client"]],
    order: [[sequelize.fn("sum", sequelize.col(valQteCA)), "DESC"]],
  });

  var som = await ligneBl.findOne({
    attributes: [[sequelize.fn("sum", sequelize.col(valQteCA)), "qteCA"]],
    include: [
      {
        model: bl,
        as: "bls",
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("dateBl")), "annee"],
          "iduser",
        ],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            whereMois,
            whereUser,
            { etat: 1 },
          ],
        },
      },
    ],
  });
  var pie = [];
  var pieVal = [];
  var minus = som.dataValues.qteCA;
  var arraySelect = [];
  packs.forEach((e) => {
    var moy = 0;
    arraySelect.push({
      value: e.dataValues.bls.pharmacies.id,
      label: e.dataValues.bls.pharmacies.nom,
    });
    moy = (Math.round(e.dataValues.qteCA) * 100) / Math.round(som.dataValues.qteCA);
    pieVal.push(Math.round(moy));
    minus -= e.dataValues.qteCA;
    pie.push(e.dataValues.bls.pharmacies.nom + "(" + Math.round(moy) + "%)");
  });
  minus = (Math.round(minus) * 100) / Math.round(som.dataValues.qteCA);
  if (som.dataValues.qteCA == null) {
    pie.push("Reste" + "(100%)");
    pieVal.push(100);
  } else if (minus != 0) {
    pie.push("Reste" + "(" + Math.round(minus) + "%)");
    pieVal.push(Math.round(minus));
  }
  return res.status(200).send({ arraySelect, pieVal, pie });
});
//bl payer
router.post("/getBlAnnuler", auth, (req, res) => {
  const client = req.body.client;
  const idDelegue = req.body.idDelegue;
  const idLine = parseInt(req.body.idLine);
  const idRole = parseInt(req.body.idRole);
  const year = parseInt(req.body.year);
  var whereD = {};
  var whereC = {};
  var whereU = {};
  if (idRole != 0 && idRole != 3) {
    whereU = { line: idLine };
    if (idDelegue != 0) whereD = { iduser: idDelegue };
  } else {
    if (idDelegue != 0) whereD = { iduser: idDelegue };
  }
  if (client != 0) whereC = { client: client };
  ligneBl
    .findAll({
      attributes: [[sequelize.fn("sum", sequelize.col("montant")), "mnt"]],
      group: ["idbielle"],
      include: {
        model: bl,
        as: "bls",
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("year", sequelize.col("dateBl")),
              year
            ),
            { etat: 2 },
            whereC,
            whereD,
          ],
        },
        include: [
          { model: user, as: "users", where: whereU },
          "pharmacies",
          "packs",
          "ims",
        ],
        /* order: [["etat", "DESC"]], */
      },
      order: [["idbielle", "DESC"]],
    })
    .then(function (r) {
      var array = [];
      r.forEach((e, key) => {
        var bls = e.dataValues.bls;
        var ext = "";
        var file  = "";
        if(bls.file != null)
        { ext = bls.file.split("."); 
        file = ext[1]}
        array.push({
          id: bls.id,
          pharmacie: bls.pharmacies.nom,
          users: bls.users.nomU+" "+bls.users.prenomU,
          pack: bls.users.type == 0?bls.packs.nom:"Vente direct",
          bonification: bls.bonification, 
          payer: bls.payer, 
          date: bls.dateBl,
          fileURL: null,
          etat: bls.etat,
          mnt: parseFloat(e.dataValues.mnt).toFixed(3),
          numeroBl: bls.numeroBL,
          ext: file,
          file: bls.file,
          fournisseur: bls.fournisseur,
          ims: bls.ims.libelle,
          decharge: bls.decharge,
        });
      });
      return res.status(200).send(array);
    });
});
module.exports = router;
