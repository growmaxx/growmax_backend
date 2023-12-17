const publicRoute= require('express').Router();
import {packages, level, reBuy, depositAddress} from '../../controller/common/packageController'

publicRoute.get('/packages', packages); 
publicRoute.post('/level', level); 
publicRoute.get('/reBuy', reBuy); 
publicRoute.get('/depositAddress', depositAddress); 

export default publicRoute;