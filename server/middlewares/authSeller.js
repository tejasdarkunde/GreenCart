import jwt from 'jsonwebtoken';

const authSeller = async (req, res, next) => {
    let token = null;

    // 1. Check X-Seller-Token header (per-tab sessionStorage)
    const sellerHeader = req.headers['x-seller-token'];
    if (sellerHeader && sellerHeader.startsWith('Bearer ')) {
        token = sellerHeader.split(' ')[1];
    }

    // 2. Fallback to cookie
    if (!token) {
        token = req.cookies?.seller_token;
    }

    if (!token) {
        return res.json({ success: false, message: 'Not Authorized' });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET); 

        if (tokenDecode.role === "seller") {   
            next();
        } else {
            return res.json({ success: false, message: 'Not Authorized' });
        }

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export default authSeller;