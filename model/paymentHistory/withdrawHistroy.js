import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
let withdrawHistory = Schema({
    userId:{ type: String, trim: true },
    type:{type: String, trim: true, default: null},
    destination:{type: String, trim: true, default: null},
    pair: { type: String, trim: true, default: null },
    orderId: { type: String, trim: true, default: null},
    asset: {type: String, trim: true, default: null},
    gmtAmount: { type: Number, trim: true, default: null},
    orderStatus: { type: String, default: "PENDING", enum: ["PENDING", "CANCEL", "COMPLETED"] },
    hash:{ type: String, trim: true, default: null},
    fee: { type: Number, trim: true , default: null},
    slippage: {type: Number, trim: true, default: null},
    totalAmount: { type: Number, default: true , default: null},
    oldCoreBal: { type: Number, default: 0 , default: null},
    status: { type: Boolean, trim: true, default: true },
}, { timestamps: true })
//User.plugin(mongoosePaginate);
export default model('withdrawHistory', withdrawHistory, 'withdrawHistory');