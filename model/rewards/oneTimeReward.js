import { Schema, model } from 'mongoose';
let oneTimeReward = Schema({ 
    userId: { type: String, required: "UserId is Required." },
    username: { type: String, trim: true },
    senderId:{type: String, trim: true },
    senderUsername:{type: String, trim: true },
    rewardPoint: { type: Number, trim: true },
    productId:{type: String, trim: true },
    rewardDistrubtionTime:{type: Date, default: null},
    price:{type: Number, default: 0},
    senderCreatedAt:{type: Date},
    status: { type: String, default: true }
}, { timestamps: true })
//User.plugin(mongoosePaginate);
export default model('oneTimeReward', oneTimeReward, 'oneTimeReward');