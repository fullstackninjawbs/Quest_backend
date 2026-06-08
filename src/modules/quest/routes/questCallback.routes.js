import express from "express";
import { handleQuestCallback } from "../controllers/questCallback.controller.js";

const router = express.Router();

/**
 * Quest callback endpoint
 * Expects SOAP XML payloads (SOAPAction callback triggers)
 * Mounts raw text body parser to handle SOAP XML bodies
 */
router.post(
  "/callback",
  express.text({
    type: ["text/xml", "application/xml"],
    limit: "10mb" // Enlarge body limit to support base64 embedded PDF documents safely
  }),
  handleQuestCallback
);

export default router;
