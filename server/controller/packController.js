const express = require("express");
const router = express.Router();
var seg_pharma = require("../models/seg_pharma");
var packproduit = require("../models/packproduit");
var pack = require("../models/pack");
const auth = require("../middlewares/passport");
const { Op } = require("sequelize");

// Desplay all lignes of client ...
router.post("/addPack", auth, (req, res) => {
  var id = req.body.id;
  var pharma = req.body.idPharmacie==0?null:req.body.idPharmacie;
  if (id == 0) {
    pack
      .create({
        nom: req.body.nom,
        bonification: req.body.bonification,
        id_pharmacie: pharma,
        segment: req.body.segment,
        etat: 1,
      })
      .then((p) => {
        packproduit
          .destroy({ where: { id: p.dataValues.id } })
          .then((des) => {
            req.body.packproduit.forEach((element) => {
              packproduit
                .create({
                  packId: p.dataValues.id,
                  produitId: element.produitId,
                  quantite: element.quantite,
                })
                .then((pp) => {})
                .catch((error) => {
                  console.log(error);
                  return res.status(403).send(false);
                });
            });
          })
          .catch((error) => {
            return res.status(403).send(false);
          });
        /* */
        return res.status(200).send(true);
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  } else {
    pack.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        pack
          .update(
            {
              nom: req.body.nom,
              bonification: req.body.bonification,
              id_pharmacie: pharma,
              segment: req.body.segment,
              etat: 1,
            },
            { where: { id: id } }
          )
          .then((p) => {
            packproduit
              .destroy({ where: { packId: id } })
              .then((des) => {
                req.body.packproduit.forEach((element) => {
                  packproduit
                    .create({
                      packId: id,
                      produitId: element.produitId,
                      quantite: element.quantite,
                    })
                    .then((pp) => {})
                    .catch((error) => {
                      console.log(error);
                      return res.status(403).send(false);
                    });
                });
              })
              .catch((error) => {
                console.log(error);
                return res.status(403).send(error);
              });
            return res.status(200).send(true);
          })
          .catch((error) => {
            console.log(error);
            return res.status(403).send(error);
          });
      }
    });
  }
});

router.post("/allPack", auth, (req, res) => {
  pack
    .findAll({ where: { id: { [Op.ne]: 0 } }, order: [["id", "desc"]] })
    .then(function (r) {
      return res.status(200).send(r);
    });
});
router.post("/getActive", auth, (req, res) => {
  pack.findAll({ where: { etat: 1 } }).then(function (r) {
    return res.status(200).send(r);
  });
});

router.put("/changeEtat/:id", auth, (req, res) => {
  var id = req.params.id;
  pack.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 0;
    if (r1.dataValues.etat == 0) etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      pack
        .update(
          {
            etat: etat,
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
});
router.post("/getPack", auth, async (req, res) => {
  var id = req.headers["id"];
  var table = await packproduit.findAll({
    where: { packId: id },
    include: ["packs", "produits"],
  });
  var header = await pack.findOne({
    where: { id: id },
    include: ["segments", "pharmacies"],
  });
  return res.status(200).json({ header, table });
});
router.get("/getPackBySegment/:id", auth, async (req, res) => {
  var id = req.params.id;
  /* var reqFromPack = await pack.findAll({
    where: {
      [Op.or]: [{ id_pharmacie: id }, { id: 0 }],
    },
  });
  if (reqFromPack.length == 1) {
    var reqParma = await seg_pharma.findAll({ where: { id_pharmacie: id } });
    if (reqParma.length != 0) {
      reqFromPack = await pack.findAll({
        where: {
          [Op.or]: [{ segment: reqParma[0].dataValues.Segment }, { id: 0 }]
        },
      });
    } else {
      reqFromPack = await pack.findAll();
    }
  } 
  var entities = Object.values(JSON.parse(JSON.stringify(reqFromPack)));
  
  entities.forEach((e) => {
    arrayOption.push({ value: e.id, label: e.nom });
  });
  
  */
  var arrayOption = [];
  var reqParma = await seg_pharma.findOne({ where: { id_pharmacie: id } });
  var reqFromPack = await pack.findAll({
    where: {
      [Op.or]: [{ id_pharmacie: id }, { id_pharmacie:{ [Op.is]: null } }],
    },
    order:[["id_pharmacie","desc"]]
  });
  var entities = Object.values(JSON.parse(JSON.stringify(reqFromPack)));
  
  entities.forEach((e) => {
    if(reqParma){
      if(e.segment==reqParma.dataValues.Segment)
      arrayOption.push({ value: e.id, label: e.nom+'(Recommandé)' });
      else{arrayOption.push({ value: e.id, label: e.nom});}
    }
      else{arrayOption.push({ value: e.id, label: e.nom});}
  });
  return res.status(200).json(arrayOption);
});

module.exports = router;
