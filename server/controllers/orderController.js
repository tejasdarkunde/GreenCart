import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe"
import User from "../models/User.js"

// Place Order COD: /api/order/cod


export const placeOrderCOD = async(req,res)=>{
    try {
         const { items, address} = req.body;
         const userId = req.userId;
         if(!address || items.length === 0)
         {
            return res.json({success: false, message: "Invalid Data"})
         }
         // Calculate Amount Using Items
         let amount = 0;
         for (const item of items) {
            const product = await Product.findById(item.product);
            amount += product.offerPrice * item.quantity;
         }

         // Add Tax Charge (2%)
         amount += Math.floor(amount * 0.02);

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

// Place Order Stripe: /api/order/stripe


export const placeOrderStripe = async(req,res)=>{
  try {
       const { items, address} = req.body;
       const userId = req.userId;
       const { origin } = req.headers;

       if(!address || items.length === 0)
       {
          return res.json({success: false, message: "Invalid Data"})
       }

       let productData = [];
       // Calculate Amount Using Items
       let amount = 0;
       for (const item of items) {
          const product = await Product.findById(item.product);
          productData.push({
            name: product.name,
            price: product.offerPrice,
            quantity: item.quantity,
          });
          amount += product.offerPrice * item.quantity;
       }

       // Add Tax Charge (2%)
       amount += Math.floor(amount * 0.02);

       const order = await Order.create({
          userId,
          items,
          amount,
          address,
          paymentType: "Online",
       });

       // Stripe Gateway  Initialize

       const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

       // Create line items for stripe

       const line_items = productData.map((item)=>{
        return{
          price_data : {
            currency : "INR",
            product_data: {
              name : item.name,
            },
            unit_amount : Math.floor(item.price + item.price * 0.02) * 100,
          },
          quantity : item.quantity,
        }
       })

       // Create session

       const session = await stripeInstance.checkout.sessions.create({
        line_items,
        mode : "payment",
        success_url : `${origin}/loader?next=my-orders`,
        cancel_url: `${origin}/cart`,
        metadata: {
          orderId : order._id.toString(),
          userId,
        }
       })

       return res.json({success: true, url : session.url })
  } catch (error) {
      return res.json({success:false, message:error.message});
  }
}

//Stripe webhooks to verify payments action : /stripe
export const stripeWebhooks = async (request, response)=>{
  // Stripe Gateway Initialize
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

  const sig = request.headers["stripe-signature"];
  let event;

  try{
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }catch(error){
    return response.status(400).send(`Webhook Error : ${error.message}`)
  }

  // Handle the event

  switch (event.type){
    case "payment_intent.succeeded":{
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      

      //Getting Session metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent : paymentIntentId,
      });

      const {orderId, userId} = session.data[0].metadata;

      // Mark Payment as paid
      await Order.findByIdAndUpdate(orderId, {isPaid : true})
      // Clear user cart
      await User.findByIdAndUpdate(userId, {cartItems: {}});
      break;
    }
    case "payment_intent.payment_failed":{
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      

      //Getting Session metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent : paymentIntentId,
      });

      const {orderId} = session.data[0].metadata;
      await Order.findByIdAndDelete(orderId);
      break;
    }
      
    default:
      console.error(`Unhandled event type ${event.type}`)
      break;
  }
  response.json({received : true})
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

// Update Order Status: /api/order/status
export const updateOrderStatus = async(req,res)=>{
    try {
        const { orderId, status } = req.body;
        const validStatuses = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
        
        if(!validStatuses.includes(status)){
            return res.json({success:false, message:"Invalid status"});
        }

        // Block "Delivered" if COD payment not collected
        if(status === 'Delivered'){
            const order = await Order.findById(orderId);
            if(order && order.paymentType === 'COD' && !order.isPaid){
                return res.json({success:false, message:"Please collect cash payment before marking as Delivered"});
            }
        }

        await Order.findByIdAndUpdate(orderId, { status });
        res.json({success:true, message:`Order status updated to ${status}`});
    } catch (error) {
        res.json({success:false, message:error.message});
    }
}

// Mark COD Order as Paid: /api/order/mark-paid
export const markCODPaid = async(req,res)=>{
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);
        
        if(!order){
            return res.json({success:false, message:"Order not found"});
        }
        if(order.paymentType !== "COD"){
            return res.json({success:false, message:"Only COD orders can be marked as paid"});
        }

        await Order.findByIdAndUpdate(orderId, { isPaid: true });
        res.json({success:true, message:"COD payment collected successfully"});
    } catch (error) {
        res.json({success:false, message:error.message});
    }
}

// Dashboard Analytics: /api/order/dashboard
export const getDashboardData = async(req,res)=>{
    try {
        // Get all valid orders (COD or paid online)
        const orders = await Order.find({
            $or: [{paymentType: "COD"}, {isPaid:true}]
        }).populate("items.product");

        const totalProducts = await Product.countDocuments();

        // Separate delivered and cancelled orders
        const deliveredOrders = orders.filter(o => o.status === 'Delivered');
        const cancelledOrders = orders.filter(o => o.status === 'Cancelled');
        const activeOrders = orders.filter(o => o.status !== 'Cancelled');

        // Summary stats - revenue only from delivered orders
        const totalOrders = orders.length;
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.amount, 0);
        const avgOrderValue = deliveredOrders.length > 0 ? Math.round(totalRevenue / deliveredOrders.length) : 0;
        const totalCancelled = cancelledOrders.length;

        // Orders & revenue by date (last 30 days) - exclude cancelled from revenue
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ordersByDate = {};
        const revenueByDate = {};

        activeOrders.forEach(order => {
            const date = new Date(order.createdAt).toISOString().split('T')[0];
            if(new Date(order.createdAt) >= thirtyDaysAgo) {
                ordersByDate[date] = (ordersByDate[date] || 0) + 1;
                if(order.status === 'Delivered') {
                    revenueByDate[date] = (revenueByDate[date] || 0) + order.amount;
                }
            }
        });

        // Fill in missing dates with 0
        const dateLabels = [];
        const orderCounts = [];
        const revenueCounts = [];
        for(let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dateLabels.push(dateStr);
            orderCounts.push(ordersByDate[dateStr] || 0);
            revenueCounts.push(revenueByDate[dateStr] || 0);
        }

        // Top selling products (by quantity) - only from non-cancelled orders
        const productSales = {};
        activeOrders.forEach(order => {
            order.items.forEach(item => {
                if(item.product) {
                    const name = item.product.name;
                    productSales[name] = (productSales[name] || 0) + item.quantity;
                }
            });
        });

        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const topProductNames = topProducts.map(p => p[0]);
        const topProductQuantities = topProducts.map(p => p[1]);

        res.json({
            success: true,
            data: {
                totalOrders,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                totalProducts,
                avgOrderValue,
                totalCancelled,
                dateLabels,
                orderCounts,
                revenueCounts,
                topProductNames,
                topProductQuantities,
            }
        });
    } catch (error) {
        res.json({success:false, message:error.message});
    }
}

// Cancel Order by Customer: /api/order/cancel
export const cancelOrder = async(req,res)=>{
    try {
        const userId = req.userId;
        const { orderId } = req.body;

        if(!orderId){
            return res.json({success:false, message:"Order ID is required"});
        }

        const order = await Order.findById(orderId);

        if(!order){
            return res.json({success:false, message:"Order not found"});
        }

        // Verify the order belongs to this user
        if(order.userId.toString() !== userId.toString()){
            return res.json({success:false, message:"Unauthorized"});
        }

        // Only allow cancellation before shipping
        const cancellableStatuses = ['Order Placed', 'Packed'];
        if(!cancellableStatuses.includes(order.status)){
            return res.json({success:false, message:`Cannot cancel order. Order is already "${order.status}".`});
        }

        await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' });
        res.json({success:true, message:"Order cancelled successfully"});
    } catch (error) {
        res.json({success:false, message:error.message});
    }
}