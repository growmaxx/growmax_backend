import express from 'express';
import mongoose from "mongoose"
import { mongo_url, mongo_password, mongo_user } from './envirnoment/config'
//import { mongo_url } from './envirnoment/config'
import authRoute from './router/userRouter/userRouter.js'
import orderRoute from './router/orderRouter/orderRouter.js'
import adminRoute from './router/adminRouter/adminRouter.js'
import publicRoute from './router/common/publicRouter'
import dashboardRoute from './router/userRouter/dashboardRoute'
import withdrawRoute from './router/withdrawRouter/withdrawRouter'
import qrRoute from './router/userRouter/qrRoute'
import { json, urlencoded } from 'body-parser';
/* import cors for outside request(Resolve the cross origin issue) */
import cors from 'cors';

const port = 5000;
const path = require('path');
const cookieParser = require('cookie-parser');
var session = require('express-session');
const flash = require('express-flash');


/* To Enable cross origin */
var app = express();

app.use(cors())
app.use(cookieParser())
app.use(flash());

app.use(express.static(path.join(__dirname, '/public')));
// To support URL-encoded bodies
app.use(json({ limit: '120mb' }))
app.use(urlencoded({ extended: true }))

app.use(session({ secret: "XASDASDP", resave: false, saveUninitialized: true }));
app.use(function(req,res,next){
  res.locals.session = req.session;
  next();
});

app.use('/api/v1/user', authRoute)
app.use('/api/v1/order', orderRoute)
app.use('/api/v1/admin', adminRoute)
app.use('/api/v1/public', publicRoute)
app.use('/api/v1/dashboard', dashboardRoute)
app.use('/api/v1/withdraw', withdrawRoute)
app.use('/api/v1/qr', qrRoute)
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
try {
  mongoose.connect(mongo_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    user: mongo_user,
    pass: mongo_password,
  });
  console.log('Connected to MONGO DB for Sinox-Profits-Backend !');
} catch (error) {
  console.log(error, 'Error in connecting to DB !');
}

let server = app.listen(port);
console.log(" N O D E     S E R V E R     C O N N E C T E D ")

// let io = socket(server);
// io.on('connection', (socket) => {
//   console.log('New user connected');
//   socket.on('matchMakingBid',async (data) => {
//     try {
//       let txArray = await matchMakingAlgo.matchMakingSocket()
//       socket.emit("orderData", txArray)
//     }
//     catch (e) {
//       console.log("Error In Socket =>", e)
//     }
//   })
//   socket.on('buyOrderDetails',async (data) => {
//     try {
//       let buyArray = await matchMakingAlgo.buyOrderList(data)
//       socket.emit("buyOrderData", buyArray)
//     }
//     catch (e) {
//       console.log("Error In Socket =>", e)
//     }
//   })
//   socket.on('sellOrderDetails',async (data) => {
//     try {
//       let sellArray = await matchMakingAlgo.sellOrderList(data)
//       socket.emit("sellOrderData", sellArray)
//     }
//     catch (e) {
//       console.log("Error In Socket =>", e)
//     }
//   })
// });



