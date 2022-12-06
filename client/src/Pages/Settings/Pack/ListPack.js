import NotificationAlert from "react-notification-alert";
import ReactTable from "../../../components/ReactTable/ReactTable.js";
import { Button, Card, Container, Row, Col } from "react-bootstrap";
import React,{useEffect,useCallback} from "react";
import { fetchPack } from "../../../Redux/packReduce";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
//store.dispatch(fetchPack());

// core components
function ListPack() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notificationAlertRef = React.useRef(null);
  const [entities, setEntities] = React.useState([]);
  function ajouter() {
    navigate('/ajouterPack');
    /* window.location.href = "/ajouterPack"; */
  }

  const getPack = useCallback(async () => {
    var pack = await dispatch(fetchPack());
    setEntities(pack.payload);
  }, [dispatch]);
  useEffect(() => {
    getPack()
  }, [getPack]) //now shut up eslint
  return (
    <>
      <Container fluid>
        <div className="rna-container">
          <NotificationAlert ref={notificationAlertRef} />
        </div>
        <Row>
          <Col md="12">
            <Button
              id="saveBL"
              className="btn-wd btn-outline mr-1 float-left"
              type="button"
              variant="info"
              onClick={ajouter}
            >
              <span className="btn-label">
                <i className="fas fa-plus"></i>
              </span>
              Ajouter une pack
            </Button>
          </Col>
          <Col md="12">
            <h4 className="title">Liste des packs</h4>
            <Card>
              <Card.Body>
                <ReactTable
                  data={entities}
                  columns={[
                    {
                      Header: "nom",
                      accessor: "nom",
                    },
                    {
                      Header: "bonification",
                      accessor: "bonification",
                    },

                    {
                      Header: "actions",
                      accessor: "id",
                      Cell: ({ cell }) => (
                        <div className="actions-right block_action">
                          <Button
                            onClick={() => {
                              navigate("/pack/update/" + cell.row.values.id);
                              /* window.location.replace(
                                "/pack/update/" + cell.row.values.id
                              ); */
                            }}
                            variant="warning"
                            size="sm"
                            className="text-warning btn-link edit"
                          >
                            <i className="fa fa-edit" />
                          </Button>
                          {/* <Button
                            id={"idLigne_" + cell.row.values.id}
                            onClick={(e) => {
                              confirmMessage(cell.row.values.id,e);
                            }}
                            variant="danger"
                            size="sm"
                            className="text-danger btn-link delete"
                          >
                            <i className="fa fa-trash" id={"idLigne_" + cell.row.values.id}/>
                          </Button> */}
                        </div>
                      ),
                    },
                  ]}
                  /*
                    You can choose between primary-pagination, info-pagination, success-pagination, warning-pagination, danger-pagination or none - which will make the pagination buttons gray
                  */
                  className="-striped -highlight primary-pagination"
                />
                {entities.length === 0 ? (
                  <div className="text-center">Aucun donnée trouvé</div>
                ) : (
                  ""
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default ListPack;
