var Sequelize = require('sequelize');
var configuration = require("../config")
var config = configuration.connection;
var produit = require("./produit");	
var releve = require("./releve");	
// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize(config.base, config.root, config.password, {
	host:config.host,
	port: config.port,
	dialect:'mysql',
	pool:{
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000
	}, 
	operatorsAliases: false
});

// setup Role model and its fields.
var LigneReleve = sequelize.define('ligne_releves', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    id_releve: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        references: {
            model: releve,
            key: "id"
        }
    },
    id_produit: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        references: {
            model: produit,
            key: "id"
        }
    },
    stock: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
    },
    jan: {
        type: Sequelize.INTEGER,
        unique: false,
        defaultValue: 0
    },
    fev: {
        type: Sequelize.INTEGER,
        unique: false,
        defaultValue: 0
    },
    mars: {
        type: Sequelize.INTEGER,
        unique: false,
        defaultValue: 0
    },
    avr: {
        type: Sequelize.INTEGER,
        unique: false,
        defaultValue: 0
    },
    mai: {
        type: Sequelize.INTEGER,
        unique: false,
        defaultValue: 0
    },
    juin: {
        type: Sequelize.INTEGER,
        unique: false,
        defaultValue: 0
    },
    juillet: {
        type: Sequelize.INTEGER,
        unique: false,
        defaultValue: 0
    },
    aout: {
        type: Sequelize.INTEGER,
        unique: false,
        defaultValue: 0
    },
    sep: {
        type: Sequelize.INTEGER,
        unique: false,
        defaultValue: 0
    },
    oct: {
        type: Sequelize.INTEGER, 
        unique: false,
        defaultValue: 0
    },
    nov: {
        type: Sequelize.INTEGER,
        unique: false,
        defaultValue: 0
    },
    dec: {
        type: Sequelize.INTEGER,
        unique: false,
        defaultValue: 0
    },
    total: {
        type: Sequelize.INTEGER,
        unique: false,
        defaultValue: 0
    },

}, { timestamps: true }); 


LigneReleve.belongsTo(releve, {as: 'releves', foreignKey: 'id_releve'});

LigneReleve.belongsTo(produit, {as: 'produits', foreignKey: 'id_produit'});



// create all the defined tables in the specified database. 
sequelize.sync()
    .then(() => console.log('ligneReleves table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export Role model for use in other files.
module.exports = LigneReleve;