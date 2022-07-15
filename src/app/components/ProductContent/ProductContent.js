import React, { useEffect, useState } from "react";
import moment from "moment";
import "moment/locale/es";
import { useFormik } from "formik";
import { toast } from "react-toastify";

import "./ProductContent.css";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Rating } from "primereact/rating";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

import { getProduct } from "../../api/products";
import {
  getLastComments,
  getAllComments,
  createComment,
} from "../../api/comments";
import useCart from "../../hooks/useCart";

moment().locale("es");

export function ProductContent() {
  const id = window.location.pathname.split("/")[2];
  const [product, setProduct] = useState({});
  const [quantity, setQuantity] = useState(1);
  const { addProduct } = useCart();
  useEffect(() => {
    getProduct(id).then((product) => setProduct(product));
  }, []);

  const getStock = (product) => {
    if (product.stock === 100) {
      return 0;
    }
    return product.stock;
  };

  return (
    <div className="ProductContent">
      <div className="ProductSection">
        <img src={product.image} alt={product.name} />
        <div className="ProductData">
          <p className="Description"> {`Productos > ${product.name}`}</p>
          <h2>{product.name}</h2>
          <p className="Id">ID: {product.ID}</p>
          <Rating value={5} readOnly cancel={false} />
          <p className="Description">{product.description}</p>
          <p className="Price">${product.price}</p>
          <p className="Description">
            Stock: {getStock(product) === 0 ? "Agotado" : getStock(product)}
          </p>
          <InputNumber
            disabled={getStock(product) === 0}
            className="HorizontalBar"
            min={1}
            max={getStock(product)}
            value={quantity}
            onChange={(e) => setQuantity(e.value)}
            showButtons
            buttonLayout="horizontal"
            decrementButtonClassName="p-button-danger"
            incrementButtonClassName="p-button-success"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            size={1}
            allowEmpty={false}
          />
          <Button
            disabled={getStock(product) === 0}
            className="buy"
            onClick={() => addProduct(product.ID, quantity)}
          >
            Añadir al carro
          </Button>
        </div>
      </div>
      <div>
        <Comments productId={id} />
      </div>
    </div>
  );
}

function Comments(props) {
  let productId = props.productId;

  const [commentsHidden, setCommentsHidden] = useState(true);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    getLastComments(productId).then((comments) => setComments(comments));
  }, []);

  const showAllComments = () => {
    setCommentsHidden(false);
    getAllComments(productId).then((comments) => setComments(comments));
  };

  return (
    <div className="CommentsSection">
      <div className="Comments">
        <h2>⭐ Valoraciones ⭐</h2>
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div className="Comment" key={comment.ID}>
              <h3>
                <b className="User">{comment.customer}</b>
                <small className="Date">
                  {moment(comment.CreatedAt).format("D MMMM YYYY")}
                </small>
              </h3>
              <p className="Stars">
                <Rating value={comment.stars} readOnly cancel={false} />
              </p>
              <p>{comment.content}</p>
            </div>
          ))
        ) : (
          <p>No hay valoraciones</p>
        )}
        <div>
          {comments.length >= 3 && commentsHidden ? (
            <p className="allCommentsButton" onClick={() => showAllComments()}>
              👇 Ver todas las valoraciones
            </p>
          ) : null}
        </div>
      </div>
      <CommentForm productId={productId} setComments={setComments} />
    </div>
  );
}

function CommentForm(props) {
  let { productId, setComments } = props;

  const formik = useFormik({
    initialValues: {
      customer: "",
      stars: 0,
      content: "",
      product_id: productId,
    },
    validate: (values) => {
      const errors = {};

      if (!values.customer) {
        errors.customer = "El nombre es requerido";
      }

      if (!values.content) {
        errors.content = "El comentario es requerido";
      }

      if (values.stars == 0) {
        errors.stars = "La valoración es requerida";
      }

      return errors;
    },
    onSubmit: async (values) => {
      await createComment(values);
      toast.success("Gracias por tu comentario");
      setComments(await getLastComments(productId));
    },
  });

  const isFormFieldValid = (name) =>
    !!(formik.touched[name] && formik.errors[name]);
  const getFormErrorMessage = (name) => {
    return (
      isFormFieldValid(name) && (
        <small className="p-error">{formik.errors[name]}</small>
      )
    );
  };

  return (
    <div className="CommentForm">
      <h2>¡Dejanos tu comentario! 😎</h2>
      <form className="form" onSubmit={formik.handleSubmit}>
        <div className="form-group">
          {getFormErrorMessage("customer")}
          <InputText
            name="customer"
            value={formik.values.customer}
            onChange={formik.handleChange}
            placeholder="Nombre"
          />
          {getFormErrorMessage("stars")}
          <Rating
            name="stars"
            value={formik.values.stars}
            onChange={formik.handleChange}
            cancel={false}
          />
          {getFormErrorMessage("content")}
          <InputTextarea
            name="content"
            rows={5}
            cols={30}
            autoResize
            maxlength="150"
            value={formik.values.content}
            onChange={formik.handleChange}
            placeholder="Comentario (máx. 150 caracteres)"
          />
          <Button label="Enviar" />
        </div>
      </form>
    </div>
  );
}
