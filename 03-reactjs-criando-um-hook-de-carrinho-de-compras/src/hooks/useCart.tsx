import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const product = cart.find(product => productId === product.id)
      const responseStoke = await api.get<Stock>(`stock/${productId}`).catch(() => {
        toast.error('Erro na adição do produto')
        throw new Error()
      })

      if(product) {
        if (product.amount + 1 > responseStoke.data.amount) {
          throw Error()
        }

        const newCart = cart.map(product => {
          if (product.id === productId) {
            return {
              ...product,
              amount: product.amount + 1
            }
          }

          return product
        })

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        setCart(newCart)
      } else {
        const response = await api.get(`products/${productId}`)

        const newProduct = {
          ...response.data,
          amount: 1
        }
        const newCart = [...cart, newProduct]

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        setCart(newCart)
      }
    } catch {
      toast.error('Quantidade solicitada fora de estoque');
    }
  };

  const removeProduct = (productId: number) => {
    const product = cart.find(product => productId === product.id)

    if(!product) {
      toast.error('Erro na remoção do produto')
      return
    }

    try {
      const newCart = cart.filter(product => product.id !== productId)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

      setCart(newCart)
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if(amount < 1) {
      toast.error('Erro na remoção do produto');
      return
    }

    try {
      const responseStoke = await api.get(`stock/${productId}`).catch(() => {
        toast.error('Erro na alteração de quantidade do produto')
        throw new Error()
      })

      if (amount > responseStoke.data.amount) {
        throw Error()
      }

      const newCart = cart.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            amount
          }
        }

        return product
      })

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      setCart(newCart)
    } catch {
      toast.error('Quantidade solicitada fora de estoque');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
