import React, { useState, useEffect } from "react";
import { FaChartBar, FaDownload, FaFileExcel, FaFilePdf } from "react-icons/fa";
import axios from "axios";

const HRExpenseAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("current_year");
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/expenses/analytics?period=${period}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      const response = await axios.get(
        `/expenses/export?format=excel&period=${period}`
      );

      if (response.status === 200) {
        const data = response.data;

        // Convert to Excel format (simplified - in production, use a proper Excel library)
        const csvContent = [
          data.headers.join(","),
          ...data.data.map((row) =>
            data.headers
              .map((header) => {
                const value =
                  row[header.toLowerCase().replace(/\s+/g, "_")] || "";
                return `"${value}"`;
              })
              .join(",")
          ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `expenses_${period}_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        setError("Failed to export data");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      setError("Failed to export data");
    } finally {
      setExportLoading(false);
    }
  };

  const exportHierarchy = async () => {
    try {
      setExportLoading(true);
      const response = await axios.get("/expenses/hierarchy-export");

      if (response.status === 200) {
        const data = response.data;

        // Convert to Excel format
        const csvContent = [
          data.headers.join(","),
          ...data.data.map((row) =>
            data.headers
              .map((header) => {
                const value =
                  row[header.toLowerCase().replace(/\s+/g, "_")] || "";
                return `"${value}"`;
              })
              .join(",")
          ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `employee_hierarchy_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        setError("Failed to export hierarchy");
      }
    } catch (error) {
      console.error("Error exporting hierarchy:", error);
      setError("Failed to export hierarchy");
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case "current_year":
        return "Current Year";
      case "current_month":
        return "Current Month";
      case "last_30_days":
        return "Last 30 Days";
      case "all_years":
        return "All Years";
      default:
        return "Current Year";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-brand-pearl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brand-red/20 border border-brand-red/40 rounded-lg p-4">
        <p className="text-brand-black">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-2 px-4 py-2 bg-brand-red text-brand-black rounded-md hover:bg-hover-danger transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 bg-brand-pearl">
        <p className="text-brand-black/70">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-brand-pearl min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-black">
            Expense Analytics
          </h2>
          <p className="text-brand-black/70">
            Comprehensive expense analysis and reporting
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-brand-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green bg-brand-pearl text-brand-black"
          >
            <option value="current_year">Current Year</option>
            <option value="current_month">Current Month</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="all_years">All Years</option>
          </select>
          <button
            onClick={exportToExcel}
            disabled={exportLoading}
            className="px-4 py-2 bg-brand-green text-brand-black rounded-md hover:bg-hover-primary disabled:opacity-50 flex items-center space-x-2 transition-colors duration-200"
          >
            <FaFileExcel className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={exportHierarchy}
            disabled={exportLoading}
            className="px-4 py-2 bg-brand-violet text-brand-black rounded-md hover:bg-hover-secondary disabled:opacity-50 flex items-center space-x-2 transition-colors duration-200"
          >
            <FaDownload className="w-4 h-4" />
            <span>Hierarchy Report</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-brand-pearl p-6 rounded-lg shadow-sm border border-brand-black/10">
          <div className="flex items-center">
            <div className="p-2 bg-brand-blue/20 rounded-lg">
              <FaChartBar className="w-6 h-6 text-brand-blue" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-brand-black/70">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-brand-black">
                {analytics.totalStats?.total_expenses || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-brand-pearl p-6 rounded-lg shadow-sm border border-brand-black/10">
          <div className="flex items-center">
            <div className="p-2 bg-brand-green/20 rounded-lg">
              <FaChartBar className="w-6 h-6 text-brand-green" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-brand-black/70">
                Total Amount
              </p>
              <p className="text-2xl font-bold text-brand-black">
                {formatCurrency(analytics.totalStats?.total_amount || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-brand-pearl p-6 rounded-lg shadow-sm border border-brand-black/10">
          <div className="flex items-center">
            <div className="p-2 bg-brand-yellow/20 rounded-lg">
              <FaChartBar className="w-6 h-6 text-brand-yellow" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-brand-black/70">
                Average Amount
              </p>
              <p className="text-2xl font-bold text-brand-black">
                {formatCurrency(analytics.totalStats?.avg_amount || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-brand-pearl p-6 rounded-lg shadow-sm border border-brand-black/10">
          <div className="flex items-center">
            <div className="p-2 bg-brand-violet/20 rounded-lg">
              <FaChartBar className="w-6 h-6 text-brand-violet" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-brand-black/70">Period</p>
              <p className="text-2xl font-bold text-brand-black">
                {getPeriodLabel(analytics.period)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-brand-pearl p-6 rounded-lg shadow-sm border border-brand-black/10">
          <h3 className="text-lg font-semibold text-brand-black mb-4">
            Expenses by Category
          </h3>
          <div className="space-y-3">
            {analytics.categoryStats?.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                  ></div>
                  <span className="text-sm font-medium text-brand-black/70">
                    {category.expense_category}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-black">
                    {formatCurrency(category.total_amount)}
                  </p>
                  <p className="text-xs text-brand-black/70">
                    {category.count} expenses
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Breakdown */}
        <div className="bg-brand-pearl p-6 rounded-lg shadow-sm border border-brand-black/10">
          <h3 className="text-lg font-semibold text-brand-black mb-4">
            Expenses by Project
          </h3>
          <div className="space-y-3">
            {analytics.projectStats?.slice(0, 8).map((project, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}
                  ></div>
                  <span className="text-sm font-medium text-brand-black/70 truncate">
                    {project.project}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-black">
                    {formatCurrency(project.total_amount)}
                  </p>
                  <p className="text-xs text-brand-black/70">
                    {project.count} expenses
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Breakdown */}
        <div className="bg-brand-pearl p-6 rounded-lg shadow-sm border border-brand-black/10">
          <h3 className="text-lg font-semibold text-brand-black mb-4">
            Expenses by Client
          </h3>
          <div className="space-y-3">
            {analytics.clientStats?.slice(0, 8).map((client, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: `hsl(${index * 30}, 70%, 50%)` }}
                  ></div>
                  <span className="text-sm font-medium text-brand-black/70 truncate">
                    {client.client}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-black">
                    {formatCurrency(client.total_amount)}
                  </p>
                  <p className="text-xs text-brand-black/70">
                    {client.count} expenses
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-brand-pearl p-6 rounded-lg shadow-sm border border-brand-black/10">
          <h3 className="text-lg font-semibold text-brand-black mb-4">
            Monthly Trends
          </h3>
          <div className="space-y-3">
            {analytics.monthlyTrends?.slice(-6).map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-brand-black/70">
                  {new Date(trend.year, trend.month - 1).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-black">
                    {formatCurrency(trend.total_amount)}
                  </p>
                  <p className="text-xs text-brand-black/70">
                    {trend.count} expenses
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRExpenseAnalytics;
