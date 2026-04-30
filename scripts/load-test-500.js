import axios from "axios";

/**
 * Script to simulate 500 concurrent users (Milestone 3).
 * Hits the isolated /api/v1/test/db-read endpoint.
 */

const API_URL = "http://localhost:5000/api/v1/test/db-read";
const CONCURRENT_REQUESTS = 500;

async function runTest() {
    console.log(`Starting Milestone 3 Load Test: ${CONCURRENT_REQUESTS} concurrent requests...`);
    const startTime = Date.now();

    const requests = Array.from({ length: CONCURRENT_REQUESTS }).map((_, i) => {
        return axios.get(API_URL).catch(err => {
            console.error(`Request ${i} failed: ${err.message}`);
            return null;
        });
    });

    const responses = await Promise.all(requests);
    const endTime = Date.now();

    const successful = responses.filter(r => r && r.status === 200).length;
    const duration = endTime - startTime;
    const avgResponseTime = duration / CONCURRENT_REQUESTS;

    console.log("\n--- Load Test Results (500 Users) ---");
    console.log(`Total Requests: ${CONCURRENT_REQUESTS}`);
    console.log(`Successful: ${successful}`);
    console.log(`Total Duration: ${duration}ms`);
    console.log(`Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);

    if (successful === CONCURRENT_REQUESTS) {
        console.log("PASS: 500 concurrent requests handled successfully.");
    } else {
        console.log("FAIL: Not all requests were successful.");
    }
}

runTest();
