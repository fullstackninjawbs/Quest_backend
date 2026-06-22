import cron from "node-cron";
import Order from "../modules/employer/models/order.model.js";
import questOrderService from "./questOrder.service.js";

export const syncPendingOrders = async () => {
    try {
        // Find orders that are not completed, cancelled, or failed and have a questOrderId
        const pendingOrders = await Order.find({
            status: { $nin: ["completed", "cancelled", "failed", "canceled"] },
            questOrderId: { $exists: true, $ne: null }
        });

        if (pendingOrders.length === 0) {
            console.log("[CRON] No pending orders to sync.");
            return;
        }

        console.log(`[CRON] Found ${pendingOrders.length} pending orders. Syncing statuses...`);

        let updatedCount = 0;

        // Optional: Process in chunks or sequentially to avoid rate-limiting from Quest API
        for (const order of pendingOrders) {
            try {
                const questStatusRes = await questOrderService.getQuestOrderStatus(order.questOrderId);
                
                if (questStatusRes.success && questStatusRes.status) {
                    const lowerStatus = questStatusRes.status.toLowerCase();
                    let newDbStatus = order.status;

                    if (lowerStatus.includes('cancel')) newDbStatus = 'cancelled';
                    else if (lowerStatus.includes('complete') || lowerStatus.includes('result')) newDbStatus = 'completed';
                    else if (lowerStatus.includes('progress') || lowerStatus.includes('collected')) newDbStatus = 'in-progress';
                    else if (lowerStatus.includes('mro') || lowerStatus.includes('review')) newDbStatus = 'MRO Review';

                    if (newDbStatus !== order.status) {
                        console.log(`[CRON] Order ${order.order_number} status changed: ${order.status} -> ${newDbStatus}`);
                        order.status = newDbStatus;
                        
                        // Optional: Push to status logs
                        if (!order.status_logs) order.status_logs = [];
                        order.status_logs.push({
                            status: newDbStatus,
                            updatedAt: new Date()
                        });

                        if (newDbStatus === 'completed') {
                            // Default logic: assume pass if it completes
                            order.test_result = "pass"; 
                        }

                        await order.save();
                        updatedCount++;
                    }
                }
            } catch (err) {
                console.error(`[CRON] Failed to sync order ${order.order_number}:`, err.message);
            }
        }

        console.log(`[CRON] Sync complete. Updated ${updatedCount} orders.`);

    } catch (error) {
        console.error("[CRON] Critical error during syncPendingOrders:", error);
    }
};

export const initCronJobs = () => {
    console.log("[CRON] Initializing Quest Status Sync Cron Job...");
    
    // Run immediately on server boot (great for testing)
    syncPendingOrders();

    // Schedule to run every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
        console.log(`[CRON] Running Quest Status Sync at ${new Date().toISOString()}`);
        await syncPendingOrders();
    });

    console.log("[CRON] Quest Status Sync Cron Job started successfully.");
};
