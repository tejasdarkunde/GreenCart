import jwt from 'jsonwebtoken';

// Login Seller: /api/seller/login
export const sellerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            email === process.env.SELLER_EMAIL.trim() &&
            password === process.env.SELLER_PASSWORD.trim()
        ) {
            const token = jwt.sign(
                { role: "seller" },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.cookie('seller_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            // Return token in body for per-tab sessionStorage
            return res.json({ success: true, token, message: "Logged In" });

        } else {
            return res.json({ success: false, message: "Invalid Credentials" });
        }

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};


// Seller isAuth: /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
    try {
        let token = null;

        // Check header first (per-tab), then cookie
        const sellerHeader = req.headers['x-seller-token'];
        if (sellerHeader && sellerHeader.startsWith('Bearer ')) {
            token = sellerHeader.split(' ')[1];
        }
        if (!token) {
            token = req.cookies.seller_token;
        }

        if (!token) {
            return res.json({ success: false });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role === "seller") {
            return res.json({ success: true });
        } else {
            return res.json({ success: false });
        }

    } catch (error) {
        return res.json({ success: false });
    }
};


// Logout Seller: /api/seller/logout
export const sellerLogout = async (req, res) => {
    try {
        res.clearCookie('seller_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        return res.json({ success: true, message: "Logged Out" });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};