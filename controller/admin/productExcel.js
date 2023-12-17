import { Workbook } from "exceljs";
import { __esModule } from '@babel/register/lib/node';
import { responseHandler } from '../../common/response'
import productModel from '../../model/product/product'/* inventory */
import userModel from '../../model/user/user'
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

const exportProduct = async (req, res) => {
    const { price } = req.params
    var products = [];
    if (price == 'mini') {
        let data = await productModel.find({ productStatus: "Completed", title: 'MINI PACK' });
        for (let index = 0; index < data.length; index++) {
            let user = await userModel.findOne({ _id: data[index].userId });
            let dataNew = JSON.stringify(data[index])
            let product = JSON.parse(dataNew)
            product.email = user.email,
                product.username = user.username,
                product.firstName = user.firstName,
                product.lastName = user.lastName,
                products.push(product)
        }
    }
    else if (price == 'Completed') {
        let data = await productModel.find({ productStatus: "Completed", title: { $ne: 'MINI PACK' } })
        for (let index = 0; index < data.length; index++) {
            let user = await userModel.findOne({ _id: data[index].userId });
            let dataNew = JSON.stringify(data[index])
            let product = JSON.parse(dataNew)
            product.email = user.email,
                product.username = user.username,
                product.firstName = user.firstName,
                product.lastName = user.lastName,
                products.push(product)
        }
    }
    else {
        let amt = parseInt(req.params.price)
        let data = await productModel.find({ price: amt });
        for (let index = 0; index < data.length; index++) {
            let user = await userModel.findOne({ _id: data[index].userId });
            let dataNew = JSON.stringify(data[index])
            let product = JSON.parse(dataNew)
            product.email = user.email,
                product.username = user.username,
                product.firstName = user.firstName,
                product.lastName = user.lastName,
                products.push(product)
        }
    }
   if(products.length<1){
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
        { header: "PACKAGE NAME", key: "title", width: 10 },
        { header: "AMOUNT", key: "price", width: 10 },
        { header: "TOTAL REWARDS", key: "totalRewards", width: 10 },
        { header: "PENDING REWARD", key: "pendingReward", width: 10 },
        { header: "ROI", key: "roi", width: 10 },
        { header: "DAILY PASSIVE REWARD", key: "dailyReward", width: 10 },
        { header: "STATUS", key: "productStatus", width: 10 },
        { header: "ACTIVE FROM", key: "createdAt", width: 10 },
    ]

    // Looping through User data
    let counter = 1;
    products.forEach((user) => {
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
    exportProduct: exportProduct
}