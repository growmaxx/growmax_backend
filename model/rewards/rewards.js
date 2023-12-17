import { Schema, model } from 'mongoose';
let rewards = Schema({ 
    userId: { type: String, required: "UserId is Required." },
    username: { type: String, trim: true },
    directLeg: { type: Number, trim: true },
    senderId:{type: String, trim: true },
    senderUsername:{type: String, trim: true },
    direct:{ type: Boolean, default: true },
    level: { type: Number, trim: true},
    rewardPoint: { type: String, trim: true },
    monthlyRewardPoint: { type: String, trim: true },
    productId:{type: String, trim: true },
    rewardPersentage:{type: String, trim: true},
    activePackage:{type: Number, trim: true},
    requiredLevel:{type: Number, trim: true},
    rewardDistrubtionTime:{type: Date, default: null},
    price:{type: Number, default: 0},
    senderCreatedAt:{type: Date},
    status: { type: Boolean, default: true },
    isActive:{ type: Boolean, default: true }
}, { timestamps: true })
//User.plugin(mongoosePaginate);
export default model('rewards', rewards, 'rewards');
