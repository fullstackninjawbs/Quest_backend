import express from "express";
const router = express.Router();
import superAdminRoutes from "../modules/superAdmin/routes/index.js";
import employerRoutes from "../modules/employer/routes/index.js";
import testRoutes from "./test.routes.js";
import billingRoutes from "../modules/employer/routes/billing.routes.js";

// 👑 Super Admin Module (Login, Dashboard, Stats)
router.use("/superadmin", superAdminRoutes);

// 🏢 Employer Module (Login, Profile, Settings)
router.use("/employer", employerRoutes);

// 💳 Billing Module (Stripe Checkout)
router.use("/billing", billingRoutes);

// ─── Other Routes ────────────────────────────────
router.use("/test", testRoutes);

// Legacy /auth and /admin endpoints are now removed or redirected by the blocks above


export default router;
