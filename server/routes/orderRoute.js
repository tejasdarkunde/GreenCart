import express from 'express';
import authUser from '../middlewares/authUser.js';
import { getAllOrders, getDashboardData, getUserOrders, markCODPaid, placeOrderCOD, placeOrderStripe, updateOrderStatus, cancelOrder } from '../controllers/orderController.js';
import authSeller from '../middlewares/authSeller.js';

const orderRouter = express.Router();

orderRouter.post('/cod',authUser, placeOrderCOD)
orderRouter.get('/user',authUser, getUserOrders)
orderRouter.get('/seller',authSeller, getAllOrders)
orderRouter.post('/stripe',authUser, placeOrderStripe)
orderRouter.get('/dashboard', authSeller, getDashboardData)
orderRouter.post('/status', authSeller, updateOrderStatus)
orderRouter.post('/mark-paid', authSeller, markCODPaid)
orderRouter.post('/cancel', authUser, cancelOrder)


export default orderRouter;


