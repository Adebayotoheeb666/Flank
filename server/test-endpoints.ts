/**
 * Test Script for FUTA Pathfinder API Endpoints
 * Tests Timetable and Emergency SOS endpoints
 * 
 * Usage: npx ts-node server/test-endpoints.ts
 */

const API_BASE = "http://localhost:8080";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

// Helper function to make API requests
async function apiCall(
  method: string,
  endpoint: string,
  body?: any
): Promise<any> {
  const url = `${API_BASE}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`${response.status}: ${data.error || response.statusText}`);
  }

  return data;
}

// Test Timetable Endpoints
async function testTimetableEndpoints() {
  console.log("\n========== TESTING TIMETABLE ENDPOINTS ==========\n");

  const studentId = "STU-2024-001";
  let courseId: string;

  // Test 1: Add a course
  try {
    const course = {
      code: "CSC101",
      name: "Introduction to Computer Science",
      venue: "SEET Auditorium",
      time: "09:00",
      day: "Monday",
      duration: 120,
      notificationTime: 15
    };

    const result = await apiCall("POST", `/api/timetable/${studentId}`, course);
    courseId = result.id;

    results.push({
      name: "POST /api/timetable/:studentId (Add Course)",
      status: "PASS",
      data: result
    });
    console.log("✅ Added course successfully");
  } catch (error: any) {
    results.push({
      name: "POST /api/timetable/:studentId (Add Course)",
      status: "FAIL",
      error: error.message
    });
    console.log(`❌ Failed to add course: ${error.message}`);
    return;
  }

  // Test 2: Get timetable
  try {
    const result = await apiCall("GET", `/api/timetable/${studentId}`);

    if (!Array.isArray(result.courses) || result.courses.length === 0) {
      throw new Error("No courses returned");
    }

    results.push({
      name: "GET /api/timetable/:studentId (Get Timetable)",
      status: "PASS",
      data: result
    });
    console.log("✅ Retrieved timetable successfully");
  } catch (error: any) {
    results.push({
      name: "GET /api/timetable/:studentId (Get Timetable)",
      status: "FAIL",
      error: error.message
    });
    console.log(`❌ Failed to get timetable: ${error.message}`);
  }

  // Test 3: Get upcoming courses
  try {
    const result = await apiCall("GET", `/api/timetable/${studentId}/upcoming`);

    results.push({
      name: "GET /api/timetable/:studentId/upcoming (Upcoming Courses)",
      status: "PASS",
      data: result
    });
    console.log("✅ Retrieved upcoming courses successfully");
  } catch (error: any) {
    results.push({
      name: "GET /api/timetable/:studentId/upcoming (Upcoming Courses)",
      status: "FAIL",
      error: error.message
    });
    console.log(`❌ Failed to get upcoming courses: ${error.message}`);
  }

  // Test 4: Get route reminder
  try {
    const result = await apiCall(
      "POST",
      `/api/timetable/${studentId}/reminder`,
      {
        courseId,
        latitude: 7.2950,
        longitude: 5.1250
      }
    );

    if (
      !result.courseId ||
      result.estimatedTravelTime === undefined ||
      result.distanceMeters === undefined
    ) {
      throw new Error("Invalid reminder response");
    }

    results.push({
      name: "POST /api/timetable/:studentId/reminder (Route Reminder)",
      status: "PASS",
      data: result
    });
    console.log("✅ Retrieved route reminder successfully");
  } catch (error: any) {
    results.push({
      name: "POST /api/timetable/:studentId/reminder (Route Reminder)",
      status: "FAIL",
      error: error.message
    });
    console.log(`❌ Failed to get route reminder: ${error.message}`);
  }

  // Test 5: Delete course
  try {
    const result = await apiCall(
      "DELETE",
      `/api/timetable/${studentId}/${courseId}`
    );

    if (!result.message) {
      throw new Error("No confirmation message returned");
    }

    results.push({
      name: "DELETE /api/timetable/:studentId/:courseId (Delete Course)",
      status: "PASS",
      data: result
    });
    console.log("✅ Deleted course successfully");
  } catch (error: any) {
    results.push({
      name: "DELETE /api/timetable/:studentId/:courseId (Delete Course)",
      status: "FAIL",
      error: error.message
    });
    console.log(`❌ Failed to delete course: ${error.message}`);
  }
}

// Test Emergency SOS Endpoints
async function testEmergencyEndpoints() {
  console.log("\n========== TESTING EMERGENCY SOS ENDPOINTS ==========\n");

  const userId = "USER-2024-001";
  let sosId: string;

  // Test 1: Trigger SOS
  try {
    const result = await apiCall("POST", "/api/emergency/sos", {
      sosType: "medical",
      latitude: 7.3000,
      longitude: 5.1300,
      userId
    });

    sosId = result.sosId;

    if (!sosId || result.status !== "active") {
      throw new Error("Invalid SOS response");
    }

    results.push({
      name: "POST /api/emergency/sos (Trigger SOS)",
      status: "PASS",
      data: result
    });
    console.log("✅ Triggered SOS successfully");
  } catch (error: any) {
    results.push({
      name: "POST /api/emergency/sos (Trigger SOS)",
      status: "FAIL",
      error: error.message
    });
    console.log(`❌ Failed to trigger SOS: ${error.message}`);
    return;
  }

  // Test 2: Update SOS Location
  try {
    const result = await apiCall(
      "POST",
      `/api/emergency/sos/${sosId}/location`,
      {
        latitude: 7.3010,
        longitude: 5.1310
      }
    );

    if (!result.timestamp) {
      throw new Error("No timestamp in response");
    }

    results.push({
      name: "POST /api/emergency/sos/:sosId/location (Update Location)",
      status: "PASS",
      data: result
    });
    console.log("✅ Updated SOS location successfully");
  } catch (error: any) {
    results.push({
      name: "POST /api/emergency/sos/:sosId/location (Update Location)",
      status: "FAIL",
      error: error.message
    });
    console.log(`❌ Failed to update SOS location: ${error.message}`);
  }

  // Test 3: Get SOS Status
  try {
    const result = await apiCall("GET", `/api/emergency/sos/${sosId}`);

    if (!result.sosId || !result.status || !Array.isArray(result.responders)) {
      throw new Error("Invalid SOS status response");
    }

    results.push({
      name: "GET /api/emergency/sos/:sosId (Get SOS Status)",
      status: "PASS",
      data: result
    });
    console.log("✅ Retrieved SOS status successfully");
  } catch (error: any) {
    results.push({
      name: "GET /api/emergency/sos/:sosId (Get SOS Status)",
      status: "FAIL",
      error: error.message
    });
    console.log(`❌ Failed to get SOS status: ${error.message}`);
  }

  // Test 4: Get All Active SOS Alerts
  try {
    const result = await apiCall("GET", "/api/emergency/active");

    if (!("count" in result) || !Array.isArray(result.alerts)) {
      throw new Error("Invalid active SOS response");
    }

    results.push({
      name: "GET /api/emergency/active (Get Active SOS)",
      status: "PASS",
      data: result
    });
    console.log("✅ Retrieved active SOS alerts successfully");
  } catch (error: any) {
    results.push({
      name: "GET /api/emergency/active (Get Active SOS)",
      status: "FAIL",
      error: error.message
    });
    console.log(`❌ Failed to get active SOS: ${error.message}`);
  }

  // Test 5: Resolve SOS
  try {
    const result = await apiCall("POST", `/api/emergency/sos/${sosId}/resolve`);

    if (result.status !== "resolved") {
      throw new Error("SOS not resolved");
    }

    results.push({
      name: "POST /api/emergency/sos/:sosId/resolve (Resolve SOS)",
      status: "PASS",
      data: result
    });
    console.log("✅ Resolved SOS successfully");
  } catch (error: any) {
    results.push({
      name: "POST /api/emergency/sos/:sosId/resolve (Resolve SOS)",
      status: "FAIL",
      error: error.message
    });
    console.log(`❌ Failed to resolve SOS: ${error.message}`);
  }

  // Test 6: Trigger another SOS and cancel it
  try {
    const newSos = await apiCall("POST", "/api/emergency/sos", {
      sosType: "security",
      latitude: 7.3020,
      longitude: 5.1320,
      userId
    });

    const cancelResult = await apiCall(
      "POST",
      `/api/emergency/sos/${newSos.sosId}/cancel`
    );

    if (cancelResult.status !== "cancelled") {
      throw new Error("SOS not cancelled");
    }

    results.push({
      name: "POST /api/emergency/sos/:sosId/cancel (Cancel SOS)",
      status: "PASS",
      data: cancelResult
    });
    console.log("✅ Cancelled SOS successfully");
  } catch (error: any) {
    results.push({
      name: "POST /api/emergency/sos/:sosId/cancel (Cancel SOS)",
      status: "FAIL",
      error: error.message
    });
    console.log(`❌ Failed to cancel SOS: ${error.message}`);
  }
}

// Print summary
function printSummary() {
  console.log("\n========== TEST SUMMARY ==========\n");

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.status === "PASS" ? "✅" : "❌";
    console.log(`${icon} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(
    `Success Rate: ${((passed / total) * 100).toFixed(1)}%`
  );
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (failed === 0) {
    console.log("🎉 All tests passed! Your endpoints are working correctly.");
  } else {
    console.log(
      "⚠️  Some tests failed. Check the errors above and ensure Supabase is configured."
    );
  }
}

// Run all tests
async function runAllTests() {
  console.log("🧪 Starting API Endpoint Tests...");
  console.log(`Base URL: ${API_BASE}\n`);

  try {
    await testTimetableEndpoints();
    await testEmergencyEndpoints();
    printSummary();
  } catch (error) {
    console.error("Fatal error during testing:", error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
