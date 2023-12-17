import userModel from '../../model/user/user'/* To Create user */
import { __esModule } from '@babel/register/lib/node';
import { responseHandler } from '../../common/response'
import { bcrypt, bcryptVerify, createJwt, createJwtOtp, createJwtPay,  sendMail, verifyJwtToken} from '../../common/function';
import tokenModel from '../../model/commonModel/token';
import { host, angular_port, fontend_host} from '../../envirnoment/config';
import walletModel from '../../model/rewards/wallet'

const signUp = async (req, res) => {
    const { firstName, lastName, email, username, password, referralCode, countryCode, country, phoneNumber} = req.body; // destructuring 
    if (!firstName || !lastName || !email || !username || !password || !referralCode || !countryCode || !country || !phoneNumber){ 
        return responseHandler(res, 400, "Bad request")
    }
    try {
        if(email.slice(-10) != "@gmail.com") return responseHandler(res, 403, "Please Enter only Gmail ID")
        let check_email_exist = await userModel.findOne({ email: email })
        if (check_email_exist) return responseHandler(res, 403, "email already exist")
        let check_username_exist = await userModel.findOne({ username: username })
        if (check_username_exist) return responseHandler(res, 403, "Username already exist")
        let check_referral_exist = await userModel.findOne({ username: referralCode,  paymentStatus: true})
        if (!check_referral_exist) return responseHandler(res, 403, "Referral ID doesn't exist")
         /* 1: Admin // 2: Employee // 3:Customer //4: production head*/
        req.body.password =await bcrypt(password) 
        const result = await userModel.create(req.body) /* create user object */
        await walletModel.create({userId: result._id});
        const otp= Math.floor(100000 + Math.random() * 900000);
        const token = await createJwtPay({userUniquePayEmail:result.email}); /* generate jwt */
        /* mail sending process */
        const link = '<html lang="en"><head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title></title></head><body style="margin: 0; background: #ccc;"> <center class="wrapper" style="width: 100%; background: #ccc; table-layout: fixed; padding-bottom: 60px;"> <table style="border-spacing: 0; background-color: #f4f4f4; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: sans-serif; color: #313131; padding: 41px 45px;" class="main" width="100%"> <tr> <td style="padding: 0;"> <table style="border-spacing: 0;" width="100%"> <tr> <td style="text-align: center;"> <a href="#"><img style="border: 0;" src="https://growmaxxfinance.com/assets/images/1.svg" alt="Logo" title="Logo" width="160px"></a> </td></tr></table> </td></tr><tr> <td style="padding: 0;">          <table style="border-spacing: 0; margin-top: 45px; margin-bottom: 40px;" width="100%" class="content-box"> <tr> <td style="background-color: #FFF; padding: 42px 33px; border-radius: 19px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;"> <table> <tr align="center"> <td align="center" style="display: flex; align-items: center; justify-content: center; width: 100%;"> <img style="border: 0; margin-bottom: 35px;" src="https://i.ibb.co/sWGPxwg/img.png" alt="Envelop" title="envelop"> </td></tr><tr> <td> <p style="text-align: center; font-size: 16px; line-height: 38px; font-weight: 500; color: #868686; margin: 0;">Welcome to Growmaxx Finance</p></td></tr><tr> <td> <h3 style="text-align: center; font-size: 30px; color: #313131; font-weight: 800; margin: 0;">Hello User!</h3>'+
        '</td></tr><tr> <td style="width: 100%; display: flex; align-items: center; justify-content: center; margin-bottom: 30px;"> <p style="font-size: 14px; line-height: 19px; color: #B5B5B5; margin: 0; width: 85%; margin-top: 10px;">Thanks for registering on Growmaxx Finance. Please verify your email to log in and access the Growwmaxx.</p></td></tr><tr align="center"> <td align="center" style="display: flex; justify-content: center;"> <table align="center"> <tr align="center"> <td style="padding: 16px 56px; background: #F06D39; margin-top: 40px; border-radius: 10px; max-width: 350px; width: fit-content;"> <div style="color: #FFF; font-size: 23px; line-height: 29px; font-weight: 800; text-decoration: none; ">'+otp+'</div> </td></tr></table> </td></tr><tr> <td style="width: 100%; display: flex; align-items: center; justify-content: center;"> <p style="font-size: 12px; line-height: 19px; color: #B5B5B5; width: 85%; margin-top: 30px; text-align: center;"> Not the right person to receive these updates? Forward this email to a colleague to <a href="#" target="_blank" style="font-size: 12px; line-height: 19px; color: #B5B5B5; text-decoration: none;"> sign up</a> for Notification.</p></td></tr></table> </td></tr></table> </td></tr><tr> <td style="padding: 0;">'+
        '<p style="font-size: 12px; color: #B5B5B5; text-align: center; margin-bottom: 0;"></p></td></tr><tr> <td style="padding: 0;"> <p style="font-size: 12px; color: #B5B5B5; text-align: center; margin-bottom: 0; margin-top: 4px;"> <a href="#" style="font-size: 12px; color: #B5B5B5; text-align: center; text-decoration: none;">Unsubscribe</a> | <a href="#" target="_blank" style="font-size: 12px; color: #B5B5B5; text-align: center; text-decoration: none;">Manage Preferences</a></p></td></tr><tr> <td style="padding: 0;"> <p style="font-size: 12px; line-height: 21px; text-align: center; margin: 15px 0 0; color: #B5B5B5;"> Copyright © 2023 Growmaxx Finance, All rights reserved.</p></td></tr></table> </center> </body></html>';
        sendMail(email, "[Growmaxx Finance] Confirm Your Registration From " + " " + new Date() + "", "", link) /* verification mail send */
        await tokenModel.create({ userId: result._id, token: token, otp:otp, type: "EMAILV"})/* Save Token to user Corresponding  */ 
        return responseHandler(res, 200, "New Customer successfully registered.", token)
    }
    catch (e) {
        console.log("Error :=>", e)
        return responseHandler(res, 500, e)
    }
}


const signIn = async (req, res) => {
    if (!req.body.email || !req.body.password) return responseHandler(res, 400, "Bad Request")
    try {
        var user = await userModel.findOne({ email: req.body.email }, { createdAt: 0, updatedAt: 0, __v: 0 })
        if (!user) return responseHandler(res, 404, "User doesn't Exist.")
        let verified = await bcryptVerify(req.body.password, user.password)
        if (verified == false) return responseHandler(res, 404, "Invalid Password")
        else if(user.status == false) return responseHandler(res, 403, "Your account is blocked ! Contact to Admin")
        else if (user.emailVerified == false) {
            /* Check What Type of Link Send To user  */
            const tokens = await sendMailForEmailVerification(user._id, user.email, res)
            return responseHandler(res, 461, "Please Verify Your Mail.", {token : tokens })
        }
        else if (!user.phoneNumber) {
            /* Check What Type of Link Send To user  */
            let token = await createJwt({userUniqueId: user._id,userUniqueEmail: user.email} )    
            return responseHandler(res, 202, "Please update contact info", token)
        }
        else if (user.paymentStatus == false) {
            let token = await createJwtPay({userUniquePayEmail: user.email})     
            return responseHandler(res, 201, "Please select your plan", token)
        }
        else if (verified == true && user.status == true && user.paymentStatus == true){ 
            const token = await createJwtOtp({userUniqueOtpId: user._id, userUniqueOtpEmail: user.email}); /* generate jwt */
            await sendMailForEmailVerify(user._id, user.email, token, "VERIV" ) ;
           return responseHandler(res, 200, "OTP sent on your registered email Id.", token)        
        }
    }
    catch (e) {
        console.log("error =>", e)
        return responseHandler(res, 500, e)
    }
}

/* Send Mail At SignIn Time if User has Expired Email Verification Link */
const sendMailForEmailVerification = async (userId, email, res) => {
    return new Promise(async (resolve, reject) => {
        try {
            const tokenObj = await tokenModel.findOne({ userId: userId, type: "EMAILV" })
            if (tokenObj) return resolve(tokenObj.token)
            const token = await createJwt({userUniqueOtpId: userId, userUniqueOtpEmail: email} ); /* generate jwt */
            const otp= Math.floor(100000 + Math.random() * 900000);
            const link = '<html lang="en"><head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title></title></head><body style="margin: 0; background: #ccc;"> <center class="wrapper" style="width: 100%; background: #ccc; table-layout: fixed; padding-bottom: 60px;"> <table style="border-spacing: 0; background-color: #f4f4f4; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: sans-serif; color: #313131; padding: 41px 45px;" class="main" width="100%"> <tr> <td style="padding: 0;"> <table style="border-spacing: 0;" width="100%"> <tr> <td style="text-align: center;"> <a href="#"><img style="border: 0;" src="https://growmaxxfinance.com/assets/images/1.svg" alt="Logo" title="Logo" width="160px"> </a> </td></tr></table> </td></tr><tr> <td style="padding: 0;">          <table style="border-spacing: 0; margin-top: 45px; margin-bottom: 40px;" width="100%" class="content-box"> <tr> <td style="background-color: #FFF; padding: 42px 33px; border-radius: 19px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;"> <table> <tr align="center"> <td align="center" style="display: flex; align-items: center; justify-content: center; width: 100%;"> <img style="border: 0; margin-bottom: 35px;" src="https://i.ibb.co/sWGPxwg/img.png" alt="Envelop" title="envelop"> </td></tr><tr> <td> <p style="text-align: center; font-size: 16px; line-height: 38px; font-weight: 500; color: #868686; margin: 0;">Welcome to Growmaxx Finance</p></td></tr><tr> <td> <h3 style="text-align: center; font-size: 30px; color: #313131; font-weight: 800; margin: 0;">Hello User!</h3>'+
            '</td></tr><tr> <td style="width: 100%; display: flex; align-items: center; justify-content: center; margin-bottom: 30px;"> <p style="font-size: 14px; line-height: 19px; color: #B5B5B5; margin: 0; width: 85%; margin-top: 10px;">Thanks for registering on Growmaxx Finance. Please verify your email to log in and access the Growwmax.</p></td></tr><tr align="center"> <td align="center" style="display: flex; justify-content: center;"> <table align="center"> <tr align="center"> <td style="padding: 16px 56px; background: #F06D39; margin-top: 40px; border-radius: 10px; max-width: 350px; width: fit-content;"> <div style="color: #FFF; font-size: 23px; line-height: 29px; font-weight: 800; text-decoration: none; ">'+otp+'</div> </td></tr></table> </td></tr><tr> <td style="width: 100%; display: flex; align-items: center; justify-content: center;"> <p style="font-size: 12px; line-height: 19px; color: #B5B5B5; width: 85%; margin-top: 30px; text-align: center;"> Not the right person to receive these updates? Forward this email to a colleague to <a href="#" target="_blank" style="font-size: 12px; line-height: 19px; color: #B5B5B5; text-decoration: none;"> sign up</a> for Notification.</p></td></tr></table> </td></tr></table> </td></tr>'+
            '<tr> <td style="padding: 0;"> <p style="font-size: 12px; line-height: 21px; text-align: center; margin: 15px 0 0; color: #B5B5B5;"> Copyright © 2023 Growmaxx Finance, All rights reserved.</p></td></tr></table> </center> </body></html>';
            await sendMail(email, "[Growmaxx Finance] Confirm Your Registration From " + " " + new Date() + "", "", link) /* verification mail send */
            resolve(token)
        }
        catch (e) {
            reject(e)
        }
    })
}

/* Send Mail At SignIn Time if User has Expired Email Verification Link */
const verifyLogin =  async (req, res) => {
    return new Promise(async (resolve, reject) => {
        try {
            var user = await userModel.findOne({ email:  req.user.userUniqueOtpEmail }, { createdAt: 0, updatedAt: 0, __v: 0 })
            if (!user) return responseHandler(res, 404, "User doesn't Exist.")
            const data = await tokenModel.findOne({ userId: user._id, type: 'VERIV' });
            if (!data) return responseHandler(res, 404, "Please enter Token");
            if (data.otp != req.body.otp) return responseHandler(res, 404, "Invalid OTP");
            if (user.emailVerified == true && user.status == true && user.paymentStatus == true){           
                await tokenModel.deleteMany({ userId: user._id, type: 'VERIV' });
                let token = await createJwt({userUniqueId: user._id, userUniqueEmail: user.email} )    
                return responseHandler(res, 200, "OK", {user, token})
           }
           else{
            return responseHandler(res, 500, "Something went wrong")
           }
        }
        catch (e) {
            reject(e)
        }
    })
}


const generateOtp =  async (req, res) => {
    try{
        console.log(" req.user.userUniqueEmail", req.user.userUniqueEmail);
        var user = await userModel.findOne({ email: req.user.userUniqueEmail }, { createdAt: 0, updatedAt: 0, __v: 0 })
        if (!user) return responseHandler(res, 404, "User doesn't Exist.")
        const token = await createJwtOtp({userUniqueOtpId: user._id, userUniqueOtpEmail: user.email}); /* generate jwt */
        await sendMailForEmailVerify(user._id, user.email, token, "WITHDRV" ) ;
       return responseHandler(res, 200, "OTP sent on your registered email Id.") 
    }
   catch(e){
    console.log("error =>", e)
    return responseHandler(res, 500, e)
   }
}

/* Send Mail At SignIn Time if User has Expired Email Verification Link */
const sendMailForEmailVerify = async (userId, email, token, type, res) => {
    return new Promise(async (resolve, reject) => {
        try {
            await tokenModel.deleteMany({ userId: userId, type: type });
            const otp= Math.floor(100000 + Math.random() * 900000);
            const link = '<html lang="en"><head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title></title></head><body style="margin: 0; background: #ccc;"> <center class="wrapper" style="width: 100%; background: #ccc; table-layout: fixed; padding-bottom: 60px;"> <table style="border-spacing: 0; background-color: #f4f4f4; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: sans-serif; color: #313131; padding: 41px 45px;" class="main" width="100%"> <tr> <td style="padding: 0;"> <table style="border-spacing: 0;" width="100%"> <tr> <td style="text-align: center;"> <a href="#"><img style="border: 0;" src="https://growmaxxfinance.com/assets/images/1.svg" alt="Logo" title="Logo" width="160px"></a> </td></tr></table> </td></tr><tr> <td style="padding: 0;">          <table style="border-spacing: 0; margin-top: 45px; margin-bottom: 40px;" width="100%" class="content-box"> <tr> <td style="background-color: #FFF; padding: 42px 33px; border-radius: 19px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;"> <table> <tr align="center"> <td align="center" style="display: flex; align-items: center; justify-content: center; width: 100%;"> <img style="border: 0; margin-bottom: 35px;" src="https://i.ibb.co/sWGPxwg/img.png" alt="Envelop" title="envelop"> </td></tr><tr> <td> <p style="text-align: center; font-size: 16px; line-height: 38px; font-weight: 500; color: #868686; margin: 0;">Welcome to Growmaxx Finance</p></td></tr><tr> <td> <h3 style="text-align: center; font-size: 30px; color: #313131; font-weight: 800; margin: 0;">Hello User!</h3>' +
            '</td></tr><tr> <td style="width: 100%; display: flex; align-items: center; justify-content: center; margin-bottom: 30px;"> <p style="font-size: 14px; line-height: 19px; color: #B5B5B5; margin: 0; width: 85%; margin-top: 10px;"> Please verify log in access of the Growwmaxx.</p></td></tr><tr align="center"> <td align="center" style="display: flex; justify-content: center;"> <table align="center"> <tr align="center"> <td style="padding: 16px 56px; background: #F06D39; margin-top: 40px; border-radius: 10px; max-width: 350px; width: fit-content;"> <div style="color: #FFF; font-size: 23px; line-height: 29px; font-weight: 800; text-decoration: none; ">' + otp + '</div> </td></tr></table> </td></tr><tr> <td style="width: 100%; display: flex; align-items: center; justify-content: center;"> <p style="font-size: 12px; line-height: 19px; color: #B5B5B5; width: 85%; margin-top: 30px; text-align: center;"> Not the right person to receive these updates? Forward this email to a colleague to <a href="#" target="_blank" style="font-size: 12px; line-height: 19px; color: #B5B5B5; text-decoration: none;"> sign up</a> for Notification.</p></td></tr></table> </td></tr></table> </td></tr><tr> <td style="padding: 0;">' +
            '<p style="font-size: 12px; color: #B5B5B5; text-align: center; margin-bottom: 0;"></p></td></tr><tr> <td style="padding: 0;"> <p style="font-size: 12px; color: #B5B5B5; text-align: center; margin-bottom: 0; margin-top: 4px;"> <a href="#" style="font-size: 12px; color: #B5B5B5; text-align: center; text-decoration: none;">Unsubscribe</a> | <a href="#" target="_blank" style="font-size: 12px; color: #B5B5B5; text-align: center; text-decoration: none;">Manage Preferences</a></p></td></tr><tr> <td style="padding: 0;"> <p style="font-size: 12px; line-height: 21px; text-align: center; margin: 15px 0 0; color: #B5B5B5;"> Copyright © 2023 Growmaxx Finance, All rights reserved.</p></td></tr></table> </center> </body></html>';
            sendMail(email, "[Growmaxx Finance] Verify Your account access " + " " + new Date() + "", "", link) /* verification mail send */
            await tokenModel.create({ userId: userId, token: token, otp:otp, type: type})/* Save Token to user Corresponding  */
            resolve(token)
        }
        catch (e) {
            reject(e)
        }
    })
}

/* User Info after Any changes in user Record And update the local Storage */
const userInfo = async (req, res) => {
    try {
        let info = await verifyJwtToken(req, res)
        let user = await userModel.findById({ _id: info }, { __v: 0, password: 0, createdAt: 0, updatedAt: 0})
        if(user){
            return responseHandler(res, 200, "OK", user);
        }
        else
        {
             return responseHandler(res, 400, "User doesn't exist")
        }
    }
    catch (e) { return responseHandler(res, 500, "Internal Server Error.", e) }
}

const verifyEmailId = async (req, res) =>{
    let check_email_exist = await userModel.findOne({ email: req.body.email })
    if (check_email_exist) return responseHandler(res, 403, "email already exist")
    else {
        return responseHandler(res, 200, "ok")
    }
}

const verifyUsername = async (req, res) =>{
    let check_username_exist = await userModel.findOne({ username: username })
    if (check_username_exist) return responseHandler(res, 403, "Username already exist")
    else 
    return responseHandler(res, 200, "ok")
}

const verifyReferral = async (req, res) =>{
    let check_referral_exist = await userModel.findOne({ username: req.body.referralCode })
    if (!check_referral_exist) return responseHandler(res, 403, "Referral ID doesn't exist")
    else 
    return responseHandler(res, 200, "ok", check_referral_exist)
}

const contactInfoUpdate = async (req, res) =>{
    const {country, phoneNumber, countryCode} = req.body;
    if (!country || !phoneNumber || !countryCode) return responseHandler(res, 400, "Bad Request")
    try {
        let info = await verifyJwtToken(req, res)
        let user = await userModel.findById({ _id: info }, { __v: 0, password: 0, createdAt: 0, updatedAt: 0})
        if (!user) return responseHandler(res, 404, "User doesn't Exist.")
        let userData = await userModel.updateOne({ _id: info}, { $set: { phoneNumber: phoneNumber, country: country, countryCode: countryCode } }) //update the password with new one
        return responseHandler(res, 200, "Contact Info updated Successfully", userData)
    }
    catch (e) {
        console.log("error =>", e)
        return responseHandler(res, 500, e)
    } 
}

module.exports = {
    signUp: signUp,
    signIn:signIn,
    userInfo:userInfo,
    verifyUsername:verifyUsername,
    verifyEmailId:verifyEmailId,
    verifyReferral: verifyReferral,
    contactInfoUpdate: contactInfoUpdate,
    verifyLogin:verifyLogin,
    generateOtp: generateOtp
}