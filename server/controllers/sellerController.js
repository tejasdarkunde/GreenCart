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
                { role: "seller" },   // ✅ IMPORTANT
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.cookie('seller_token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.json({ success: true, message: "Logged In" });

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
        const token = req.cookies.seller_token;

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
            secure: false,
            sameSite: 'lax',
        });

        return res.json({ success: true, message: "Logged Out" });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};