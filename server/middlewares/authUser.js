import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
  // Support per-tab auth: check Authorization header first, then fallback to cookie
  let token = null;

  // 1. Check Authorization header (per-tab sessionStorage token)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Fallback to cookie (for backward compat / Stripe webhooks etc.)
  if (!token) {
    token = req.cookies?.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not Authorized' });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    
    if (tokenDecode && tokenDecode.id) {
      req.userId = tokenDecode.id;
      req.user = tokenDecode;
      next();
    } else {
      return res.status(401).json({ success: false, message: 'Not Authorized' });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token expired or invalid' });
  }
};

export default authUser;
