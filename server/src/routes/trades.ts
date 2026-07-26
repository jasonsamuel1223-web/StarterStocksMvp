import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { buyStock, sellStock, getOrders, getOrderById } from '../controllers/tradesController';

const router = Router();

router.use(authenticate);

router.post('/buy', buyStock);
router.post('/sell', sellStock);
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);

export default router;
