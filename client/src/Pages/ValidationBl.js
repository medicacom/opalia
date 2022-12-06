import React, { useCallback } from "react";
import Select from "react-select";
import { useDispatch } from "react-redux";
import { Button, Card, Container, Row, Col, Form } from "react-bootstrap";
import { getBl, blChangeEtat, blDeleted, getDetailBl, getAllDelegueBl } from "../Redux/blReduce";
import jwt_decode from "jwt-decode";
import ReactTable from "../components/ReactTable/ReactTable.js";
import NotificationAlert from "react-notification-alert";
import SweetAlert from "react-bootstrap-sweetalert";
import { useNavigate } from "react-router-dom";

function ValidationBl() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  var token = localStorage.getItem("x-access-token");
  var year = localStorage.getItem("annee");
  localStorage.removeItem("bonification");
  localStorage.removeItem("commentaire");
  var decoded = jwt_decode(token);
  const idLine = decoded.userauth.line;
  const id = decoded.userauth.id;
  const idRole = decoded.userauth.idrole;
  const [data, setData] = React.useState([]);

  const [options, setOptions] = React.useState([
    {
      value: "",
      label: "Délégué",
      isDisabled: true,
    },
  ]);
  const [delegueSelect, setDelegueSelect] = React.useState({
    value: 0,
    label: "Délégué",
  });

  const notificationAlertRef = React.useRef(null);
  const [alert, setAlert] = React.useState(null);
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
  const confirmMessage = (id, boni, etat, idRow) => {
    setAlert(
      <SweetAlert
        style={{ display: "block", marginTop: "-100px" }}
        title={
          etat === 1
            ? "Étes vous sure d'accepter Bl?"
            : etat === 2
            ? "Étes vous sure d'annuler Bl?"
            : "Étes vous sure de supprimer Bl?"
        }
        onConfirm={() => changeEtat(id, etat, idRow)}
        onCancel={() => hideAlert()}
        confirmBtnBsStyle="info"
        cancelBtnBsStyle="danger"
        confirmBtnText="Oui"
        cancelBtnText="Non"
        showCancel
      >
        {etat === 1 ? (
          <div>
            <Form.Group>
              <label>Bonification * </label>
              <Form.Control
                defaultValue={boni}
                placeholder="Bonification"
                type="text"
                onChange={(value) => {
                  localStorage.setItem("bonification", value.target.value);
                }}
              ></Form.Control>
            </Form.Group>
          </div>        
        ) : etat === 2 ?(
          <div>
            <Form.Group className="input-comment">
              <textarea
                className="form-control"
                onChange={(value) => {
                  localStorage.setItem("commentaire", value.target.value);
                }}
                rows="5"
              ></textarea>
            </Form.Group>
          </div>
        )
      :""}
      </SweetAlert>
    );
  };
  function changeEtat(id, etat, idRow) {
    var bonification = etat === 1 ? localStorage.getItem("bonification") : null;
    var commentaire = null;
    var verifComm=true
    if(etat === 2){
      commentaire = localStorage.getItem("commentaire");
      if(commentaire ==="" || commentaire === null){
        verifComm=false
        notify("tr", "Commentaire est obligatoire", "danger");
      }
    }
    if (etat !== 3 && verifComm) {
      dispatch(blChangeEtat({ id, etat, bonification,commentaire })).then((e1) => {
        if(e1.payload === true){
          listeBl(0);
          switch (etat) {
            case 1:
              notify("tr", "Bl valider avec succes", "success");
              break;
            case 2:
              notify("tr", "Bl refusé avec succes", "success");
              break;
            default:
              break;
          }
        } else {
          notify("tr", "Bl existe déjà", "danger");
        }
      });
      hideAlert();
    } else if(etat === 3){
      var list = data;
      list.splice(idRow, 1);
      setData(list);
      dispatch(blDeleted({ id }));
      notify("tr", "Supprimer avec succès", "success");
      hideAlert();
    }
  }
  const hideAlert = () => {
    setAlert(null);
  };
  /* detailBl */
  const detailBl = useCallback(
    async (p) => {
      var det = await dispatch(getDetailBl(p.id));
      var data = await det.payload;
      setAlert(
        <SweetAlert
          customClass="pop-up-bl"
          style={{ display: "block", marginTop: "-100px" }}
          title={"Détail BL"}
          onConfirm={() => hideAlert()}
          cancelBtnBsStyle="danger"
        >
          <table className="table table-bordered">
            <thead>
              <tr className="table-info">
                <th>Nom délégue</th>
                <th>Numéro BL</th>
                <th>Date BL</th>
                <th>Pharmacie</th>
                <th>Grossiste</th>
                <th>Bricks</th>
                <th>Pack</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{p.users}</td>
                <td>{p.numeroBl}</td>
                <td>{p.date}</td>
                <td>{p.pharmacie}</td>
                <td>{p.fournisseur}</td>
                <td>{p.ims}</td>
                <td>{p.pack}</td>
              </tr>
            </tbody>
          </table>
          <table className="table table-bordered">
            <thead>
              <tr className="table-info">
                <th>Quantité</th>
                <th>Produit</th>
                <th>Code PCT</th>
                <th>PU</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {data.map(e=>{
                return (
                <tr key={"ligne-"+e.id}>
                  <td>{e.quantite}</td>
                  <td>{e.produits.designation}</td>
                  <td>{e.produits.code}</td>
                  <td>{(e.montant/e.quantite).toFixed(3)}</td>
                  <td>{e.montant.toFixed(3)}</td>

                </tr>)
              })}
            </tbody>
          </table>
        </SweetAlert>
      );
    },
    [dispatch]
  );

  const getDelegue = useCallback(
    async (p) => {
      var anneeLocal = year;
      var delegueBD = await dispatch(getAllDelegueBl({idLine,idRole,anneeLocal}));
      var entities = delegueBD.payload;
      var arrayOption = [];
      entities.forEach((e) => {
        arrayOption.push({ value: e.users.id, label: e.users.nomU + " " + e.users.prenomU });
        if (e.id === p) {
          setDelegueSelect({ value: e.users.id, label: e.users.nomU + " " + e.users.prenomU });
        }
      });
      setOptions(arrayOption);
    },
    [dispatch, idLine, idRole, year]
  );
  /* const getFiles = useCallback(
    async (id,file, ext) => {
      var f = await dispatch(getFileBl(id));
      var res = f.payload;
      var file1 = null;
      var fileURL = null;
      if (ext !== "pdf") {
        file1 = new Blob([res], {
          type: "application/*",
        });
        fileURL = URL.createObjectURL(file1);
      } else {
        file1 = new Blob([res], {
          type: "application/pdf",
        });
        fileURL = URL.createObjectURL(file1);
      }
      return fileURL;
    },
    [dispatch]
  ); */
  const listeBl = useCallback(
    async (idDelegue) => {
      var idUser = (idRole === 1 || idRole=== 0) ? idDelegue : id;
      var list = await dispatch(
        getBl({
          idDelegue: idUser,
          idLine: idLine,
          id: idUser,
          idRole: idRole, 
          year: year,
        })
      );
      var res = list.payload;
      setData(res);
      /* if (res.length === 0) setData([]);
      else {
        for (const key in res) {
          var r = await getFiles(res[key].id,res[key].file,res[key].ext);
          res[key].fileURL = r
        }
        setData(res);
      } */
    },
    [dispatch, id, idLine, idRole, year]
  );
  React.useEffect(() => {
    listeBl(0);
    if (idRole === 1) getDelegue();
  }, [listeBl, idRole, getDelegue]);
  /* detailBl */
  const getCommentaire = useCallback(
    async (commentaire) => {
      setAlert(
        <SweetAlert
          style={{ display: "block", marginTop: "-100px" }}
          title={"Commentaire"}
          onConfirm={() => hideAlert()}
          cancelBtnBsStyle="danger"
        >
          {commentaire !=="" && commentaire !==null?commentaire:"Aucun commentaire"}
        </SweetAlert>
      );
    },
    []
  );

  return (
    <>
      {alert}
      <Container fluid>
        <div className="rna-container">
          <NotificationAlert ref={notificationAlertRef} />
        </div>
        <Row>
          {idRole === 1 ? (
            <Col md="6">
              <label>Délégué </label>
              <Select
                className="react-select primary"
                classNamePrefix="react-select"
                value={delegueSelect}
                onChange={(value) => {
                  setDelegueSelect(value);
                  listeBl(value.value);
                }}
                options={options}
              />
            </Col>
          ) : ""}
          <Col md="12">
            <h4 className="title">Validation BL</h4>
            <Card>
              <Card.Body>
                <ReactTable
                  data={data}
                  columns={[
                    {
                      Header: "Numéro BL",
                      accessor: "numeroBl",
                    },
                    {
                      Header: "Nom Délégué",
                      accessor: "users",
                    },
                    {
                      Header: "Pharmacies",
                      accessor: "pharmacie",
                    },
                    {
                      Header: "Pack",
                      accessor: "pack",
                    },
                    {
                      Header: "Bonification",
                      accessor: "bonification",
                    },
                    {
                      Header: "Total",
                      accessor: "mnt",
                    },
                    {
                      Header: "Etat",
                      accessor: "etat",
                      Cell: ({ cell }) =>
                        cell.row.values.etat === 0 ? "En cours" : "Refusé",
                    },
                    {
                      Header: "Date",
                      accessor: "date",
                      Cell: ({ cell }) => (
                        <div className="block_action">
                          {cell.row.values.date !== null
                            ? new Date(cell.row.values.date)
                                .toISOString()
                                .slice(0, 10)
                            : ""}
                        </div>
                      ),
                    },
                    {
                      Header: "visualization",
                      accessor: "file",
                      Cell: ({ cell }) =>
                       (
                        <Button
                          id={"idLigne_" + cell.row.values.id}
                          onClick={(e) => {
                            navigate("/telechargerFichier/2/"+cell.row.values.id);
                            localStorage.setItem("file", cell.row.original.file);
                            localStorage.setItem("returnList", "ValidationBl");
                          }}
                          className="btn btn-info ml-1 visualiser"
                        >
                          <i
                            className="fa fa-file"
                            id={"idLigne_" + cell.row.values.id}
                          />
                          Visualiser
                        </Button>),
                    },
                    /* {
                      Header: "visualization",
                      accessor: "fileURL",
                      Cell: ({ cell }) => (
                          cell.row.original.ext === "pdf" ? (
                            <div className="visualiser">
                              <iframe
                                title="Transition"
                                width="100%"
                                height="100%"
                                src={cell.row.values.fileURL}
                              ></iframe>
                              <br></br>
                              <a
                                className="btn btn-info btn-bl"
                                rel="noreferrer"
                                href={cell.row.values.fileURL}
                                target="_blank"
                              >
                                <i className="fas fa-file"></i>
                                Visualiser
                              </a>
                            </div>
                          ) : 
                          <div className="visualiser">
                            <img src={cell.row.values.fileURL} className="img-file" alt=""></img>
                            <br></br>
                            <a
                              className="btn btn-info btn-bl"
                              rel="noreferrer"
                              href={cell.row.values.fileURL}
                              download={cell.row.original.file}
                              target="_blank"
                            >
                              <i className="fas fa-file"></i>
                              Visualiser
                            </a>
                          </div>
                      ),
                    }, */
                    {
                      Header: "commentaire",
                      accessor: "commentaire",
                      Cell: ({ cell }) =>(
                      <div>
                        <Button
                          id={"idLigneV_" + cell.row.values.id}
                          onClick={(e) => {
                            getCommentaire(cell.row.values.commentaire);
                          }}
                          className="btn btn-info"
                        >
                          Lire <i
                            className="fa fa-comment"
                            id={"idLigneV_" + cell.row.values.id}
                          />
                        </Button>

                      </div>)
                    },
                    {
                      Header: "actions",
                      accessor: "id",
                      Cell: ({ cell }) =>
                        idRole === 1 ? (
                          <div className="actions-right block_action">
                            <Button
                              id={"idLigneV_" + cell.row.values.id}
                              onClick={(e) => {
                                detailBl(cell.row.original);
                              }}
                              className="delete btn btn-success"
                            >
                              <i
                                className="fa fa-eye"
                                id={"idLigneV_" + cell.row.values.id}
                              />
                            </Button>
                            <Button
                              id={"idLigneC_" + cell.row.values.id}
                              onClick={(e) => {
                                confirmMessage(
                                  cell.row.values.id,
                                  cell.row.original.bonification,
                                  1,
                                  cell.row.id
                                );
                              }}
                              className="delete btn btn-success ml-1"
                            >
                              <i
                                className="fa fa-check"
                                id={"idLigneC_" + cell.row.values.id}
                              />
                            </Button>

                            <Button
                              id={"idLigneD_" + cell.row.values.id}
                              onClick={(e) => {
                                confirmMessage(
                                  cell.row.values.id,
                                  cell.row.original.bonification,
                                  2,
                                  cell.row.id
                                );
                              }}
                              className="delete btn btn-danger ml-1"
                            >
                              <i
                                className="fa fa-times"
                                id={"idLigneD_" + cell.row.values.id}
                              />
                            </Button>
                          </div>
                        ) : (
                          <div className="actions-right block_action">
                            <Button
                              id={"idLigneV_" + cell.row.values.id}
                              onClick={(e) => {
                                detailBl(cell.row.original);
                              }}
                              className="delete btn btn-success"
                            >
                              <i
                                className="fa fa-eye"
                                id={"idLigneV_" + cell.row.values.id}
                              />
                            </Button>
                            <Button
                              id={"idLigne_" + cell.row.values.id}
                              onClick={(e) => {
                                confirmMessage(
                                  cell.row.values.id,
                                  cell.row.original.bonification,
                                  3,
                                  cell.row.id
                                );
                              }}
                              className="delete btn btn-danger ml-1 float-right"
                            >
                              <i
                                className="fa fa-trash"
                                id={"idLigne_" + cell.row.values.id}
                              />
                            </Button>
                          </div>
                        ),
                    },
                  ]}
                  className="-striped -highlight primary-pagination"
                />
                {data.length === 0 ? (
                  <div className="text-center">Aucun produit trouvé</div>
                ) : ""}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default ValidationBl;
