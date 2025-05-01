// import User from "../models/User.js";

// // Update User CartData : /api/cart/update

// export const updateCart = async(req,res)=>{
//     try {
//         const {userId, cartItems}=req.body
//         await User.findByIdAndUpdate(userId,{cartItems})
//         res.json({success:true,message:"Cart Updated"})
//     } catch (error) {
//         console.log(error.message)
//         res.json({success:false,message:error.message})
//     }
// }

import User from "../models/User.js";

// Update User CartData : /api/cart/update
export const updateCart = async (req, res) => {
    try {
        const { cartItems } = req.body;

        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized - no user ID" });
        }

        await User.findByIdAndUpdate(req.userId, { cartItems });
        res.json({ success: true, message: "Cart Updated" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
