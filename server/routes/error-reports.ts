import { RequestHandler } from "express";
import { MapErrorReport, MapErrorReportResponse } from "@shared/api";
import { supabase } from "../../shared/supabase";

// Error reports are now strictly persisted to Supabase

/**
 * Submit a new error report
 * POST /api/error-reports
 * TODO: Persist to Supabase once error_reports table is created
 */
export const submitErrorReport: RequestHandler = async (req, res) => {
  try {
    const report: MapErrorReport = req.body;

    // Validate required fields
    if (!report.type || !report.title || !report.description) {
      return res.status(400).json({
        reportId: "",
        status: "error",
        message: "Missing required fields: type, title, description"
      });
    }

    // Create report with ID and timestamp
    const newReport: MapErrorReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...report,
      status: "reported",
      createdAt: new Date().toISOString()
    };

    // Save to Supabase
    if (supabase) {
      const { error } = await supabase
        .from("error_reports")
        .insert([newReport]);

      if (error) {
        console.error("Failed to save error report to Supabase:", error);
        return res.status(500).json({ error: "Failed to submit error report" });
      }
    } else {
      console.error("Supabase client not available");
      return res.status(503).json({ error: "Service unavailable" });
    }

    console.log(`[Error Report] New report submitted: ${newReport.id}`, {
      type: newReport.type,
      title: newReport.title,
      severity: newReport.severity
    });

    const response: MapErrorReportResponse = {
      reportId: newReport.id,
      status: "submitted",
      message: "Error report submitted successfully. Thank you for helping us improve!"
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({
      reportId: "",
      status: "error",
      message: "Failed to submit error report"
    });
  }
};

/**
 * Get all error reports (admin endpoint)
 * GET /api/error-reports
 */
export const getErrorReports: RequestHandler = async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Service unavailable" });

    const { data: reports, error } = await supabase
      .from("error_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const resolvedCount = (reports || []).filter((r: any) => r.status === "resolved").length;

    res.json({
      reports: reports || [],
      total: (reports || []).length,
      resolved: resolvedCount
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      reports: [],
      total: 0,
      resolved: 0
    });
  }
};

/**
 * Get a specific error report
 * GET /api/error-reports/:reportId
 */
export const getErrorReport: RequestHandler = async (req, res) => {
  try {
    const { reportId } = req.params;
    if (!supabase) return res.status(503).json({ error: "Service unavailable" });

    const { data: report, error } = await supabase
      .from("error_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (error || !report) {
      return res.status(404).json({
        error: "Report not found"
      });
    }

    res.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({
      error: "Failed to fetch report"
    });
  }
};

/**
 * Update error report status (admin endpoint)
 * PATCH /api/error-reports/:reportId
 */
export const updateErrorReport: RequestHandler = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, resolution } = req.body;
    if (!supabase) return res.status(503).json({ error: "Service unavailable" });

    const updateData: any = {};
    if (status) updateData.status = status;
    if (resolution) {
      updateData.resolution = resolution;
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: report, error } = await supabase
      .from("error_reports")
      .update(updateData)
      .eq("id", reportId)
      .select()
      .single();

    if (error || !report) {
      return res.status(404).json({
        error: "Report not found"
      });
    }

    console.log(`[Error Report] Report updated: ${reportId}`, {
      status: report.status,
      resolved: !!report.resolution
    });

    res.json(report);
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({
      error: "Failed to update report"
    });
  }
};

/**
 * Delete error report (admin endpoint)
 * DELETE /api/error-reports/:reportId
 */
export const deleteErrorReport: RequestHandler = async (req, res) => {
  try {
    const { reportId } = req.params;
    if (!supabase) return res.status(503).json({ error: "Service unavailable" });

    const { data: deletedReport, error } = await supabase
      .from("error_reports")
      .delete()
      .eq("id", reportId)
      .select()
      .single();

    if (error || !deletedReport) {
      return res.status(404).json({
        error: "Report not found"
      });
    }

    console.log(`[Error Report] Report deleted: ${reportId}`);

    res.json({
      message: "Report deleted successfully",
      deletedReport
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({
      error: "Failed to delete report"
    });
  }
};
