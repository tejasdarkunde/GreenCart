import jwt from 'jsonwebtoken';

const authSeller = async (req, res, next) => {

    const { seller_token } = req.cookies;
    const token = seller_token;

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