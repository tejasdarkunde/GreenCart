import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'user' },
    messages: [{
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        suggestedProducts: [{ type: String, ref: 'product' }],
        timestamp: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

chatHistorySchema.index({ userId: 1 });

const ChatHistory = mongoose.models.chathistory || mongoose.model('chathistory', chatHistorySchema);

export default ChatHistory;
