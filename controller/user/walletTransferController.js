import { responseHandler } from '../../common/response';
import { __esModule } from '@babel/register/lib/node';
import productModel from '../../model/product/product'/* inventory */
import userModel from '../../model/user/user';
import rewardsModel from '../../model/rewards/rewards';
import passiveRewardModel from '../../model/rewards/passive';
import communityRewardModel from '../../model/rewards/community';
import walletModel from '../../model/rewards/wallet';
import coreHistoryModel from '../../model/paymentHistory/coreHistroy';
import monthHistoryModel from '../../model/paymentHistory/monthHistory';
import { sendMail, verifyJwtToken } from '../../common/function';
import { host, angular_port } from '../../envirnoment/config'
/***************** Create Order by User ******************/
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

const coreToEco = async (req, res) => {
    try {
        if (!req.body.amount) {
            return responseHandler(res, 400, "Bad request");
        }
        // else if(!check_user_exist.twoFaStatus){
        //     return responseHandler(res, 463, "Please Enable Two-Factor-Authentication before transfer GMT")
        // }
        let userId = await verifyJwtToken(req, res);
        let check_user_exist = await userModel.findOne({ _id: userId })
        if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist")
        const data = await walletModel.findOne({ userId: userId });
        if (req.body.amount < 0) {
            return responseHandler(res, 406, "Invalid amount");
        }
        if (data.coreWallet < req.body.amount) {
            return responseHandler(res, 406, "Don't have sufficient balance in core wallet");
        }
        const coreWallet = data.coreWallet - req.body.amount;
        const ecoWallet = data.ecoWallet + req.body.amount;
        await walletModel.findOneAndUpdate({ _id: data._id }, { ecoWallet: ecoWallet, coreWallet: coreWallet })
        let histroy = {
            userId: userId,
            sender: check_user_exist.username,
            receiverId: userId,
            receiver: check_user_exist.username,
            transferType: "Core-To-Eco",
            transfer: "INTERNAL",
            asset: "GMT",
            gmt: req.body.amount,
            orderStatus: "COMPLETED",
            status: true
        }
        await coreHistoryModel.create(histroy);
        const link = await trade_HTML(histroy)
        sendMail(check_user_exist.email, "[Growmaxx] Core-To-Eco Transfer update ", "", link) /* Core-To-Eco mail send */
        return responseHandler(res, 200, "OK", data);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const coreWalletBalance = async (req, res) => {
    try {
        let userId = await verifyJwtToken(req, res);
        const data = await walletModel.findOne({ userId: userId });
        if (!data) {
            return responseHandler(res, 200, { coreWalletBalance: 0 });
        }
        return responseHandler(res, 200, "OK", { coreWalletBalance: data.tradeWallet });
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

//monthly reward

// async function monthlyRewardBooster() {
//     console.log("monthly Reward start");
//     var datetime = new Date();
//     const wallet = await walletModel.find();
//     for await (const data of wallet) {
//         let monthBal = data.coreWallet - data.ecoWallet;
//         let query = { $inc: { tradeWallet: monthBal, ecoWallet: monthBal } }
//         let record = {
//             userId: data.userId,
//             month: "Dec-2023",
//             reward: data.ecoWallet,
//             status: true
//         }
//         await monthHistoryModel.create(record)
//     }
// }


async function rewardBooster() {
    console.log("start");
    const products = await productModel.find({ productStatus: "Active" });
    var datetime = new Date();
    // var hourlyTime = new Date((datetime).setHours((datetime).getHours() + 1));
    let count = 0
    for await (const data of products) {
        let query = {};
        let pendingRewards;
        var timeTest = await checkPassiveReward(data.userId, data._id, data.createdAt);
        console.log("timeTest.updatedAt <= datetime", timeTest.updatedAt <= datetime, data._id);
        if (timeTest.updatedAt <= datetime) {
            if (data.dailyReward < data.pendingReward && data.pendingReward > 0) {
                pendingRewards = data.pendingReward - data.dailyReward;
                query = { $inc: { claimedPassiveRewards: data.dailyReward, pendingReward: -(data.dailyReward) } }
            }
            else if (data.dailyReward == data.pendingReward && data.pendingReward > 0) {
                query = { $set: { productStatus: "Completed", pendingReward: 0 }, $inc: { claimedPassiveRewards: data.dailyReward } }
                pendingRewards = 0
            }
            // extra
            else if (data.dailyReward > data.pendingReward && data.pendingReward) {
                const extraRewards = data.dailyReward - data.pendingReward;
                const newReward = data.dailyReward - parseFloat(extraRewards);
                query = { $set: { pendingReward: 0, productStatus: "Completed", extraReward: extraRewards }, $inc: { claimedPassiveRewards: newReward } }
                data.dailyReward = newReward
                pendingRewards = 0;
            }
            const updateProduct = await productModel.updateOne({ _id: data._id, productStatus: "Active" }, query)
            if (updateProduct) {
                await walletModel.updateOne({ userId: data.userId }, { $inc: { coreWallet: data.dailyReward } });
                await passiveEntry(data.userId, data.title, data._id, data.price, data.roi, data.dailyReward, pendingRewards, data.totalRewards);
            }
            const rewards = await rewardsModel.find({ productId: data._id, isActive: true, status: true })
            if (rewards.length > 0) {
                const cTime = datetime.toISOString().substr(0, 10);
                for (const reward of rewards) {
                    let activePackage = await productModel.find({ productStatus: "Active", userId: reward.userId, createdAt: { $lt: cTime } });
                    var comReward = (reward.rewardPoint / activePackage.length).toFixed(12);
                    for await (const element of activePackage) {
                        let comQuery = {};
                        let walletQuery = {};
                        if (parseFloat(comReward) < element.pendingReward && element.pendingReward > 0 && element.productStatus == "Active") {
                            comQuery = { $inc: { claimedCommunityRewards: comReward, pendingReward: -(comReward) }, $set: { productStatus: "Active" } };
                            walletQuery = { $inc: { coreWallet: comReward } };
                        }
                        else if (parseFloat(comReward) == element.pendingReward && element.pendingReward > 0 && element.productStatus == "Active") {
                            comQuery = { $inc: { claimedCommunityRewards: comReward }, $set: { productStatus: "Completed", pendingReward: 0 } };
                            walletQuery = { $inc: { coreWallet: comReward } };
                        }
                        else if (parseFloat(comReward) > element.pendingReward && element.pendingReward > 0 && element.productStatus == "Active") {
                            const extraRewards = parseFloat(comReward) - element.pendingReward;
                            const newReward = parseFloat(comReward) - parseFloat(extraRewards);
                            comQuery = { $inc: { claimedCommunityRewards: newReward }, $set: { productStatus: "Completed", pendingReward: 0, extraRewards: extraRewards } }
                            walletQuery = { $inc: { coreWallet: newReward } };
                        }
                        const comRewards = await productModel.updateOne({ _id: element._id, productStatus: "Active" }, comQuery)
                        if (comRewards) {
                            await walletModel.updateOne({ userId: element.userId }, walletQuery);
                            await communityEntry(reward.userId, reward.username, reward.senderId, reward.senderUsername, element.roi, reward._id, element._id, element.title, comReward, reward.rewardPoint, "1/" + activePackage.length, reward.senderCreatedAt);
                        }
                    }
                }
            }
        }
        count++;
        console.log(">>>>>>>count", count)
    }
  setTimeout(rewardBooster, 90000);
}

async function passiveEntry(userId, packages, packageId, price, roi, dailyReward, pendingReward, totalRewards) {
    let passive = {
        userId: userId,
        package: packages,
        packageId: packageId,
        price: price,
        roi: roi,
        reward: dailyReward,
        pendingReward: pendingReward,
        totalReward: totalRewards
    }
    console.log("=========>>>>passive", passive);
    await passiveRewardModel.create(passive);
}

async function communityEntry(userId, username, senderId, senderUsername, roi, rewardId, packageId, packages, comReward, rewards, ratio, senderCreatedAt) {
    let community = {
        userId: userId,
        username: username,
        senderId: senderId,
        senderUsername: senderUsername,
        roi: roi,
        rewardId: rewardId,
        packageId: packageId,
        package: packages,
        reward: comReward,
        rewards: rewards,
        ratio: ratio,
        senderCreatedAt: senderCreatedAt
    }
    console.log("=========>>>>>comm", community);
    await communityRewardModel.create(community);
}

async function checkPassiveReward(userId, packageId, createdAt) {
    const updatedTime = createdAt.toISOString().substr(11, 13);
    var passiveIncome = await passiveRewardModel.findOne({ userId: userId, packageId: packageId }).sort({ updatedAt: -1 });
    // console.log("passiveIncome>>>>>", passiveIncome);
    if (passiveIncome) {
        const pTime = passiveIncome.updatedAt.toISOString().substr(0, 11)
        let upTime = pTime.concat(updatedTime)
        var updatedTimeDate = new Date(upTime);
        let updatedDate = new Date((updatedTimeDate).setHours((updatedTimeDate).getHours() + 24));
        await productModel.updateOne({ _id: packageId }, { $set: { rewardDistrubtionTime: updatedDate } });
        return { updatedAt: updatedDate };;
    }
    else {
        let createdDateOfProduct = new Date((createdAt).setHours(createdAt.getHours() + 24));
        await productModel.updateOne({ _id: packageId }, { $set: { rewardDistrubtionTime: createdDateOfProduct } });
        return { updatedAt: createdDateOfProduct };
    }
}


const coreHistory = async (req, res) => {
    let userId = await verifyJwtToken(req, res);
    let check_user_exist = await userModel.findOne({ _id: userId })
    if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist");
    let check_history_exist = await coreHistoryModel.find({ userId: userId }).sort({ createdAt: -1 });
    if (check_history_exist.length < 1) return responseHandler(res, 461, "No History found");
    return responseHandler(res, 200, "ok", check_history_exist);
}

rewardBooster();
// async function checkCommunityReward(userId, rewardId, packageId, createdAt) {
//     var communityIncome = await communityRewardModel.findOne({ userId: userId, rewardId: rewardId, packageId: packageId }).sort({ updatedAt: -1 });
//     const updatedTime = createdAt.toISOString().substr(11, 13)
//     if (communityIncome) {
//         const cTime = communityIncome.updatedAt.toISOString().substr(0, 11)
//         let upTime = cTime.concat(updatedTime)
//         var updatedTimeDate = new Date(upTime);
//         let updatedDate = new Date((updatedTimeDate).setHours((updatedTimeDate).getHours() + 24));
//         return { updatedAt: updatedDate };
//     }
//     else {
//         let createdDateOfProduct = new Date((createdAt).setHours(createdAt.getHours() + 24));
//         return { updatedAt: createdDateOfProduct };
//     }
// }

// while(1){
//      rewardBooster();
// }
//l( rewardBooster, 12000);
//setInterval(rewardBooster, 3600000);
//monthlyRewardBooster();
const trade_HTML = (data) => {
    let link = '<html> <body> <div bgcolor="#f3f3f3" style="background-color:#f3f3f3"> <table width="650" bgcolor="#ffffff" border="0" align="center" cellpadding="0" cellspacing="0" style="color:#000;font-family:Lato,Helvetica Neue,Helvetica,Arial,sans-serif;"> <tbody> <tr> <td height="30" bgcolor="#f3f3f3"></td></tr><tr> <td height="102" align="center" style="border-bottom:1px solid #eaeaea;"> <img src="https://growmaxxprofits.com/wp-content/uploads/2023/01/FLG.svg" style="width:100px" alt="Growmaxx" title="Growmaxx" style="display:block" class="CToWUd"> </td></tr><tr> <td valign="top"> <table width="100%" border="0" cellpadding="30" cellspacing="0" style="font-size:14px"> <tbody> <tr> <td> <div> <p style="font-size:16px">Dear ' + data.sender + ',</p><div style="color:#333;font-size:14px"> <p style="color:#333">Confirmation mail for trade on Growmaxx. </p><table><tr><td>Transfer Type:</td><td style="font-weight:600;">' + data.transferType + '</td></tr><tr><td> GMT Quantity :</td><td style="font-weight:600;">' + data.gmt + '</td></tr><tr><td>Transfer Way:</td><td style="font-weight:600;">' + data.transfer + '</td></tr><tr><td>Status:</td><td style="font-weight:600;">' + data.orderStatus + '</td></tr></table><br><p>The Growmaxx Team </p></div></div></td></tr></tbody> </table> </td></tr><tr> <td height="40" align="center" valign="bottom" style="font-size:12px;color:#999"> © 2023 -Growmaxx. All Rights Reserved. </td></tr><tr> <td height="30"></td></tr><tr> <td height="30" bgcolor="#f3f3f3"></td></tr></tbody> </table> </div></body></html>';
    return link;
}

const tradeCore_HTML = (data) => {
    let link = '<html> <body> <div bgcolor="#f3f3f3" style="background-color:#f3f3f3"> <table width="650" bgcolor="#ffffff" border="0" align="center" cellpadding="0" cellspacing="0" style="color:#000;font-family:Lato,Helvetica Neue,Helvetica,Arial,sans-serif;"> <tbody> <tr> <td height="30" bgcolor="#f3f3f3"></td></tr><tr> <td height="102" align="center" style="border-bottom:1px solid #eaeaea;"> <img src="https://growmaxxprofits.com/wp-content/uploads/2023/01/FLG.svg" style="width:100px" alt="Growmaxx" title="Growmaxx" style="display:block" class="CToWUd"> </td></tr><tr> <td valign="top"> <table width="100%" border="0" cellpadding="30" cellspacing="0" style="font-size:14px"> <tbody> <tr> <td> <div> <p style="font-size:16px">Dear ' + data.sender + ',</p><div style="color:#333;font-size:14px"> <p style="color:#333">Confirmation mail for trade on Growmaxx. </p><table><tr><td>Transfer Type:</td><td style="font-weight:600;">' + data.transferType + '</td></tr><tr><td>Sender :</td><td style="font-weight:600;"> ' + data.sender + '</td></tr><tr><td>Receiver :</td><td style="font-weight:600;"> ' + data.receiver + '</td></tr><tr><td>GMT Quantity:</td><td style="font-weight:600;"> ' + data.gmt + '</td></tr><tr><td>You are :</td><td style="font-weight:600;">' + data.transfer + '</td></tr><tr><td>Status:</td><td style="font-weight:600;">' + data.orderStatus + '</td></tr></table><br><p>The Growmaxx Team </p></div></div></td></tr></tbody> </table> </td></tr><tr> <td height="40" align="center" valign="bottom" style="font-size:12px;color:#999"> © 2023 -Growmaxx. All Rights Reserved. </td></tr><tr> <td height="30"></td></tr><tr> <td height="30" bgcolor="#f3f3f3"></td></tr></tbody> </table> </div></body></html>';
    return link;
}
const tradeCoreReciver_HTML = (data) => {
    let link = '<html> <body> <div bgcolor="#f3f3f3" style="background-color:#f3f3f3"> <table width="650" bgcolor="#ffffff" border="0" align="center" cellpadding="0" cellspacing="0" style="color:#000;font-family:Lato,Helvetica Neue,Helvetica,Arial,sans-serif;"> <tbody> <tr> <td height="30" bgcolor="#f3f3f3"></td></tr><tr> <td height="102" align="center" style="border-bottom:1px solid #eaeaea;"> <img src="https://growmaxxprofits.com/wp-content/uploads/2023/01/FLG.svg" style="width:100px" alt="Growmaxx" title="Growmaxx" style="display:block" class="CToWUd"> </td></tr><tr> <td valign="top"> <table width="100%" border="0" cellpadding="30" cellspacing="0" style="font-size:14px"> <tbody> <tr> <td> <div> <p style="font-size:16px">Dear ' + data.receiver + ',</p><div style="color:#333;font-size:14px"> <p style="color:#333">Confirmation mail for trade on Growmaxx. </p><table><tr><td>Transfer Type:</td><td style="font-weight:600;">' + data.transferType + '</td></tr><tr><td>Sender :</td><td style="font-weight:600;"> ' + data.sender + '</td></tr><tr><td>Receiver :</td><td style="font-weight:600;"> ' + data.receiver + '</td></tr><tr><td>GMT Quantity:</td><td style="font-weight:600;"> ' + data.gmt + '</td></tr><tr><td>You are :</td><td style="font-weight:600;">' + data.transfer + '</td></tr><tr><td>Status:</td><td style="font-weight:600;">' + data.orderStatus + '</td></tr></table><br><p>The Growmaxx Team </p></div></div></td></tr></tbody> </table> </td></tr><tr> <td height="40" align="center" valign="bottom" style="font-size:12px;color:#999"> © 2023 -Growmaxx. All Rights Reserved. </td></tr><tr> <td height="30"></td></tr><tr> <td height="30" bgcolor="#f3f3f3"></td></tr></tbody> </table> </div></body></html>';
    return link;
}
module.exports = {
    coreWalletBalance: coreWalletBalance,
    rewardBooster: rewardBooster,
    coreHistory: coreHistory
}