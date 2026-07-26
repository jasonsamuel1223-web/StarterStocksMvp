import { Router } from 'express';
import { register, login, logout, refresh } from '../controllers/authController';
import { requireSameOrigin } from '../app';

const router = Router();

router.post('/register', register);
router.post('/login', login);
// Protect cookie-consuming endpoints with same-origin check (CSRF mitigation)
router.post('/logout', requireSameOrigin, logout);
router.post('/refresh', requireSameOrigin, refresh);

export default router;
