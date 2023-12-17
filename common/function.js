var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcryptjs'));
var jwt = Promise.promisifyAll(require('jsonwebtoken'));
var nodemailer = Promise.promisifyAll(require('nodemailer'));
import { nodeMailerEmail, nodeMailerPass } from '../envirnoment/config';
import { responseHandler } from './response'
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import CryptoJS from "crypto-js";
import fs from 'fs';
module.exports = {
    /* To encrypt the password string */
    bcrypt: async (password) => {
        return new Promise(async (resolve, reject) => {
            try {
                let salt = await bcrypt.genSalt(10)
                let hash = await bcrypt.hash(password, salt)
                resolve(hash)
            }
            catch (e) {
                console.log("Error==>", e)
                reject(e)
            }
        })

    },
    /* To decrypt the password */
    bcryptVerify: async (password, dbPassword) => {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await bcrypt.compare(password, dbPassword))
            }
            catch (e) {
                reject(e)
            }
        })
    },

    /* To generate Auth token for checking every request */
    createJwt: async (payload) => {
        return new Promise(async (resolve, reject) => {
            try {
                var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(payload), 'CkfYl0WMXs6qDjhF8Qqg4sOtTVVjBbWDUy9tB5UnyfWuMxVJXaEhyFBNju22tpJY').toString();
                var privateKEY = fs.readFileSync('./certificate/private.key', 'utf8') 
                let token = jwt.sign({data:ciphertext} , privateKEY, { issuer: 'Growmaxx_Dashboard',  subject: 'test',  audience: 'https://growmaxxdashboard.com', expiresIn: '30m', algorithm: "RS256"});
                resolve(token)
            }
            catch (e) {
                reject(e)
            }

        })
    },

    /* To Validate the User is Authenticate Or working as a middleWare */
    verifyJwt: async (req, res, next) => {
       // console.log("req.headers ==> ", req.headers.authorization)
        try {
            if (!req.headers.authorization) return responseHandler(res, 401, "Unauthorized")
            else {
                const publicKEY = fs.readFileSync('./certificate/public.key', 'utf8')
                const decoded = jwt.verify(req.headers.authorization, publicKEY,{algorithm:"RS256"});
                var bytes  = CryptoJS.AES.decrypt(decoded.data, 'CkfYl0WMXs6qDjhF8Qqg4sOtTVVjBbWDUy9tB5UnyfWuMxVJXaEhyFBNju22tpJY');
                var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                req.user = decryptedData
                next()
            }
        }
        catch (e) {
            return responseHandler(res, 401, "Verification Token expired! Please login again!")
        }
    },

      /* To generate Auth token for checking every request */
      createJwtOtp: async (payload) => {
        return new Promise(async (resolve, reject) => {
            try {
                var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(payload), 'CkfYl0WMXs6qDjhF7Qqg4sOtTVVjBbWDUy5tB9UnyfWuMxVJXaEhyFBNju98tpZA').toString();
                var privateKEY = fs.readFileSync('./certificateOtp/private.key', 'utf8') 
                let token = jwt.sign({data:ciphertext} , privateKEY, { issuer: 'Growmaxx_Dashboard',  subject: 'test',  audience: 'https://growmaxxdashboard.com', expiresIn: '30m', algorithm: "RS256"});
                resolve(token)
            }
            catch (e) {
                reject(e)
            }

        })
    },

    /* To Validate the User is Authenticate Or working as a middleWare */
    verifyJwtOtp: async (req, res, next) => {
       // console.log("req.headers ==> ", req.headers.authorization)
        try {
            if (!req.headers.authorization) return responseHandler(res, 401, "Unauthorized")
            else {
                const publicKEY = fs.readFileSync('./certificateOtp/public.key', 'utf8')
                const decoded = jwt.verify(req.headers.authorization, publicKEY,{algorithm:"RS256"});
                var bytes  = CryptoJS.AES.decrypt(decoded.data, 'CkfYl0WMXs6qDjhF7Qqg4sOtTVVjBbWDUy5tB9UnyfWuMxVJXaEhyFBNju98tpZA');
                var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                req.user = decryptedData
                next()
            }
        }
        catch (e) {
            return responseHandler(res, 401, "Verification Token expired! Please login again!")
        }
    },


    /* To generate Auth token for checking every request */
    createJwtPay: async (payload) => {
        return new Promise(async (resolve, reject) => {
            try {
                var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(payload), 'CopYl0WMXs7qDjhF7Zqg8hOtTVVjBbWDUy9tB5UnyfWuMxVJXaEhyFBNju88tpJY').toString();
                var privateKEY = fs.readFileSync('./certificatePay/private.key', 'utf8') 
                resolve(jwt.sign({ data: ciphertext }, privateKEY, { expiresIn: '24h', algorithm: 'RS256'}));
            }
            catch (e) {
                reject(e)
            }

        })
    },

    /* To Validate the User is Authenticate Or working as a middleWare */
    verifyJwtPay: async (req, res, next) => {
       // console.log("req.headers ==> ", req.headers.authorization)
        try {
            if (!req.headers.authorization) return responseHandler(res, 401, "Unauthorized")
            else {
                const publicKEY = fs.readFileSync('./certificatePay/public.key', 'utf8')
                const decoded = jwt.verify(req.headers.authorization, publicKEY, { algorithm: 'RS256' });
                var bytes  = CryptoJS.AES.decrypt(decoded.data, 'CopYl0WMXs7qDjhF7Zqg8hOtTVVjBbWDUy9tB5UnyfWuMxVJXaEhyFBNju88tpJY');
                var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                req.user = decryptedData.userUniquePayEmail
                next()
            }
        }
        catch (e) {
            return responseHandler(res, 401, "Verification Token expired! Please login again!")
        }
    },

     /* To Validate the User is Authenticate Or working as a middleWare */
     verifyJwtTokenPay: async (req, res, next) => {
        // console.log("req.headers ==> ", req.headers.authorization)
        try {
            if (!req.headers.authorization) return responseHandler(res, 401, "Unauthorized")
            else {
                var publicKEY = fs.readFileSync('./certificatePay/public.key', 'utf8')
                let verifyToken = jwt.verify(req.headers.authorization, publicKEY, { algorithm: 'RS256' });
                var bytes  = CryptoJS.AES.decrypt(verifyToken.data, 'CopYl0WMXs7qDjhF7Zqg8hOtTVVjBbWDUy9tB5UnyfWuMxVJXaEhyFBNju88tpJY');
                var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                return decryptedData.userUniquePayId;
            }
        }
        catch (e) {
            console.log("JWT NOT Verify ==>", e)
            return responseHandler(res, 401, e)
        }
    },

    /* To generate Auth token for checking every request */
    createJwtAdmin: async (payload) => {
        return new Promise(async (resolve, reject) => {
            try {
                var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(payload), 'CkfYl0WMXs6qDjhF9Zqg4oOtTVVjBbWDUy9tB5UnyfWuMxVJXaEhyFBNju88tpJY').toString();
                var privateKEY = fs.readFileSync('./adminCertificate/private.key', 'utf8') 
                resolve(jwt.sign({ data: ciphertext }, privateKEY, { expiresIn: '30m', algorithm: 'RS256' }));
            }
            catch (e) {
                reject(e)
            }
        })
    },

    /* To Validate the User is Authenticate Or working as a middleWare */
    verifyJwtAdmin: async (req, res, next) => {
       // console.log("req.headers ==> ", req.headers.authorization)
        try {
            if (!req.headers.authorization) return responseHandler(res, 401, "Unauthorized")
            else {
                const publicKEY = fs.readFileSync('./adminCertificate/public.key', 'utf8')
                const decoded = jwt.verify(req.headers.authorization, publicKEY, { algorithm: 'RS256' });
                var bytes  = CryptoJS.AES.decrypt(decoded.data, 'CkfYl0WMXs6qDjhF9Zqg4oOtTVVjBbWDUy9tB5UnyfWuMxVJXaEhyFBNju88tpJY');
                var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                req.user = decryptedData.adminUniqueId
                next()
            }
        }
        catch (e) {
            return responseHandler(res, 401, "Verification Token expired! Please login again!")
        }
    },

      /* To Validate the User is Authenticate Or working as a middleWare */
      verifyJwtTokenAdmin: async (req, res, next) => {
        // console.log("req.headers ==> ", req.headers.authorization)
        try {
            if (!req.headers.authorization) return responseHandler(res, 401, "Unauthorized")
            else {
                var publicKEY = fs.readFileSync('./adminCertificate/public.key', 'utf8')
                let verifyToken = jwt.verify(req.headers.authorization, publicKEY, { algorithm: 'RS256' });
                var bytes  = CryptoJS.AES.decrypt(verifyToken.data, 'CkfYl0WMXs6qDjhF9Zqg4oOtTVVjBbWDUy9tB5UnyfWuMxVJXaEhyFBNju88tpJY');
                var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                return decryptedData.adminUniqueId;
            }
        }
        catch (e) {
            console.log("JWT NOT Verify ==>", e)
            return responseHandler(res, 401, e)
        }
    },

      /* To Validate the User is Authenticate Or working as a middleWare */
      verifyJwtToken: async (req, res, next) => {
        // console.log("req.headers ==> ", req.headers.authorization)
        try {
            if (!req.headers.authorization) return responseHandler(res, 401, "Unauthorized")
            else {
                var publicKEY = fs.readFileSync('./certificate/public.key', 'utf8')
                let verifyToken = jwt.verify(req.headers.authorization, publicKEY, { algorithm: 'RS256' });
                var bytes  = CryptoJS.AES.decrypt(verifyToken.data, 'CkfYl0WMXs6qDjhF8Qqg4sOtTVVjBbWDUy9tB5UnyfWuMxVJXaEhyFBNju22tpJY');
                var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                return decryptedData.userUniqueId;
            }
        }
        catch (e) {
            console.log("JWT NOT Verify ==>", e)
            return responseHandler(res, 401, e)
        }
    },
    /* Genearte Secret Key for validating QR code */
    generateSecretKeyForQrCode: async () => {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await speakeasy.generateSecret({ length: 10 }));
            }
            catch (e) { reject(e) }
        })
    },

    /* Generate QR Code For Google Auth */
    generateQrCode: async (req, secret) => {
        return new Promise(async (resolve, reject) => {
            try {
                var url = await speakeasy.otpauthURL({ secret: secret.ascii, label: "growmaxx" + "(" + req.body.email_id + ")" });
                resolve(await QRCode.toDataURL(url))
            }
            catch (e) { reject(e) }
        })

    },

    /* Verify QR Code */
    verifyQrCode: async (userToken, secret) => {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await speakeasy.totp.verify({ secret: secret.base32, encoding: 'base32', token: userToken, window: 0 }))
            }
            catch (e) {
                console.log("err =>", e)
                reject(e)
            }
        })
    },
    /* Send Mail After when User Sign Up */
    sendMail: async (to, subj, text, link) => {
        // try {
        //     let transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: nodeMailerEmail, pass: nodeMailerPass } })
        //     let messageObj = {
        //         from: 'test',
        //         to: to,
        //         subject: subj,
        //         html: link
        //     }
        //     await transporter.sendMail(messageObj)
        //     console.log("Mail sent")
        // }
        // catch (e) { console.log("Errror in sending Email-->", e) }
        try {
            let transporter = nodemailer.createTransport({
                name: "www.growmaxxacademy.com",
                host: 'smtp.hostinger.com',
                secure: true,
                port: 465,
                auth: {
                    user: 'info@growmaxxacademy.com',
                    pass: 'Kamble@Kapil2023'
                },
                tls: {
                    rejectUnauthorized: false,
                 },
            })
            let messageObj = {
                from: 'info@growmaxxacademy.com',
                to: to,
                subject: subj,
                html: link
            }
            await transporter.sendMail(messageObj)
            console.log("Mail sent")
        }
        catch (e) { console.log("Errror in sending Email-->", e) }
    },

    /* verify the Email Link */
    verifyEmail: (req, res) => {
        return new Promise(async (resolve, reject) => {
            try {
                 var publicKEY =  fs.readFileSync('./certificate/public.key', 'utf8')
                let decoded =  jwt.verify(req.params.token, publicKEY, { algorithm: 'RS256' });
                var bytes  = CryptoJS.AES.decrypt(decoded.data, 'CkfYl0WMXs6qDjhF8Qqg4sOtTVVjBbWDUy9tB5UnyfWuMxVJXaEhyFBNju22tpJY');
                var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                //req.user = decryptedData
                return resolve(decryptedData)
            }
            catch (e) {
                if (e.name === 'TokenExpiredError') return reject(e.name)
                else if (e.name === 'JsonWebTokenError') return reject(e.name)
                else return reject(e.name)
            }
        })
    },
    tenMinutesJwt: async (payload, res) => {
        try {
            var privateKEY = await fs.readFileSync('./certificate/private.key', 'utf8')
            return await jwt.sign({ data: payload }, privateKEY, { expiresIn: '24h', algorithm: 'RS256' });
        } catch (e) { return responseHandler(res, 500, "Internal Server Error") }
    },
    /* verify JWT and return decrypt token */
    decryptJwt: async (req, res) => {
        try {
            if (!req.headers.authorization) return responseHandler(res, 401, "Unauthorized")
            else {
                var publicKEY = await fs.readFileSync('./certificate/public.key', 'utf8')
                let verifyToken = await jwt.verify(req.headers.authorization, publicKEY, { algorithm: 'RS256' });
                return verifyToken;
            }
        }
        catch (e) { return responseHandler(res, 401, e) }
    },

}

