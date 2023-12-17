import { Schema, model } from 'mongoose';

let business = Schema({ 
    userId: { type: Schema.Types.ObjectId, unique: true, required: "UserId is Required." },
    totalbusiness:{type: Number, trim: true},
    businessIn24h:{type: Number, trim: true},
    rank: { type: String, default: true },
    upComingRank: { type: String, default: true },
    rankBusiness: { type: Number, trim: true}
}, { timestamps: true })
//User.plugin(mongoosePaginate);
export default model('business', business, 'business');
