import React, { useEffect } from "react";
import NotificationAlert from "react-notification-alert";
// react-bootstrap components
import { Button, Card, Form, Container, Row, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { marcheImsAdded, marcheImsGetById } from "../../../Redux/marcheImsReduce";

import { useDispatch } from "react-redux";

function AjouterMarcheIms() {
  const dispatch = useDispatch();
  const location = useParams();
  const navigate = useNavigate();
  if (isNaN(location.id) === true) document.title = "Ajouter un marché";
  else  document.title = "Modifier le marché";
  const [lib, setLib] = React.useState("");
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
    if(lib === "")      
      notify("tr", "Marché est obligatoire", "danger");
    else {
      dispatch(marcheImsAdded({ lib, id })).then(e=>{
        if(e.payload ===true){
          if(isNaN(location.id) === true)
            notify("tr", "Insertion avec succes", "success")
          else  
            notify("tr", "Modifier avec succes", "success");
          setTimeout(async () => {
            listeMarcheIms();
          }, 1500);
        } else {
          notify("tr", "Problème de connexion", "danger");          
        }
      });
      /* if (isNaN(location.id) === true) {
        dispatch(marcheImsAdded({ lib, id }));
        notify("tr", "Insertion avec succes", "success");
        setTimeout(async () => {
          listeMarcheIms();
        }, 1500);
      } else {
        dispatch(marcheImsAdded({ lib, id }));
        notify("tr", "Modifier avec succes", "success");
        setTimeout(async () => {
          listeMarcheIms();
        }, 1500);
      } */
    }
  }

  useEffect(() => {
    async function getMarcheIms() {
      if (isNaN(location.id) === false) {
        var marcheIms = await dispatch(marcheImsGetById(location.id));
        var entities = marcheIms.payload;
        if(entities === false){
          navigate('/listMarcheIms');
        }
        else{
          setLib(entities.lib);
          setId(location.id);
        }
      }
    }
    getMarcheIms();
  }, [location.id,dispatch,navigate]);

  function listeMarcheIms() {
    navigate('/listMarcheIms');
    /* window.location.replace("/listMarcheIms"); */
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
                  onClick={listeMarcheIms}
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
                          { typeof location.id == "undefined" ? "Ajouter marché" : "Modifier marché" }
                        </Card.Title>
                      </Card.Header>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col className="pr-1" md="6">
                          <Form.Group>
                            <label>Marché * </label>
                            <Form.Control
                              defaultValue={lib}
                              placeholder="Marché"
                              type="text"
                              onChange={(value) => {
                                setLib(value.target.value);
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

export default AjouterMarcheIms;
