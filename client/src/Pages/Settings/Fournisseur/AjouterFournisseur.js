import React, { useEffect } from "react";
import NotificationAlert from "react-notification-alert";

// react-bootstrap components
import { Button, Card, Form, Container, Row, Col } from "react-bootstrap";
import { useParams,useNavigate } from "react-router-dom";
import { fournisseurAdded, fournisseurGetById } from "../../../Redux/fournisseurReduce";
import { useDispatch } from "react-redux";

function AjouterFournisseur() {
  const dispatch = useDispatch();
  const location = useParams();
  const navigate = useNavigate();
  if (isNaN(location.id) === true) document.title = "Ajouter un Grossiste";
  else  document.title = "Modifier le Grossiste";
  const [nom, setNom] = React.useState("");
  const [id, setId] = React.useState(0);

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
  function submitForm(event) {
    if(nom === "")
      notify("tr", "Grossiste est obligatoire", "danger");
    else{
      dispatch(fournisseurAdded({ nom, id })).then(e=>{
        if(e.payload ===true){
          if(isNaN(location.id) === true)
            notify("tr", "Insertion avec succes", "success")
          else  
            notify("tr", "Modifier avec succes", "success");
          setTimeout(async () => {
            listeFournisseur();
          }, 1500);
        } else {
          notify("tr", "Problème de connexion", "danger");          
        }
      });

    }
    /* if(nom === "")      
      notify("tr", "Grossiste est obligatoire", "danger");
    else {
      if (isNaN(location.id) === true) {
        dispatch(fournisseurAdded({ nom, id }));
        notify("tr", "Insertion avec succes", "success");
        setTimeout(async () => {
          listeFournisseur();
        }, 1500);
      } else {
        dispatch(fournisseurAdded({ nom, id }));
        notify("tr", "Modifier avec succes", "success");
        setTimeout(async () => {
          listeFournisseur();
        }, 1500);
      }
    } */
  }

  useEffect(() => {
    async function getFournisseur() {
      if (isNaN(location.id) === false) {
        var fournisseur = await dispatch(fournisseurGetById(location.id));
        var entities = fournisseur.payload;
        if(entities === false){
          navigate('/listFournisseur');
        }
        else{
          setNom(entities.nom);
          setId(location.id);
        }
      }
    }
    getFournisseur();
  }, [location.id,dispatch,navigate]);

  function listeFournisseur() {
    navigate('/listFournisseur');
    /* window.location.replace("/listFournisseur"); */
  }
  return (
    <>
      <Container fluid>
        <div className="rna-container">
          <NotificationAlert ref={notificationAlertRef} />
        </div>
        <div className="section-image">
          <Container>
            <Row>
              <Col md="12">
                <Button
                  id="saveBL"
                  className="btn-wd btn-outline mr-1 float-left"
                  type="button"
                  variant="info"
                  onClick={listeFournisseur}
                >
                  <span className="btn-label">
                    <i className="fas fa-list"></i>
                  </span>
                  Retour à la liste
                </Button>
              </Col>
            </Row>
            <Row>
              <Col md="12">
                <Form action="" className="form" method="">
                  <Card>
                    <Card.Header>
                      <Card.Header>
                        <Card.Title as="h4">
                          { typeof location.id == "undefined" ? "Ajouter grossiste" : "Modifier grossiste" }
                        </Card.Title>
                      </Card.Header>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col className="pr-1" md="6">
                          <Form.Group>
                            <label>Nom * </label>
                            <Form.Control
                              defaultValue={nom}
                              placeholder="grossiste"
                              type="text"
                              onChange={(value) => {
                                setNom(value.target.value);
                              }}
                            ></Form.Control>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Button
                        className="btn-fill pull-right"
                        type="button"
                        variant="info"
                        onClick={submitForm}
                      >
                        Enregistrer
                      </Button>
                      <div className="clearfix"></div>
                    </Card.Body>
                  </Card>
                </Form>
              </Col>
            </Row>
          </Container>
        </div>
      </Container>
    </>
  );
}

export default AjouterFournisseur;
