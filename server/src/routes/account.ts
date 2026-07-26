import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getBalance,
  getPortfolio,
  getTransactions,
  getAccountInfo,
} from '../controllers/accountController';

const router = Router();

router.use(authenticate);

router.get('/balance', getBalance);
router.get('/portfolio', getPortfolio);
router.get('/transactions', getTransactions);
router.get('/info', getAccountInfo);

export default router;
