import { __esModule } from '@babel/register/lib/node';
import { responseHandler } from '../../common/response'
import { bcrypt, bcryptVerify, createJwt, sendMail, verifyJwtToken } from '../../common/function';
import { host, angular_port } from '../../envirnoment/config'
import productModel from '../../model/product/product'/* inventory */
import walletModel from '../../model/rewards/wallet'
import rewardsModel from '../../model/rewards/rewards';
import userModel from '../../model/user/user'
import withdrawModel from '../../model/user/withdraw';
import passiveRewardModel from '../../model/rewards/passive';
import addressModel from '../../model/user/address';
import communityRewardModel from '../../model/rewards/community';
import businessModel from '../../model/rewards/business'
import withdrawHistoryModel from '../../model/paymentHistory/withdrawHistroy';
import coreHistoryModel from '../../model/paymentHistory/coreHistroy';
import paymentHistoryModel from '../../model/paymentHistory/paymentHistory';
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

const getWalletBalance = async (req, res) => {
    var product = await productModel.find();
    let userData = [];
    for (let index = 0; index < product.length; index++) {
        let wallet = await walletModel.findOne({ userId: product[index].userId });
        let user = await userModel.findOne({ _id: product[index].userId });
        userData.push({
            userId: wallet.userId,
            user: user.email,
            // claimedPassiveRewards: product[index].claimedPassiveRewards,
            claimedCommunityRewards: product[index].claimedCommunityRewards,
            //pendingReward: product[index].pendingReward,
            //coreWallet: wallet.coreWallet,
            tradeWallet: wallet.tradeWallet,
            ecoWallet: wallet.ecoWallet
        })
    }
    return responseHandler(res, 200, "OK", userData);
}


const usersWallet = async (req, res) => {
    var users = await walletModel.find();
    console.log();
    let userData = [];
    for (let index = 0; index < users.length; index++) {
        let wallet = await userModel.findOne({ _id: users[index].userId });
        if (wallet) {
            userData.push({
                userId: wallet._id,
            })
        }
        else {
            console.log("users._id>>>", users[index].userId);
        }
    }
    return responseHandler(res, 200, "OK", userData);
}

const findWallet = async (req, res) => {
    // var useremail=  await passiveRewardModel.find({userId:"6459eea0c98eea01578e2791"});
    // console.log(">>>>>>>>useremail", useremail);
    var useremail = await userModel.find({ referralCode: "Mehar001", paymentStatus: true }).sort({ createdAt: -1 });
    console.log(">>>>>>>>useremail", useremail);
    // users._id>>> 64501c1579e368d956c8372c
    //     var wallet =  await walletModel.find({userId:"64501c1579e368d956c8372c"});
    //   var user=  await userModel.findOne({_id:"64501c1579e368d956c8372c"});
    //     console.log(user);
    //     await walletModel.deleteOne({userId:"64501c1579e368d956c8372c"});
    return responseHandler(res, 200, "OK", useremail);
}
const findWaithdrawWallet = async (req, res) => {
    var useremail = await rewardsModel.findOne({ username: "Mehar001", senderUsername: "Rajni" }).sort({ createdAt: -1 });
    // console.log(">>>>>>>>useremail", useremail);
    // var useremail=  await withdrawModel.findOne({bnb:"0x8a76d9dc130600f2093045d15c5f276ca0af71da"});
    // console.log(">>>>>>>>useremail", useremail);
    // users._id>>> 64501c1579e368d956c8372c
    //      var wallet =  await walletModel.findOne({userId:"6459eea0c98eea01578e2791"});
    //  var user=  await userModel.find({referralCode:"Mehar001", paymentStatus: true});

    //   console.log(" user.length=====>",  useremail.length);

    //     var passiveReward =   await passiveRewardModel.find({userId:"6459eea0c98eea01578e2791"}).sort({ createdAt: -1 });
    //     let comBal = 0
    //     for (let index = 0; index < passiveReward.length; index++) {
    //         comBal += passiveReward[index].reward
    //     }
    //     console.log(">>>>>comBal", comBal);
    //     //wrong community : 645113f370c044e0358a8e45
    //    // 64543808c98eea01578e2316
    //         console.log(wallet);
    //     await walletModel.deleteOne({userId:"64501c1579e368d956c8372c"});
    return responseHandler(res, 200, "OK", useremail);
}
const coreWalletBal = async (req, res) => {
    var wallet = await walletModel.find();
    let walletBal = 0
    console.log(">>>>>>>======>", wallet.length);
    for (let index = 0; index < wallet.length; index++) {
        walletBal += wallet[index].coreWallet
    }
    return responseHandler(res, 200, "OK", walletBal);
}


const accountDetails = async (req, res) => {
    var wallet = await addressModel.findOne({ userId: "6459f231c98eea01578e27ab" });
    return responseHandler(res, 200, "OK", wallet);
}

const communityReward = async (req, res) => {
    var communityIncome = await communityRewardModel.find({ userId: "64723c9b5707bf9e383501df" }).sort({ createdAt: -1 });
    console.log(">>>>>>>======>", communityIncome);
    let comBal = 0
    // for (let index = 0; index < communityIncome.length; index++) {
    //     comBal += communityIncome[index].reward
    // }
    // console.log(">>>>>comBal", comBal);
    return responseHandler(res, 200, "OK", communityIncome);
}

const products = async (req, res) => {
    var product = await productModel.find({ userId: req.body.userId })
    return responseHandler(res, 200, "OK", product);
}


const displayData = async (req, res) => {
    try {
        console.log("=================>userId", req.body);
        let userId = req.body.userId;
        let check_user_exist = await userModel.findOne({ _id: userId })
        if (!check_user_exist) return responseHandler(res, 406, "User doesn't exist")
        var product = await productModel.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: "$id",
                    totalReward: { $sum: "$totalRewards" },
                    passiveReward: { $sum: "$claimedPassiveRewards" },
                    pending: { $sum: "$pendingReward" },
                    communityReward: { $sum: "$claimedCommunityRewards" },
                    count: { $sum: 1 }
                }
            }]);
        console.log("======>product", product[0]);
        let dailyCommunityReward = 0;
        let dailyPassiveReward = 0;
        const reward = await rewardsModel.findOne({ username: check_user_exist.username }).sort({ createdAt: -1 });
        console.log("======>reward", reward);
        const business = await businessModel.findOne({ userId: userId })
        console.log("======>business", business);
        const totalbusiness = !business ? 0 : business.totalbusiness;
        const leg = reward == null ? 0 : reward.directLeg;
        const businessIn24h = reward == null ? 0 : reward.businessIn24h;
        var walletData = await walletModel.findOne({ userId: userId });
        console.log("======>walletData", walletData);
        var datetime = new Date();
        const cTime = datetime.toISOString().substring(0, 10)
        let upTime = cTime.concat('T00:00:00Z')
        let DownTime = cTime.concat('T23:59:59Z')
        console.log("datetime", upTime, DownTime);

        const comRewards = await communityRewardModel.find({ userId: userId, createdAt: { $gte: upTime, $lt: DownTime } });
        if (comRewards) {
            for (const comReward of comRewards) {
                dailyCommunityReward = dailyCommunityReward + comReward.reward;
            }
        }
        const passiveReward = await passiveRewardModel.find({ userId: userId, createdAt: { $gte: upTime, $lt: DownTime } });
        if (passiveReward) {
            for (const passReward of passiveReward) {
                dailyPassiveReward = dailyPassiveReward + passReward.reward;
            }
        }
        console.log("==========>", { coreWallet: walletData.coreWallet, leg: leg, totalbusiness: totalbusiness, businessIn24h: businessIn24h, ecoWallet: walletData.ecoWallet, tradeWallet: walletData.tradeWallet, dailyCommunityReward: dailyCommunityReward, dailyPassiveReward: dailyPassiveReward, product: product[0] });
        return responseHandler(res, 200, "Success", { coreWallet: walletData.coreWallet, leg: leg, totalbusiness: totalbusiness, businessIn24h: businessIn24h, ecoWallet: walletData.ecoWallet, tradeWallet: walletData.tradeWallet, dailyCommunityReward: dailyCommunityReward, dailyPassiveReward: dailyPassiveReward, product: product[0] })
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}


const doubleRewardTest = async (req, res) => {
    try {
        var users = await userModel.findOne({ paymentStatus: true, _id: req.body.userId });
        let userData = [];
        let count = 1;
        let x = 1;
        //for (let i = 0; i < users.length; i++) {
        const products = await productModel.find({ userId: users._id });
        let pending = 0;
        let total = 0;
        console.log(">>>>>>>>>>pr", products);
        if (products.length > 1) {
            products.forEach(async element => {
                console.log(">>>>>>>>products", products.length, element._id);
                let craeted = element.createdAt
                const cTime = (craeted).toISOString().substr(0, 10)
                let upTime = cTime.concat('T00:00:00Z')
                let DownTime = cTime.concat('T23:59:59Z')
                console.log(">>>>upTime", upTime, "====>DownTime", DownTime);
                const rewards = await rewardsModel.find({ senderId: users._id, createdAt: { $gte: upTime, $lt: DownTime } })
                console.log(">>>>>>>>rewards.length", rewards);
                // const a= await rewardsModel.updateMany({senderId: users._id, createdAt: { $gte: upTime, $lt: DownTime } },{
                //     $set:{productId: element._id}
                //  }) 
                //  console.log(">>>>update", a);     

            });
            //    console.log(">>>>>>>>products", products.length, products[0]._id);
            //     const rewards = await rewardsModel.find({ senderId: users[i]._id, isActive: true })
            //     console.log(">>>>>>>>rewards.length",  rewards.length);
            //    if(rewards.length > 1){
            //     const a= await rewardsModel.updateMany({senderId: users[i]._id},{
            //         $set:{productId: products[0]._id}
            //      }) 
            //      console.log(">>>>update", a);
            //    }
            count++
            // }
        }
        return responseHandler(res, 200, "Success", products)
    } catch (e) { }

    //     var datetime = new Date();
    //     const cTime = datetime.toISOString().substr(0, 10)
    //     console.log("cTime", cTime);
    //     let upTime = cTime.concat('T00:00:00Z')
    //     let DownTime = cTime.concat('T23:59:59Z')
    //    // let user = await userModel.find({ status: true});
    // //    user.forEach(async element => {
    // //         var passiveIncome = await passiveRewardModel.find({ userId: element._id, createdAt: { $gte: upTime, $lt: DownTime } })
    // //         console.log(">>>>>>passiveIncome", passiveIncome);
    // //         for (let index = 0; index < passiveIncome.length; index++) {
    // //             console.log(">>>>>>>>>>user>>>>>", element._id);

    // //             if (index > 0 && passiveIncome[0].packageId == passiveIncome[index].packageId && passiveIncome[0].pendingReward == passiveIncome[index].pendingReward) {
    // //                 console.log(">>>>>>>>>>passiveIncome test",passiveIncome[index]._id);
    // //               //  await passiveRewardModel.deleteOne({ _id: passiveIncome[index]._id });
    // //             }
    // //         }
    // //     })


    //     let activePackage = await productModel.find({ productStatus: "Active", createdAt:{$lt: cTime }});
    // console.log(">>>>>>>>>>>>>>>>>>activePackage", activePackage);
    //     // let product = await productModel.find({ status: true, _id:"645f51aec98eea01578e2c06"});
    //     // console.log(">>>>>product", product);
    //     // product.forEach(async element => {
    //     //     const comRewards = await communityRewardModel.find({ packageId: element._id, createdAt: { $gte: upTime, $lt: DownTime } });
    //     //  console.log(" passiveIncome[index].packageId", comRewards);
    //     //     for (let index = 0; index < comRewards.length; index++) {
    //     //         if (index > 0 && comRewards[0].senderId == comRewards[index].senderId) {
    //     //             console.log(">>>>>>>>>>user", comRewards[index]);
    //     //           //  await passiveRewardModel.deleteOne({ _id: comRewards[index]._id });
    //     //         }
    //     //     }
    //     // });

    //     return responseHandler(res, 200, "Success")

    //     // const comRewards = await passiveRewardModel.find({ userId: "64561f82c98eea01578e244a", createdAt: { $gte: upTime, $lt: DownTime } });
    //     // console.log(">comRewards", comRewards);

}
const productData = async (req, res) => {
    var product = await productModel.find({ _id: req.body._id });
    return responseHandler(res, 200, "OK", product);
}

const productCount = async (req, res) => {
    const basic100 = await productModel.countDocuments({ title: "Basic", price: 100 });
    const basic300 = await productModel.countDocuments({ title: "Basic", price: 300 });
    const basic500 = await productModel.countDocuments({ title: "Basic", price: 500 });
    const basic900 = await productModel.countDocuments({ title: "Basic", price: 900 });

    const basicCount = basic100 + basic300 + basic500 + basic900;

    const advance20000 = await productModel.countDocuments({ title: "Advance", price: 20000 });
    const advance15000 = await productModel.countDocuments({ title: "Advance", price: 15000 });
    const advance24000 = await productModel.countDocuments({ title: "Advance", price: 24000 });
    const advance10000 = await productModel.countDocuments({ title: "Advance", price: 10000 });
    const advance12500 = await productModel.countDocuments({ title: "Advance", price: 12500 });

    const advanceCount = advance20000 + advance15000 + advance24000 + advance10000 + advance12500;

    const medium1000 = await productModel.countDocuments({ title: "Medium", price: 1000 });
    const medium1500 = await productModel.countDocuments({ title: "Medium", price: 1500 });
    const medium3000 = await productModel.countDocuments({ title: "Medium", price: 3000 });
    const medium6000 = await productModel.countDocuments({ title: "Medium", price: 6000 });
    const medium9000 = await productModel.countDocuments({ title: "Medium", price: 9000 });

    const mediumCount = medium1000 + medium1500 + medium3000 + medium6000 + medium9000;

    const corporate25000 = await productModel.countDocuments({ title: "Corporate", price: 25000 });
    const corporate50000 = await productModel.countDocuments({ title: "Corporate", price: 50000 });

    const corporateCount = corporate25000 + corporate50000;

    var completeRegularPack = await productModel.countDocuments({ productStatus: "Completed", title: { $ne: "MINI PACK" } });
    var completeMiniPack = await productModel.countDocuments({ productStatus: "Completed", title: { $eq: "MINI PACK" } });

    const product = {
        basic100: basic100,
        basic300: basic300,
        basic500: basic500,
        basic900: basic900,
        basicCount: basicCount,
        advance20000: advance20000,
        advance15000: advance15000,
        advance24000: advance24000,
        advance10000: advance10000,
        advance12500: advance12500,
        advanceCount: advanceCount,
        medium1000: medium1000,
        medium1500: medium1500,
        medium3000: medium3000,
        medium6000: medium6000,
        medium9000: medium9000,
        mediumCount: mediumCount,
        corporate25000: corporate25000,
        corporate50000: corporate50000,
        corporateCount: corporateCount,
        regular: completeRegularPack,
        miniPack: completeMiniPack
    }

    return responseHandler(res, 200, "OK", product);
}

const communityIncome = async (req, res) => {
    try {
        // const data = await communityRewardModel.find({ userId: userId }).sort({ createdAt: -1 });
        // if (data.length == 0) {
        //     return responseHandler(res, 406, "No Community Reward found");
        // }
        var datetime = new Date();
        const cTime = "2023-07-26"
        let upTime = cTime.concat('T00:00:00Z')
        let DownTime = cTime.concat('T23:59:59Z')
        const comRewards = await communityRewardModel.find({ userId: req.body.userId, createdAt: { $gte: upTime, $lt: DownTime } });
        console.log(">>>>>comRewards", comRewards);
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

const getWithdrawWallet = async (req, res) => {
    try {
        let userId = req.body.userId;
        let check_user_exist = await userModel.findOne({ _id: userId })
        if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist");
        let check_history_exist = await withdrawHistoryModel.find({ userId: userId }).sort({ createdAt: -1 });
        if (check_history_exist.length < 1) return responseHandler(res, 461, "No History found");
        return responseHandler(res, 200, "ok", check_history_exist);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const completedProduct = async (req, res) => {
    try {
        var product = [];
        if (req.body.title == 'mini') {
            let data = await productModel.find({ productStatus: "Completed", title: 'MINI PACK' });
            for (let index = 0; index < data.length; index++) {
                let user = await userModel.findOne({ _id: data[index].userId });
                product.push({
                    product: data[index],
                    user: user
                })
            }
        }
        else {
            let data = await productModel.find({ productStatus: "Completed", title: { $ne: 'MINI PACK' } })
            for (let index = 0; index < data.length; index++) {
                let user = await userModel.findOne({ _id: data[index].userId });
                product.push({
                    product: data[index],
                    user: user
                })
            }
        }

        return responseHandler(res, 200, "ok", product);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const productDetails = async (req, res) => {
    let price = parseInt(req.body.price)
    try {
        var product = [];
        let data = await productModel.find({ price: price });
        for (let index = 0; index < data.length; index++) {
            let user = await userModel.findOne({ _id: data[index].userId });
            product.push({
                product: data[index],
                user: user
            })
        }
        return responseHandler(res, 200, "ok", product);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const topBuyerDetails = async (req, res) => {
    let price = parseInt(req.body.price)
    try {
        var product = [];
        let data = await userModel.findOne({ paymentStatus: true, _id: "645f49f7c98eea01578e2bd8" });
        for (let index = 0; index < data.length; index++) {
            let data = await productModel.aggregate({ $match: { userId: data._id } }, { $group: { price: { $sum: "$price" } } })

        }
        return responseHandler(res, 200, "ok", product);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}


const all24WithdrawHistory = async (req, res) => {
    try {
        const { page } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;
        var datetime = new Date();
        const cTime = datetime.toISOString().substr(0, 10)
        let upTime = cTime.concat('T00:00:00Z')
        let DownTime = cTime.concat('T23:59:59Z')
        var withdrawHistoryData = [];
        const withdraw24H = await withdrawHistoryModel.aggregate([{
            $match: {
                createdAt: { $gte: new Date(upTime), $lt: new Date(DownTime) }
            }
        }, { $skip: skip }, { $limit: limit }])
        if (withdraw24H.length < 1) {
            return responseHandler(res, 407, "No withdrawal found!")
        }
        let counting = skip;
        for (let index = 0; index < withdraw24H.length; index++) {
            let user = await userModel.findOne({ _id: withdraw24H[index].userId });
            let dataNew = JSON.stringify(withdraw24H[index])
            let withdraw = JSON.parse(dataNew)
            withdraw.sn = ++counting;
            withdraw.email = user.email,
                withdraw.username = user.username,
                withdraw.firstName = user.firstName,
                withdraw.lastName = user.lastName,
                withdrawHistoryData.push(withdraw)
        }
        const totalCount = await withdrawHistoryModel.countDocuments({ createdAt: { $gte: upTime, $lt: DownTime } });


        return responseHandler(res, 200, "ok", { data: withdrawHistoryData, totalCount: totalCount });
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const allWithdrawHistory = async (req, res) => {
    try {
        const { page } = req.query;
        console.log(">>>page", page);   
        const limit = 10;
        const skip = (page - 1) * limit;
        var withdrawHistoryData = [];
        const withdraw24H = await withdrawHistoryModel.aggregate([{
            $match: {
                orderStatus: "COMPLETED"
            }
        }, { $skip: skip }, { $limit: limit }])
        let counting = skip;
        for (let index = 0; index < withdraw24H.length; index++) {
            let user = await userModel.findOne({ _id: withdraw24H[index].userId });
            let dataNew = JSON.stringify(withdraw24H[index])
            let withdraw = JSON.parse(dataNew);
            withdraw.sn = ++counting;
            withdraw.email = user.email,
                withdraw.username = user.username,
                withdraw.firstName = user.firstName,
                withdraw.lastName = user.lastName,
                withdrawHistoryData.push(withdraw)
        }
        const totalCount = await withdrawHistoryModel.countDocuments({orderStatus: "COMPLETED"});
        return responseHandler(res, 200, "ok", { data: withdrawHistoryData, totalCount: totalCount });
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const allPendingWithdrawHistory = async (req, res) => {
    try {
        const { page } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;
        var withdrawHistoryData = [];
        const withdraw24H = await withdrawHistoryModel.aggregate([{
            $match: {
                orderStatus: "PENDING"
            }
        },{$sort: { 'createdAt': -1 }}, { $skip: skip }, { $limit: limit }])
        if (withdraw24H.length < 1) {
            return responseHandler(res, 407, "No pending withdraw found!")
        }
        let counting = skip;
        for (let index = 0; index < withdraw24H.length; index++) {
            let user = await userModel.findOne({ _id: withdraw24H[index].userId });
            let dataNew = JSON.stringify(withdraw24H[index])
            let withdraw = JSON.parse(dataNew)
            withdraw.sn = ++counting;
            withdraw.email = user.email,
                withdraw.username = user.username,
                withdraw.firstName = user.firstName,
                withdraw.lastName = user.lastName,
                withdrawHistoryData.push(withdraw)
        }
        const totalCount = await withdrawHistoryModel.countDocuments({orderStatus: "PENDING"});
        return responseHandler(res, 200, "ok", { data: withdrawHistoryData, totalCount: totalCount });
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const allCoinWithdrawHistory = async (req, res) => {
    try {
        var withdrawHistoryData = [];
        const withdraw24H = await withdrawHistoryModel.find({ orderStatus: "COMPLETED", pair: req.body.pair })
        var gmtCount = 0;
        var coinCount = 0;
        for (let index = 0; index < withdraw24H.length; index++) {
            let user = await userModel.findOne({ _id: withdraw24H[index].userId });
            withdrawHistoryData.push({
                historyData: withdraw24H[index],
                user: user,
                gmt: gmtCount + gmt,
                coin: coinCount + totalAmount
            })
        }
        return responseHandler(res, 200, "ok", withdrawHistoryData);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const searchWithdrawHistory = async (req, res) => {
    try {
        const { search, page } = req.body; // destructuring 
        const limit = 10;
        const skip = (page - 1) * limit;
        if (!search) {
            return responseHandler(res, 400, "Bad request")
        }
        let counting = skip;
        var withdrawHistoryData = [];
        var withdraw24H = await withdrawHistoryModel.aggregate([{
            $match: {
                destination: new RegExp(search.trim())
            }
        }, { $skip: skip }, { $limit: limit }, {$sort: { createdAt: -1 }}])
        for (let index = 0; index < withdraw24H.length; index++) {
            let user = await userModel.findOne({ _id: withdraw24H[index].userId });
            let dataNew = JSON.stringify(withdraw24H[index])
            let withdraw = JSON.parse(dataNew)
            withdraw.sn = ++counting;
            withdraw.email = user.email,
                withdraw.username = user.username,
                withdraw.firstName = user.firstName,
                withdraw.lastName = user.lastName,
                withdrawHistoryData.push(withdraw)
        }
        const totalCount = await withdrawHistoryModel.countDocuments({  destination: new RegExp(search.trim())});
        return responseHandler(res, 200, "ok", { data: withdrawHistoryData, totalCount: totalCount });
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const userLegs = async (req, res) => {
    try {
        const { userId } = req.body; // destructuring 
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
            const totalBusiness = !business ? 0 : business.totalbusiness;
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

// transfer
const coreToEco = async (req, res) => {
    try {
        const { userId } = req.body
        if (!req.body.amount || userId) {
            return responseHandler(res, 400, "Bad request");
        }

        let check_user_exist = await userModel.findOne({ _id: userId })
        if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist")
        const data = await walletModel.findOne({ userId: userId });
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

const coreToTrade = async (req, res) => {
    try {
        if (!req.body.amount) {
            return responseHandler(res, 400, "Bad request");
        }
        const { userId } = req.body
        let check_user_exist = await userModel.findOne({ _id: userId })
        if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist")
        // else if(!check_user_exist.twoFaStatus){
        //     return responseHandler(res, 463, "Please Enable Two-Factor-Authentication before transfer GMT")
        // }
        const data = await walletModel.findOne({ userId: userId })
        if (data.coreWallet < req.body.amount) {
            return responseHandler(res, 406, "Don't have sufficient balance in core wallet");
        }
        const coreWallet = data.coreWallet - req.body.amount;
        const tradeWallet = data.tradeWallet + req.body.amount;
        await walletModel.findOneAndUpdate({ _id: data._id }, { tradeWallet: tradeWallet, coreWallet: coreWallet })
        let histroy = {
            userId: userId,
            sender: check_user_exist.username,
            receiverId: userId,
            receiver: check_user_exist.username,
            transferType: "Core-To-Trade",
            transfer: "INTERNAL",
            asset: "GMT",
            gmt: req.body.amount,
            orderStatus: "COMPLETED",
            status: true
        }
        await coreHistoryModel.create(histroy);
        const link = await trade_HTML(histroy)
        sendMail(check_user_exist.email, "[Growmaxx] Core-To-Trade Transfer update ", "", link) /* Core-To-Eco mail send */
        return responseHandler(res, 200, "OK", data);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const coreWalletBalance = async (req, res) => {
    try {
        const { userId } = req.body
        const data = await walletModel.findOne({ userId: userId });
        if (!data) {
            return responseHandler(res, 200, { coreWalletBalance: 0 });
        }
        return responseHandler(res, 200, "OK", { coreWalletBalance: data.coreWallet });
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const coreToCore = async (req, res) => {
    try {
        const { amount, username, userId } = req.body
        if (!amount || !username) {
            return responseHandler(res, 400, "Bad request");
        }
        if (amount < 10) return responseHandler(res, 461, "You are allowed to transfer mini 10 GMT")

        let check_user_exist = await userModel.findOne({ _id: userId });
        if (!check_user_exist) return responseHandler(res, 461, "User doesn't exist")
        // else if(!check_user_exist.twoFaStatus){
        //     return responseHandler(res, 463, "Please Enable Two-Factor-Authentication before transfer GMT")
        // }
        let receiverData = await userModel.findOne({ username: username })
        if (!receiverData) return responseHandler(res, 461, "Receiver doesn't exist")
        const sender = await walletModel.findOne({ userId: userId })
        const linkedAccountUp = await rewardsModel.findOne({ username: check_user_exist.username }, { senderUsername: username })
        const linkedAccountDown = await rewardsModel.findOne({ username: username }, { senderUsername: check_user_exist.username })
        if (!linkedAccountDown && !linkedAccountUp) return responseHandler(res, 461, "Receiver account not linked with your account!")
        const receiver = await walletModel.findOne({ userId: receiverData._id })
        if (sender.coreWallet < amount) {
            return responseHandler(res, 406, "Don't have sufficient balance in core wallet");
        }
        await walletModel.updateOne({ _id: sender._id }, { $inc: { coreWallet: -(amount) } })
        await walletModel.updateOne({ _id: receiver._id }, { $inc: { coreWallet: amount } })
        let senderHistroy = {
            userId: userId,
            sender: check_user_exist.username,
            receiverId: receiverData._id,
            receiver: receiverData.username,
            transferType: "Core-To-Core",
            transfer: "SENDER",
            asset: "GMT",
            gmt: amount,
            orderStatus: "COMPLETED",
            status: true
        }
        let receiverHistroy = {
            userId: receiverData._id,
            sender: check_user_exist.username,
            senderId: userId,
            receiver: receiverData.username,
            transferType: "Core-To-Core",
            transfer: "RECEIVER",
            asset: "GMT",
            gmt: amount,
            orderStatus: "COMPLETED",
            status: true
        }
        await coreHistoryModel.create(senderHistroy);
        const link1 = tradeCore_HTML(senderHistroy)
        sendMail(check_user_exist.email, "[Growmaxx] Core-To-Core Transfer update ", "", link1) /* Core-To-Core Sender mail send */
        await coreHistoryModel.create(receiverHistroy);
        const link2 = tradeCoreReciver_HTML(receiverHistroy)
        sendMail(receiverData.email, "[Growmaxx] Core-To-Core Transfer update ", "", link2) /* Core-To-Core Receiver mail send */
        return responseHandler(res, 200, "Core to core swap done");
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}


const todaysProduct = async (req, res) => {
    try {
        const cTime = req.body.search
        let upTime = cTime.concat('T00:00:00Z')
        let DownTime = cTime.concat('T23:59:59Z')
        var product = [];
        let data = await productModel.find({createdAt: { $gte: upTime, $lt: DownTime}});
        for (let index = 0; index < data.length; index++) {
            let user = await userModel.findOne({ _id: data[index].userId });
            product.push({
                product: data[index],
                user: user
            })
        }
        return responseHandler(res, 200, "ok", product);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const teams = async (req, res) => {
    try {
        const userId = req.body.userId
        const teams = await rewardsModel.find({userId: userId});
        if (teams.length == 0) {
            return responseHandler(res, 406, "No Community Reward found");
        }
        const uniqueRewards = [];
        for (const uniTeams of teams) {
            let data = uniqueRewards.find((a) => a.senderId ===  uniTeams.senderId)
            if (data) {
                return
            }
            else {
                uniqueRewards.push({uniTeams})
            }
        }
        return responseHandler(res, 200, "ok", uniqueRewards);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}

const todaysDeposit = async (req, res) => {
    try {
        const cTime = req.body.search
        let upTime = cTime.concat('T00:00:00Z')
        let DownTime = cTime.concat('T23:59:59Z')
        var product = [];
        let data = await paymentHistoryModel.find({createdAt: { $gte: upTime, $lt: DownTime}});
        for (let index = 0; index < data.length; index++) {
            let user = await userModel.findOne({ _id: data[index].userId });
            product.push({
                product: data[index],
                user: user
            })
        }
        return responseHandler(res, 200, "ok", product);
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}



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
    getWalletBalance: getWalletBalance,
    usersWallet: usersWallet,
    findWallet: findWallet,
    coreWalletBal: coreWalletBal,
    findWaithdrawWallet: findWaithdrawWallet,
    accountDetails: accountDetails,
    communityReward: communityReward,
    products: products,
    displayData: displayData,
    doubleRewardTest: doubleRewardTest,
    productData: productData,
    communityIncome: communityIncome,
    getWithdrawWallet: getWithdrawWallet,
    productCount: productCount,
    completedProduct: completedProduct,
    productDetails: productDetails,
    all24WithdrawHistory: all24WithdrawHistory,
    searchWithdrawHistory: searchWithdrawHistory,
    allWithdrawHistory: allWithdrawHistory,
    allCoinWithdrawHistory: allCoinWithdrawHistory,
    allPendingWithdrawHistory: allPendingWithdrawHistory,
    topBuyerDetails: topBuyerDetails,
    userLegs: userLegs,
    todaysProduct: todaysProduct,
    todaysDeposit: todaysDeposit,
    teams: teams,

    coreToTrade: coreToTrade,
    coreToEco: coreToEco,
    coreToCore: coreToCore,
    coreWalletBalance: coreWalletBalance,
};


