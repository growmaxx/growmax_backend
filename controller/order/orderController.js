import { responseHandler } from '../../common/response';
import { __esModule } from '@babel/register/lib/node';
import productModel from '../../model/product/product'/* inventory */
import packagesModel from '../../model/package/package'/* inventory */
import userModel from '../../model/user/user';
import paymentHistoryModel from '../../model/paymentHistory/paymentHistory';
import communityRewardsModel from '../../model/rewards/communityRewards';
import rewardsModel from '../../model/rewards/rewards';
import levelModel from '../../model/rewards/level';
import passiveRewardModel from '../../model/rewards/passive';
import communityRewardModel from '../../model/rewards/community';
import oneTomeRewardModel from '../../model/rewards/oneTimeReward';
import walletModel from '../../model/rewards/wallet';
import businessModel from '../../model/rewards/business'
import tokenModel from '../../model/commonModel/token';
import { host, angular_port } from '../../envirnoment/config'
import coreHistoryModel from '../../model/paymentHistory/coreHistroy'
import { getTxHash, getTx } from '../../common/blockchain';
import { sendMail, createJwt, tenMinutesJwt, verifyJwtTokenPay, verifyEmail, bcrypt, bcryptVerify, verifyJwtToken } from '../../common/function';
// import user from '../../model/User/user.js';
// import { angular_host, angular_port } from '../../enviornment/config';
/***************** Create Order by User ******************/
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

const createInitialOrder = async (req, res) => { 
    const { blockHash, blockNumber, from, to, amount, paymentType, paymentMethod, packageName, paymentCoin } = req.body; // destructuring
    if (!blockHash || !blockNumber || !from || !to || !amount || !paymentType || !paymentMethod || !packageName || !paymentCoin) {
        return responseHandler(res, 400, "Bad request")
    }
    try {  
        let getTxhistory = await getTxHash(blockHash);
        let getTxData = await getTx(getTxhistory);
        let blockAmt =  parseInt(getTxData.value)
        if(amount != blockAmt) {
            return responseHandler(res, 406, "Something went wrong ! If your amount is deducted then  please contact to admin !!")
        }
        let paymentHashExist = await paymentHistoryModel.findOne({blockHash:blockHash})
        if(paymentHashExist){
            return responseHandler(res, 406, "Something went wrong ! If your amount is deducted then  please contact to admin !!")
        }
        let check_user_exist = await userModel.findOne({ email: req.user })
        if (!check_user_exist) return responseHandler(res, 406, "User doesn't exist")
        if (!check_user_exist.emailVerified) {
            return responseHandler(res, 406, "Please verify your email Id")
        }
        if (check_user_exist.paymentStatus) {
            return responseHandler(res, 406, "You already having inital package")
        }
        const packages = await packagesModel.findOne({ name: packageName, price:amount});
        if (!packages) return responseHandler(res, 406, "Package doesn't exist")
        const totalRewards = amount * 3
        req.body.monthlyReward = (amount * packages.roi) / 100;
        req.body.dailyReward = (amount * packages.roi) / 3000;
        req.body.userId = check_user_exist._id;
        const data = { userId: check_user_exist._id, title: packageName, price: amount, roi: packages.roi, monthlyReward: req.body.monthlyReward, dailyReward: req.body.dailyReward, totalRewards: totalRewards, productStatus: "Active", pendingReward: totalRewards }
        const product = await productModel.create(data) /* create purchased product object */
        req.body.to  = "0x665f698af48a1ae6954322cdd9a7fdb34bfbaacb"
        await paymentHistoryModel.create(req.body) /* create payment history object */
        await userModel.findByIdAndUpdate({ _id: check_user_exist._id }, { $set: { paymentStatus: true } }) //update the paymentStatus with new one
        if (check_user_exist.username != "growmaxxfinance") {
            await rewardDistribution(check_user_exist._id, check_user_exist.username, check_user_exist.referralCode, amount, packages.roi, check_user_exist.createdAt, product._id);
        }
        const link = order_HTML(data);
        sendMail(check_user_exist.email, "[Growmaxx Finance] Package successfully added ", "", link) /* Order mail send */
        let token = await createJwt({userUniqueId: check_user_exist._id, userUniqueEmail: check_user_exist.email})    
        return responseHandler(res, 200, "Course successfully added in your account", token)
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}


const createOrder = async (req, res) => {
    let userId = await verifyJwtToken(req, res);
    const { blockHash, blockNumber, from, to, amount, paymentType, paymentMethod, packageName, paymentCoin } = req.body; // destructuring
    if (!blockHash || !blockNumber || !from || !to || !amount || !paymentType || !paymentMethod || !packageName || !paymentCoin) {
        return responseHandler(res, 400, "Bad request")
    }
    let paymentHashExist = await paymentHistoryModel.findOne({blockHash:blockHash})
    if(paymentHashExist){
        return responseHandler(res, 406, "Something went wrong ! If your amount is deducted then  please contact to admin !!")
    }
    try { 
        let getTxhistory = await getTxHash(blockHash);
        let getTxData = await getTx(getTxhistory);
        let blockAmt =  parseInt(getTxData.value)
        if(amount != blockAmt) {
            return responseHandler(res, 406, "Something went wrong ! If your amount is deducted then  please contact to admin !!")
        }
        let check_user_exist = await userModel.findOne({ _id: userId })
        if (!check_user_exist) return responseHandler(res, 406, "User doesn't exist")
        if (!check_user_exist.paymentStatus) {
            return responseHandler(res, 406, "Please Buy before rebuy the package")
        }
        let paymentHashExist = await paymentHistoryModel.findOne({blockHash:blockHash})
        if(paymentHashExist){
            return responseHandler(res, 406, "Something went wrong ! If your amount is deducted then  please contact to admin !!")
        }
        const packages = await packagesModel.findOne({ name: packageName, price:amount });
        if (!packages) return responseHandler(res, 406, "Package doesn't exist")
        const totalRewards = amount * 3
        req.body.monthlyReward = (amount * packages.roi) / 100;
        req.body.dailyReward = (amount * packages.roi) / 3000;
        req.body.userId = check_user_exist._id;
        const data = { userId: check_user_exist._id, title: packageName, price: amount, roi: packages.roi, monthlyReward: req.body.monthlyReward, totalRewards: totalRewards, productStatus: "Active", pendingReward: totalRewards }
        const product = await productModel.create(data) /* create purchased product object */
        req.body.to  = getTxData.recipient
        await paymentHistoryModel.create(req.body) /* create payment history object */
        await userModel.findByIdAndUpdate({ _id: check_user_exist._id }, { $set: { paymentStatus: true } }) //update the paymentStatus with new one
        if (check_user_exist.username != "growmaxxfinance") {
            await rewardDistribution(check_user_exist._id, check_user_exist.username, check_user_exist.referralCode, amount, packages.roi, check_user_exist.createdAt, product._id);
        }
        const link = order_HTML(data);
        sendMail(check_user_exist.email, "[Growmaxx Finance] Package successfully added ", "", link) /* Order mail send */
        return responseHandler(res, 200, "Package successfully added in your account")
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}


 //const createOrder = async (req, res) => {
    // let data = ["Ichigo01", "Ragnor", "Radhe108", "Pushkar80", "Grow2025", "Chandani29", "Mayank2016", "Balaji2023", "Amit@", "chandra633", "Aayansh", "sheetal"]
    // for (let index = 0; index < data.length; index++) {
    //      let userData = await userModel.findOne({username:data[index]})
    //      console.log("===>user", userData._id, userData.username);
    //      await productModel.updateMany({userId:userData._id},{productStatus:"Completed", pendingReward:0})
    //      await walletModel.updateOne({userId: userData._id}, {coreWallet:0})
    //      console.log("=======> index", index);
    // }
//     // let userId = await verifyJwtToken(req, res); // user having issue then execute it
//     const { blockHash, blockNumber, from, to, amount, paymentType, paymentMethod, packageName, paymentCoin } = req.body; // destructuring
//     if (!blockHash || !blockNumber || !from || !to || !amount || !paymentType || !paymentMethod || !packageName || !paymentCoin) {
//         return responseHandler(res, 400, "Bad request")
//     }
//     let paymentHashExist = await paymentHistoryModel.findOne({blockHash:blockHash})
//     if(paymentHashExist){
//         return responseHandler(res, 406, "Something went wrong ! If your amount is deducted then  please contact to admin !!")
//     }
//     try {
//         // let getTxhistory = await getTxHash(blockHash);
//         // let getTxData = await getTx(getTxhistory);
//         // let blockAmt =  parseInt(getTxData.value)
//         // if(amount != blockAmt) {
//         //     return responseHandler(res, 406, "Something went wrong ! If your amount is deducted then  please contact to admin !!")
//         // }
//         let check_user_exist = await userModel.findOne({ _id: "653ccc54b12654a292f991c5" })
//         if (!check_user_exist) return responseHandler(res, 406, "User doesn't exist")
//         if (!check_user_exist.paymentStatus) {
//             return responseHandler(res, 406, "Please Buy before rebuy the package")
//         }
//         // let paymentHashExist = await paymentHistoryModel.findOne({blockHash:blockHash})
//         // if(paymentHashExist){
//         //     return responseHandler(res, 406, "Something went wrong ! If your amount is deducted then  please contact to admin !!")
//         // }
//         let amount = 299;
//         const packages = await packagesModel.findOne({ name: "Medium", price:299 });
//         console.log("====>packages", packages);
//         // if (!packages) return responseHandler(res, 406, "Package doesn't exist")
//         // const totalRewards = amount * 3
//         // req.body.dailyReward = (amount * packages.roi) / 100;
//         // req.body.userId = check_user_exist._id;
//         // const data = { userId: check_user_exist._id, title: packageName, price: amount, roi: packages.roi, dailyReward: req.body.dailyReward, totalRewards: totalRewards, productStatus: "Active", pendingReward: totalRewards }
//         // const product = await productModel.create(data) /* create purchased product object */
//         // req.body.to  = getTxData.recipient
//         // await paymentHistoryModel.create(req.body) /* create payment history object */
//       //  await userModel.findByIdAndUpdate({ _id: check_user_exist._id }, { $set: { paymentStatus: true } }) //update the paymentStatus with new one
//         if (check_user_exist.username != "growmaxx") {
//             await rewardDistribution(check_user_exist._id, check_user_exist.username, check_user_exist.referralCode, amount, packages.roi, check_user_exist.createdAt, "653ceff6b12654a292f99d79");
//         }
//         // const link = order_HTML(data);
//         // sendMail(check_user_exist.email, "[Growmaxx] Package successfully added ", "", link) /* Order mail send */
//         return responseHandler(res, 200, "Course successfully added in your account")
//     }
//     catch (e) {
//         console.log("Error :=>", e)
//         return responseHandler(res, 500, e)
//     }
//}

const miniOrder = async (req, res) => {
    let userId = await verifyJwtToken(req, res);
    try {
        let check_user_exist = await userModel.findOne({ _id: userId })
        if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist")
        const packages = await packagesModel.findOne({ name: "MINI PACK" });
        if (!packages) return responseHandler(res, 461, "Package doesn't exist")
        const totalRewards = parseInt(packages.price) * 3
        req.body.monthlyReward = (amount * packages.roi) / 100;
        req.body.dailyReward = (amount * packages.roi) / 3000;
        var walletData = await walletModel.findOne({ userId: check_user_exist._id });
        let coreWallet = !walletData ? 0 : walletData.coreWallet;
        const ecoWallet = !walletData ? 0 : walletData.ecoWallet;
        const tradeWallet = !walletData ? 0 : walletData.tradeWallet;
        if (coreWallet < 500) {
            return responseHandler(res, 461, "Don't have sufficient balance for Mini Pack")
        }
        const data = { userId: check_user_exist._id, title: packages.name, price: packages.price, roi: packages.roi, dailyReward: req.body.dailyReward, totalRewards: totalRewards, productStatus: "Active", pendingReward: totalRewards };
        const product = await productModel.create(data) /* create purchased product object */

        await walletModel.findOneAndUpdate({ userId: check_user_exist._id }, { $set: { coreWallet: (coreWallet - 500), ecoWallet: ecoWallet, tradeWallet: tradeWallet } })
        
        if (check_user_exist.username != "Growmaxxfinance") {
            await rewardDistribution(check_user_exist._id, check_user_exist.username, check_user_exist.referralCode, packages.price, packages.roi, check_user_exist.createdAt, product._id);
        }
        const link = order_HTML(data);
        sendMail(check_user_exist.email, "[Growmaxx Finance] Mini Package successfully added " + " " + new Date() + "", "", link) /* Order mail send */
        let coreHistroy = {
            userId: userId,
            sender: check_user_exist.username,
            receiverId: userId,
            receiver: check_user_exist.username,
            transferType: "Mini Pack",
            transfer: "INTERNAL",
            asset: "GMT",
            gmt: 500,
            orderStatus: "COMPLETED",
            status: true
        }
        await coreHistoryModel.create(coreHistroy);
        return responseHandler(res, 200, "Course successfully added in your account")
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}


const getOrder = async (req, res) => {
    let userId = await verifyJwtToken(req, res);
    try {
        let check_user_exist = await userModel.findOne({ _id: userId });
        if (!check_user_exist) return responseHandler(res, 406, "User doesn't exist");
        const data = await productModel.find({ userId: userId }).sort({ createdAt: -1 });
        if (!data) return responseHandler(res, 406, "No course found");

        return responseHandler(res, 200, "OK", data);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const paymentHistory = async (req, res) => {
    let userId = await verifyJwtToken(req, res);
    try {
        const check_user_exist = await userModel.findOne({ _id: userId });
        if (!check_user_exist) return responseHandler(res, 406, "User doesn't exist");
        const data = await paymentHistoryModel.find({ userId: userId }).sort({ createdAt: -1 });
        if (!data) return responseHandler(res, 406, "No histroy found");
        return responseHandler(res, 200, "OK", data);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const rewardDistribution = async (userId, username, referralCode, price, roi, createdAt, productId, res) => {
    const parent = await userModel.findOne({ username: referralCode }); // parent data
    const parentData = await communityRewardsModel.findOne({ userId: parent._id }); // parent community  data
    const userChain = await communityRewardsModel.findOne({ userId: userId }); // user data
    if (!userChain && !parentData) {
        await communityRewardsModel.create({ userId, username, parentsDetails: { userId: parent._id, username: parent.username } })
        await rewardCounter(userId, username, price, roi, createdAt, parent._id, parent.username, 0, productId)

    }
    else if (!userChain && parentData) {
        var parentsDetail = parentData.parentsDetails.length > 11 ? ((parentData.parentsDetails).slice(0, 31)) : parentData.parentsDetails
        parentsDetail = [{ userId: parent._id, username: parent.username }, ...parentsDetail];
        await communityRewardsModel.create({ userId, username, parentsDetails: parentsDetail })
        for (let index = 0; index < parentsDetail.length; index++) {
            await rewardCounter(userId, username, price, roi, createdAt, parentsDetail[index].userId, parentsDetail[index].username, index, productId)
            //await rewardCounter(userId, username, price, roi, createdAt, parent._id,  parent.username, index)
        }
    }
    else if (userChain && !parentData) {
        parentsDetail = { userId: parent._id, username: parent.username }
        await communityRewardsModel.create({ userId, username, parentsDetails: parentsDetail })
        await rewardCounter(userId, username, price, roi, createdAt, parent._id, parent.username, 0, productId)
        //await rewardCounter(userId, username, price, roi, createdAt, parent._id,  parent.username, index)
    }
    else {
        var parentsDetail = parentData.parentsDetails.length > 11 ? ((parentData.parentsDetails).slice(0, 31)) : parentData.parentsDetails
        parentsDetail = [{ userId: parent._id, username: parent.username }, ...parentsDetail];
        for (let index = 0; index < parentsDetail.length; index++) {
            await rewardCounter(userId, username, price, roi, createdAt, parentsDetail[index].userId, parentsDetail[index].username, index, productId)
        }
    }
    await updateRewardNLeg();
}


const rewardCounter = async (userId, username, price, roi, createdAt, parentId, parentUsername, index, productId, res) => {
    try {
        const parentReward = await rewardsModel.findOne({ username: parentUsername }).sort({ createdAt: -1 }); // parent data
        var product = await productModel.find({ userId: parentId, isActive: true, productStatus: "Active" })
        let level;
        let directLeg;
        let rewardPoint;
        let rewardPersentage;
        let totalbusiness;
        let direct = false;
        let isActive = false;
        let monthlyRewardPoint;
        let requiredLevel;
        if (index + 1 == 1) {
            const legVerify = await rewardsModel.findOne({ username: parentUsername, senderId: userId });
            directLeg = !parentReward ? 1 : (!legVerify ? parentReward.directLeg + 1 : parentReward.directLeg);
            rewardPoint = price  * (1 / 3000);
            monthlyRewardPoint = price  * (1 / 100);
            if(directLeg>10){
                level = 10
            }
            else{
            let leg = await levelModel.findOne({ direct: directLeg });
            level = leg.level
            }
            totalbusiness = price;
            rewardPersentage = 1;  
            direct = true;
            isActive = true;
            requiredLevel = 1;
            if (parentReward) {
                await rewardsModel.updateMany({ username: parentUsername }, { $set: { directLeg: directLeg, level: level } });
            }
            var date = new Date(); // Now
            let distrubtionTime =  date.setDate(date.getDate() + 30); 
            const oneTimeRewardPoint =  price * 5 / 100;
            const oneTimeRewardData ={
                userId: parentId,
                username: parentUsername,
                senderId: userId,
                senderUsername: username,
                rewardPoint: oneTimeRewardPoint,
                productId: productId,
                price: price,
                rewardDistrubtionTime: distrubtionTime,
                senderCreatedAt: createdAt,
                status: "Pending",
            }
            await oneTomeRewardModel.create(oneTimeRewardData);
        }
        else {
            directLeg = parentReward.directLeg>10 ? 10 : parentReward.directLeg;
            let leg = await levelModel.findOne({ direct: parentReward.directLeg });
            level = leg.level
            let levels = await levelModel.findOne({ level: index + 1 });
            rewardPoint = price  * (levels.rewardPersentage / 3000);
            monthlyRewardPoint = price  * (levels.rewardPersentage / 100);
            rewardPersentage = levels.rewardPersentage
            if (level.direct >= index + 1) {
                isActive = true;
            }
            requiredLevel = index + 1
        }
        const data = {
            userId: parentId,
            username: parentUsername,
            directLeg: directLeg,
            senderId: userId,
            senderUsername: username,
            direct: direct,
            level: level,
            rewardPoint: rewardPoint,
            monthlyRewardPoint: monthlyRewardPoint,
            productId: productId,
            rewardPersentage: rewardPersentage,
            activePackage: product.length,
            requiredLevel: requiredLevel,
            senderCreatedAt: createdAt,
            status: true,
            isActive: isActive,
            price: price
        }
        await rewardsModel.create(data);
        await businessCount(price, parentId);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

async function updateRewardNLeg() {
    const data = await rewardsModel.find({ isActive: false });
    for (let index = 0; index < data.length; index++) {
        if (data[index].level >= data[index].requiredLevel) {
            await rewardsModel.findOneAndUpdate({ _id: data[index]._id }, { $set: { isActive: true } });
        }
    }
}

// const verifyOrder = async (req, res) => {
//     let check_user_exist = await userModel.findOne({ _id: req.userId })
//     if (!check_user_exist.emailVerified) {
//         return responseHandler(res, 406, "Please verify your email Id")
//     }
//     if (!check_user_exist) return responseHandler(res, 406, "User doesn't exist")
//     const packages = await packagesModel.findOne({ name: packageName });
//     if (!packages) return responseHandler(res, 406, "Package doesn't exist");
// }

// setInterval(communityRewardDistribute, 18000);
// setInterval(passiveRewardDistribute, 5000);
//setInterval(updateRewardNLeg, 5000);

const directLeg = async (req, res) => {
    try {
        let userId = await verifyJwtToken(req, res);
        const data = await rewardsModel.find({ userId: userId, direct: true }).sort({ createdAt: -1 });
        if (data.length == 0) {
            return responseHandler(res, 403, "No Direct Connection found");
        }
        var result = data.reduce((unique, o) => {
            if (!unique.some(obj => obj.senderUsername === o.senderUsername)) {
                unique.push(o);
            }
            return unique;
        }, []);
        let directUser = [];
        for (let index = 0; index < result.length; index++) {
            let business = await businessModel.findOne({ userId: ObjectId(result[index].senderId) })
            let packages = await productModel.find({ userId: result[index].senderId })
            let price = packages.reduce(function (tot, arr) { return tot + arr.price; }, 0);
            const totalBusiness  = !business ? 0 : business.totalbusiness;
            directUser.push({
                senderUsername: result[index].senderUsername,
                totalbusiness: totalBusiness,
                packages: price,
                packageCount: packages.length
             })
        };
        return responseHandler(res, 200, "OK", directUser);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}


const passiveIncome = async (req, res) => {
    try {
        let userId = await verifyJwtToken(req, res);
        const data = await passiveRewardModel.find({ userId: userId }).sort({ createdAt: -1 });
        if (data.length == 0) {
            return responseHandler(res, 406, "No Passive Reward found");
        }
        return responseHandler(res, 200, "OK", data);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const communityIncome = async (req, res) => {
    try {
        let userId = await verifyJwtToken(req, res);
        var datetime = new Date();
        const cTime = datetime.toISOString().substr(0, 10)
        let upTime = cTime.concat('T00:00:00Z')
        let DownTime = cTime.concat('T23:59:59Z')
        const comRewards = await communityRewardModel.find({ userId: userId, createdAt: { $gte: upTime, $lt: DownTime } });
        if (comRewards.length == 0) {
            return responseHandler(res, 406, "No Community Reward found");
        }
        const uniqueRewards = [];
        for (const comReward of comRewards) {
            let data = uniqueRewards.find((a) => a.senderId === comReward.senderId)
            if (data) {
                data.reward = data.reward + comReward.reward
            }
            else {
                uniqueRewards.push({
                    senderId: comReward.senderId,
                    senderUsername: comReward.senderUsername,
                    reward: comReward.reward,
                    createdAt: comReward.createdAt
                })
            }
        }
        return responseHandler(res, 200, "success", uniqueRewards);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const communityIncomeDate = async (req, res) => {
    try {
        let userId = await verifyJwtToken(req, res);
        // const data = await communityRewardModel.find({ userId: userId }).sort({ createdAt: -1 });
        // if (data.length == 0) {
        //     return responseHandler(res, 406, "No Community Reward found");
        // }
        const cTime = req.body.search
        let upTime = cTime.concat('T00:00:00Z')
        let DownTime = cTime.concat('T23:59:59Z')
        const comRewards = await communityRewardModel.find({ userId: userId, createdAt: { $gte: upTime, $lt: DownTime } });
        if (comRewards.length == 0) {
            return responseHandler(res, 406, "No Community Reward found");
        }
        const uniqueRewards = [];
        for (const comReward of comRewards) {
            let data = uniqueRewards.find((a) => a.senderId === comReward.senderId)
            if (data) {
                data.reward = data.reward + comReward.reward
            }
            else {
                uniqueRewards.push({
                    senderId: comReward.senderId,
                    senderUsername: comReward.senderUsername,
                    reward: comReward.reward,
                    createdAt: comReward.createdAt
                })
            }
        }
        return responseHandler(res, 200, "success", uniqueRewards);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

async function businessCount(price, userId) {
    let data = {
        userId: ObjectId(userId),
        totalbusiness: price,
        rankBusiness: 0,
        businessIn24h: 0,
        rank: "",
        upComingRank: "",
    }
    let businessUser = await businessModel.findOne({ userId: ObjectId(userId) });
    if (businessUser) {
        await businessModel.updateOne({ userId: ObjectId(userId) }, { $inc: { totalbusiness: price } })
    }
    else {
        await businessModel.create(data)
    }
}

const order_HTML = (data) => {
    let link = '<html> <body> <div bgcolor="#f3f3f3" style="background-color:#f3f3f3"> <table width="650" bgcolor="#ffffff" border="0" align="center" cellpadding="0" cellspacing="0" style="color:#000;font-family:Lato,Helvetica Neue,Helvetica,Arial,sans-serif;"> <tbody> <tr> <td height="30" bgcolor="#f3f3f3"></td></tr><tr> <td height="102" align="center" style="border-bottom:1px solid #eaeaea;"> <img src="https://growmaxxprofits.com/wp-content/uploads/2023/01/FLG.svg" style="width:100px" alt="Growmaxx" title="Growmaxx" style="display:block" class="CToWUd"> </td></tr><tr> <td valign="top"> <table width="100%" border="0" cellpadding="30" cellspacing="0" style="font-size:14px"> <tbody> <tr> <td> <div> <p style="font-size:16px">Dear User,</p><div style="color:#333;font-size:14px"> <p style="color:#333">Confirmation mail for your purchased package from Growmaxx. </p><p style="font-weight:600;">Package Details </p><table><tr><td>Package Type:</td><td style="font-weight:600;">'+data.title+'</td></tr><tr><td>Package Price:</td><td style="font-weight:600;">$'+data.price+'</td></tr><tr><td>ROI:</td><td style="font-weight:600;">'+data.roi+'%</td></tr><tr><td>Total Reward:</td><td style="font-weight:600;">'+data.totalRewards+'</td></tr></table><br><p>The Growmaxx Team </p></div></div></td></tr></tbody> </table> </td></tr><tr> <td height="40" align="center" valign="bottom" style="font-size:12px;color:#999"> © 2023 -Growmaxx. All Rights Reserved. </td></tr><tr> <td height="30"></td></tr><tr> <td height="30" bgcolor="#f3f3f3"></td></tr></tbody> </table> </div></body></html>';
    return link;
}

const getOrderAdmin = async (req, res) => {
    let userId = await verifyJwtToken(req, res);
    try {
        let check_user_exist = await userModel.findOne({ _id: userId });
        if (!check_user_exist) return responseHandler(res, 406, "User doesn't exist");
        const data = await productModel.find({ userId: userId }).sort({ createdAt: -1 });
        if (!data) return responseHandler(res, 406, "No course found");

        return responseHandler(res, 200, "OK", data);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}



// const pendingOrder = async (req, res) => {
//     const { blockHash, blockNumber, from, to, amount, paymentType, paymentMethod, packageName, paymentCoin } = req.body; // destructuring
//     if (!blockHash || !blockNumber || !from || !to || !amount || !paymentType || !paymentMethod || !packageName || !paymentCoin) {
//         return responseHandler(res, 400, "Bad request")
//     }
//     try {
//         let getTxhistory = await getTxHash(blockHash);
//         let getTxData = await getTx(getTxhistory);
//         let blockAmt =  parseInt(getTxData)
//         if(amount != blockAmt) {
//             return responseHandler(res, 406, "Something went wrong ! If your amount is deducted then  please contact to admin !!")
//         }
//         let check_user_exist = await userModel.findOne({ email: "jk170289@gmail.com" })
//         if (!check_user_exist) return responseHandler(res, 406, "User doesn't exist")
//         if (!check_user_exist.emailVerified) {
//             return responseHandler(res, 406, "Please verify your email Id")
//         }
//         // if (check_user_exist.paymentStatus) {
//         //     return responseHandler(res, 406, "You already having inital package")
//         // }
//         const packages = await packagesModel.findOne({ name: packageName, price:amount});
//         if (!packages) return responseHandler(res, 406, "Package doesn't exist")
//         const totalRewards = amount * 3
//         req.body.dailyReward = (amount * packages.roi) / 100;
//         req.body.userId = check_user_exist._id;
//         const data = { userId: check_user_exist._id, title: packageName, price: amount, roi: packages.roi, dailyReward: req.body.dailyReward, totalRewards: totalRewards, productStatus: "Active", pendingReward: totalRewards }
//         const product = await productModel.create(data) /* create purchased product object */
//         await paymentHistoryModel.create(req.body) /* create payment history object */
//         await userModel.findByIdAndUpdate({ _id: check_user_exist._id }, { $set: { paymentStatus: true } }) //update the paymentStatus with new one
//         if (check_user_exist.username != "growmaxx") {
//             await rewardDistribution(check_user_exist._id, check_user_exist.username, check_user_exist.referralCode, amount, packages.roi, check_user_exist.createdAt, product._id);
//         }
//         // const link = order_HTML(data);
//         // sendMail(check_user_exist.email, "[Growmaxx] Package successfully added ", "", link) /* Order mail send */
//         let token = await createJwt({userUniqueId: check_user_exist._id, userUniqueEmail: check_user_exist.email})    
//         return responseHandler(res, 200, "Course successfully added in your account", token)
//     }
//     catch (e) {
//         console.log("Error :=>", e)
//         return responseHandler(res, 500, e)
//     }
// }
const blockUser= async (req, res) => {
    // let check_user_exist = await userModel.find({ status: false })
    // let count = 0;
    // console.log("=========> count", count);
    // console.log(">>>>>>>>legnth", check_user_exist.length);
    // for await (const data of check_user_exist) {
    //     console.log(">>>>>>>>legnth", data._id);
    //     console.log(">>>>>>>>count", count++);
    // }
}

module.exports = {
    createOrder: createOrder,
    getOrder: getOrder,
    paymentHistory: paymentHistory,
    directLeg: directLeg,
    passiveIncome: passiveIncome,
    communityIncome: communityIncome,
    miniOrder: miniOrder,
    communityIncomeDate: communityIncomeDate,
    createInitialOrder:createInitialOrder,
    getOrderAdmin: getOrderAdmin,
    blockUser:blockUser
}


