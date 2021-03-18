import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import { Alert } from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

import formatValue from '../utils/formatValue';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  cartTotal: string;
  totalItensInCart: number;
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // TODO LOAD ITEMS FROM ASYNC STORAGE
      const cart = await AsyncStorage.getItem('@Gomarketplace:cart');

      cart && setProducts(JSON.parse(cart));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      // TODO ADD A NEW ITEM TO THE CART
      const productsList = products;
      const productExists = productsList.find(item => item.id === product.id);

      if (productExists) {
        productExists.quantity += 1;
        setProducts([...productsList]);
      } else {
        const newProduct = {
          id: product.id,
          title: product.title,
          image_url: product.image_url,
          price: product.price,
          quantity: 1,
        };

        setProducts([...products, newProduct]);
      }

      await AsyncStorage.setItem(
        '@Gomarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      // TODO INCREMENTS A PRODUCT QUANTITY IN THE CART
      const product = products.find(item => item.id === id);

      if (product) {
        product.quantity += 1;
      }

      setProducts([...products]);

      await AsyncStorage.setItem(
        '@Gomarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      // TODO DECREMENTS A PRODUCT QUANTITY IN THE CART
      const product = products.find(item => item.id === id);

      if (product) {
        if (product.quantity === 1) {
          Alert.alert(
            'Confirm deletion',
            'Are you sure you want to remove this product from the cart?',
            [
              {
                text: 'Yes',
                onPress: async () => {
                  const updatedProducts = products.filter(
                    item => item !== product,
                  );
                  setProducts([...updatedProducts]);
                  await AsyncStorage.setItem(
                    '@Gomarketplace:cart',
                    JSON.stringify(updatedProducts),
                  );
                },
              },
              {
                text: 'No',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel',
              },
            ],
          );
        } else {
          product.quantity -= 1;
          setProducts([...products]);
          await AsyncStorage.setItem(
            '@Gomarketplace:cart',
            JSON.stringify(products),
          );
        }
      }
    },
    [products],
  );

  const cartTotal = useMemo(() => {
    // TODO RETURN THE SUM OF THE PRICE FROM ALL ITEMS IN THE CART
    const totalValue = products.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    return formatValue(totalValue);
  }, [products]);

  const totalItensInCart = useMemo(() => {
    // TODO RETURN THE SUM OF THE QUANTITY OF THE PRODUCTS IN THE CART
    const totalItensNumber = products.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
    return totalItensNumber;
  }, [products]);

  const value = React.useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
      cartTotal,
      totalItensInCart,
    }),
    [products, cartTotal, addToCart, increment, decrement, totalItensInCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
