import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  Clock, MapPin, Bell, Plus, Trash2, Save, Calendar, AlertCircle,
  CheckCircle, AlertTriangle, Navigation, Settings, X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  code: string;
  name: string;
  venue: string;
  time: string;
  day: string;
  duration: number; // in minutes
  notificationTime: number; // minutes before class
}

interface RouteReminder {
  courseId: string;
  status: "upcoming" | "in-route" | "completed";
  estimatedTime: number; // minutes to get there
  distanceMeters: number;
}

const MOCK_COURSES: Course[] = [
  {
    id: "1",
    code: "FEC 101",
    name: "Introduction to Computer Science",
    venue: "SEET Building, Room 301",
    time: "08:00 AM",
    day: "Monday",
    duration: 60,
    notificationTime: 20
  },
  {
    id: "2",
    code: "FEC 102",
    name: "Data Structures",
    venue: "SEET Building, Lab 5",
    time: "10:30 AM",
    day: "Wednesday",
    duration: 90,
    notificationTime: 15
  },
  {
    id: "3",
    code: "FEC 103",
    name: "Database Systems",
    venue: "SAAT Building, Room 205",
    time: "02:00 PM",
    day: "Friday",
    duration: 60,
    notificationTime: 25
  }
];

export default function TimetablePage() {
  // Track page analytics
  useAnalytics("timetable");

  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [newCourse, setNewCourse] = useState<Partial<Course>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [reminders, setReminders] = useState<RouteReminder[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Simulate route reminders checking
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const upcomingReminders = courses.map(course => {
        // Mock calculation - in real app, check actual time
        const courseTime = parseInt(course.time.split(":")[0]);
        const currentHour = now.getHours();
        const timeDiff = courseTime - currentHour;

        let status: "upcoming" | "in-route" | "completed" = "upcoming";
        if (timeDiff < -1) status = "completed";
        else if (timeDiff < course.notificationTime / 60) status = "in-route";

        return {
          courseId: course.id,
          status,
          estimatedTime: Math.max(0, timeDiff * 60 + 20),
          distanceMeters: 350
        };
      });
      setReminders(upcomingReminders);
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [courses]);

  const addCourse = () => {
    if (newCourse.code && newCourse.name && newCourse.venue) {
      const course: Course = {
        id: String(courses.length + 1),
        code: newCourse.code,
        name: newCourse.name,
        venue: newCourse.venue,
        time: newCourse.time || "09:00 AM",
        day: newCourse.day || "Monday",
        duration: newCourse.duration || 60,
        notificationTime: newCourse.notificationTime || 20
      };
      setCourses([...courses, course]);
      setNewCourse({});
      setShowAddForm(false);
    }
  };

  const deleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "in-route":
        return <Badge className="bg-orange-600">In Route</Badge>;
      default:
        return <Badge className="bg-blue-600">Upcoming</Badge>;
    }
  };

  const upcomingCourses = courses.filter(c => {
    const reminder = reminders.find(r => r.courseId === c.id);
    return reminder?.status !== "completed";
  });

  const completedCourses = courses.filter(c => {
    const reminder = reminders.find(r => r.courseId === c.id);
    return reminder?.status === "completed";
  });

  return (
    <Layout>
      <div className="container py-12 space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 font-bold text-sm uppercase tracking-wider">
            <Calendar className="h-4 w-4" />
            <span>Timetable Sync</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Your Course Schedule</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Auto-generated routes and timely reminders for all your classes. Never be late again!
          </p>
        </div>

        {/* Notifications Toggle */}
        <Card className="p-6 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Bell className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-bold">Route Reminders</p>
              <p className="text-sm text-muted-foreground">Get notified 15-20 minutes before class</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="w-6 h-6 text-purple-600 rounded"
          />
        </Card>

        {/* Course Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 space-y-2">
            <p className="text-sm text-muted-foreground">Total Courses</p>
            <p className="text-3xl font-bold">{courses.length}</p>
          </Card>
          <Card className="p-6 space-y-2">
            <p className="text-sm text-muted-foreground">Upcoming Today</p>
            <p className="text-3xl font-bold">{upcomingCourses.length}</p>
          </Card>
          <Card className="p-6 space-y-2">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedCourses.length}</p>
          </Card>
        </div>

        {/* Upcoming Classes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Upcoming Classes
            </h2>
            <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2 rounded-xl">
              <Plus className="h-5 w-5" />
              Add Course
            </Button>
          </div>

          {/* Add Course Form */}
          {showAddForm && (
            <Card className="p-6 space-y-4 border-primary/30 bg-primary/5">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Course Code (e.g., FEC 101)"
                  value={newCourse.code || ""}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Course Name"
                  value={newCourse.name || ""}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Venue/Room"
                  value={newCourse.venue || ""}
                  onChange={(e) => setNewCourse({ ...newCourse, venue: e.target.value })}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Day (e.g., Monday)"
                  value={newCourse.day || ""}
                  onChange={(e) => setNewCourse({ ...newCourse, day: e.target.value })}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Time (e.g., 09:00 AM)"
                  value={newCourse.time || ""}
                  onChange={(e) => setNewCourse({ ...newCourse, time: e.target.value })}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Duration (minutes)"
                  type="number"
                  value={newCourse.duration || ""}
                  onChange={(e) => setNewCourse({ ...newCourse, duration: parseInt(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={addCourse} className="flex-1 rounded-xl gap-2">
                  <Save className="h-5 w-5" />
                  Save Course
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Courses List */}
          <div className="space-y-3">
            {upcomingCourses.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No courses scheduled yet. Add your first course!</p>
              </Card>
            ) : (
              upcomingCourses.map(course => {
                const reminder = reminders.find(r => r.courseId === course.id);
                return (
                  <Card key={course.id} className="p-6 space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold">{course.code}: {course.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline" className="gap-1">
                                <Calendar className="h-3 w-3" />
                                {course.day}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {course.time}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <MapPin className="h-3 w-3" />
                                {course.duration}m
                              </Badge>
                            </div>
                          </div>
                          {reminder && getStatusBadge(reminder.status)}
                        </div>

                        <div className="bg-muted p-4 rounded-xl flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                          <div>
                            <p className="font-semibold">{course.venue}</p>
                            {reminder && (
                              <p className="text-sm text-muted-foreground">
                                ~{reminder.estimatedTime} mins away
                              </p>
                            )}
                          </div>
                        </div>

                        {reminder && reminder.status === "in-route" && (
                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-orange-900">Leave now!</p>
                              <p className="text-sm text-orange-700">
                                Leave in the next {reminder.estimatedTime} minutes to arrive on time
                              </p>
                            </div>
                          </div>
                        )}

                        {notificationsEnabled && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Bell className="h-4 w-4" />
                            You'll get a reminder {course.notificationTime} minutes before
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="gap-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Navigation className="h-4 w-4" />
                          Navigate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCourse(course.id)}
                          className="gap-2 rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Completed Classes */}
        {completedCourses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Completed Classes
            </h2>
            <div className="space-y-3">
              {completedCourses.map(course => (
                <Card key={course.id} className="p-4 opacity-75">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{course.code}: {course.name}</p>
                      <p className="text-sm text-muted-foreground">{course.venue}</p>
                    </div>
                    <Badge className="bg-green-600">Completed</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tip Section */}
        <Card className="p-6 bg-blue-50 border-blue-200 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900">Pro Tip</p>
              <p className="text-sm text-blue-700">
                Enable notifications and location services for automatic route reminders. The app will calculate travel time based on your current location and alert you when it's time to leave for class.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
