import catchAsync from '../../../utils/catchAsync.js';
import AppError from '../../../utils/AppError.js';

/**
 * Get available collection sites
 * GET /api/v1/orders/sites
 * 
 * Note: In Phase 1, this returns a curated list or proxies to Quest's FindLocation API.
 */
export const getSites = catchAsync(async (req, res, next) => {
    const { zip, distance = 50 } = req.query;

    if (!zip) {
        return next(new AppError('Zip code is required to search for sites.', 400));
    }

    // Placeholder: In a real implementation, this would call questSoapService.findSites(zip, distance)
    // For now, we return a mock successful response or a sample list to unblock the frontend wizard.
    
    const mockSites = [
        {
            siteId: 'Q7782',
            name: 'Quest Diagnostics - New York Midtown',
            address: '123 Main St, Suite 100, New York, NY 10001',
            phone: '212-555-0199',
            hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
            schedulingFlags: { canSchedule: true }
        }
    ];

    res.status(200).json({
        success: true,
        count: mockSites.length,
        data: mockSites
    });
});
