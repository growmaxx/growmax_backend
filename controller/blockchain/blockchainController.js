import { responseHandler } from '../../common/response';
import { __esModule } from '@babel/register/lib/node';
import userModel from '../../model/user/user';
import walletModel from '../../model/rewards/wallet';
import withdrawModel from '../../model/user/withdraw';
import productModel from '../../model/product/product'/* inventory */
import withdrawHistoryModel from '../../model/paymentHistory/withdrawHistroy';
import withdrawSplitHistoryModel from '../../model/paymentHistory/withdrawSplitHistrory'
import { verifyJwtToken, sendMail, verifyQrCode } from '../../common/function';
import tokenModel from '../../model/commonModel/token';
import { createAccount, transferAdmin, transferBNB, getUsdtBalance, transferMatic, transferUsdt, getBalance, approve, transferFrom, transferMaticByRelay, getBalanceUser } from '../../common/blockchain';
import addressModel from '../../model/user/address';
import axios from 'axios';
import { USDT_WITHDRAW_FEE, BNB_WITHDRAW_FEE, GMT_RECEIVER, RELAY_OUTPUT } from '../../envirnoment/config'
import twoFA from '../../model/user/gauth';
import coreHistoryModel from '../../model/paymentHistory/coreHistroy'
/***************** Create Withdraw by User ******************/

import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;
const transferFund = async (req, res) => {
    try {
        if (!req.body.coin || !req.body.gmt) {
            return responseHandler(res, 400, "Bad request");
        }
        const gmtTxId = Date.now();
        let userId = await verifyJwtToken(req, res);
        req.body.userId = userId;
        if (req.body.coin == 'BNB') {
            return responseHandler(res, 471, "BNB withdrawal has been suspended temporarily !.")
        }
        let twoFAObj = await twoFA.findOne({ userId: req.body.userId });
        if (!twoFAObj) return responseHandler(res, 471, "Enable Two-FA before withdraw.")
        let Verify = await verifyQrCode(req.body.otp, twoFAObj.secretKeyForGAuth)
        if (!Verify) return responseHandler(res, 481, "Invalid Two-FA Code.");
        const mailOtp = await tokenModel.findOne({ userId: req.body.userId, type: 'WITHDRV' });
        if (!mailOtp) return responseHandler(res, 404, "Please enter Token");
        if (mailOtp.otp != req.body.mailOtp) return responseHandler(res, 404, "Invalid OTP");
        let check_user_exist = await userModel.findOne({ _id: userId, status: true, paymentStatus: true })
        if (!check_user_exist) return responseHandler(res, 461, "User doesn't exit")
        //if (check_user_exist) return responseHandler(res, 461, "Withdraw In maintenance")
        const checkbalance = await coreWalletBalance(userId); // core wallet current balance
        if (checkbalance == -1) {
            await userModel.findOneAndUpdate({ _id: userId }, { $set: { status: true } })
            return responseHandler(res, 461, "Your account is blocked! Please contact to admin!")
        }
        console.log("=========>>>>>checkbalance", checkbalance);
        if (checkbalance < req.body.gmt) {
            return responseHandler(res, 403, "You don't have sufficient fund for withdraw");
        }
        const wallet = await withdrawModel.findOne({ userId: userId });
        if (req.body.coin == 'BNB' && (wallet.bnb == null || wallet.bnb == undefined)) {
            return responseHandler(res, 403, "Please set your withdraw BNB address before withdraw");
        }
        else if (req.body.coin == 'USDT' && (wallet.usdt == null || wallet.usdt == undefined)) {
            return responseHandler(res, 403, "Please set your withdraw USDT address before withdraw");
        }
        else if (wallet.bnb.substr(0, 2) != "0x" || wallet.usdt.substr(0, 2) != "0x") {
            return responseHandler(res, 403, "Please Enter only ERC20 completable address for withdrawal");
        }
        // Price calculation in  USD
        const bitcoinObject = await livePrice(req.body.coin)
        var fee = req.body.coin == 'BNB' ? BNB_WITHDRAW_FEE : USDT_WITHDRAW_FEE;
        const amount = (((req.body.gmt - (req.body.gmt * 1 / 100)) / bitcoinObject).toFixed(4)) - fee // Amount calculator 
        const relayAmount = (req.body.gmt * 1 / 100) / bitcoinObject;
        // checking balance bnb
        var coinBalance = await getBalance();
        var coinUsdtBalance = await getUsdtBalance();
        if (parseFloat(coinUsdtBalance) < (amount + relayAmount) || parseFloat(coinBalance) < 0.01) {
            return responseHandler(res, 403, "Something went wrong !! Please Try after sometime");
        }
        var walletAddress = req.body.coin == 'BNB'? wallet.bnb : wallet.usdt;

        // update core wallet balance
        const coreWallet = checkbalance - req.body.gmt;
        let coreHistroy = {
            userId: userId,
            sender: check_user_exist.username,
            receiverId: userId,
            receiver: check_user_exist.username,
            transferType: "Withdrawal",
            transfer: "INTERNAL",
            asset: "GMT",
            gmt: req.body.gmt,
            orderStatus: "PENDING",
            orderId: gmtTxId,
            status: true
        }
        console.log("coreHistroy>>>>>", coreHistroy);
        await coreHistoryModel.create(coreHistroy);
        const updateWallet = await walletModel.findOneAndUpdate({ userId: userId }, { $set: { tradeWallet: coreWallet } })
        // create history
        const createOrder = {
            userId: userId,
            type: "WITHDRAW",
            destination: walletAddress,
            gmtAmount: req.body.gmt,
            orderId: gmtTxId,
            status: true,
            pair: "GMT - " + req.body.coin,
            orderStatus: "PENDING",
            fee: fee,
            asset: req.body.coin,
            slippage: relayAmount,
            oldCoreBal: checkbalance,
            totalAmount: amount
        }
        await withdrawHistoryModel.create(createOrder)
        const withdrwTime = await withdrawHistoryModel.findOne({ orderId: gmtTxId })
        if (withdrwTime.oldCoreBal == updateWallet.coreWallet) {
            // Withdraw coin process
            var coinTransfer
            if (req.body.coin == 'BNB') {
                coinTransfer = await transferBNB(wallet.bnb, amount)
                await withdrawDeatils(userId, 'WITHDRAW', req.body.coin, amount, wallet.bnb, coinTransfer.hash, gmtTxId, 0)
            }
            else {
                coinTransfer = await transferUsdt(wallet.usdt, amount)
                console.log(">>>>>>coinTransfer", coinTransfer);
                await withdrawDeatils(userId, 'WITHDRAW', req.body.coin, amount, wallet.usdt, coinTransfer.hash, gmtTxId, 0)
            }
            // req.body.coin == 'BNB' ? await transferBNB(RELAY_OUTPUT, relayAmount.toFixed(5)) : await transferMatic(RELAY_OUTPUT, relayAmount.toFixed(5))
            await withdrawHistoryModel.updateOne({ orderId: gmtTxId }, { $set: { orderStatus: "COMPLETED",  hash: coinTransfer.hash} })
            await coreHistoryModel.updateOne({ orderId: gmtTxId }, { $set: { orderStatus: "COMPLETED"} })
            const link =  withdraw_HTML(createOrder,  coinTransfer.hash, check_user_exist.username)
            sendMail(check_user_exist.email, "[Growmaxx] Withdrawal update ", "", link) /* Withdraw mail send */    
            return responseHandler(res, 200, "Withdrawal Request Successful");
        }
        else {
            await withdrawHistoryModel.deleteOne({ orderId: gmtTxId })
            return responseHandler(res, 200, "Withdrawal Request Successfully");
        }
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}


const transferFund2 = async (req, res) => {
    try {
        if (!req.body.coin || !req.body.gmt) {
            return responseHandler(res, 400, "Bad request");
        }
        const gmtTxId = Date.now();
        let userId = await verifyJwtToken(req, res);
        req.body.userId = userId;
        if (req.body.coin == 'BNB') {
            return responseHandler(res, 471, "BNB withdrawal has been suspended temporarily !.")
        }
        let check_user_exist = await userModel.findOne({ _id: userId, status: true, paymentStatus: true })
        if (!check_user_exist) return responseHandler(res, 461, "User doesn't exit")
        //if (check_user_exist) return responseHandler(res, 461, "Withdraw In maintenance")
        const checkbalance = await coreWalletBalance(userId); // core wallet current balance
        if (checkbalance == -1) {
            await userModel.findOneAndUpdate({ _id: userId }, { $set: { status: true } })
            return responseHandler(res, 461, "Your account is blocked! Please contact to admin!")
        }
        console.log("=========>>>>>checkbalance", checkbalance);
        if (checkbalance < req.body.gmt) {
            return responseHandler(res, 403, "You don't have sufficient fund for withdraw");
        }
        const wallet = await withdrawModel.findOne({ userId: userId });
        if (req.body.coin == 'BNB' && (wallet.bnb == null || wallet.bnb == undefined)) {
            return responseHandler(res, 403, "Please set your withdraw BNB address before withdraw");
        }
        else if (req.body.coin == 'USDT' && (wallet.usdt == null || wallet.usdt == undefined)) {
            return responseHandler(res, 403, "Please set your withdraw USDT address before withdraw");
        }
        else if (wallet.bnb.substr(0, 2) != "0x" || wallet.usdt.substr(0, 2) != "0x") {
            return responseHandler(res, 403, "Please Enter only ERC20 completable address for withdrawal");
        }
        // Price calculation in  USD
        const bitcoinObject = await livePrice(req.body.coin)
        var fee = req.body.coin == 'BNB' ? BNB_WITHDRAW_FEE : USDT_WITHDRAW_FEE;
        const amount = (((req.body.gmt - (req.body.gmt * 1 / 100)) / bitcoinObject).toFixed(4)) - fee // Amount calculator 
        const relayAmount = (req.body.gmt * 1 / 100) / bitcoinObject;
       
        var walletAddress = req.body.coin == 'BNB'? wallet.bnb : wallet.usdt;

        // update core wallet balance
        const coreWallet = checkbalance - req.body.gmt;
        let coreHistroy = {
            userId: userId,
            sender: check_user_exist.username,
            receiverId: userId,
            receiver: check_user_exist.username,
            transferType: "Withdrawal",
            transfer: "INTERNAL",
            asset: "GMT",
            gmt: req.body.gmt,
            orderStatus: "PENDING",
            orderId: gmtTxId,
            status: true
        }
        console.log("coreHistroy>>>>>", coreHistroy);
        await coreHistoryModel.create(coreHistroy);
        const updateWallet = await walletModel.findOneAndUpdate({ userId: userId }, { $set: { tradeWallet: coreWallet } })
        // create history
        const createOrder = {
            userId: userId,
            type: "WITHDRAW",
            destination: walletAddress,
            gmtAmount: req.body.gmt,
            orderId: gmtTxId,
            status: true,
            pair: "GMT - " + req.body.coin,
            orderStatus: "PENDING",
            fee: fee,
            asset: req.body.coin,
            slippage: relayAmount,
            oldCoreBal: checkbalance,
            totalAmount: amount
        }
        await withdrawHistoryModel.create(createOrder)
        const withdrwTime = await withdrawHistoryModel.findOne({ orderId: gmtTxId })
        if (withdrwTime.oldCoreBal == updateWallet.coreWallet) {
            // req.body.coin == 'BNB' ? await transferBNB(RELAY_OUTPUT, relayAmount.toFixed(5)) : await transferMatic(RELAY_OUTPUT, relayAmount.toFixed(5))
            await withdrawHistoryModel.updateOne({ orderId: gmtTxId }, { $set: { orderStatus: "COMPLETED",  hash: coinTransfer.hash} })
            await coreHistoryModel.updateOne({ orderId: gmtTxId }, { $set: { orderStatus: "COMPLETED"} })
            const link =  withdraw_HTML(createOrder,  coinTransfer.hash, check_user_exist.username)
            sendMail(check_user_exist.email, "[Growmaxx] Withdrawal update ", "", link) /* Withdraw mail send */    
            return responseHandler(res, 200, "Withdrawal Request Successful");
        }
        else {
            await withdrawHistoryModel.deleteOne({ orderId: gmtTxId })
            return responseHandler(res, 200, "Withdrawal Request Successfully");
        }
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const verifyAccount = async (req, res) => {
    try {
        let userId = await verifyJwtToken(req, res);
        let check_user_exist = await userModel.findOne({ _id: userId })
        if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist")
        const userAddress = await account(userId); // User Address 
        const maticLivePrice = await livePrice('MATIC')
        const matic = 1 / maticLivePrice
        const userTxFee = await transferMaticByRelay(userAddress.address, matic)
        console.log(">>>>>>>>userTxFee", userTxFee);
        if (userTxFee.hash) {
            const data = await withdrawModel.findOneAndUpdate({ userId: userId }, { $set: { feeStatus: true } })
            console.log(">>>>>data", data);
            return responseHandler(res, 200, "Your Growmaxx account validated on Blockchain");
        }
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

async function withdrawDeatils(userId, type, asset, amount, destination, txId, orderId, step) {
    const withdrawHistory = {
        userId,
        type,
        asset,
        amount,
        destination,
        txId,
        orderId
    }
    await withdrawSplitHistoryModel.create(withdrawHistory) /* create Withdraw Coin history object */
    await withdrawHistoryModel.findOneAndUpdate({ orderId: orderId }, { $set: { step: step } })
    return;
}

async function livePrice(coin) {
    const options = {
        method: 'GET',
        url: coin == 'BNB' ? 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd' : 'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd'
    };
    const result = await axios(options);
    var dataString = JSON.stringify(result.data);
    var dataJSON = JSON.parse(dataString);
    var bitcoinObject = coin == 'BNB' ? dataJSON["binancecoin"].usd : 1;
    return bitcoinObject
}

async function checkApproval(userId, userAddress, corebalance, gmt) {
    console.log(">>>>>>>checkApproval corebalance", corebalance);
    console.log("userAddress.approveAmount>>>>>>", userAddress.approveAmount);
    if (userAddress.approveAmount == 0) {
        const approveEpd = corebalance - gmt;
        // const corebalance = corebalance
        const approval = await approve(userAddress.privatekey, corebalance);
        console.log("checkApproval>>>>>>", approval);
        if (approval) {
            await addressModel.findOneAndUpdate({ userId: userId }, { $set: { approveAmount: corebalance, approveExpend: approveEpd } })
            return;
        }
    }
    else if (userAddress.approveAmount != 0 && userAddress.approveExpend < gmt) {
        const approveAmt = corebalance + userAddress.approveAmount;
        const approveExpend = (corebalance + userAddress.approveExpend) - gmt;
        console.log(">>>>>>>>approveAmt", approveAmt);
        console.log(">>>>>>>>approveExpend", approveExpend);
        const approval = await approve(userAddress.privatekey, approveAmt);
        if (approval) {
            await addressModel.findOneAndUpdate({ userId: userId }, { $set: { approveAmount: approveAmt, approveExpend: approveExpend } })
            return;
        }
    }
    else {
        const approveExpend = userAddress.approveExpend - gmt;
        await addressModel.findOneAndUpdate({ userId: userId }, { $set: { approveExpend: approveExpend } })
        return;
    }
}

async function coreWalletBalance(userId) {
    try {
        var product = await productModel.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: "$id",
                    pending: { $sum: "$pendingReward" },
                    totalReward: { $sum: "$totalRewards" },
                }
            }]);
        let pending = product[0] ? (product[0].totalReward - product[0].pending) : 0
        let pendingGmt = parseFloat(pending.toFixed(2))
        console.log("pendingGmt====>", pendingGmt);
        const data = await walletModel.findOne({ userId: userId });
        const coreBal = parseFloat(data.tradeWallet.toFixed(2))
        if (!data) {
            return responseHandler(res, 200, { coreWalletBalance: 0 });
        }
        else if (pendingGmt >= coreBal) {
            return data.coreWallet;
        }
        else {
            return -1;
        }

    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}



async function account(userId) {
    const address = await addressModel.findOne({ userId: userId })
    if (address) return address;
    const data = await createAccount();
    const userAddress = {
        userId: userId,
        address: data.address,
        chainCode: data.chainCode,
        publickey: data.publicKey,
        mnemonic: data.mnemonic,
        fingerprint: data.fingerprint,
        parentFingerprint: data.parentFingerprint,
        privatekey: data.privatekey,
        approveAmount: 0,
        approveExpend: 0,
        status: true,
        isActive: true
    }
    await addressModel.create(userAddress);
    return userAddress;
}

const feeCalculator = async (req, res) => {
    try {
        const options = {
            method: 'GET',
            url: 'https://api.coingecko.com/api/v3/simple/price?ids=binance-coin-wormhole&vs_currencies=usd'
        };
        const result = await axios(options);
        var dataString = JSON.stringify(result.data);
        var dataJSON = JSON.parse(dataString);
        var bnbCost = dataJSON["binance-coin-wormhole"].usd
        const usdtFee = USDT_WITHDRAW_FEE
        const bnbFee = BNB_WITHDRAW_FEE
        const feeData = {
            bnbCost: bnbCost,
            usdtCost: 1,
            usdtFee: usdtFee,
            bnbFee: bnbFee
        }
        return responseHandler(res, 200, "OK", feeData);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const withdrawHistory = async (req, res) => {
    let userId = await verifyJwtToken(req, res);
    let check_user_exist = await userModel.findOne({ _id: userId })
    if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist");
    let check_history_exist = await withdrawHistoryModel.find({ userId: userId }).sort({ createdAt: -1 });
    if (check_history_exist.length < 1) return responseHandler(res, 461, "No History found");
    return responseHandler(res, 200, "ok", check_history_exist);
}

const withdrawHistoryDetails = async (req, res) => {
    if (!req.body.orderId) {
        return responseHandler(res, 400, "Bad request");
    }
    let userId = await verifyJwtToken(req, res);
    let check_user_exist = await userModel.findOne({ _id: userId })
    if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist");
    let check_history_exist = await withdrawSplitHistoryModel.find({ orderId: req.body.orderId });
    if (!check_history_exist) return responseHandler(res, 461, "No History found");
    return responseHandler(res, 200, "ok", check_history_exist);
}

// async function tokenTransfer() {
//     let check_history_exist = await withdrawHistoryModel.find({ step: 0 });
//     check_history_exist.forEach(async element => {
//         const userAddress = await account(element.userId); // User Address 
//         var userBalance = await getBalanceUser(userAddress.address); // your blockchain balance
//         console.log(">>>>>>>>userBalance", userBalance);
//         console.log(">>>>>>>>parseFloat(userBalance) < 0", parseFloat(userBalance) < 0);
//         if (parseFloat(userBalance) < 0) {
//             return responseHandler(res, 403, "We are working on your Growmaxx account setup. Please try to withdraw after 10 mins");
//         }
//         // approval setup 
//         await checkApproval(userId, userAddress, checkbalance, element.gmtAmount);
//         //GMT transfer relay to user
//         const transferGmtToUser = await transferAdmin(userAddress.address, element.gmtAmount)
//         await withdrawDeatils(userId, 'DEPOSIT', 'GMT', element.gmtAmount, userAddress.address, transferGmtToUser.hash, gmtTxId, 1)
//         //GMT transfer User to Relay
//         const transferUserToAdmin = await transferFrom(userAddress.address, GMT_RECEIVER, element.gmtAmount)
//         await withdrawDeatils(userId, 'WITHDRAW', 'GMT', element.gmtAmount, GMT_RECEIVER, transferUserToAdmin.hash, element.gmtTxId, 2)
//     });
// }

const pendingPayment = async (req, res) => {
    try {
        const { orderId } = req.body
        var withdrawData = await withdrawHistoryModel.findOne({ _id: orderId }).sort({ createdAt: -1 });
        const wallet = await withdrawModel.findOne({ userId: withdrawData.userId });
        const address = withdrawData.asset == 'BNB' ? wallet.bnb : wallet.usdt
        if (address.substr(0, 2) != "0x") {
            return responseHandler(res, 403, "Withdraw wallet is not  ERC20 completable address");
        }
        const coinTransfer = withdrawData.asset == 'BNB' ? await transferBNB(wallet.bnb, withdrawData.totalAmount) : await transferUsdt(wallet.usdt, withdrawData.totalAmount)
        await withdrawHistoryModel.updateOne({ orderId: withdrawData.orderId }, { $set: { orderStatus: "COMPLETED", destination: address } })
        await coreHistoryModel.updateOne({ orderId: withdrawData.orderId }, { $set: { orderStatus: "COMPLETED" } })
        return responseHandler(res, 200, "OK");
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const localTransfer = async (req, res) => {
    try {
        var fee = req.body.coin == 'BNB' ? BNB_WITHDRAW_FEE : USDT_WITHDRAW_FEE;
        const amount = (((req.body.gmt - (req.body.gmt * 1 / 100)) / bitcoinObject).toFixed(4)) - fee // Amount calculator 
        const address = withdrawData.asset == 'BNB' ? wallet.bnb : wallet.usdt
        if (address.substr(0, 2) != "0x") {
            return responseHandler(res, 403, "Withdraw wallet is not  ERC20 completable address");
        }
        const coinTransfer = withdrawData.asset == 'BNB' ? await transferBNB(wallet.bnb, withdrawData.totalAmount) : await transferUsdt(wallet.usdt, withdrawData.totalAmount)
        await withdrawHistoryModel.updateOne({ orderId: withdrawData.orderId }, { $set: { orderStatus: "COMPLETED", destination: address } })
        await coreHistoryModel.updateOne({ orderId: withdrawData.orderId }, { $set: { orderStatus: "COMPLETED" } })
        return responseHandler(res, 200, "OK");
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}
const withdraw_HTML = (data, coinTransfer, username) => {
    let link = '<html> <body> <div bgcolor="#f3f3f3" style="background-color:#f3f3f3"> <table width="650" bgcolor="#ffffff" border="0" align="center" cellpadding="0" cellspacing="0" style="color:#000;font-family:Lato,Helvetica Neue,Helvetica,Arial,sans-serif;"> <tbody> <tr> <td height="30" bgcolor="#f3f3f3"></td></tr><tr> <td height="102" align="center" style="border-bottom:1px solid #eaeaea;"> <img src="https://growmaxxprofits.com/wp-content/uploads/2023/01/FLG.svg" style="width:100px" alt="Growmaxx" title="Growmaxx" style="display:block" class="CToWUd"> </td></tr><tr> <td valign="top"> <table width="100%" border="0" cellpadding="30" cellspacing="0" style="font-size:14px"> <tbody> <tr> <td> <div> <p style="font-size:16px">Dear ' + username + ',</p><div style="color:#333;font-size:14px"> <p style="color:#333">Confirmation mail for Withdrawal on Growmaxx. </p><table><tr><td>Transfer Type:</td><td style="font-weight:600;">' + data.type + '</td></tr><tr><td>Order Id :</td><td style="font-weight:600;"> ' + data.orderId + '</td></tr><tr><td>Amount :</td><td style="font-weight:600;"> ' + data.totalAmount + '  ' + data.asset + '</td></tr><tr><td>GMT :</td><td style="font-weight:600;"> ' + data.gmtAmount + '</td></tr><tr><td>Pair :</td><td style="font-weight:600;">' + data.pair + '</td></tr><tr><td>Status:</td><td style="font-weight:600;">' + data.orderStatus + '</td></tr><tr><td>Destination Address:</td><td style="font-weight:600;">' + data.destination + '</td></tr><tr><td>Tx Hash:</td><td style="font-weight:600;">' + coinTransfer + '</td></tr></table><br><p>The Growmaxx Team </p></div></div></td></tr></tbody> </table> </td></tr><tr> <td height="40" align="center" valign="bottom" style="font-size:12px;color:#999"> © 2023 -Growmaxx. All Rights Reserved. </td></tr><tr> <td height="30"></td></tr><tr> <td height="30" bgcolor="#f3f3f3"></td></tr></tbody> </table> </div></body></html>';
    return link;
}


module.exports = {
    transferFund: transferFund,
    feeCalculator: feeCalculator,
    withdrawHistory: withdrawHistory,
    withdrawHistoryDetails: withdrawHistoryDetails,
    verifyAccount: verifyAccount,
    pendingPayment: pendingPayment,
    localTransfer: localTransfer
}

//Chandra633
//Sanju58
//{userId:"65433f4f52cce2fcc09d968c"}