const adminRoute = require('express').Router();
import { signUp, signIn, getAllusers, verifyToken,  todaysUser, adminInfo, adminDisplayData, userInfo, sentOtp, searchUser, inactiveActiveUsers, userCount, changeEmail, userIsActive, reset2faRequestList, resetTwoFa } from '../../controller/admin/adminController';
import { addPackage, addLevel, updatePackage } from '../../controller/admin/packageController';
import { getWalletBalance, usersWallet, productCount,todaysProduct, teams, todaysDeposit, topBuyerDetails, allPendingWithdrawHistory, completedProduct, allCoinWithdrawHistory, allWithdrawHistory, searchWithdrawHistory, all24WithdrawHistory, productDetails, findWallet, productData, communityIncome, getWithdrawWallet, coreWalletBal, findWaithdrawWallet, accountDetails, communityReward, products, doubleRewardTest,  displayData, userLegs, coreToTrade, coreWalletBalance, coreToEco, coreToCore} from '../../controller/admin/productController';
import { verifyJwt, verifyJwtAdmin, checkSession } from '../../common/function';
import { exportProduct } from '../../controller/admin/productExcel';
import { exportWithdraw } from '../../controller/admin/withdrawExcel';
import { customExport } from '../../controller/admin/customExportController'

/************************* New Admin users  **************************/
adminRoute.post('/signup', signUp);
adminRoute.post('/signin', signIn);
adminRoute.get('/otp', sentOtp); 

/*********************************** Create New order *************************************************************************/

adminRoute.put('/userIsActive', verifyJwtAdmin, userIsActive);
adminRoute.get('/users', verifyJwtAdmin, getAllusers); 
adminRoute.get('/adminDisplayData', verifyJwtAdmin, adminDisplayData);
adminRoute.get('/adminInfo', verifyJwtAdmin, adminInfo);
adminRoute.post('/searchUser', verifyJwtAdmin, searchUser); 
adminRoute.post('/userInfo', verifyJwtAdmin, userInfo); 
adminRoute.get('/userCount', verifyJwtAdmin, userCount); 
adminRoute.get('/inactiveActiveUsers', verifyJwtAdmin, inactiveActiveUsers); 
/************************2FA reset / User ********************/
adminRoute.post('/resetTwofaRequestList', verifyJwtAdmin, reset2faRequestList); 
adminRoute.post('/resetTwoFa', verifyJwtAdmin, resetTwoFa); 
adminRoute.post('/todaysUser', verifyJwtAdmin, todaysUser); 
adminRoute.post('/teams', verifyJwtAdmin, teams); 


/******************Product *******************/
// adminRoute.post('/addProduct', productImageUploader.single('productImage'), addProduct);
// adminRoute.get('/productList', verifyJwt, productList);
// adminRoute.put('/updateProduct', productImageUploader.single('productImage'), updateProduct);
// adminRoute.post('/viewProduct', verifyJwt, viewProduct);
// adminRoute.put('/deleteProduct', verifyJwt, deleteProduct);
// adminRoute.put('/productIsActive', verifyJwt, productIsActive);
// adminRoute.put('/productToggleStatus', verifyJwt, productToggleStatus);
// adminRoute.put('/featuredToggleProduct', verifyJwt, featuredToggleProduct);
// adminRoute.put('/newArrivalProduct', verifyJwt, newArrivalProduct);



/**********************Role  ********************/
adminRoute.post('/displayData', verifyJwtAdmin,  displayData); 
adminRoute.get('/productCount', verifyJwtAdmin,  productCount);
adminRoute.post('/completedProduct', verifyJwtAdmin,  completedProduct); 
adminRoute.post('/productDetails', verifyJwtAdmin,  productDetails);
adminRoute.get('/all24WithdrawHistory', verifyJwtAdmin,  all24WithdrawHistory);
adminRoute.post('/searchWithdrawHistory', verifyJwtAdmin,  searchWithdrawHistory); 
adminRoute.post('/allCoinWithdrawHistory', verifyJwtAdmin,  allCoinWithdrawHistory); 
adminRoute.get('/allWithdrawHistory', verifyJwtAdmin,  allWithdrawHistory);
adminRoute.get('/allPendingWithdrawHistory', verifyJwtAdmin,  allPendingWithdrawHistory);
adminRoute.post('/addPackage',verifyJwtAdmin, addPackage);
adminRoute.post('/addLevel', verifyJwtAdmin, addLevel);
adminRoute.put('/updatePackage', verifyJwtAdmin, updatePackage);
adminRoute.post('/todaysProduct', verifyJwtAdmin, todaysProduct); 
adminRoute.post('/txHistory', verifyJwtAdmin, todaysDeposit); 


adminRoute.get('/getWalletBalance', verifyJwtAdmin, getWalletBalance);

adminRoute.get('/usersWallet', verifyJwtAdmin, usersWallet);
adminRoute.get('/findWallet', verifyJwtAdmin, findWallet);
adminRoute.get('/coreWalletBal', verifyJwtAdmin, coreWalletBal);
adminRoute.get('/findWaithdrawWallet',verifyJwtAdmin, findWaithdrawWallet);
adminRoute.get('/accountDetails', verifyJwtAdmin, accountDetails); 
adminRoute.get('/communityReward', verifyJwtAdmin, communityReward); 
adminRoute.post('/products', verifyJwtAdmin, products); 
adminRoute.post('/doubleRewardTest', verifyJwtAdmin, doubleRewardTest);
adminRoute.post('/productData', verifyJwtAdmin, productData);
adminRoute.post('/communityIncome', verifyJwtAdmin, communityIncome); 
adminRoute.post('/withdrawWallet', verifyJwtAdmin, getWithdrawWallet); 
adminRoute.post('/topBuyerDetails', verifyJwtAdmin, topBuyerDetails); 
adminRoute.post('/userLegs', verifyJwtAdmin, userLegs); 

//transfer 
// adminRoute.post('/coreToTrade', verifyJwt, coreToTrade); 
// adminRoute.post('/coreToEco', verifyJwt, coreToEco); 
// adminRoute.post('/coreToCore', verifyJwt, coreToCore); 
adminRoute.post('/coreWalletBalance', verifyJwtAdmin, coreWalletBalance); 
adminRoute.post('/changeEmail', verifyJwtAdmin, changeEmail); 
adminRoute.get('/exportProduct/:price', verifyJwtAdmin,  exportProduct); 
adminRoute.get('/exportWithdraw/:search', verifyJwtAdmin,  exportWithdraw); 
adminRoute.get('/customExport', verifyJwtAdmin, customExport); 
adminRoute.get('/', verifyJwtAdmin, verifyToken);
// /****************************Home Banner *************/
// adminRoute.post('/addBanner', homeBannerUploader.single('banner'), addBanner);
// adminRoute.delete('/removeHomePageBanner/:bannerId/', verifyJwt, removeHomePageBanner);
export default adminRoute;

