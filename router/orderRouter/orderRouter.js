const orderRoute= require('express').Router();
import {createOrder, getOrder, blockUser, paymentHistory, directLeg, passiveIncome, getOrderAdmin,  communityIncome, miniOrder, communityIncomeDate, createInitialOrder} from '../../controller/order/orderController';
import {coreToEco, coreToTrade, coreWalletBalance, coreHistory} from '../../controller/user/walletTransferController'
import { verifyJwt, verifyJwtPay, verifyJwtAdmin, checkSession } from '../../common/function';

/*********************************** Create New order *************************************************************************/
orderRoute.post('/createOrder',verifyJwt, createOrder);
orderRoute.get('/getOrder',verifyJwt, getOrder);
orderRoute.get('/paymentHistory',verifyJwt, paymentHistory); 
orderRoute.get('/directLeg',verifyJwt, directLeg);
orderRoute.get('/passiveIncome',verifyJwt, passiveIncome);
orderRoute.get('/communityIncome',verifyJwt, communityIncome);
orderRoute.post('/communityIncomeDate',verifyJwt, communityIncomeDate);
orderRoute.get('/coreWalletBalance',verifyJwt, coreWalletBalance);

// orderRoute.post('/coreToEco',verifyJwt, coreToEco);
// orderRoute.post('/coreToTrade',verifyJwt, coreToTrade);
// orderRoute.post('/coreToCore',verifyJwt, coreToCore);
orderRoute.get('/coreHistory',verifyJwt, coreHistory);
orderRoute.get('/miniOrder',verifyJwt, miniOrder);
orderRoute.post('/createInitialOrder',verifyJwtPay, createInitialOrder);
orderRoute.get('/getOrderAdmin',verifyJwtAdmin, getOrderAdmin);
orderRoute.get('/blockUser',verifyJwtAdmin,  blockUser);

//orderRoute.get('/verifyOrder', verifyJwt, verifyOrder);
export default orderRoute;

