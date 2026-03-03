import { RequestHandler } from "express";
import { supabase } from "../../shared/supabase";

interface PushNotificationRequest {
  studentId: string;
  courseId: string;
  courseName: string;
  venue: string;
  scheduledTime: string;
  remindMinutesBefore: number;
}

interface ScheduledReminder {
  id: string;
  student_id: string;
  course_id: string;
  course_name: string;
  venue: string;
  scheduled_time: string;
  reminder_minutes: number;
  status: "pending" | "sent" | "dismissed";
  created_at: string;
}

/**
 * POST /api/notifications/schedule
 * Schedule a push notification reminder for a course
 */
export const handleScheduleReminder: RequestHandler = async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      courseName,
      venue,
      scheduledTime,
      remindMinutesBefore
    }: PushNotificationRequest = req.body;

    if (!studentId || !courseId || !scheduledTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Calculate reminder trigger time
    const courseDate = new Date(scheduledTime);
    const reminderDate = new Date(
      courseDate.getTime() - remindMinutesBefore * 60 * 1000
    );

    const { data, error } = await supabase
      .from("scheduled_reminders")
      .insert([
        {
          student_id: studentId,
          course_id: courseId,
          course_name: courseName,
          venue: venue,
          scheduled_time: scheduledTime,
          reminder_time: reminderDate.toISOString(),
          reminder_minutes: remindMinutesBefore,
          status: "pending",
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Failed to schedule reminder" });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Schedule reminder error:", error);
    res.status(500).json({ error: "Failed to schedule reminder" });
  }
};

/**
 * GET /api/notifications/:studentId/pending
 * Get pending reminders for a student
 */
export const handleGetPendingReminders: RequestHandler = async (req, res) => {
  try {
    const { studentId } = req.params;

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("scheduled_reminders")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "pending")
      .lte("reminder_time", now)
      .order("reminder_time", { ascending: true });

    if (error) {
      console.error("Supabase Error:", error);
      return res.json([]);
    }

    res.json(data || []);
  } catch (error) {
    console.error("Get reminders error:", error);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
};

/**
 * POST /api/notifications/:reminderId/mark-sent
 * Mark a reminder as sent (after push notification is delivered)
 */
export const handleMarkReminderSent: RequestHandler = async (req, res) => {
  try {
    const { reminderId } = req.params;

    const { data, error } = await supabase
      .from("scheduled_reminders")
      .update({ status: "sent" })
      .eq("id", reminderId)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return res.status(500).json({ error: "Failed to update reminder" });
    }

    res.json(data);
  } catch (error) {
    console.error("Mark reminder sent error:", error);
    res.status(500).json({ error: "Failed to mark reminder" });
  }
};

/**
 * POST /api/notifications/:reminderId/dismiss
 * Dismiss a reminder
 */
export const handleDismissReminder: RequestHandler = async (req, res) => {
  try {
    const { reminderId } = req.params;

    const { data, error } = await supabase
      .from("scheduled_reminders")
      .update({ status: "dismissed" })
      .eq("id", reminderId)
      .select()
      .single();

    if (error) {
      console.error("Dismiss error:", error);
      return res.status(500).json({ error: "Failed to dismiss reminder" });
    }

    res.json(data);
  } catch (error) {
    console.error("Dismiss reminder error:", error);
    res.status(500).json({ error: "Failed to dismiss reminder" });
  }
};

/**
 * GET /api/notifications/:studentId/all
 * Get all reminders for a student (paginated)
 */
export const handleGetAllReminders: RequestHandler = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from("scheduled_reminders")
      .select("*")
      .eq("student_id", studentId)
      .order("scheduled_time", { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string)
      );

    if (error) {
      console.error("Supabase Error:", error);
      return res.json([]);
    }

    res.json(data || []);
  } catch (error) {
    console.error("Get reminders error:", error);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
};

/**
 * POST /api/notifications/send-batch
 * Send batch notifications (called by Edge Functions scheduler)
 * This is triggered by a cron job in Supabase Edge Functions
 */
export const handleSendBatchNotifications: RequestHandler = async (req, res) => {
  try {
    const { edge_function_secret } = req.headers;

    // Verify the request is from a trusted source
    if (edge_function_secret !== process.env.EDGE_FUNCTION_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get all pending reminders that should be sent now
    const now = new Date().toISOString();

    const { data: reminders, error: fetchError } = await supabase
      .from("scheduled_reminders")
      .select("*")
      .eq("status", "pending")
      .lte("reminder_time", now)
      .order("reminder_time", { ascending: true })
      .limit(100);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return res.status(500).json({ error: "Failed to fetch reminders" });
    }

    const notificationResults = [];

    // Send notifications for each reminder
    for (const reminder of reminders || []) {
      try {
        // TODO: Integrate with actual push notification service
        // Options: Firebase Cloud Messaging, OneSignal, Expo Push, etc.
        console.log(`Sending reminder to ${reminder.student_id}:`, {
          course: reminder.course_name,
          venue: reminder.venue,
          time: reminder.scheduled_time
        });

        // Mark as sent
        const { error: updateError } = await supabase
          .from("scheduled_reminders")
          .update({ status: "sent" })
          .eq("id", reminder.id);

        if (!updateError) {
          notificationResults.push({
            reminderId: reminder.id,
            status: "sent"
          });
        }
      } catch (error) {
        console.error(`Failed to send notification for reminder ${reminder.id}:`, error);
      }
    }

    res.json({
      totalProcessed: notificationResults.length,
      results: notificationResults
    });
  } catch (error) {
    console.error("Batch notification error:", error);
    res.status(500).json({ error: "Failed to send batch notifications" });
  }
};
