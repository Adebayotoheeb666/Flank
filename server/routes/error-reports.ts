import { RequestHandler } from "express";
import { MapErrorReport, MapErrorReportResponse } from "@shared/api";

// In-memory storage for demo (replace with Supabase in production)
const errorReports: MapErrorReport[] = [];

/**
 * Submit a new error report
 * POST /api/error-reports
 */
export const submitErrorReport: RequestHandler = (req, res) => {
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

    // Store report
    errorReports.push(newReport);

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
export const getErrorReports: RequestHandler = (req, res) => {
  try {
    // Count resolved reports
    const resolvedCount = errorReports.filter(r => r.status === "resolved").length;

    res.json({
      reports: errorReports,
      total: errorReports.length,
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
export const getErrorReport: RequestHandler = (req, res) => {
  try {
    const { reportId } = req.params;
    const report = errorReports.find(r => r.id === reportId);

    if (!report) {
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
export const updateErrorReport: RequestHandler = (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, resolution } = req.body;

    const report = errorReports.find(r => r.id === reportId);
    if (!report) {
      return res.status(404).json({
        error: "Report not found"
      });
    }

    // Update status
    if (status) {
      report.status = status;
    }

    // Add resolution if provided
    if (resolution) {
      report.resolution = resolution;
      report.resolvedAt = new Date().toISOString();
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
export const deleteErrorReport: RequestHandler = (req, res) => {
  try {
    const { reportId } = req.params;
    const index = errorReports.findIndex(r => r.id === reportId);

    if (index === -1) {
      return res.status(404).json({
        error: "Report not found"
      });
    }

    const deletedReport = errorReports.splice(index, 1)[0];

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
