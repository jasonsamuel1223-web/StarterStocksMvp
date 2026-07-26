import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getHoldings, getPerformance, getSummary } from '../controllers/portfolioController';

const router = Router();

router.use(authenticate);

router.get('/holdings', getHoldings);
router.get('/performance', getPerformance);
router.get('/summary', getSummary);

export default router;
