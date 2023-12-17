import userModel from '../../model/user/user'/* To Create user */
import adminModel from '../../model/admin/admin'/* To Create user */
import { __esModule } from '@babel/register/lib/node';
import { responseHandler } from '../../common/response'
import { bcrypt, bcryptVerify, createJwt, sendMail, createJwtAdmin, verifyJwtTokenAdmin, verifyJwtToken } from '../../common/function';
import { host, angular_port } from '../../envirnoment/config';
import walletModel from '../../model/rewards/wallet'
import productModel from '../../model/product/product'/* inventory */
import rewardsModel from '../../model/rewards/rewards';
import withdrawHistoryModel from '../../model/paymentHistory/withdrawHistroy';
import resetTwoFARequestModel from '../../model/admin/twoFaReset';
import twoFA from '../../model/user/gauth';
import constants from '../../common/constants';
import tokenModel from '../../model/commonModel/token';

var randomstring = require("randomstring");
var fs = require('fs');
/* Employee Signup */
const signUp = async (req, res) => {
    const { firstName, lastName, email, password } = req.body; // destructuring 
    // if (!firstName || !lastName || !email || !password) {
    //     return responseHandler(res, 400, "Bad request")
    // }
    // try {
    //     let check_email_exist = await adminModel.findOne({ email: email })
    //     if (check_email_exist) return responseHandler(res, 403, "email already exist")
    //     /* 1: Admin */
    //     req.body.password = await bcrypt(req.body.password)
    //     req.body.status = true;
    //     let result = await adminModel.create(req.body) /* create user object */
    //     /* mail sending process */
    //     return responseHandler(res, 200, "Employee successfully registered.")
    // }
    // catch (e) {
    //     console.log("Error :=>", e)
    //     return responseHandler(res, 500, e)
    // }
}


const signIn = async (req, res) => {
    if (!req.body.email || !req.body.password || !req.body.otp) return responseHandler(res, 400, "Bad Request")
    try {
        var adminData = await adminModel.findOne({ email: req.body.email }, { createdAt: 0, updatedAt: 0, __v: 0 })
        if (!adminData) return responseHandler(res, 404, "User doesn't Exist.")

        const data = await tokenModel.findOne({ userId: adminData._id, type: 'EMAILV' });
        if (!data) return responseHandler(res, 404, "Please enter Token");
        if (data.otp != req.body.otp) return responseHandler(res, 404, "Invalid OTP");
        let verified = await bcryptVerify(req.body.password, adminData.password)
        if (verified == false) return responseHandler(res, 404, "Invalid Password")
        else if (verified == true && adminData.status == true) {
            await tokenModel.deleteMany({ userId: adminData._id, type: 'EMAILV' });
            let admin = await adminModel.findOne({ _id: adminData._id }, { __v: 0, password: 0, createdAt: 0, updatedAt: 0 })
            let token = await createJwtAdmin({adminUniqueId: admin._id})
            return responseHandler(res, 200, "OK", { admin, token })
        }
    }
    catch (e) {
        console.log("error =>", e)
        return responseHandler(res, 500, e)
    }
}


const adminDisplayData = async (req, res) => {
    let users = await userModel.find({ paymentStatus: true })
    var wallet = await walletModel.aggregate([{
        $group: {
            _id: "$id",
            coreWallet: { $sum: "$coreWallet" },
            tradeWallet: { $sum: "$tradeWallet" },
            ecoWallet: { $sum: "$ecoWallet" }
        }
    }]);
    let gmt = 0;
    var productRegular = await productModel.aggregate([
        { $match: { title: { $ne: "MINI PACK" } } },
        {
            $group: {
                _id: "$id",
                totalSellBuy: { $sum: "$price" },
                count: { $sum: 1 }
            }
        }]);
    var productMinipack = await productModel.find({ title: { $eq: "MINI PACK" } });
    let totalMiniPackBuy = productMinipack.length * 50
    var completeRegularPack = await productModel.countDocuments({ productStatus: "Completed", title: { $ne: "MINI PACK" } });
    var completeMiniPack = await productModel.countDocuments({ productStatus: "Completed", title: { $eq: "MINI PACK" } });
    var datetime = new Date();
    const cTime = datetime.toISOString().substr(0, 10)
    let upTime = cTime.concat('T00:00:00Z')
    let DownTime = cTime.concat('T23:59:59Z')
    const withdraw24H = await withdrawHistoryModel.aggregate([{
        $match: { createdAt: { $gte: new Date(upTime), $lt: new Date(DownTime) } }
    },
    {
        $group: {
            _id: "$id",
            gmtAmount: { $sum: "$gmtAmount" },
        }
    }
    ]);
    var newUser = await userModel.countDocuments({createdAt: { $gte: new Date(upTime), $lt: new Date(DownTime)} , paymentStatus:true}); 
    var newProduct = await productModel.countDocuments({createdAt: { $gte: new Date(upTime), $lt: new Date(DownTime)}});
    const withdrawTotal = await withdrawHistoryModel.aggregate([
        { $match: { orderStatus: "COMPLETED" } },
        {
            $group: {
                _id: "$id",
                gmtAmount: { $sum: "$gmtAmount" },
            }
        }
    ]);
    let data = {
        totalUser: users.length,
        coreWallet: wallet[0].coreWallet,
        totalProduct: productMinipack.length + productRegular[0].count,
        gmt: withdraw24H[0] ? withdraw24H[0].gmtAmount : 0,
        totalGmt: withdrawTotal[0].gmtAmount,
        miniPack: productMinipack.length,
        regularPackCount: productRegular[0].count,
        completeRegularPack: completeRegularPack,
        completeMiniPack: completeMiniPack,
        tradeWallet: wallet[0].tradeWallet,
        ecoWallet: wallet[0].ecoWallet,
        totalSellBuy: productRegular[0].totalSellBuy,
        totalMiniPackBuy: totalMiniPackBuy,
        newUser: newUser,
        newProduct:newProduct
    }
    return responseHandler(res, 200, "OK", data);
}


const adminInfo = async (req, res) => {
    try {
        let info = await verifyJwtTokenAdmin(req, res)
        let user = await adminModel.findById({ _id: info }, { __v: 0, password: 0, createdAt: 0, updatedAt: 0 })
        if (user) {
            return responseHandler(res, 200, "OK", user);
        }
        else {
            return responseHandler(res, 400, "User doesn't exist")
        }
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}

/* get all employee data */
const getAllusers = async (req, res) => {
    try {
        let users = await userModel.find({ paymentStatus: true, status: true })
        return responseHandler(res, 200, "OK", users)
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}
const userCount = async (req, res) => {
    try {
        let activeUser = await userModel.countDocuments({ paymentStatus: true, status: true })
        let inactiveUser = await userModel.countDocuments({ paymentStatus: true, status: false })
        return responseHandler(res, 200, "OK", { activeUser: activeUser, inactiveUser: inactiveUser })
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}

const inactiveActiveUsers = async (req, res) => {
    try {
        let users = await userModel.find({ paymentStatus: true, status: false })
        return responseHandler(res, 200, "OK", users)
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}


const todaysUser = async (req, res) => {
    try {
        const cTime = req.body.search
        let upTime = cTime.concat('T00:00:00Z')
        let DownTime = cTime.concat('T23:59:59Z')
        const users = await userModel.find({createdAt: { $gte: upTime, $lt: DownTime}, paymentStatus:true})
        return responseHandler(res, 200, "OK", users)
    }
    catch (e) { console.log("=======>e", e);
     return responseHandler(res, 500, "Internal Server Error.", e) }
}


/* Get User Info after Any changes in user Record And update the local Storage */
const user_isActive = async (req, res) => {
    const { userId } = req.body; // destructuring 
    if (!userId) {
        return responseHandler(res, 400, "Bad request")
    }
    var result = await userModel.findById({ _id: userId }, { __v: 0, password: 0, createdAt: 0, updatedAt: 0 })
    if (!result) return responseHandler(res, 404, "User doesn't Exist.")
    try {
        await userModel.updateOne({ _id: userId }, { status: result.status == 1 ? 0 : 1 });
        await rewardsModel.updateMany({ senderId: userId }, { status: result.status == 1 ? 0 : 1 });
        await rewardsModel.updateMany({ userId: userId }, { status: result.status == 1 ? 0 : 1 });
        if (result.status == 1) {
            await productModel.updateMany({ userId: userId, pendingReward: { $ne: 0 } }, { productStatus: 'Inative' });
        }
        else {
            await productModel.updateMany({ userId: userId, pendingReward: { $ne: 0 } }, { productStatus: 'Active' });
            await productModel.updateMany({ userId: userId, pendingReward: 0 }, { productStatus: 'Completed' });
        }
        return responseHandler(res, 200, "OK");
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}


const userInfo = async (req, res) => {
    const { userId } = req.body; // destructuring 
    try {
        if (!userId) {
            return responseHandler(res, 400, "Bad request")
        }
        var result = await userModel.findById({ _id: userId }, { __v: 0, password: 0, createdAt: 0, updatedAt: 0 })
        if (!result) return responseHandler(res, 404, "User doesn't Exist.")

        return responseHandler(res, 200, "OK", result);
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}

const changeEmail = async (req, res) => {
    const { oldEmail, newEmail } = req.body; // destructuring 
    try {
        if (!oldEmail || !newEmail) {
            return responseHandler(res, 400, "Bad request")
        }
        var oldMailData = await userModel.findOne({ email: oldEmail })
        if (!oldMailData) return responseHandler(res, 404, "Current Email ID doesn't Exist.")
        var newMailData = await userModel.findOne({ email: newEmail })
        if (newMailData) return responseHandler(res, 404, "New Email ID already Exist.")
        let newData = await userModel.findOneAndUpdate({ _id: oldMailData._id }, { email: newEmail })
        return responseHandler(res, 200, "Email updated Successfully !");
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}


/************************ Customer Search  ************ */
const searchCustomer = async (req, res) => {
    const { search } = req.body; // destructuring 
    if (!search) {
        return responseHandler(res, 400, "Bad request")
    }
    var result = await userModel.find({ $and: [{ $or: [{ firstName: new RegExp(search.trim()) }, { lastName: new RegExp(search.trim()) }, { username: new RegExp(search.trim()) }, { email: new RegExp(search.trim()) }, { userId: new RegExp(search.trim()) }] }, { roleId: 3 }] }).sort({ createdAt: -1 });
    try {
        let info = await verifyJwtTokenAdmin(req, res)
        let user = await userModel.findById({ _id: info }, { __v: 0, password: 0, createdAt: 0, updatedAt: 0 })
        if (user.roleId != 1 && user.roleId != 2 && user.roleId != 4)
            return responseHandler(res, 400, "Bad Request")
        if (result.length < 1) return responseHandler(res, 404, "No record found.")
        else
            return responseHandler(res, 200, "Ok", result)
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}
/************************  Search  user ************ */
const searchUser = async (req, res) => {
    const { search } = req.body; // destructuring 
    if (!search) {
        return responseHandler(res, 400, "Bad request")
    }
    var result = await userModel.find({ $and: [{ $or: [{ firstName: new RegExp(search.trim()) }, { lastName: new RegExp(search.trim()) }, { username: new RegExp(search.trim()) }, { email: new RegExp(search.trim()) }] }] }).sort({ createdAt: -1 });
    try {
        if (result.length < 1) {
            return responseHandler(res, 404, "No record found.")
        }
        else
            return responseHandler(res, 200, "Ok", result)
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}

const reset2faRequestList = async (req, res) => {
    try {
        let resetUserData = await resetTwoFARequestModel.find({ status: req.body.status });
        if (resetUserData.length < 1) {
            return responseHandler(res, 404, "No record found.")
        }
        else {
            return responseHandler(res, 200, "OK", resetUserData);
        }
    }
    catch (e) {
        return responseHandler(res, 500, e)
    }
}

const resetTwoFa = async (req, res) => {
    const { userId, action } = req.body
    try {
        let resetUserData = await resetTwoFARequestModel.findOne({ userId: userId });
        if (!resetUserData) {
            return responseHandler(res, 404, "No record found.")
        }
        else {
            let status = action == 1 ? "ACCEPTED" : "REJECTED"
            await resetTwoFARequestModel.findOneAndUpdate({ userId: userId }, { status: status })
            if (action == 1) {
                await twoFA.deleteOne({ userId: userId })
                await userModel.updateOne({ _id: userId }, { twoFaStatus: false })
            }
            const link = twoFA_Reset_HTML(resetUserData.username, status)
            sendMail(resetUserData.email, "[Growmaxx] Security update", null, link)
            return responseHandler(res, 200, "OK")
        }
    }
    catch (e) {
        return responseHandler(res, 500, e)
    }
}


const sentOtp = async (req, res) => {
    try {
        const otp = Math.floor(100000 + Math.random() * 900000);
        var result = await adminModel.findOne({ email: constants.EMAIL }, { __v: 0, password: 0, createdAt: 0, updatedAt: 0 }).sort({ createdAt: -1 })
        if (!result) return responseHandler(res, 404, "User doesn't Exist.")
        await tokenModel.deleteMany({ userId: result._id, type: 'EMAILV' });
        const token = await createJwtAdmin({adminUniqueId: result._id}); /* generate jwt */
        await tokenModel.create({ userId: result._id, token: token, otp: otp, type: "EMAILV" })/* Save Token to user Corresponding  */
        const link = '<html lang="en"><head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title></title></head><body style="margin: 0; background: #ccc;"> <center class="wrapper" style="width: 100%; background: #ccc; table-layout: fixed; padding-bottom: 60px;"> <table style="border-spacing: 0; background-color: #f4f4f4; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: sans-serif; color: #313131; padding: 41px 45px;" class="main" width="100%"> <tr> <td style="padding: 0;"> <table style="border-spacing: 0;" width="100%"> <tr> <td style="text-align: center;"> <a href="#"><img style="border: 0;" src="https://growmaxxdashboard.com/assets/images/logo.svg" alt="Logo" title="Logo" width="160px"></a> </td></tr></table> </td></tr><tr> <td style="padding: 0;">          <table style="border-spacing: 0; margin-top: 45px; margin-bottom: 40px;" width="100%" class="content-box"> <tr> <td style="background-color: #FFF; padding: 42px 33px; border-radius: 19px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;"> <table> <tr align="center"> <td align="center" style="display: flex; align-items: center; justify-content: center; width: 100%;"> <img style="border: 0; margin-bottom: 35px;" src="https://i.ibb.co/sWGPxwg/img.png" alt="Envelop" title="envelop"> </td></tr><tr> <td> <p style="text-align: center; font-size: 16px; line-height: 38px; font-weight: 500; color: #868686; margin: 0;">Welcome to Growmaxx</p></td></tr><tr> <td> <h3 style="text-align: center; font-size: 30px; color: #313131; font-weight: 800; margin: 0;">Hello User!</h3>' +
            '</td></tr><tr> <td style="width: 100%; display: flex; align-items: center; justify-content: center; margin-bottom: 30px;"> <p style="font-size: 14px; line-height: 19px; color: #B5B5B5; margin: 0; width: 85%; margin-top: 10px;"> Please verify log in access of the Growwmaxx.</p></td></tr><tr align="center"> <td align="center" style="display: flex; justify-content: center;"> <table align="center"> <tr align="center"> <td style="padding: 16px 56px; background: #F06D39; margin-top: 40px; border-radius: 10px; max-width: 350px; width: fit-content;"> <div style="color: #FFF; font-size: 23px; line-height: 29px; font-weight: 800; text-decoration: none; ">' + otp + '</div> </td></tr></table> </td></tr><tr> <td style="width: 100%; display: flex; align-items: center; justify-content: center;"> <p style="font-size: 12px; line-height: 19px; color: #B5B5B5; width: 85%; margin-top: 30px; text-align: center;"> Not the right person to receive these updates? Forward this email to a colleague to <a href="#" target="_blank" style="font-size: 12px; line-height: 19px; color: #B5B5B5; text-decoration: none;"> sign up</a> for Notification.</p></td></tr></table> </td></tr></table> </td></tr><tr> <td style="padding: 0;">' +
            '<p style="font-size: 12px; color: #B5B5B5; text-align: center; margin-bottom: 0;"></p></td></tr><tr> <td style="padding: 0;"> <p style="font-size: 12px; color: #B5B5B5; text-align: center; margin-bottom: 0; margin-top: 4px;"> <a href="#" style="font-size: 12px; color: #B5B5B5; text-align: center; text-decoration: none;">Unsubscribe</a> | <a href="#" target="_blank" style="font-size: 12px; color: #B5B5B5; text-align: center; text-decoration: none;">Manage Preferences</a></p></td></tr><tr> <td style="padding: 0;"> <p style="font-size: 12px; line-height: 21px; text-align: center; margin: 15px 0 0; color: #B5B5B5;"> Copyright © 2023 Growmaxx, All rights reserved.</p></td></tr></table> </center> </body></html>';
        sendMail(result.email, "[Growmaxx] Veifying login OTP for admin " + " " + new Date() + "", "", link) /* verification mail send */
        return responseHandler(res, 200, "Veifying login OTP for admin.")
    }
    catch (e) {
        return responseHandler(res, 500, e)
    }
}

const verifyToken = async (req, res) => {
    try {
        return responseHandler(res, 200, "Ok")
    }
    catch (e) {
        return responseHandler(res, 500, e)
    }
}

const twoFA_Reset_HTML = (username, status) => {
    let link = '<html> <body> <div bgcolor="#f3f3f3" style="background-color:#f3f3f3"> <table width="650" bgcolor="#ffffff" border="0" align="center" cellpadding="0" cellspacing="0" style="color:#000;font-family:Lato,Helvetica Neue,Helvetica,Arial,sans-serif;"> <tbody> <tr> <td height="30" bgcolor="#f3f3f3"></td></tr><tr> <td height="102" align="center" style="border-bottom:1px solid #eaeaea;"> <img src="https://growmaxxprofits.com/wp-content/uploads/2023/01/FLG.svg" style="width:100px" alt="Growmaxx" title="Growmaxx" style="display:block" class="CToWUd"> </td></tr><tr> <td valign="top"> <table width="100%" border="0" cellpadding="30" cellspacing="0" style="font-size:14px"> <tbody> <tr> <td> <div> <p style="font-size:16px">Dear ' + username + ',</p><div style="color:#333;font-size:14px"> <p style="color:#333">Two Factor Authentication Reset request ' + status + '!.</p> <br><p>The Growmaxx Team </p></div></div></td></tr></tbody> </table> </td></tr><tr> <td height="40" align="center" valign="bottom" style="font-size:12px;color:#999"> © 2023 -Growmaxx. All Rights Reserved. </td></tr><tr> <td height="30"></td></tr><tr> <td height="30" bgcolor="#f3f3f3"></td></tr></tbody> </table> </div></body></html>';
    return link;
}



module.exports = {
    userIsActive: user_isActive,
    signUp: signUp,
    getAllusers: getAllusers,
    searchCustomer: searchCustomer,
    searchUser: searchUser,
    signIn: signIn,
    adminDisplayData: adminDisplayData,
    userInfo: userInfo,
    adminInfo: adminInfo,
    userCount: userCount,
    inactiveActiveUsers: inactiveActiveUsers,
    changeEmail: changeEmail,
    reset2faRequestList: reset2faRequestList,
    resetTwoFa: resetTwoFa,
    sentOtp: sentOtp,
    verifyToken: verifyToken,
    todaysUser: todaysUser,
};
