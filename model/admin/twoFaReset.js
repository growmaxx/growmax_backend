import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
let resetTwoFARequest = Schema({
    email: {type: String, trim: true},
    userId: { type: Schema.Types.ObjectId, trim: true },
    username:{type: String, trim: true},
    attempt:{type: Number, trim: true},
    status:{type: String, trim: true},
}, { timestamps: true })
//User.plugin(mongoosePaginate);
export default model('resetTwoFARequest', resetTwoFARequest, 'resetTwoFARequest');