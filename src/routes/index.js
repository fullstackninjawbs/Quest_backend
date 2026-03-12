const express = require("express");
const router = express.Router();
const superAdminRoutes = require("../modules/superAdmin/routes");
const employerRoutes = require("../modules/employer/routes");
const testRoutes = require("./test.routes");

// 👑 Super Admin Module (Login, Dashboard, Stats)
router.use("/super-admin", superAdminRoutes);

// 🏢 Employer Module (Login, Profile, Settings)
router.use("/employer", employerRoutes);

// ─── Other Routes ────────────────────────────────
router.use("/test", testRoutes);
// Legacy /auth and /admin endpoints are now removed or redirected by the blocks above


module.exports = router;
