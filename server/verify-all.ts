/**
 * Comprehensive Verification Script for FUTA Pathfinder API
 */

const API_BASE = "http://localhost:3000";

async function test(name: string, fn: () => Promise<void>) {
    console.log(`Testing ${name}...`);
    try {
        await fn();
        console.log(`✅ ${name} passed\n`);
    } catch (error: any) {
        console.error(`❌ ${name} failed: ${error.message}\n`);
    }
}

async function apiCall(method: string, endpoint: string, body?: any) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`${response.status} ${response.statusText}${errorData.error ? ': ' + errorData.error : ''}`);
    }
    return response.json();
}

async function runTests() {
    console.log("🧪 Starting Comprehensive API Verification...\n");

    // 1. Ping
    await test("GET /api/ping", async () => {
        const res = await apiCall("GET", "/api/ping");
        if (!res.message) throw new Error("Missing message in response");
        console.log(`   Response: ${res.message}`);
    });

    // 2. Locations
    let firstLocationId: string = "";
    await test("GET /api/locations", async () => {
        const res = await apiCall("GET", "/api/locations");
        if (!Array.isArray(res) || res.length === 0) throw new Error("Invalid or empty locations array");
        firstLocationId = res[0].id;
        console.log(`   Found ${res.length} locations. First ID: ${firstLocationId}`);
    });

    await test("GET /api/search", async () => {
        const res = await apiCall("GET", "/api/search?q=SEET");
        if (!Array.isArray(res)) throw new Error("Invalid response format");
        console.log(`   Found ${res.length} matches for 'SEET'`);
    });

    // 3. Navigation
    await test("POST /api/route", async () => {
        const res = await apiCall("POST", "/api/route", {
            start_lat: 7.3000,
            start_lng: 5.1300,
            end_location_id: firstLocationId
        });
        if (!res.path || !res.steps) throw new Error("Invalid route response");
        console.log(`   Route found with ${res.steps.length} steps, distance: ${res.total_distance}m`);
    });

    // 4. Virtual Tour
    let firstBuildingId: string = "";
    await test("GET /api/virtual-tour/buildings", async () => {
        const res = await apiCall("GET", "/api/virtual-tour/buildings");
        if (!Array.isArray(res) || res.length === 0) throw new Error("Invalid or empty buildings array");
        firstBuildingId = res[0].id;
        console.log(`   Found ${res.length} tour buildings. First ID: ${firstBuildingId}`);
    });

    await test("GET /api/virtual-tour/highlights", async () => {
        const res = await apiCall("GET", "/api/virtual-tour/highlights");
        if (!Array.isArray(res)) throw new Error("Invalid response format");
        console.log(`   Found ${res.length} highlights`);
    });

    // 5. Emergency
    await test("GET /api/emergency/contacts", async () => {
        const res = await apiCall("GET", "/api/emergency/contacts");
        if (!Array.isArray(res)) throw new Error("Invalid response format");
        console.log(`   Found ${res.length} emergency contacts`);
    });

    await test("GET /api/emergency/active", async () => {
        const res = await apiCall("GET", "/api/emergency/active");
        if (res.count === undefined) throw new Error("Invalid response format");
        console.log(`   Active SOS count: ${res.count}`);
    });

    // 6. Shortcuts
    await test("GET /api/shortcuts", async () => {
        const res = await apiCall("GET", "/api/shortcuts");
        if (!Array.isArray(res)) throw new Error("Invalid response format");
        console.log(`   Found ${res.length} shortcuts`);
    });

    // 7. Guidance
    await test("GET /api/guidance", async () => {
        const res = await apiCall("GET", "/api/guidance");
        if (!Array.isArray(res)) throw new Error("Invalid response format");
        console.log(`   Found ${res.length} guidance steps`);
    });

    console.log("🏁 Verification complete.");
}

runTests();
