import userModel from '../../model/user/user.js';
import { responseHandler } from '../../common/response';
import tokenModel from '../../model/commonModel/token'
import { sendMail, tenMinutesJwt, verifyEmail, bcrypt, bcryptVerify, verifyJwtToken, createJwt } from '../../common/function';
import { host, fontend_host } from '../../envirnoment/config.js';
//import { angular_host, angular_port } from '../../enviornment/config';


/* Forgot Password */
const forgotPassword = async (req, res) => {
    if (!req.body.email) return responseHandler(res, 400, "Bad Request")
    try {
        const user = await userModel.findOne({ email: req.body.email })
        if (!user) return responseHandler(res, 404, "Invalid Email")
        const token = await createJwt(req.body.email, res)
        /* check Reset password Link is already send .then Send A next link after Ten Minutes. */
        const checkToken = await check_token_exist(user._id, token)
        const link = await forgotPassword_HTML(token)
        sendMail(user.email, "Growmaxx Finance Reset Password Link", null, link)

        return responseHandler(res, 200, "A reset password link sent to your Email.")
    }
    catch (e) {
        console.log(e)
        return responseHandler(res, 500, "Internal Server Error.", e)
    }
}


/* check Reset Link is valid or not */
const checkResetLink = async (req, res) => {
    try {
        let tokenObj = await tokenModel.findOne({ token: req.params.token })
        if (tokenObj == null) {
            return responseHandler(res, 400, "This link does not exist.")
        }
        else {
            let check = await verifyEmail(req, res)
            return responseHandler(res, 200, "OK")
        }
    }
    catch (e) {
        if (e == "TokenExpiredError") return responseHandler(res, 500, "Link has been expired.", e)
        return responseHandler(res, 500, "Internal Server Error.", e)
    }
}

/* Reset Password Call */
const resetPassword = async (req, res) => {
    if (!req.body.confirmPassword || !req.body.newPassword || !req.params.token) return responseHandler(res, 400, "Bad Request")
    try {
        let tokenObj = await tokenModel.findOne({ token: req.params.token })
        if (tokenObj == null) {
            return responseHandler(res, 406, "This link does not exist.")
        }
        let token = await verifyEmail(req, res) //verify JWt and get email from token
        if (req.body.confirmPassword != req.body.newPassword) return responseHandler(res, 400, "Password and Confirm Password should be same.")
        let new_bcr = await bcrypt(req.body.newPassword)
        let user_obj = await userModel.findOneAndUpdate({ email: token }, { $set: { password: new_bcr } }, { new: true })
        if (!user_obj) return responseHandler(res, 404, "Invalid Credentials.")
        /* Reset Password Html */
        let link = await reset_password_html(user_obj)
        sendMail(user_obj.email, "Your Growmaxx Finance Password has been Reset", null, link)
        await tokenModel.deleteOne({ token: req.params.token }) // delete token 
        return responseHandler(res, 200, "OK")
    }
    catch (e) {
        return responseHandler(res, 500, "Internal Server Error.", e)
    }
}

/* Change Password call inside account options */
const changePassword = async (req, res) => {
    let user_id = await verifyJwtToken(req, res)
    if (!req.body.oldPassword || !req.body.newPassword || !req.body.confirmPassword) return responseHandler(res, 400, "Bad Request")
    const { oldPassword, newPassword, confirmPassword } = req.body
    if (newPassword != confirmPassword) return responseHandler(res, 406, "Password and Confirm Password should be same.")
    try {

        let user_obj = await userModel.findOne({ _id: user_id });
        let check_password = await bcryptVerify(oldPassword, user_obj.password) //match the old password and real password
        if (!check_password) return responseHandler(res, 404, "Current password is not correct.")
        else {
            let check_password_not_repeat_last_time = await bcryptVerify(newPassword, user_obj.password)
            if (check_password_not_repeat_last_time) return responseHandler(res, 403, "Oh! Please try a different password.")
            let new_password_bcr = await bcrypt(newPassword)
            let test = (await userModel.findOneAndUpdate({ _id: user_id }, { $set: { password: new_password_bcr } })) || (await vendorModel.findOneAndUpdate({ _id: user_id }, { $set: { password: new_password_bcr } })) || (await customerModel.findOneAndUpdate({ _id: user_id }, { $set: { password: new_password_bcr } })) //update the password with new one
            let link = await change_password_html(user_obj)
            sendMail(user_obj.email, "Your Growmaxx Finance Password has been Changed", null, link)
            return responseHandler(res, 200, "You have changed your password successfully.")
        }
    }
    catch (e) {
        console.log("Error ===>", e)
        return responseHandler(res, 500, e)
    }
}
/* check token Exist then not send link on user email Id */
const check_token_exist = (userId, token) => {
    return new Promise(async (resolve, reject) => {
        try {
            let tokenPassV = await tokenModel.findOne({ userId: userId, type: "PASSV" })
            if (tokenPassV != null) {
                await tokenModel.deleteOne({ userId: userId, type: "PASSV" })
            }
            const otp = Math.floor(100000 + Math.random() * 900000);
            await tokenModel.create({ userId: userId, type: "PASSV", otp: otp, token: token })
            resolve(true)
        }
        catch (e) {
            reject(e)
        }
    })
}
module.exports = {
    forgotPassword: forgotPassword,
    checkResetLink: checkResetLink,
    resetPassword: resetPassword,
    changePassword: changePassword
}




/*********************************************************************************************************************************************************/
/* HTML Template for forgot password */
const forgotPassword_HTML = (token) => {
    let link = '<html> <body> <div bgcolor="#f3f3f3" style="background-color:#f3f3f3"> <table width="650" bgcolor="#ffffff" border="0" align="center" cellpadding="0" cellspacing="0" style="color:#000;font-family:Lato,Helvetica Neue,Helvetica,Arial,sans-serif;"> <tbody> <tr> <td height="30" bgcolor="#f3f3f3"></td></tr><tr> <td height="102" align="center" style="border-bottom:1px solid #eaeaea;"> <img src="https://growmaxxprofits.com/wp-content/uploads/2023/01/FLG.svg" style="width:100px" alt="Growmaxx" class="CToWUd"> </td></tr><tr> <td valign="top"> <table width="100%" border="0" cellpadding="30" cellspacing="0" style="font-size:14px"> <tbody> <tr> <td> <div> <p style="font-size:16px">Dear concern,</p><div style="color:#333;font-size:14px"> <p style="color:#333">Please use the link below to complete the process of changing your password for Growmaxx. </p><p>Click <a style="color:#0099cc;text-decoration:none" href="' + host + '/reset-password/' + token + '">here</a> to reset your password</p><p> If you did not try to reset your password, feel free to ignore this message. If you have any additional questions, feel free to reach out to us at info@growmaxx.com.</p><p>The Growmaxx Team </p></div></div></td></tr></tbody> </table> </td></tr><tr> <td height="40" align="center" valign="bottom" style="font-size:12px;color:#999"> © 2023 -Growmaxx. All Rights Reserved. </td></tr><tr> <td height="30"></td></tr><tr> <td height="30" bgcolor="#f3f3f3"></td></tr></tbody> </table> </div></body></html>';
    return link;
}

/* Changed password HTML  */
const change_password_html = () => {
    let link = ""
    link = '<p>You have SuccessFully changed Your Growmaxx Password<p>'
    return link;
}
/* Reset Password HTML. When user has been successfully reset his password */
const reset_password_html = () => {
    let link = ""
    link = '<p>You have SuccessFully Reset Your Growmaxx Password<p>'
    return link;
}
