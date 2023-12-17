import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
let coreHistory = Schema({
    userId:{ type: String, trim: true },
    sender:{type: String, trim: true},
    senderId:{type: String, trim: true},
    receiverId:{type: String, trim: true},
    receiver:{type: String, trim: true},
    transferType: { type: String, trim: true },
    transfer: {type: String, enum: ["SENDER", "RECEIVER", "INTERNAL"]},
    asset: {type: String, trim: true},
    gmt: { type: Number, trim: true},
    orderStatus: { type: String, default: "COMPLETED", enum: ["COMPLETED", "PENDING"] },
    orderId: {type: String, trim: true},
    status: { type: Boolean, trim: true },
}, { timestamps: true })
//User.plugin(mongoosePaginate);
export default model('coreHistory', coreHistory, 'coreHistory');