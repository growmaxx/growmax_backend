const authRoute= require('express').Router();
import {signUp, signIn, userInfo, verifyUsername, verifyEmailId, generateOtp, verifyLogin, verifyReferral, contactInfoUpdate} from '../../controller/user/userController.js';
import { verifyEmail, resendMail_For_Verify_Email, verifyToken } from '../../controller/common/mailController';
import { forgotPassword, checkResetLink, resetPassword, changePassword } from '../../controller/common/passwordController'
import { verifyJwt, checkSession, verifyJwtOtp, verifyJwtPay } from '../../common/function';


authRoute.post('/signup', signUp);
authRoute.post('/login', signIn);
//authRoute.get('/btc',getInfo)
// authRoute.get('/btcNetwork',getAccount)

/*********************************** Send Mail Again Calls *************************************************************************/
authRoute.post('/resendMail_For_Verify_Email', resendMail_For_Verify_Email)
/*********************************** Send Mail Again Calls *************************************************************************/


/*************************************** To verify the Email Link ******************************************************************/
authRoute.post('/verifyEmail/', verifyJwtPay, verifyEmail)
authRoute.post('/verifyLogin/', verifyJwtOtp, verifyLogin)
authRoute.get('/userInfo/', verifyJwt, userInfo)
authRoute.get('/generateOtp/', verifyJwt, generateOtp)



/*************************************** To User profile Update ******************************************************************/
//authRoute.get('/userInfo',verifyJwt,userInfo)
/***************************************** To verify the Email Link ****************************************************************/
/************************************  Password Controller Routes Calls ***********************************************************/
authRoute.put('/changePassword',changePassword)
authRoute.post('/forgotPassword', forgotPassword)
authRoute.get('/checkResetLink/:token', checkResetLink)
authRoute.post('/resetPassword/:token', resetPassword)
authRoute.post('/contactInfoUpdate', verifyJwt, contactInfoUpdate)

//authRoute.put('/updateProfile',uploader.single('profilePicture'),updateProfile);

// before signup verify
authRoute.post('/verifysUsername/', verifyJwt, verifyUsername)
authRoute.post('/verifyEmailId/', verifyJwt, verifyEmailId)
authRoute.post('/verifyReferral/', verifyJwt, verifyReferral)
authRoute.get('/', verifyJwt, verifyToken);


export default authRoute;

