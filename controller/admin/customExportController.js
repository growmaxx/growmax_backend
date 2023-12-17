import { Workbook } from "exceljs";
import { __esModule } from '@babel/register/lib/node';
import { responseHandler } from '../../common/response'
import userModel from '../../model/user/user'
import productModel from '../../model/product/product'/* inventory */
import rewardsModel from '../../model/rewards/rewards';
import withdrawHistoryModel from '../../model/paymentHistory/withdrawHistroy';
import walletModel from '../../model/rewards/wallet';
import businessModel from '../../model/rewards/business';
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;


const customExport = async (req, res) => {

    var customData = []
    let users = await userModel.find({ paymentStatus: true});
    for (let index = 0; index < users.length; index++) {
        let withdraw = await withdrawHistoryModel.aggregate([{
            $match: { "userId": users[index]._id.toString() }
        }, {
            $group: {
                _id: "$id",
                totalAmount: { $sum: "$totalAmount" },
                gmtAmount: { $sum: "$gmtAmount" }
            }
        }])
        let product = await productModel.aggregate([{
            $match: { "userId": users[index]._id.toString() }
        }, {
            $group: {
                _id: "$id",
                price: { $sum: "$price" },
                totalRewards: { $sum: "$totalRewards" },
                rebuy: { $sum: { $cond: [{ $gt: ["$price", 50] }, 1, 0] } }

            }
        }])
        let wallet = await walletModel.aggregate([{
            $match: { "userId": users[index]._id.toString() }
        }, {
            $group: {
                _id: "$id",
                coreWallet: { $sum: "$coreWallet" },

            }
        }])
        let business = await businessModel.findOne({ userId: ObjectId(users[index]._id) })
        let reward = await rewardsModel.findOne({ userId: users[index]._id }).sort({ createdAt: -1 });
        customData.push({
            email: users[index].email,
            leg: reward != null ? reward.directLeg : 0,
            wallet: wallet[0].coreWallet,
            price: product[0].price,
            totalRewards: product[0].totalRewards,
            rebuy: product[0].rebuy,
            withdraw: withdraw[0] != undefined ? withdraw[0].gmtAmount : 0,
            totalBusiness: business != null ? business.totalbusiness: 0
            })
        console.log("index============>", index);
    }
    console.log("===========>", customData);
    const workbook = new Workbook();  // Create a new workbook
    const worksheet = workbook.addWorksheet("My Users"); // New Worksheet
    // Column for data in excel. key must match data key
    worksheet.columns = [
        { header: "S no.", key: "s_no", width: 10 },
        { header: "EMAIL", key: "email", width: 25 },
        { header: "USER NAME", key: "username", width: 20 },
        { header: "DEPOSIT", key: "price", width: 20 },
        { header: "TOTAL REWARD", key: "totalRewards", width: 10 },
        { header: "REBUY", key: "rebuy", width: 20 },
        { header: "WITHDRAW", key: "withdraw", width: 20 },
        { header: "CORE AVAILABLE BALANCE", key: "wallet", width: 30 }
    ]

    // Looping through User data
    let counter = 1;
    customData.forEach((user) => {
        user.s_no = counter;
        worksheet.addRow(user); // Add data in worksheet
        counter++;
    });

    // Making first line in excel bold
    worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
    });

    try {
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        );
        res.setHeader("Content-Disposition", `attachment; filename=${Date.now()}-products.xlsx`);
        await workbook.xlsx.write(res)
        return res.status(200);

        // await workbook.xlsx.writeFile(`${path}/users.xlsx`).then(() => {
        //   res.send({
        //     status: "success",
        //     message: "file successfully downloaded",
        //     path: `${path}/users.xlsx`,
        //   });
        // });
    } catch (err) {
        res.send({
            status: "error",
            message: "Something went wrong",
        });
    }
};

module.exports = {
    customExport: customExport
}