import { responseHandler } from '../../common/response';
import { __esModule } from '@babel/register/lib/node';
import userModel from '../../model/user/user';
import withdrawModel from '../../model/user/withdraw'
import { verifyJwtToken, verifyQrCode } from '../../common/function';
import oneTimeRewardModel from '../../model/rewards/oneTimeReward';
import monthHistoryModel from '../../model/paymentHistory/monthHistory'
import { host, angular_port } from '../../envirnoment/config'
import twoFA from '../../model/user/gauth';
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

const addWithdrawWallet = async (req, res) => {
    try {
        let userId = await verifyJwtToken(req, res);
        let check_user_exist = await userModel.findOne({ _id: userId })
        if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist")
        const { bnb, usdt, otp } = req.body; // destructuring 
        console.log(">>>>>>=====req", req.body );
        console.log(">>>>!bnb && !usdt || !otp>>=====req", !bnb && !usdt || !otp);
        if (!bnb && !usdt || !otp) {
            return responseHandler(res, 400, "Bad request")
        }
        else if(req.body.bnb != undefined && bnb.substr(0,2) != "0x"){
            return responseHandler(res, 403, "Please Enter only ERC20 completable address for withdrawal");
        }
        else if(req.body.usdt != undefined && usdt.substr(0,2) != "0x"){
            return responseHandler(res, 403, "Please Enter only ERC20 completable address for withdrawal");
        }
        req.body.userId = userId;
        let twoFAObj= await twoFA.findOne({ userId:req.body.userId});
        if (!twoFAObj)  return responseHandler(res, 471, "Enable Two-FA before withdraw.")
        let Verify = await verifyQrCode( req.body.otp, twoFAObj.secretKeyForGAuth)
        if (!Verify)  return responseHandler(res, 481, "Invalid Two-FA Code.")
        const data = await withdrawModel.findOne({ userId: userId });
        if (!data) {
            req.body.bnb = req.body.bnb != undefined ? req.body.bnb : null
            req.body.usdt = req.body.usdt != undefined ? req.body.usdt : null
            await withdrawModel.create(req.body)
            return responseHandler(res, 200, "Your Withdraw address added successfully.");
        }
        else {
            req.body.bnb = req.body.bnb != undefined ? req.body.bnb : data.bnb 
            req.body.usdt = req.body.usdt != undefined ? req.body.usdt : data.usdt  
            await withdrawModel.updateOne({ _id: data._id }, { $set: { bnb:  req.body.bnb, usdt:  req.body.usdt } }) //update the password with new one
            return responseHandler(res, 200, "Your Withdraw address updated successfully.")
        }
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const getWithdrawWallet = async (req, res) => {
    try {
        let userId = await verifyJwtToken(req, res);
        const data = await withdrawModel.findOne({ userId: userId });
        if (!data) {
            return responseHandler(res, 200, "ok", { data: false });
        }
        return responseHandler(res, 200, "ok", data)
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const directIncome = async (req, res) => {
    let userId = await verifyJwtToken(req, res);
    let check_user_exist = await userModel.findOne({ _id: userId })
    if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist");
    let check_history_exist = await oneTimeRewardModel.find({ userId: userId }).sort({ createdAt: -1 });
    if (check_history_exist.length < 1) return responseHandler(res, 461, "No History found");
    return responseHandler(res, 200, "ok", check_history_exist);
}

const monthlyIncome = async (req, res) => {
    let userId = await verifyJwtToken(req, res);
    let check_user_exist = await userModel.findOne({ _id: userId })
    if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist");
    let check_history_exist = await monthHistoryModel.find({ userId: userId }).sort({ createdAt: -1 });
    if (check_history_exist.length < 1) return responseHandler(res, 461, "No History found");
    return responseHandler(res, 200, "ok", check_history_exist);
}

module.exports = {
    addWithdrawWallet: addWithdrawWallet,
    getWithdrawWallet: getWithdrawWallet,
    monthlyIncome: monthlyIncome,
    directIncome: directIncome
}
