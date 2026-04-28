import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/User.js"

// Place Order COD: /api/order/cod


export const placeOrderCOD = async(req,res)=>{
    try {
         const { userId, items, address} = req.body;
         if(!address || items.length === 0)
         {
            return res.json({success: false, message: "Invalid Data"})
         }
         // Calculate Amount Using Items
         let amount = await items.reduce(async (acc,item)=>{
            const product = await Product.findById(item.product);
            return (await acc) + product.offerPrice * item.quantity;
         }, 0)

         // Add Tax Charge (2%)
         amount +=Math.floor(amount * 0.02);

         await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD",
         });

         return res.json({success: true, message:"Order Placed Successfully"})
    } catch (error) {
        return res.json({success:false, message:error.message});
    }
}

// Place Order Razorpay: /api/order/razorpay/place
export const placeOrderRazorpay = async (req, res) => {
    try {
        const { userId, items, address } = req.body;
        if (!address || items.length === 0) {
            return res.json({ success: false, message: "Invalid Data" });
        }

        // Calculate Amount Using Items
        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product);
            return (await acc) + product.offerPrice * item.quantity;
        }, 0);

        // Add Tax Charge (2%)
        amount += Math.floor(amount * 0.02);

        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online",
        });

        // Initialize Razorpay
        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: amount * 100, // Amount is in currency subunits (paise)
            currency: "INR",
            receipt: order._id.toString(),
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        return res.json({ success: true, order: razorpayOrder, dbOrderId: order._id.toString() });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Verify Razorpay Payment: /api/order/razorpay/verify
export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId, userId } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Mark Payment as paid
            await Order.findByIdAndUpdate(dbOrderId, { isPaid: true });
            // Clear user cart
            await User.findByIdAndUpdate(userId, { cartItems: {} });

            return res.json({ success: true, message: "Payment Verified Successfully" });
        } else {
            return res.json({ success: false, message: "Invalid signature sent!" });
        }
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const getUserOrders = async (req, res) => {
    try {
      const userId = req.userId; // ✅ Use this instead of req.user._id
  
      const orders = await Order.find({
        userId,
        $or: [{ paymentType: "COD" }, { isPaid: true }]
      })
      .populate("items.product address")
      .sort({ createdAt: -1 });
  
      res.json({ success: true, orders });
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
  };
  


// Get  All Orders(for seller/admin):/api/order/seller

export const getAllOrders = async(req,res)=>{
    try {
        const orders = await Order.find({
            $or: [{paymentType: "COD"}, {isPaid:true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({success:true, orders});
    } catch (error) {
       res.json({success:false,message:error.message}); 
    }
}