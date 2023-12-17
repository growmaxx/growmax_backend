import packagesModel from '../../model/package/package'/* inventory */
import depositModel from '../../model/admin/deposit'/* inventory */
import { __esModule } from '@babel/register/lib/node';
import { responseHandler } from '../../common/response'
import levelModel from '../../model/rewards/level';

/****   Add  Package *****/
const addPackage = async (req, res) => {
    const { name, price, roi, maxPay, internalPackage} = req.body; // destructuring 
    if (!name || !price ||  !roi || !maxPay ) {
        return responseHandler(res, 400, "Bad request")
    }
    try {
        await packagesModel.create(req.body) /* create user object */
        return responseHandler(res, 200, "Package added successfully")
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}


/****   Add  Level *****/
const addLevel = async (req, res) => {
    const { direct, level, rewardPersentage, rankRequied} = req.body; // destructuring 
    if (!direct || !level ||  !rewardPersentage ) {
        return responseHandler(res, 400, "Bad request")
    }
    try {
        await levelModel.create(req.body) /* create user object */
        return responseHandler(res, 200, "Level added successfully")
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}


/****   Update  Package *****/
const updatePackage = async (req, res) => {
    const { name, price, roi, maxPay, internalPackage, packageId} = req.body; // destructuring 
    if (!name || !price ||  !roi || !maxPay || !packageId) {
        return responseHandler(res, 400, "Bad request")
    }
    try {
        let roleData = await packagesModel.updateOne({ _id: packageId },{ $set: {name:name , price: price , roi: roi , maxPay: maxPay } } );
        return responseHandler(res, 200, "Package updated successfully.")
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}

module.exports = {
    addPackage: addPackage,
    addLevel:addLevel,
    updatePackage:updatePackage
};