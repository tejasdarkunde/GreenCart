import express from 'express';
import authUser from '../middlewares/authUser.js';
import authSeller from '../middlewares/authSeller.js';
import {
    aiChat,
    smartSearch,
    getRecommendations,
    getSimilarProductsAPI,
    trackInteraction,
    suggestedPrice,
    demandForecast,
    recognizeImage,
    getChatHistory,
    clearChatHistory,
} from '../controllers/aiController.js';

const aiRouter = express.Router();

// --- Customer AI Features ---

// Chatbot
aiRouter.post('/chat', authUser, aiChat);
aiRouter.get('/chat-history', authUser, getChatHistory);
aiRouter.post('/clear-chat', authUser, clearChatHistory);

// Smart Search (no auth required — guests can search too)
aiRouter.post('/smart-search', smartSearch);

// Recommendations (auth required for personalized results)
aiRouter.get('/recommendations', authUser, getRecommendations);

// Similar Products (no auth required)
aiRouter.get('/similar/:productId', getSimilarProductsAPI);

// Track user interaction
aiRouter.post('/track', authUser, trackInteraction);

// Image Recognition (no auth required)
aiRouter.post('/recognize-image', recognizeImage);

// --- Seller AI Features ---

// Suggested pricing (seller only)
aiRouter.get('/suggested-price/:productId', authSeller, suggestedPrice);

// Demand forecast (seller only)
aiRouter.get('/forecast', authSeller, demandForecast);

export default aiRouter;
