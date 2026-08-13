import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  Download,
  Calendar,
  ShoppingBag,
  PieChart,
  BarChart,
} from 'lucide-react';

export default function AdminSalesReport() {
  const [range, setRange] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      let url = `/sales/report?range=${range}`;
      if (range === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await axios.get(url);
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, [range]);

  const handleCustomFilterSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchSalesReport();
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const { summary, salesOverTime, topProducts } = reportData;
    let csvContent = 'data:text/csv;charset=utf-8,';

    // Summary Section
    csvContent += 'VAULT SALES REPORT SUMMARY\n';
    csvContent += `Report Range,${reportData.dateRange?.range || range}\n`;
    csvContent += `Start Date,${new Date(reportData.dateRange?.start).toLocaleDateString('en-IN')}\n`;
    csvContent += `End Date,${new Date(reportData.dateRange?.end).toLocaleDateString('en-IN')}\n\n`;

    csvContent += 'METRIC,VALUE (INR)\n';
    csvContent += `Gross Sales,${summary.grossSales}\n`;
    csvContent += `Total Orders,${summary.totalOrders}\n`;
    csvContent += `Total Discounts,${summary.totalDiscount}\n`;
    csvContent += `Total Refunds,${summary.totalRefunds}\n`;
    csvContent += `Net Revenue,${summary.netRevenue}\n`;
    csvContent += `Average Order Value,${summary.averageOrderValue}\n\n`;

    // Sales Over Time Section
    csvContent += 'DAILY SALES BREAKDOWN\n';
    csvContent += 'DATE,ORDERS,SALES (INR)\n';
    salesOverTime.forEach((item) => {
      csvContent += `${item.date},${item.orders},${item.sales}\n`;
    });
    csvContent += '\n';

    // Top Products Section
    csvContent += 'TOP SELLING PRODUCTS\n';
    csvContent += 'PRODUCT NAME,UNITS SOLD,REVENUE (INR)\n';
    topProducts.forEach((prod) => {
      csvContent += `"${prod.name.replace(/"/g, '""')}",${prod.quantity},${prod.revenue}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vault_Sales_Report_${range}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto text-[#111111]">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111]">
            Sales Report &amp; Analytics
          </h1>
          <p className="text-xs text-[#6b7280] font-mono mt-1">
            Track gross sales, net revenue, discounts, returns, and top products.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={loading || !reportData}
          className="bg-[#111111] hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider py-2.5 px-5 flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-xs transition-all"
        >
          <Download size={15} /> Export CSV Report
        </button>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-mono font-bold text-[#6b7280] uppercase flex items-center gap-2">
            <Calendar size={14} className="text-[#111111]" /> Filter Time Range:
          </span>

          <div className="flex flex-wrap items-center gap-2 font-mono">
            {[
              { label: 'Today', value: 'today' },
              { label: 'Yesterday', value: 'yesterday' },
              { label: 'This Week', value: 'this_week' },
              { label: 'This Month', value: 'this_month' },
              { label: 'This Year', value: 'this_year' },
              { label: 'Custom Range', value: 'custom' },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setRange(btn.value)}
                className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  range === btn.value
                    ? 'bg-[#111111] text-white font-extrabold shadow-xs'
                    : 'bg-[#f9fafb] border border-[#e5e5e5] text-[#6b7280] hover:text-[#111111]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Selector */}
        {range === 'custom' && (
          <form onSubmit={handleCustomFilterSubmit} className="pt-3 border-t border-[#e5e5e5] flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <label className="text-[#6b7280]">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-[#e5e5e5] text-[#111111] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#111111]"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[#6b7280]">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-[#e5e5e5] text-[#111111] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#111111]"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-[#111111] hover:bg-black text-white px-4 py-1.5 rounded-xl font-bold uppercase"
            >
              Apply Filter
            </button>
          </form>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-3" />
          <p className="text-xs font-mono text-[#6b7280]">Calculating Sales Report...</p>
        </div>
      ) : !reportData ? (
        <div className="text-center py-20 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
          <p className="text-xs text-[#6b7280] font-mono">Unable to load report data. Please try again.</p>
        </div>
      ) : (
        <>
          {/* SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
            <div className="bg-white border border-[#e5e5e5] p-4 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[9px] text-[#6b7280] uppercase font-bold">Gross Sales</span>
              <p className="text-xl font-extrabold text-[#111111]">₹{reportData.summary.grossSales?.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white border border-[#e5e5e5] p-4 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[9px] text-[#6b7280] uppercase font-bold">Total Orders</span>
              <p className="text-xl font-extrabold text-[#111111]">{reportData.summary.totalOrders}</p>
            </div>
            <div className="bg-white border border-[#e5e5e5] p-4 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[9px] text-[#6b7280] uppercase font-bold">Total Discount</span>
              <p className="text-xl font-extrabold text-[#d97706]">₹{reportData.summary.totalDiscount?.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white border border-[#e5e5e5] p-4 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[9px] text-[#6b7280] uppercase font-bold">Total Refunds</span>
              <p className="text-xl font-extrabold text-[#dc2626]">₹{reportData.summary.totalRefunds?.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white border border-[#e5e5e5] p-4 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[9px] text-[#6b7280] uppercase font-bold">Net Revenue</span>
              <p className="text-xl font-extrabold text-[#16a34a]">₹{reportData.summary.netRevenue?.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white border border-[#e5e5e5] p-4 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[9px] text-[#6b7280] uppercase font-bold">Avg Order Value</span>
              <p className="text-xl font-extrabold text-[#111111]">₹{reportData.summary.averageOrderValue?.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* REPORTS & BREAKDOWN TABLES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
            {/* DAILY SALES FEED */}
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl space-y-4 shadow-xs">
              <h3 className="text-sm font-extrabold uppercase text-[#111111] tracking-wide border-b border-[#e5e5e5] pb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#16a34a]" /> Sales Over Time
              </h3>
              {reportData.salesOverTime.length === 0 ? (
                <p className="text-xs text-[#6b7280] py-6 text-center">No sales recorded during this time range.</p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                        <th className="p-3">Date</th>
                        <th className="p-3">Orders</th>
                        <th className="p-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e5]">
                      {reportData.salesOverTime.map((item) => (
                        <tr key={item.date} className="hover:bg-[#f9fafb]">
                          <td className="p-3 font-bold text-[#111111]">{item.date}</td>
                          <td className="p-3 text-[#374151]">{item.orders}</td>
                          <td className="p-3 text-right font-extrabold text-[#16a34a]">
                            ₹{item.sales?.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* TOP SELLING PRODUCTS */}
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl space-y-4 shadow-xs">
              <h3 className="text-sm font-extrabold uppercase text-[#111111] tracking-wide border-b border-[#e5e5e5] pb-3 flex items-center gap-2">
                <ShoppingBag size={16} className="text-[#d97706]" /> Top Selling Products
              </h3>
              {reportData.topProducts.length === 0 ? (
                <p className="text-xs text-[#6b7280] py-6 text-center">No product performance data found.</p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                        <th className="p-3">Product</th>
                        <th className="p-3">Qty Sold</th>
                        <th className="p-3 text-right">Gross Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e5]">
                      {reportData.topProducts.map((prod) => (
                        <tr key={prod.name} className="hover:bg-[#f9fafb]">
                          <td className="p-3 font-bold text-[#111111] truncate max-w-[180px] font-sans">{prod.name}</td>
                          <td className="p-3 text-[#374151]">{prod.quantity}</td>
                          <td className="p-3 text-right font-extrabold text-[#111111]">
                            ₹{prod.revenue?.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* PAYMENT METHOD BREAKDOWN */}
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl space-y-4 shadow-xs">
              <h3 className="text-sm font-extrabold uppercase text-[#111111] tracking-wide border-b border-[#e5e5e5] pb-3 flex items-center gap-2">
                <PieChart size={16} className="text-[#111111]" /> Payment Methods Breakdown
              </h3>
              <div className="space-y-3">
                {reportData.paymentBreakdown.map((pm) => (
                  <div key={pm.method} className="flex justify-between items-center bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5]">
                    <span className="font-bold text-[#111111] text-xs">{pm.method}</span>
                    <span className="text-xs text-[#6b7280]">{pm.count} orders</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ORDER STATUS BREAKDOWN */}
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl space-y-4 shadow-xs">
              <h3 className="text-sm font-extrabold uppercase text-[#111111] tracking-wide border-b border-[#e5e5e5] pb-3 flex items-center gap-2">
                <BarChart size={16} className="text-[#111111]" /> Order Status Distribution
              </h3>
              <div className="space-y-3">
                {reportData.statusBreakdown.map((sb) => (
                  <div key={sb.status} className="flex justify-between items-center bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5]">
                    <span className="font-bold text-[#111111] text-xs">{sb.status}</span>
                    <span className="text-xs text-[#6b7280]">{sb.count} orders</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
