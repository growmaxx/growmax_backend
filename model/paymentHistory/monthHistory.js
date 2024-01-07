import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
let monthHistory = Schema({
    userId:{ type: String, trim: true },
    month:{type: String, trim: true},
    reward: { type: Number, trim: true },
    status: { type: Boolean, default: true },
}, { timestamps: true })
//User.plugin(mongoosePaginate);
export default model('monthHistory', monthHistory, 'monthHistory');
