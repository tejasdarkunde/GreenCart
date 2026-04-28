import mongoose from "mongoose";

const userInteractionSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'user' },
    productId: { type: String, required: true, ref: 'product' },
    interactionType: { type: String, enum: ['view', 'cart', 'purchase', 'search'], required: true },
}, { timestamps: true });

// Index for efficient querying
userInteractionSchema.index({ userId: 1, productId: 1 });
userInteractionSchema.index({ productId: 1, interactionType: 1 });

const UserInteraction = mongoose.models.userinteraction || mongoose.model('userinteraction', userInteractionSchema);

export default UserInteraction;
