import packagesModel from '../../model/package/package'/* inventory */
import { __esModule } from '@babel/register/lib/node';
import { responseHandler } from '../../common/response'
import levelModel from '../../model/rewards/level';
import depositModel from '../../model/admin/deposit'
var fs = require('fs');
  /****************************  fetching package  ************************/
const packages = async (req, res) => {
    try{
        const trial =  await packagesModel.find({ name: "Trial Pack"})
        const silver =  await packagesModel.find({ name: "Silver Pack"});
        const gold =  await packagesModel.find({ name: "Gold Pack"});
        const diamond =  await packagesModel.find({ name: "Diamond Pack"});
        return responseHandler(res, 200, "Packages Successfully fetched", {trial: trial, silver:silver,  gold:gold, diamond:diamond})             
    }    
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }  
  }

  const reBuy = async (req, res) => {
    try{
        const trial =  await packagesModel.find({ name: "Trial Pack"})
        const silver =  await packagesModel.find({ name: "Silver Pack"});
        const gold =  await packagesModel.find({ name: "Gold Pack"});
        const diamond =  await packagesModel.find({ name: "Diamond Pack"});
        const mini_pack =  await packagesModel.findOne({ name: "Mini Pack"})
        return responseHandler(res, 200, "Packages Successfully fetched", {trial: trial, silver:silver,  gold:gold, diamond:diamond, mini_pack:mini_pack})             
    }    
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }  
  }


  const level = async (req, res) => {
    try{
        const data =  await levelModel.findOne({direct: req.body.direct});
      
        return responseHandler(res, 200, "level Successfully fetched", data)             
    }    
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }  
  }

  const depositAddress = async (req, res) => {
    try {
        let deposit = await depositModel.findOne({createdAt: "2023-09-29T17:53:34.288Z"}, { _id:0, createdAt: 0, updatedAt: 0, __v: 0 }).sort({createdAt:-1});
        return responseHandler(res, 200, "fetched", deposit)         
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}


module.exports = {
    packages:packages,
    level:level,
    reBuy:reBuy,
    depositAddress:depositAddress
};
