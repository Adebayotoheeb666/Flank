import { RequestHandler } from "express";
import { Course, CourseResponse, RouteReminderResponse } from "@shared/api";
import { supabase } from "../../shared/supabase";

/**
 * GET /api/timetable/:studentId
 * Fetch all courses for a student
 */
export const getTimetable: RequestHandler = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const { data: courses, error } = await supabase
      .from("student_courses")
      .select("*")
      .eq("student_id", studentId)
      .order("day");

    if (error) {
      console.error("Supabase Error:", error);
      res.status(500).json({ error: "Failed to fetch timetable" });
      return;
    }

    // Map Supabase columns to Course interface
    const mappedCourses: Course[] = (courses || []).map((course: any) => ({
      id: course.id,
      code: course.course_code,
      name: course.course_name,
      venue: course.venue,
      time: course.time,
      day: course.day,
      duration: course.duration,
      notificationTime: course.notification_time,
      studentId
    }));

    const response: CourseResponse = {
      courses: mappedCourses
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
export const addCourse: RequestHandler = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const course: Course = req.body;

    if (!course.code || !course.name || !course.venue || !course.time || !course.day) {
      res.status(400).json({ error: "Missing required course fields" });
      return;
    }

    const { data: newCourse, error } = await supabase
      .from("student_courses")
      .insert([
        {
          student_id: studentId,
          course_code: course.code,
          course_name: course.name,
          venue: course.venue,
          time: course.time,
          day: course.day,
          duration: course.duration || 60,
          notification_time: course.notificationTime || 15
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      res.status(500).json({ error: "Failed to add course" });
      return;
    }

    const mappedCourse: Course = {
      id: newCourse.id,
      code: newCourse.course_code,
      name: newCourse.course_name,
      venue: newCourse.venue,
      time: newCourse.time,
      day: newCourse.day,
      duration: newCourse.duration,
      notificationTime: newCourse.notification_time,
      studentId
    };

    res.status(201).json(mappedCourse);
  } catch (error) {
    console.error("Course creation error:", error);
    res.status(500).json({ error: "Failed to add course" });
  }
};

/**
 * DELETE /api/timetable/:studentId/:courseId
 * Delete a course for a student
 */
export const deleteCourse: RequestHandler = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    const { error } = await supabase
      .from("student_courses")
      .delete()
      .eq("id", courseId)
      .eq("student_id", studentId);

    if (error) {
      console.error("Supabase Error:", error);
      res.status(500).json({ error: "Failed to delete course" });
      return;
    }

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
export const getRouteReminder: RequestHandler = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, latitude, longitude } = req.body;

    const { data: course, error } = await supabase
      .from("student_courses")
      .select("*")
      .eq("id", courseId)
      .eq("student_id", studentId)
      .single();

    if (error || !course) {
      res.status(404).json({ error: "Course not found" });
      return;
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
    const shouldLeaveNow = minutesUntilClass <= course.notification_time && minutesUntilClass > 0;

    const mappedCourse: Course = {
      id: course.id,
      code: course.course_code,
      name: course.course_name,
      venue: course.venue,
      time: course.time,
      day: course.day,
      duration: course.duration,
      notificationTime: course.notification_time,
      studentId
    };

    const response: RouteReminderResponse = {
      courseId,
      estimatedTravelTime,
      distanceMeters: Math.round(distance),
      shouldLeaveNow,
      nextClass: mappedCourse
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
export const getUpcomingCourses: RequestHandler = async (req, res) => {
  try {
    const { studentId } = req.params;
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

    const { data: courses, error } = await supabase
      .from("student_courses")
      .select("*")
      .eq("student_id", studentId)
      .eq("day", today)
      .order("time", { ascending: true });

    if (error) {
      console.error("Supabase Error:", error);
      res.status(500).json({ error: "Failed to fetch upcoming courses" });
      return;
    }

    const mappedCourses: Course[] = (courses || []).map((course: any) => ({
      id: course.id,
      code: course.course_code,
      name: course.course_name,
      venue: course.venue,
      time: course.time,
      day: course.day,
      duration: course.duration,
      notificationTime: course.notification_time,
      studentId
    }));

    const response: CourseResponse = { courses: mappedCourses };
    res.json(response);
  } catch (error) {
    console.error("Upcoming courses error:", error);
    res.status(500).json({ error: "Failed to fetch upcoming courses" });
  }
};
