import React, { useEffect, useCallback, useState } from "react";
import NotificationAlert from "react-notification-alert";
import Select from "react-select";

import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import { getActiveFournisseur } from "../../Redux/fournisseurReduce";
import { releveAdded, saveFile, extractionsReleve, cheeckProduit } from "../../Redux/releveReduce";
import { useDispatch } from "react-redux";
import ReactTable from "../../components/ReactTable/ReactTableBl.js";
import jwt_decode from "jwt-decode";
import { Alert } from "react-bootstrap";
// react-bootstrap components
import { Button, Card, Form, Container, Row, Col } from "react-bootstrap";
import Configuration from "../../configuration";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import Slider from '@material-ui/core/Slider'
import Typography from '@material-ui/core/Typography'

function ReleveGro() {
  var token = localStorage.getItem("x-access-token");
  var decoded = jwt_decode(token);
  const idrole = decoded.userauth.idrole;
  var anneeLocal = localStorage.getItem("annee");
  const idUser = decoded.userauth.id;
  const notificationAlertRef = React.useRef(null);
  const notify = (place, msg, type) => {
    var options = {};
    options = {
      place: place,
      message: (
        <div>
          <div>{msg}</div>
        </div>
      ),
      type: type,
      icon: "nc-icon nc-bell-55",
      autoDismiss: 7,
    };
    notificationAlertRef.current.notificationAlert(options);
  };
  const dispatch = useDispatch();
  const [extensionFile, setExtensionFile] = useState("");
  const [image, setImage] = useState("");
  const [produitExist, setProduitExist] = React.useState("");

  //fournisseur
  const [fournisseur, setFournisseur] = React.useState(null);
  const [fourSelected, setFourSelected] = React.useState(null);
  const [optionFour, setOptionFour] = React.useState([
    {
      value: "",
      label: "Grossiste",
      isDisabled: true,
    },
  ]);
  //table body
  const [entities, setEntities] = useState([]);
  const [uploadFile, setUploadFile] = React.useState();

  const [numPages, setNumPages] = useState(null);
  const [pdfFile, setPdfFile] = useState("");
  const pdfOptions = {
    cMapUrl: "cmaps/",
    cMapPacked: true,
  };

  /** start crop img**/
  const [traitment, setTraitment] = useState(false);
  const [image1, setImage1] = useState("");
  const [fileName, setFileName] = useState("");
  const [cropData, setCropData] = useState("#");
  const [cropper, setCropper] = useState();
  const [rotation, setRotation] = useState(0)
  const getCropData = () => {
    if (typeof cropper !== "undefined") {
      setCropData(cropper.getCroppedCanvas().toDataURL());
    }
  };
  /** end crop img**/

  const checkProd = useCallback(
    async (table) => {
      var arrayBody = [];
      dispatch(cheeckProduit(table)).then((rowsdes) => {
        var prod = rowsdes.payload;
        var produitexit = [];
        for (var i = 0; i < prod.length; i++) {
          if (prod[i] !== null) {
            arrayBody.push({
              idProduit: prod[i][2],
              designation: prod[i][0],
              code: table[i].code,
              stock: table[i].stock,
              total: table[i].total,
              jan: table[i].jan,
              fev: table[i].fev,
              mars: table[i].mars,
              avr: table[i].avr,
              mai: table[i].mai,
              juin: table[i].juin,
              juillet: table[i].juillet,
              aout: table[i].aout,
              sep: table[i].sep,
              oct: table[i].oct,
              nov: table[i].nov,
              dec: table[i].dec,
              na: 'N/A'
            });
          } else {
            produitexit.push('Code produit '+table[i].code+" \n\n/ \n\n");
            arrayBody.push({
              idProduit: null,
              designation: table[i].designation,
              code: table[i].code,
              stock: table[i].stock,
              total: table[i].total,
              jan: table[i].jan,
              fev: table[i].fev,
              mars: table[i].mars,
              avr: table[i].avr,
              mai: table[i].mai,
              juin: table[i].juin,
              juillet: table[i].juillet,
              aout: table[i].aout,
              sep: table[i].sep,
              oct: table[i].oct,
              nov: table[i].nov,
              dec: table[i].dec,
              na: 'N/A'
            });
          }
        }
        
        if(produitexit.length >0 )setProduitExist(produitexit);
        setEntities(arrayBody);
        document.getElementById("loaderTable").classList.add("hidden");
      });
    },
    [dispatch]
  );
  const setTable = useCallback(
    async (table, init) => {
      //1 => update table ***** 0 => initialiser table
      checkProd(table);
    },
    [checkProd]
  );
  function uploadBL(event) {
    var element = document.getElementById("table-BL");
    var element1 = document.getElementById("table-BL-header");
    element.classList.add("hidden");
    element1.classList.add("hidden");
    let blFile = event.target.files[0];
    if (blFile) {
      var ext = blFile.name.split(".")
      setExtensionFile(ext[(ext.length-1)]);
      setImage(URL.createObjectURL(blFile));
      if (ext[1] === "pdf") {
        setUploadFile(blFile);
      } else {
        setUploadFile(blFile);
        cropImg(event)
      }
      setEntities([]);
      onFileChange(event);
    }
  }
  function cropImg(e) {
    e.preventDefault();
    let files;
    if (e.dataTransfer) {
      files = e.dataTransfer.files;
    } else if (e.target) {
      files = e.target.files;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage1(reader.result);
    };
    reader.readAsDataURL(files[0]);
  };
  function onFileChange(event) {
    setPdfFile(event.target.files[0]);
  }

  function onDocumentLoadSuccess({ numPages: nextNumPages }) {
    setNumPages(nextNumPages);

    setTimeout(() => {
      convertCanvasToImage();
    }, 1000);
  }

  function convertCanvasToImage() {
    let canvases = document.getElementsByClassName("react-pdf__Page__canvas");
    setImage1(canvases)
    if (!canvases || canvases.length === 0) {
      console.warn("no canvases :'(");
      return;
    }
  }





  //get fournisseur
  const getFournisseur = useCallback(async () => {
    var fournisseur = await dispatch(getActiveFournisseur());
    var entities = fournisseur.payload;
    var arrayOption = [];
    entities.forEach((e) => {
      arrayOption.push({ value: e.id, label: e.nom });
    });
    setOptionFour(arrayOption);
  }, [dispatch]);



  const showTable = useCallback(
    async (file) => {
      var element = document.getElementById("table-BL");
      var element1 = document.getElementById("table-BL-header");
      element.classList.add("hidden");
      element1.classList.add("hidden");
      if (typeof file === "object") {
        document.getElementById("loaderTable").classList.remove("hidden");
        const dataArray = new FormData();
        dataArray.append("file", file);
        dataArray.append("name", file.name);
        var bl = await dispatch(extractionsReleve(dataArray));
        var entities = bl.payload;
        element.classList.remove("hidden");
        element1.classList.remove("hidden");

        setTable(entities, 0);
        notify("tr", "Extraction avec succes", "success");
      } else {
        notify("tr", "Il faut selectionner un releve", "danger");
      }
    },
    [dispatch, setTable]
  );




  const saveTable = useCallback(
    async (entities, uploadFile, fourSelected) => {

      var verif = true;
      entities.forEach((data) => {
        if (data.idProduit === null) verif = false;
      });
      if (verif === false) {
        notify("tr", "Vérifier vos données!", "danger");
      } else {
        const dataArray = new FormData();
        dataArray.append("file", uploadFile);
        dataArray.append("name", uploadFile.name);
        var bl = "";
        dataArray.append("bl", bl);
        if (fourSelected !== null) {
          dispatch(saveFile(dataArray)).then((e) => {
            var filename = e.payload.filename;

            dispatch(releveAdded({ annee: anneeLocal, filename: filename, ligneReleve: entities, four: fourSelected.value })).then((e) => {
              if (e.payload === true) {
                notify("tr", "Insertion avec succes", "success");
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              } else {
                notify("tr", "Vérifier vos données!", "danger");
              }
            });
          });
        }else{
          notify("tr", "Grossiste obligatoire!", "danger");
        }
      }

    },
    [dispatch, fileName, traitment]
  );



  useEffect(() => {
    getFournisseur();

  }, [
    getFournisseur,
  ]);
  return (
    <>
      <Container fluid className="responsive-BL table-dynamique">
      {produitExist !== "" ? (
          <Alert variant="danger">
            {produitExist}
          </Alert>
        ) : ""}
        <div className="rna-container">
          <NotificationAlert ref={notificationAlertRef} />
        </div>
        <Row>
          <Col md="12">
            <Card className="strpied-tabled-with-hover">
              <Card.Header>
                <Card.Title as="h4">Reléve grossiste</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-center">
                  <form>
                    <Form.Group className="float-left">
                      <Form.Control
                        id="test"
                        name="file"
                        type="file"
                        accept="application/pdf, image/png, image/jpeg, image/jpg"
                        onChange={(e) => uploadBL(e)}
                      ></Form.Control>
                    </Form.Group>
                  </form>
                  <div className="clear"></div>
                  <br></br>

                  {extensionFile === "" ? (
                    <h4>
                      Veuillez sélectionner un document PDF/Image <br></br> Nous
                      recomandons d'utiliser PDFScaner pour la prise des photos
                    </h4>
                  ) : extensionFile === "pdf" ? (
                    <Document
                      file={pdfFile}
                      onLoadSuccess={onDocumentLoadSuccess}
                      noData={
                        <h4>
                          Veuillez sélectionner un document PDF <br></br> Nous
                          recomandons d'utiliser PDFScaner pour la prise des
                          photos
                        </h4>
                      }
                      options={pdfOptions}
                    >
                      {Array.from(new Array(numPages), (el, index) => (
                        <Page
                          scale={2}
                          key={`page_${index + 1}`}
                          pageNumber={index + 1}
                        />
                      ))}
                    </Document>

                  ) : (
                    <div className="image-bl">
                      <img src={image} alt="" />
                    </div>
                  )}
                  <br />
                  <Button
                    className="btn-wd btn-outline mr-1 float-right extraction"
                    id="blExt"
                    type="button"
                    variant="info"
                    onClick={(v) => {
                      if (traitment === false)
                        showTable(uploadFile);
                    }}
                  >
                    <span className="btn-label">
                      <i className="fas fa-cogs"></i>
                    </span>
                    Extraction
                  </Button>
                </div>

                <div className="text-center">
                  <img
                    id="loaderTable"
                    className="hidden"
                    src={require("../../assets/img/loader.gif").default}
                    alt="loader"
                  />
                </div>
                <br></br>
                <Row className="hidden" id="table-BL-header">

                  <Col md="3">
                    <span>Grossiste * </span>
                    <Select
                      className="react-select primary"
                      classNamePrefix="react-select"
                      name="Grossiste"
                      placeholder="Grossiste"
                      value={fourSelected}
                      onChange={(v) => {
                        setFourSelected(v);
                      }}
                      options={optionFour}
                    />
                  </Col>

                </Row>
                <br></br>
                <Row className="hidden" id="table-BL">
                  <Col md="12">
                    <hr></hr>
                    <br></br>
                    <ReactTable
                      data={entities}
                      columns={[
                        {
                          Header: "Designation",
                          accessor: "designation",
                        },
                        {
                          Header: "Stock",
                          accessor: "stock",
                        },
                        {
                          Header: "Jan",
                          accessor: "jan",
                        },
                        {
                          Header: "Fev",
                          accessor: "fev",
                        },
                        {
                          Header: "Mars",
                          accessor: "mars",
                        },
                        {
                          Header: "Avr",
                          accessor: "avr",
                        },
                        {
                          Header: "Mai",
                          accessor: "mai",
                        },
                        {
                          Header: "Juin",
                          accessor: "juin",
                        },
                        {
                          Header: "Juillet",
                          accessor: "juillet",
                        },
                        {
                          Header: "Aout",
                          accessor: "aout",
                        },
                        {
                          Header: "Sep",
                          accessor: "sep",
                        },
                        {
                          Header: "Oct",
                          accessor: "oct",
                        },
                        {
                          Header: "Nov",
                          accessor: "nov",
                        },
                        {
                          Header: "dec",
                          accessor: "dec",
                        },
                        {
                          Header: "Total",
                          accessor: "total",
                        },
                        {
                          Header: "Date limite",
                          accessor: "na",
                        },

                      ]}
                      className="-striped -highlight primary-pagination"
                    />

                  </Col>
                  <Col md="12">

                    <Button
                      id="saveBL"
                      className="btn-wd btn-outline mr-1 float-right"
                      type="button"
                      variant="success"
                      onClick={() =>
                        saveTable(entities, uploadFile, fourSelected)
                      }
                    >
                      <span className="btn-label">
                        <i className="fas fa-check"></i>
                      </span>
                      Enregistrer
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
export default ReleveGro;
