import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaUserClock,
  FaSignOutAlt,
  FaCalendarPlus,
  FaChartBar,
  FaSync,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

const HRPNCMonitoring = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);

  // Initialize with current month
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`;
    setSelectedMonth(currentMonth);

    // Generate available months (last 12 months)
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthStr = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      months.push({
        value: monthStr,
        label: date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        }),
      });
    }
    setAvailableMonths(months);
  }, []);

  // Fetch report data when month changes
  useEffect(() => {
    if (selectedMonth) {
      fetchReportData();
    }
  }, [selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReportData = async () => {
    if (!selectedMonth) return;

    setLoading(true);
    try {
      console.log(
        `📊 Fetching P&C Monthly Monitoring Report for ${selectedMonth}`
      );
      const response = await axios.get(
        `http://localhost:5001/api/hr/pnc-monitoring?month=${selectedMonth}`
      );

      console.log("✅ Report data fetched:", response.data);
      setReportData(response.data);
      toast.success("Report data loaded successfully");
    } catch (error) {
      console.error("❌ Error fetching report data:", error);
      toast.error(error.response?.data?.error || "Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedMonth) return;

    setLoading(true);
    try {
      console.log(
        `🔄 Recalculating P&C Monthly Monitoring Report for ${selectedMonth}`
      );
      const response = await axios.post(
        `http://localhost:5001/api/hr/pnc-monitoring/recalculate`,
        { month: selectedMonth }
      );

      console.log("✅ Report recalculated:", response.data);
      setReportData(response.data);
      toast.success("Report recalculated successfully");
    } catch (error) {
      console.error("❌ Error recalculating report:", error);
      toast.error(
        error.response?.data?.error || "Failed to recalculate report"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value) => {
    return `${parseFloat(value).toFixed(1)}%`;
  };

  const StatCard = ({ title, value, icon: Icon, color = "blue" }) => (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className={`h-8 w-8 text-${color}-500`} />
      </div>
    </div>
  );

  const MetricCard = ({ title, value, subtitle, color = "gray" }) => (
    <div
      className={`bg-white rounded-lg shadow-md p-4 border-l-4 border-${color}-500`}
    >
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  const DistributionChart = ({ data, title, type = "bar" }) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map((item) => item.count));

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {item.group || item.gender}
                  </span>
                  <span className="text-gray-600">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="mt-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      type === "pie"
                        ? `bg-${
                            ["blue", "green", "yellow", "red", "purple"][
                              index % 5
                            ]
                          }-500`
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${(item.count / maxValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PieChart = ({ data, title }) => {
    if (!data || data.length === 0) return null;

    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
    ];

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="grid grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  colors[index % colors.length]
                }`}
              ></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {item.gender}
                </p>
                <p className="text-xs text-gray-500">
                  {item.count} ({item.percentage}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading && !reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Loading P&C Monthly Monitoring Report...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                P&C Monthly Monitoring Report
              </h1>
              <p className="text-gray-600 mt-1">
                People & Culture monthly metrics and analytics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Month Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Month:
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {availableMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleRecalculate}
                disabled={loading}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <FaSync className={`mr-2 ${loading ? "animate-spin" : ""}`} />
                Recalculate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {loading && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Updating report...</span>
            </div>
          </div>
        )}

        {reportData && (
          <div className="space-y-6">
            {/* Report Period Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-blue-900">
                    Report Period: {reportData.month}
                  </h2>
                  <p className="text-blue-700">
                    {reportData.period?.startOfMonth
                      ? new Date(
                          reportData.period.startOfMonth
                        ).toLocaleDateString()
                      : "N/A"}{" "}
                    -{" "}
                    {reportData.period?.endOfMonth
                      ? new Date(
                          reportData.period.endOfMonth
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="text-sm text-blue-600">
                  Generated:{" "}
                  {reportData.generatedAt
                    ? new Date(reportData.generatedAt).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Key Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <StatCard
                  title="Total Headcount"
                  value={reportData.statistics?.totalHeadcount || 0}
                  icon={FaUsers}
                  color="blue"
                />
                <StatCard
                  title="Total Contractors"
                  value={reportData.statistics?.totalContractors || 0}
                  icon={FaUserClock}
                  color="green"
                />
                <StatCard
                  title="Total Leavers"
                  value={reportData.statistics?.totalLeavers || 0}
                  icon={FaSignOutAlt}
                  color="red"
                />
                <StatCard
                  title="Future Joiners"
                  value={reportData.statistics?.futureJoiners || 0}
                  icon={FaCalendarPlus}
                  color="yellow"
                />
                <StatCard
                  title="Live Vacancies"
                  value={reportData.statistics?.totalVacancies || 0}
                  icon={FaChartBar}
                  color="purple"
                />
              </div>
            </div>

            {/* Demographics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Age Distribution */}
              <DistributionChart
                data={reportData.ageDistribution?.groups || []}
                title={`Age Distribution (Avg: ${
                  reportData.ageDistribution?.averageAge || 0
                } years)`}
                type="bar"
              />

              {/* Gender Distribution */}
              <PieChart
                data={reportData.gender || []}
                title="Gender Distribution"
              />
            </div>

            {/* Tenure and Additional Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tenure Distribution */}
              <div className="lg:col-span-2">
                <DistributionChart
                  data={reportData.tenure?.groups || []}
                  title={`Length of Service (Avg: ${
                    reportData.tenure?.averageTenure || 0
                  } years)`}
                  type="bar"
                />
              </div>

              {/* Additional Metrics */}
              <div className="space-y-4">
                <MetricCard
                  title="Disability Percentage"
                  value={formatPercentage(
                    reportData.disability?.percentage || 0
                  )}
                  color="green"
                />
                <MetricCard
                  title="Attrition Rate"
                  value={formatPercentage(
                    reportData.attrition?.percentage || 0
                  )}
                  subtitle="This month"
                  color="red"
                />
              </div>
            </div>

            {/* Summary Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Summary Overview
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metric
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Total Headcount
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reportData.statistics?.totalHeadcount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        100.0%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Contractors
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reportData.statistics?.totalContractors || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(reportData.statistics?.totalHeadcount || 0) > 0
                          ? formatPercentage(
                              ((reportData.statistics?.totalContractors || 0) /
                                (reportData.statistics?.totalHeadcount || 1)) *
                                100
                            )
                          : "0.0%"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Average Age
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reportData.ageDistribution?.averageAge || 0} years
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        -
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Average Tenure
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reportData.tenure?.averageTenure || 0} years
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        -
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Attrition Rate
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reportData.statistics?.totalLeavers || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(
                          reportData.attrition?.percentage || 0
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!reportData && !loading && (
          <div className="text-center py-12">
            <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Report Data
            </h3>
            <p className="text-gray-600">
              Select a month to view the P&C Monthly Monitoring Report
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HRPNCMonitoring;
