import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/health
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Assessment API is running"
  });
});

export default router;
