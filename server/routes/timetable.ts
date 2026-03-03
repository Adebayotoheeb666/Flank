import { RequestHandler } from "express";
import { Course, CourseResponse, RouteReminderResponse } from "@shared/api";

// Mock database - in production, this would be Supabase
const courseDatabase: Record<string, Course[]> = {};

/**
 * GET /api/timetable/:studentId
 * Fetch all courses for a student
 */
export const getTimetable: RequestHandler = (req, res) => {
  try {
    const studentId = req.params.studentId;
    const courses = courseDatabase[studentId] || [];
    
    const response: CourseResponse = {
      courses
    };
    
    res.json(response);
  } catch (error) {
    console.error("Timetable fetch error:", error);
    res.status(500).json({ error: "Failed to fetch timetable" });
  }
};

/**
 * POST /api/timetable/:studentId
 * Add a new course for a student
 */
export const addCourse: RequestHandler = (req, res) => {
  try {
    const studentId = req.params.studentId;
    const course: Course = req.body;

    if (!courseDatabase[studentId]) {
      courseDatabase[studentId] = [];
    }

    course.id = String(Date.now());
    course.studentId = studentId;
    courseDatabase[studentId].push(course);

    res.status(201).json(course);
  } catch (error) {
    console.error("Course creation error:", error);
    res.status(500).json({ error: "Failed to add course" });
  }
};

/**
 * DELETE /api/timetable/:studentId/:courseId
 * Delete a course for a student
 */
export const deleteCourse: RequestHandler = (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    if (!courseDatabase[studentId]) {
      return res.status(404).json({ error: "Student not found" });
    }

    courseDatabase[studentId] = courseDatabase[studentId].filter(
      c => c.id !== courseId
    );

    res.json({ message: "Course deleted" });
  } catch (error) {
    console.error("Course deletion error:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
};

/**
 * POST /api/timetable/:studentId/reminder
 * Check if student should leave for class and get route info
 */
export const getRouteReminder: RequestHandler = (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, latitude, longitude } = req.body;

    if (!courseDatabase[studentId]) {
      return res.status(404).json({ error: "Student not found" });
    }

    const course = courseDatabase[studentId].find(c => c.id === courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Mock calculation of travel time
    // In production, this would use actual navigation data
    const mockVenueCoordinates = {
      lat: 7.3050,
      lng: 5.1350
    };

    const distance = Math.sqrt(
      Math.pow(mockVenueCoordinates.lat - latitude, 2) +
      Math.pow(mockVenueCoordinates.lng - longitude, 2)
    ) * 111000; // rough conversion to meters

    const estimatedTravelTime = Math.round(distance / 1.4); // assuming 1.4 m/s walking speed
    const courseHour = parseInt(course.time.split(":")[0]);
    const currentHour = new Date().getHours();
    const minutesUntilClass = (courseHour - currentHour) * 60;
    const shouldLeaveNow = minutesUntilClass <= course.notificationTime && minutesUntilClass > 0;

    const response: RouteReminderResponse = {
      courseId,
      estimatedTravelTime,
      distanceMeters: Math.round(distance),
      shouldLeaveNow,
      nextClass: course
    };

    res.json(response);
  } catch (error) {
    console.error("Route reminder error:", error);
    res.status(500).json({ error: "Failed to get reminder" });
  }
};

/**
 * GET /api/timetable/:studentId/upcoming
 * Get all upcoming courses for today
 */
export const getUpcomingCourses: RequestHandler = (req, res) => {
  try {
    const { studentId } = req.params;
    const courses = courseDatabase[studentId] || [];

    if (!courses.length) {
      return res.json({ courses: [] });
    }

    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const upcomingCourses = courses.filter(c => c.day === today);

    // Sort by time
    upcomingCourses.sort((a, b) => {
      const timeA = parseInt(a.time.split(":")[0]);
      const timeB = parseInt(b.time.split(":")[0]);
      return timeA - timeB;
    });

    const response: CourseResponse = { courses: upcomingCourses };
    res.json(response);
  } catch (error) {
    console.error("Upcoming courses error:", error);
    res.status(500).json({ error: "Failed to fetch upcoming courses" });
  }
};
