import { responseHandler } from '../../common/response';
import { verifyEmail, createJwt, sendMail } from '../../common/function'
import userModel from '../../model/user/user';
import tokenModel from '../../model/commonModel/token';
// import user from '../../model/User/user.js';
// import { angular_host, angular_port } from '../../enviornment/config';
/* To verify the user Email */
const check_Link_for_emailVerified = async (req, res) => {
    try {
        const userObj = await userModel.findOne({ email: req.user });
        if (userObj.emailVerified == true) return responseHandler(res, 406, "Email Id Already Verified.");
        const data = await tokenModel.findOne({ userId: userObj._id, type: 'EMAILV' });
        if (!data) return responseHandler(res, 404, "Invalid Token");
        if (data.otp != req.body.otp) return responseHandler(res, 404, "Invalid OTP");
        else {
            const test = await userModel.findOneAndUpdate({ _id: userObj._id }, { $set: { emailVerified: true } }, { new: true })
            return responseHandler(res, 200, "Congratulation ! Your email is successfully verified ! ")
        }
    }
    catch (e) {
        return responseHandler(res, 500, e)
    }
}
/* When user not verify his email then send again email for verification */
const resendMail_For_Verify_Email = async (req, res) => {
    if (!req.body.emailId) return responseHandler(res, 400, "Bad Request")
    try {
        let check__id_exist = (await userModel.findOne({ email: req.body.emailId }))
        if (!check__id_exist) return responseHandler(res, "404", "Invalid Credentials")
        let tokenExist = await tokenModel.findOne({ userId: check__id_exist._id, type: "EMAILV" })
        if (tokenExist) return responseHandler(res, "462", "Please Try After Ten Minutes.")
        let token = await createJwt(check__id_exist._id) //generate jwt
        let link = await verify_Email_Html(token)
        await tokenModel.create({ userId: check__id_exist._id, token: token, type: "EMAILV" })/* Save Token to user Corresponding  */
        sendMail(check__id_exist.email, "Growmaxx Finance Email Verification Link", null)
        return responseHandler(res, 200, "Email Verification Link has been sent successfully")
    }
    catch (e) {
        return responseHandler(res, 500, e)
    }
}

const verifyToken = async (req, res) => {
    try {
        return responseHandler(res, 200, "Ok")
    }
    catch (e) {
        return responseHandler(res, 500, e)
    }
}

module.exports = {
    verifyEmail: check_Link_for_emailVerified,
    resendMail_For_Verify_Email: resendMail_For_Verify_Email,
    verifyToken: verifyToken
}