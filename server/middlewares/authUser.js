// import jwt from 'jsonwebtoken';

// const authUser=async(req,res,next)=>{
//    const {token} = req.cookies;

//    if(!token)
//    {
//      return res.json({success:false,message:'Not Authorized'});
//    }

//    try {
//       const tokenDecode= jwt.verify(token,process.env.JWT_SECRET) 
//       if(tokenDecode.id)
//       {
//         //req.body.userId=tokenDecode.id
//         req.userId = tokenDecode.id; 

//       }else{
//         return res.json({success:false,message:'Not Authorized'})
//       }
//       next();
//    } catch (error) 
//    {
//        res.json({success:false,message:error.message});
//    }
// }


// export default authUser;

import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not Authorized' });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    
    if (tokenDecode && tokenDecode.id) {
      req.userId = tokenDecode.id; // ✅ Set userId for protected routes
      req.user = tokenDecode;      // (optional) Set full user info if needed
      next();
    } else {
      return res.status(401).json({ success: false, message: 'Not Authorized' });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export default authUser;
