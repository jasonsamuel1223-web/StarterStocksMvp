import { Router } from 'express';
import { getQuote, getAllQuotes } from '../controllers/quotesController';

const router = Router();

// Public — no auth required
router.get('/', getAllQuotes);
router.get('/:ticker', getQuote);

export default router;
