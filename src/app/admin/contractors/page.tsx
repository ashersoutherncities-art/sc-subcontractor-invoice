"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Contractor {
  id: number;
  company_name: string;
  rep_name: string | null;
  phone: string | null;
  email: string | null;
  label: string | null;
  services: string | null;
  total_paid: number;
}

const TRADE_OPTIONS = [
  "Concrete",
  "Electrical",
  "Framing",
  "HVAC",
  "Insulation",
  "Landscaping",
  "Masonry",
  "Painting",
  "Plumbing",
  "Roofing",
  "Site Work",
  "Steel / Structural",
  "Tile & Flooring",
  "Windows & Doors",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseServices(contractor: Contractor): string[] {
  const raw = contractor.services || contractor.label || "";
  if (!raw.trim()) return [];
  return raw
    .split(/[,;|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ServiceTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return <span className="text-gray-400 text-xs">--</span>;
  const visible = tags.slice(0, 3);
  const overflow = tags.length - 3;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((tag) => (
        <span
          key={tag}
          className="inline-block bg-[#132452]/10 text-[#132452] text-xs font-medium px-2 py-0.5 rounded-full"
        >
          {tag}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-block bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
          +{overflow}
        </span>
      )}
    </div>
  );
}

export default function ApprovedContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");

  const fetchContractors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contractors");
      if (res.ok) {
        const data = await res.json();
        setContractors(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  const filtered = contractors.filter((c) => {
    const matchesSearch =
      !search ||
      c.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesTrade =
      !tradeFilter ||
      parseServices(c).some((s) =>
        s.toLowerCase().includes(tradeFilter.toLowerCase())
      );
    return matchesSearch && matchesTrade;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-[#132452] hover:underline text-sm font-medium inline-block mb-3"
          >
            &larr; Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-[#132452]">
            Approved Contractors
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Vendors approved for the SCC network
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-500 mb-1">
                Search by Company
              </label>
              <input
                type="text"
                placeholder="Company name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#132452]/20 focus:border-[#132452]"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-500 mb-1">
                Trade / Service
              </label>
              <select
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#132452]/20 focus:border-[#132452]"
              >
                <option value="">All Trades</option>
                {TRADE_OPTIONS.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-400 text-sm">
            Loading contractors...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-400 text-sm">
            {contractors.length === 0
              ? "No approved contractors yet."
              : "No contractors match your filters."}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#132452] text-white">
                    <th className="py-3 px-4 text-left font-semibold">Company Name</th>
                    <th className="py-3 px-4 text-left font-semibold">Rep Name</th>
                    <th className="py-3 px-4 text-left font-semibold">Phone</th>
                    <th className="py-3 px-4 text-left font-semibold">Email</th>
                    <th className="py-3 px-4 text-left font-semibold">Services</th>
                    <th className="py-3 px-4 text-right font-semibold">Total Paid</th>
                    <th className="py-3 px-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, index) => (
                    <tr
                      key={c.id}
                      className={`border-b border-gray-100 hover:bg-[#132452]/5 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-[#132452]">
                        {c.company_name}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {c.rep_name || <span className="text-gray-400">--</span>}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {c.phone || <span className="text-gray-400">--</span>}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {c.email || <span className="text-gray-400">--</span>}
                      </td>
                      <td className="py-3 px-4">
                        <ServiceTags tags={parseServices(c)} />
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-800">
                        {formatCurrency(c.total_paid || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/contractor/${c.id}`}
                          className="inline-block bg-[#fa8c41] text-white text-xs font-semibold px-3 py-1.5 rounded hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
