import twoFA from '../../model/user/gauth';
import { __esModule } from '@babel/register/lib/node';
import { responseHandler } from '../../common/response';
import { generateSecretKeyForQrCode, generateQrCode, verifyQrCode, bcryptVerify, verifyJwtToken, sendMail } from '../../common/function'
import userModel from '../../model/user/user';
import resetTwoFARequestModel from '../../model/admin/twoFaReset';
module.exports = {
    /* Generate QR Code Call  When User want to enable GAuth*/
    generateQrCode: async (req, res) => {
        if (!req.body.user_id || !req.body.email_id) return responseHandler(res, 400, "Bad Request")
        try {
            let userObj = await userModel.findOne({ _id: req.body.user_id })
            if (!userObj) return responseHandler(res, 404, "Invalid Credentials")
            if (userObj.twoFaStatus) return responseHandler(res, 404, "Two FA already Enabled")
            let check_twoFA_obj_exist = await twoFA.findOne({ userId: req.body.user_id })
            /* check userTwoFaObj has exist */
            if (check_twoFA_obj_exist) {
                /* If secret Key Exist */
                if (check_twoFA_obj_exist.secretKeyForGAuth) {
                    let qr = await generateQrCode(req, check_twoFA_obj_exist.secretKeyForGAuth)
                    return responseHandler(res, 200, "OK", { qr: qr, secret: check_twoFA_obj_exist.secretKeyForGAuth.base32 })
                }
                /* if secret key is not Exist */
                else {
                    let secretKey = await generateSecretKeyForQrCode()
                    let qr = await generateQrCode(req, secretKey)
                    await twoFA.updateOne({ userId: req.body.user_id }, { $set: { secretKeyForGAuth: secretKey } })
                    return responseHandler(res, 200, "OK", { qr: qr, secret: secretKey.base32 })
                }
            }
            /* if Two FA obj is not exist with user then create  */
            else {
                let secretKey = await generateSecretKeyForQrCode()
                let qr = await generateQrCode(req, secretKey)
                let newObj = await twoFA.findOneAndUpdate({ userId: req.body.user_id }, { $set: { secretKeyForGAuth: secretKey, userId: req.body.user_id } }, { upsert: true, new: true })
                let test = await userModel.findOneAndUpdate({ _id: req.body.user_id }, { $set: { twoFaPopulate: newObj._id } })
                return responseHandler(res, 200, "OK", { qr: qr, secret: secretKey.base32 })
            }
        }
        catch (e) {
            return responseHandler(res, 500, e)
        }
    },

    /* To Verify QR Code number [ 1-> if body has status key then update that value Otherwise only check Gauth code is valid or not  */
    verifyQrCode: async (req, res) => {
        console.log("###==>", req.body)
        if (!req.body.user_id || !req.body.token) return responseHandler(res, 400, "Bad Request")
        try {
            let userObj = await userModel.findOne({ _id: req.body.user_id })
            if (!userObj) return responseHandler(res, 404, "Invalid Credentials.")
            let twoFAObj = await twoFA.findOne({ userId: req.body.user_id })
            let Verify = await verifyQrCode(req.body.token, twoFAObj.secretKeyForGAuth)
            if (Verify) {
                await twoFA.updateOne({ userId: req.body.user_id }, { $set: { enableDisbaleGAuth: true, updatedAt: Date.now() } })
                let a = await userModel.updateOne({ _id: req.body.user_id }, { $set: { twoFaStatus: true, updatedAt: Date.now() } })
                const link = twoFA_HTML(userObj.username)
                sendMail(userObj.email, "[Growmaxx] Security update", "", link) /* TwoFA Enable mail send */
                return responseHandler(res, 200, "OK")
            }
            else return responseHandler(res, 481, "Invalid Code.")
        }
        catch (e) {
            console.log("verify Qr Code Error ==>", e)
            return responseHandler(res, 500, e)
        }
    },

    /* Disable GAuth   */
    disableGAuth: async (req, res) => {
        try {
            let userObj = await userModel.findById({ _id: req.body.user_id })
            let check_password = await bcryptVerify(req.body.password, userObj.password)
            if (check_password == false) return responseHandler(res, 404, "Invalid Password.")
            await twoFA.findOneAndUpdate({ userId: req.body.user_id }, { $set: { enableDisbaleGAuth: false } }, { new: true })
            return responseHandler(res, 200, "GAuth has been Disabled.")
        }
        catch (e) {
            return responseHandler(res, 500, e)
        }
    },

    /* Verify GAuth Code..  When There is no need of Gauth middleware but Gauth is enabled . So this api call from front End and check Gauth is correct or not . If correct then hit the next call in success Response. */
    verifyGAuthCode: async (req, res) => {
        if (!req.body.user_id || !req.body.token) return responseHandler(res, 400, "Bad Request.")
        try {
            let twoFAObj = await twoFA.findOne({ userId: req.body.user_id })
            let Verify = await verifyQrCode(req.body.token, twoFAObj.secretKeyForGAuth)
            if (Verify) return responseHandler(res, 200, "OK")
            return responseHandler(res, 481, "Invalid Code.")
        }
        catch (e) {
            return responseHandler(res, 500, e)
        }
    },

    resetRequestForTwoFa: async (req, res) => {
        let info = await verifyJwtToken(req, res)
        try {
            let user = await userModel.findById({ _id: info }, { __v: 0, password: 0, createdAt: 0, updatedAt: 0 })
            if (!user) {
                return responseHandler(res, 400, "User doesn't exist")
            }
            let resetUserData = await resetTwoFARequestModel.findOne({ userId: info });
            if (!resetUserData) {
                let data = {
                    attempt: 1,
                    status:"PENDING",
                    userId: info,
                    username: user.username,
                    email: user.email
                }
                await resetTwoFARequestModel.create(data);
            }
            else if(resetUserData && resetUserData.status=="PENDING") {

                return responseHandler(res, 407, "Your Two FA reset request is already sent to admin!")
            }
            else {
                await resetTwoFARequestModel.findOneAndUpdate({userId: info},{attempt: (resetUserData.attempt+1), status:"PENDING"});
            }
            const link = twoFA_Reset_HTML(user.username)
            //sendMail(userObj.email, "[Growmaxx] Security update", "", link) /* TwoFA Enable mail send */
            return responseHandler(res, 200, "OK");
        }
        catch (e) {
            return responseHandler(res, 500, e)
        }
    },

    resetRequestForTwoFaStatus: async (req, res) => {
        let info = await verifyJwtToken(req, res)
        try {
            let resetUserData = await resetTwoFARequestModel.findOne({ userId: info });
            if (!resetUserData) {
                return responseHandler(res, 200, "OK", {status:0});
            }
            else {
                return responseHandler(res, 200, "OK", resetUserData);
            }
        }
        catch (e) {
            return responseHandler(res, 500, e)
        }
    },
}


const twoFA_HTML = (username) => {
    let link = '<html> <body> <div bgcolor="#f3f3f3" style="background-color:#f3f3f3"> <table width="650" bgcolor="#ffffff" border="0" align="center" cellpadding="0" cellspacing="0" style="color:#000;font-family:Lato,Helvetica Neue,Helvetica,Arial,sans-serif;"> <tbody> <tr> <td height="30" bgcolor="#f3f3f3"></td></tr><tr> <td height="102" align="center" style="border-bottom:1px solid #eaeaea;"> <img src="https://growmaxxprofits.com/wp-content/uploads/2023/01/FLG.svg" style="width:100px" alt="Growmaxx" title="Growmaxx" style="display:block" class="CToWUd"> </td></tr><tr> <td valign="top"> <table width="100%" border="0" cellpadding="30" cellspacing="0" style="font-size:14px"> <tbody> <tr> <td> <div> <p style="font-size:16px">Dear ' + username + ',</p><div style="color:#333;font-size:14px"> <p style="color:#333">Two Factor Authentication successfully Enabled!.</p> <br><p>The Growmaxx Team </p></div></div></td></tr></tbody> </table> </td></tr><tr> <td height="40" align="center" valign="bottom" style="font-size:12px;color:#999"> © 2023 -Growmaxx. All Rights Reserved. </td></tr><tr> <td height="30"></td></tr><tr> <td height="30" bgcolor="#f3f3f3"></td></tr></tbody> </table> </div></body></html>';
    return link;
}

const twoFA_Reset_HTML = (username) => {
    let link = '<html> <body> <div bgcolor="#f3f3f3" style="background-color:#f3f3f3"> <table width="650" bgcolor="#ffffff" border="0" align="center" cellpadding="0" cellspacing="0" style="color:#000;font-family:Lato,Helvetica Neue,Helvetica,Arial,sans-serif;"> <tbody> <tr> <td height="30" bgcolor="#f3f3f3"></td></tr><tr> <td height="102" align="center" style="border-bottom:1px solid #eaeaea;"> <img src="https://growmaxxprofits.com/wp-content/uploads/2023/01/FLG.svg" style="width:100px" alt="Growmaxx" title="Growmaxx" style="display:block" class="CToWUd"> </td></tr><tr> <td valign="top"> <table width="100%" border="0" cellpadding="30" cellspacing="0" style="font-size:14px"> <tbody> <tr> <td> <div> <p style="font-size:16px">Dear ' + username + ',</p><div style="color:#333;font-size:14px"> <p style="color:#333">Two Factor Authentication Reset request sent to Admin!.</p><p>Our team will update the TWO-FA reset status with 24 hours. </p> <br><p>The Growmaxx Team </p></div></div></td></tr></tbody> </table> </td></tr><tr> <td height="40" align="center" valign="bottom" style="font-size:12px;color:#999"> © 2023 -Growmaxx. All Rights Reserved. </td></tr><tr> <td height="30"></td></tr><tr> <td height="30" bgcolor="#f3f3f3"></td></tr></tbody> </table> </div></body></html>';
    return link;
}