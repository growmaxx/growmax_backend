import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
let deposit = Schema({
    address: { type: String, trim: true },
    status: { type: Boolean, default: true },
}, { timestamps: true })
//User.plugin(mongoosePaginate); 
export default model('deposit', deposit, 'deposit');

