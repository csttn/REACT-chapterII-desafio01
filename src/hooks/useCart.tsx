import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api, axios } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

export interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  //memorizando valores para evitar renderizações desnecessárias
  const prevCartRef = useRef<Product[]>();

  //variavel de referencia armazenando o valor inical do carrinho
  useEffect(() => {
    prevCartRef.current = cart;
    console.log("to dentro do effect prev.current = cart");
  });
  //atribuindo o valor incial do carrinho a variavel Prev
  const cartPreviousValue = prevCartRef.current ?? cart;

  // monitorando valores para renderização e persistir os dados no LocalStorage
  useEffect(() => {
    if (cartPreviousValue !== cart) {
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    }
  }, [cart, cartPreviousValue]);

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(
        (product) => product.id === productId
      );

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1,
        };

        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    const updatedCart = [...cart];
    try {
      const productIndex = updatedCart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex !== -1) {
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
      } else {
        toast.error("Erro na remoção do produto");
      }
    } catch (error) {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      //validação de quantidade minima
      if (amount <= 0) {
        return;
      }
      //verificando quantidade em estoque do produto
      const stock = await api.get(`/stock/${productId}`);

      //validado se a quantidade do produto é valida com o disponicel em estoque
      if (stock.data.amount < amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updatedCart = [...cart];

      const updatedProduct = updatedCart.find((product, index) =>
        product.id === productId ? { product, index } : null
      );
      //verificando a existencia do produto a ser modificado
      if (updatedProduct) {
        updatedProduct.amount = amount;
      }

      setCart(updatedCart);
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addProduct,
        removeProduct,
        updateProductAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
