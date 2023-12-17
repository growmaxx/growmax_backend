import { Workbook } from "exceljs";
import { __esModule } from '@babel/register/lib/node';
import { responseHandler } from '../../common/response'
import userModel from '../../model/user/user'
import withdrawHistoryModel from '../../model/paymentHistory/withdrawHistroy';
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

const exportWithdraw = async (req, res) => {
    const { search } = req.params
    var withdrawHistoryData = [];
    if (search == 'all24History') {
        var datetime = new Date();
        const cTime = datetime.toISOString().substr(0, 10)
        let upTime = cTime.concat('T00:00:00Z')
        let DownTime = cTime.concat('T23:59:59Z')
        const withdraw24H = await withdrawHistoryModel.find({ createdAt: { $gte: upTime, $lt: DownTime } })
        if (withdraw24H.length < 1) {
            return responseHandler(res, 407, "No withdrawal found!")
        }
        for (let index = 0; index < withdraw24H.length; index++) {
            let user = await userModel.findOne({ _id: withdraw24H[index].userId });
            let dataNew = JSON.stringify(withdraw24H[index])
            let withdraw = JSON.parse(dataNew)
            withdraw.email = user.email,
                withdraw.username = user.username,
                withdraw.firstName = user.firstName,
                withdraw.lastName = user.lastName,
                withdrawHistoryData.push(withdraw)
        }
    }
    else if (search == 'allHistory') {
        const withdraw24H = await withdrawHistoryModel.find({ orderStatus: "COMPLETED" })
        for (let index = 0; index < withdraw24H.length; index++) {
            let user = await userModel.findOne({ _id: withdraw24H[index].userId });
            let dataNew = JSON.stringify(withdraw24H[index])
            let withdraw = JSON.parse(dataNew)
            withdraw.email = user.email,
                withdraw.username = user.username,
                withdraw.firstName = user.firstName,
                withdraw.lastName = user.lastName,
                withdrawHistoryData.push(withdraw)
        }
    }
    else if (search == 'allPendingHistory') {
        const withdraw24H = await withdrawHistoryModel.find({ orderStatus: "PENDING" }).sort({ createdAt: -1 });
        for (let index = 0; index < withdraw24H.length; index++) {
            let user = await userModel.findOne({ _id: withdraw24H[index].userId });
            let dataNew = JSON.stringify(withdraw24H[index])
            let withdraw = JSON.parse(dataNew)
            withdraw.email = user.email,
                withdraw.username = user.username,
                withdraw.firstName = user.firstName,
                withdraw.lastName = user.lastName,
                withdrawHistoryData.push(withdraw)
        }
    }
    else if (search == 'allCoinWithdraw') {
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
    }
    else {
        var withdraw24H = await withdrawHistoryModel.find({ destination: new RegExp(search.trim()) }).sort({ createdAt: -1 });
        for (let index = 0; index < withdraw24H.length; index++) {
            let user = await userModel.findOne({ _id: withdraw24H[index].userId });
            let dataNew = JSON.stringify(withdraw24H[index])
            let withdraw = JSON.parse(dataNew)
            withdraw.email = user.email,
                withdraw.username = user.username,
                withdraw.firstName = user.firstName,
                withdraw.lastName = user.lastName,
                withdrawHistoryData.push(withdraw)
        }
    }
    if (withdrawHistoryData.length < 1) {
        return responseHandler(res, 407, "No data for export")
    }

    const workbook = new Workbook();  // Create a new workbook
    const worksheet = workbook.addWorksheet("My Users"); // New Worksheet
    // Column for data in excel. key must match data key
    worksheet.columns = [
        { header: "S no.", key: "s_no", width: 10 },
        { header: "EMAIL", key: "email", width: 25 },
        { header: "USER NAME", key: "username", width: 20 },
        { header: "FIRST NAME", key: "firstName", width: 15 },
        { header: "LAST NAME", key: "lastName", width: 15 },
        { header: "ORDER ID", key: "orderId", width: 10 },
        { header: "TYPE", key: "type", width: 10 },
        { header: "PAIR", key: "pair", width: 10 },
        { header: "GMT AMOUNT", key: "gmtAmount", width: 10 },
        { header: "RECEIVE AMOUNT", key: "totalAmount", width: 10 },
        { header: "ASSET", key: "asset", width: 10 },
        { header: "FEE", key: "fee", width: 10 },
        { header: "SLIPPAGE", key: "slippage", width: 10 },
        { header: "STATUS", key: "orderStatus", width: 10 },
        { header: "DESTINATION", key: "destination", width: 30 },
        { header: "CREATED AT", key: "createdAt", width: 30 },
    ]

    // Looping through User data
    let counter = 1;
    withdrawHistoryData.forEach((user) => {
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
    exportWithdraw: exportWithdraw
}