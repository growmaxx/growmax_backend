const withdrawRoute= require('express').Router();
import {addWithdrawWallet, getWithdrawWallet} from '../../controller/withdraw/withdrawController'
import { verifyJwt, verifyJwtAdmin, checkSession } from '../../common/function';
import { transferFund, feeCalculator, withdrawHistory, withdrawHistoryDetails, verifyAccount, pendingPayment } from '../../controller/blockchain/blockchainController';
/*********************************** Withdraw *************************************************************************/

withdrawRoute.put('/addWithdrawWallet',verifyJwt,  addWithdrawWallet);
withdrawRoute.get('/getWithdrawWallet',verifyJwt,  getWithdrawWallet);
withdrawRoute.post('/transferFund',verifyJwt,  transferFund);
withdrawRoute.get('/feeCalculator',verifyJwt,  feeCalculator);
withdrawRoute.get('/withdrawHistory',verifyJwt,  withdrawHistory);
withdrawRoute.post('/withdrawHistoryDetails',verifyJwt,  withdrawHistoryDetails); 
withdrawRoute.get('/verifyBlockchainAccount',verifyJwt,  verifyAccount);
withdrawRoute.post('/pendingPayment', verifyJwtAdmin,  pendingPayment);

//withdrawRoute.get('/pendingPayment',  pendingPayment);
//withdrawRoute.get('/verifyOrder', verifyJwt, verifyOrder);
export default withdrawRoute;
