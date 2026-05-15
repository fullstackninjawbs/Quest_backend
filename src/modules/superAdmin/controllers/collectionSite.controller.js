import CollectionSite from "../models/CollectionSite.model.js";
import questService from "../../../services/quest.service.js";
import catchAsync from "../../../utils/catchAsync.js";

/**
 * @desc    Sync all collection sites from Quest
 * @route   POST /api/v1/superadmin/collection-sites/sync
 * @access  Private (Super Admin)
 */
export const syncAllSites = catchAsync(async (req, res) => {
    // 1. Fetch real data from Quest (This can take 2-3 minutes for 25k sites)
    const sites = await questService.fetchAllCollectionSites();
    
    console.log(`Sync Controller: Processing ${sites.length} sites...`);

    // 2. Prepare bulk operations
    const operations = sites.map(site => ({
        updateOne: {
            filter: { siteCode: site.siteCode },
            update: { $set: { ...site, lastSyncedAt: new Date() } },
            upsert: true
        }
    }));

    // 3. Execute in batches of 5000 to be safe and efficient
    const batchSize = 5000;
    let processed = 0;
    
    for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        await CollectionSite.bulkWrite(batch);
        processed += batch.length;
        console.log(`Sync Controller: Saved ${processed}/${sites.length} sites...`);
    }
    
    res.status(200).json({
        success: true,
        message: `Sync completed. Processed ${sites.length} sites from Quest UAT.`,
        data: {
            totalProcessed: sites.length,
            lastSyncedAt: new Date()
        }
    });
});

/**
 * @desc    Get list of synced collection sites
 * @route   GET /api/v1/superadmin/collection-sites
 * @access  Private (Super Admin)
 */
export const getCollectionSites = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const query = search ? {
        $or: [
            { siteCode: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
            { "address.zip": { $regex: search, $options: "i" } },
            { "address.city": { $regex: search, $options: "i" } }
        ]
    } : {};

    const sites = await CollectionSite.find(query)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort({ "address.state": 1, "address.city": 1 });

    const count = await CollectionSite.countDocuments(query);

    res.status(200).json({
        success: true,
        data: {
            sites,
            totalPages: Math.ceil(count / limitNum),
            currentPage: pageNum,
            totalSites: count
        }
    });
});

/**
 * @desc    Get sync status (last sync date, counts)
 * @route   GET /api/v1/superadmin/collection-sites/status
 * @access  Private (Super Admin)
 */
export const getSyncStatus = catchAsync(async (req, res) => {
    const totalSites = await CollectionSite.countDocuments();
    const lastSync = await CollectionSite.findOne().sort({ lastSyncedAt: -1 }).select("lastSyncedAt");

    res.status(200).json({
        success: true,
        data: {
            totalSites,
            lastSyncedAt: lastSync ? lastSync.lastSyncedAt : null
        }
    });
});
