import { Schema, model } from 'mongoose';
let product = Schema({ 
    userId: { type: String, required: "UserId is Required." },
    title: { type: String, trim: true },
    price: { type: Number, trim: true },
    roi: { type: Number, trim: true},
    monthlyReward: { type: Number, trim: true, default:0},
    dailyReward: { type: Number, trim: true, default:0},
    directReward: { type: Number, trim: true, default:0},
    totalRewards: { type: Number, trim: true },
    claimedPassiveRewards:{type: Number, trim: true, default:0},
    claimedCommunityRewards:{type: Number, trim: true, default:0},
    pendingReward : {type: Number, trim: true, default:0},
    extraReward : {type: Number, trim: true, default:0},
    rewardDistrubtionTime:{type: Date, default: null},
    status: { type: Boolean, default: true },
    isActive:{ type: Boolean, default: true },
    productStatus:{ type: String, trim: true },
}, { timestamps: true })
//User.plugin(mongoosePaginate);
export default model('product', product, 'product');
