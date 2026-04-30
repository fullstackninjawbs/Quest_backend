import axios from "axios";

/**
 * Script to simulate 100 concurrent DB queries.
 * Hits the isolated /api/v1/test/db endpoint to test DB performance.
 */

const API_URL = "http://localhost:5000/api/v1/test/db-read";
const CONCURRENT_REQUESTS = 100;

async function runTest() {
    console.log(`Starting load test: ${CONCURRENT_REQUESTS} concurrent requests...`);
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

    console.log("\n--- Load Test Results ---");
    console.log(`Total Requests: ${CONCURRENT_REQUESTS}`);
    console.log(`Successful: ${successful}`);
    console.log(`Total Duration: ${duration}ms`);
    console.log(`Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);

    if (avgResponseTime < 200 && successful === CONCURRENT_REQUESTS) {
        console.log("PASS: No errors, response time < 200ms average.");
    } else {
        console.log("FAIL: Results do not meet criteria.");
    }
}

runTest();
