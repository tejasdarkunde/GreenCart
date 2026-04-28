import { useContext, useEffect, useState, useRef } from "react";
import { createContext } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

// ---------- Per-Tab Token Management ----------
// Uses sessionStorage so each tab has its own session.
// This means logging out in one tab does NOT affect other tabs.

function getTabToken() {
    return sessionStorage.getItem('token');
}

function setTabToken(token) {
    if (token) {
        sessionStorage.setItem('token', token);
    } else {
        sessionStorage.removeItem('token');
    }
}

function getSellerTabToken() {
    return sessionStorage.getItem('seller_token');
}

function setSellerTabToken(token) {
    if (token) {
        sessionStorage.setItem('seller_token', token);
    } else {
        sessionStorage.removeItem('seller_token');
    }
}

// Add Authorization header to every request if a token exists in this tab
axios.interceptors.request.use((config) => {
    const token = getTabToken();
    const sellerToken = getSellerTabToken();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (sellerToken) {
        config.headers['X-Seller-Token'] = `Bearer ${sellerToken}`;
    }
    return config;
});

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

    const currency = import.meta.env.VITE_CURRENCY;

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isSeller, setIsSeller] = useState(false);
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [searchQuery, setSearchQuery] = useState({});

    // Flag to prevent the cart-sync useEffect from firing before
    // the real cart has been loaded from the server.
    const cartLoadedFromServer = useRef(false);

    // ---- Authentication ----

    // Fetch Seller Status
    const fetchSeller = async () => {
        try {
            const { data } = await axios.get('/api/seller/is-auth');
            if (data.success) {
                setIsSeller(true);
            } else {
                setIsSeller(false);
            }
        } catch (error) {
            setIsSeller(false);
        }
    }

    // Fetch User Auth Status, User Data and Cart Items
    const fetchUser = async () => {
        try {
            const { data } = await axios.get('/api/user/is-auth', {
                withCredentials: true
            });
            if (data.success) {
                setUser(data.user);
                setCartItems(data.user.cartItems || {});
                cartLoadedFromServer.current = true; // Mark cart as loaded
            }
        } catch (error) {
            setUser(null);
            cartLoadedFromServer.current = true; // Even on failure, mark as loaded
        }
    }

    // ---- Products ----

    // Fetch All Products
    const fetchProducts = async () => {
        try {
            const { data } = await axios.get('/api/product/list')
            if (data.success) {
                setProducts(data.products)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // ---- Cart Operations ----

    // Add Product to cart
    const addToCart = (itemId) => {
        if (!user) {
            toast.error("Please login to add items to cart")
            setShowUserLogin(true)
            return;
        }

        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            cartData[itemId] += 1;
        } else {
            cartData[itemId] = 1;
        }
        setCartItems(cartData);
        toast.success("Added to Cart")
    }

    // Update Cart Item Quantity
    const updateCartItem = (itemId, quantity) => {
        if (!user) {
            toast.error("Please login to update cart")
            setShowUserLogin(true)
            return;
        }

        let cartData = structuredClone(cartItems);
        cartData[itemId] = quantity;
        setCartItems(cartData)
        toast.success("Cart Updated")
    }

    // Remove product from cart (decrement by 1 - used on product cards)
    const removeFromCart = (itemId) => {
        if (!user) {
            toast.error("Please login to remove items from cart")
            setShowUserLogin(true)
            return;
        }

        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            cartData[itemId] -= 1;
            if (cartData[itemId] === 0) {
                delete cartData[itemId];
            }
        }
        toast.success("Removed from cart")
        setCartItems(cartData)
    }

    // Delete product entirely from cart (used on Cart page ❌ button)
    const deleteFromCart = (itemId) => {
        if (!user) {
            toast.error("Please login to remove items from cart")
            setShowUserLogin(true)
            return;
        }

        let cartData = structuredClone(cartItems);
        delete cartData[itemId];
        toast.success("Removed from cart")
        setCartItems(cartData)
    }

    // Get Cart Item Count
    const getCartCount = () => {
        let totalCount = 0;
        for (const item in cartItems) {
            totalCount += cartItems[item];
        }
        return totalCount;
    }

    // Get Cart Total Amount
    const getCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            let itemInfo = products.find((product) => product._id === item);
            if (itemInfo && cartItems[item] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[item]
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }

    // ---- Lifecycle ----

    useEffect(() => {
        fetchUser()
        fetchSeller()
        fetchProducts()
    }, [])

    // Update database Cart Items
    // BUG FIX: Only sync cart to server AFTER the initial cart has been loaded
    // from the server. Without this guard, the empty default {} would overwrite
    // the user's real cart in the DB on every page load.
    useEffect(() => {
        // Don't sync until the server cart has been loaded at least once
        if (!cartLoadedFromServer.current) return;

        const updateCart = async () => {
            try {
                const { data } = await axios.post('/api/cart/update', { cartItems })
                if (!data.success) {
                    toast.error(data.message)
                }
            } catch (error) {
                // Silently fail for 401 (user logged out)
                if (error?.response?.status !== 401) {
                    toast.error(error.message)
                }
            }
        }

        if (user) {
            updateCart();
        }

    }, [cartItems])

    // ---- Logout (per-tab) ----

    const logout = async () => {
        try {
            await axios.get('/api/user/logout');
            // Only clear THIS tab's session
            setTabToken(null);
            setUser(null);
            setCartItems({});
            cartLoadedFromServer.current = false;
            toast.success("Logged Out");
            navigate('/');
        } catch (error) {
            toast.error(error.message);
        }
    }

    const sellerLogout = async () => {
        try {
            await axios.get('/api/seller/logout');
            setSellerTabToken(null);
            setIsSeller(false);
            toast.success("Logged Out");
            navigate('/');
        } catch (error) {
            toast.error(error.message);
        }
    }

    const value = {
        navigate, user, setUser, setIsSeller, isSeller,
        showUserLogin, setShowUserLogin, products, currency,
        addToCart, updateCartItem, removeFromCart, deleteFromCart, cartItems,
        searchQuery, setSearchQuery, getCartAmount, getCartCount,
        axios, fetchProducts, setCartItems, fetchSeller,
        logout, sellerLogout,
        setTabToken, setSellerTabToken, getTabToken, getSellerTabToken,
        cartLoadedFromServer,
    }

    return <AppContext.Provider value={value}>
        {children}
    </AppContext.Provider>
}

export const useAppContext = () => {
    return useContext(AppContext)
}