import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import alertsRouter from "./alerts";
import modelsRouter from "./models";
import dashboardRouter from "./dashboard";
import syntheticRouter from "./synthetic";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(alertsRouter);
router.use(modelsRouter);
router.use(dashboardRouter);
router.use(syntheticRouter);

export default router;
