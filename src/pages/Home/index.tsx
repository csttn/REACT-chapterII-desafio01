import React, { useState, useEffect } from "react";

import { api } from "../../services/api";
import { useCart } from "../../hooks/useCart";
import { ProductList } from "./styles";
import { formatPrice } from "../../util/format";
import { MdAddShoppingCart } from "react-icons/md";

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

export interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart } = useCart();

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    //criando array do mesmo tipo para adicionar as respectivas chaves
    const newSumAmount = { ...sumAmount };

    //adicionando chave id e valor de quantidade para os elementos no carrinho
    newSumAmount[product.id] = product.amount;

    // retornando array com os objetos com as respectivas chaves como id e valor como quantidade do produto
    return newSumAmount;
  }, {} as CartItemsAmount);

  function handleAddProduct(id: number) {
    addProduct(id);
  }

  //carregando produtos e renderizando com valores formatados
  useEffect(() => {
    async function loadProducts() {
      const { data } = await api.get<Product[]>("/products");
      const productFormatted = data.map((product) => ({
        ...product,
        priceFormatted: formatPrice(product.price),
      }));

      setProducts(productFormatted);
    }
    loadProducts();
  }, []);

  return (
    <ProductList>
      {products.map((product) => (
        <li key={product.id}>
          <img src={product.image} alt={product.title} />
          <strong>{product.title}</strong>
          <span>{product.priceFormatted}</span>
          <button
            type="button"
            data-testid="add-product-button"
            onClick={() => handleAddProduct(product.id)}
          >
            <div data-testid="cart-product-quantity">
              <MdAddShoppingCart size={16} color="#FFF" />
              {cartItemsAmount[product.id] || 0}
            </div>

            <span>ADICIONAR AO CARRINHO</span>
          </button>
        </li>
      ))}
    </ProductList>
  );
};

export default Home;
