"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Offer {
  id: number;
  user_id: number;
  company: string;
  company_logo_url: string;
  role: string;
  offer_type: string;
  hourly_rate: number;
  monthly_rate: number;
  location: string;
  created_at: string;
}

export default function Offers() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  
  // Filter states
  const [offerTypeFilter, setOfferTypeFilter] = useState<"all" | "internship" | "full-time">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [hourlyRateFilter, setHourlyRateFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"hourly_rate" | "location" | "created_at">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Form state
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    offerType: "internship",
    hourlyRate: "",
    location: "",
  });

  // Calculate monthly rate from hourly rate (40 hrs/week × 4.33 weeks/month ≈ 173.33 hrs/month)
  const calculateMonthlyRate = (hourlyRate: number) => {
    return hourlyRate * 173.33;
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    filterAndSortOffers();
  }, [offers, offerTypeFilter, companyFilter, hourlyRateFilter, locationFilter, sortBy, sortOrder]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/offers", {
        credentials: "include",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setOffers(data || []);
      } else {
        console.error("Failed to fetch offers");
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUniqueCompanies = () => {
    const companies = [...new Set(offers.map(offer => offer.company))];
    return companies.sort();
  };

  const getUniqueHourlyRates = () => {
    const rates = [...new Set(offers.map(offer => offer.hourly_rate))];
    return rates.sort((a, b) => a - b);
  };

  const getUniqueLocations = () => {
    const locations = [...new Set(offers.map(offer => offer.location))];
    return locations.sort();
  };

  const filterAndSortOffers = () => {
    let filtered = [...offers];

    // Filter by offer type
    if (offerTypeFilter !== "all") {
      filtered = filtered.filter(offer => offer.offer_type === offerTypeFilter);
    }

    // Filter by company
    if (companyFilter !== "all") {
      filtered = filtered.filter(offer => offer.company === companyFilter);
    }

    // Filter by hourly rate
    if (hourlyRateFilter !== "all") {
      filtered = filtered.filter(offer => offer.hourly_rate === parseFloat(hourlyRateFilter));
    }

    // Filter by location
    if (locationFilter !== "all") {
      filtered = filtered.filter(offer => offer.location === locationFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "hourly_rate":
          comparison = a.hourly_rate - b.hourly_rate;
          break;
        case "location":
          comparison = a.location.localeCompare(b.location);
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredOffers(filtered);
  };

  const calculateAverages = () => {
    if (filteredOffers.length === 0) {
      return { avgHourly: 0, avgMonthly: 0 };
    }

    const totalHourly = filteredOffers.reduce((sum, offer) => sum + offer.hourly_rate, 0);
    const totalMonthly = filteredOffers.reduce((sum, offer) => sum + offer.monthly_rate, 0);

    return {
      avgHourly: totalHourly / filteredOffers.length,
      avgMonthly: totalMonthly / filteredOffers.length,
    };
  };

  const handleAddOffer = async () => {
    setSavingOffer(true);
    try {
      const hourlyRate = parseFloat(formData.hourlyRate);
      const monthlyRate = calculateMonthlyRate(hourlyRate);

      const res = await fetch("http://localhost:8080/api/offers", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: formData.company,
          role: formData.role,
          offer_type: formData.offerType,
          hourly_rate: hourlyRate,
          monthly_rate: monthlyRate,
          location: formData.location,
        }),
      });

      if (res.ok) {
        setFormData({
          company: "",
          role: "",
          offerType: "internship",
          hourlyRate: "",
          location: "",
        });
        setShowAddModal(false);
        await fetchOffers();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to add offer"}`);
      }
    } catch (error) {
      console.error("Error adding offer:", error);
      alert("Failed to add offer");
    } finally {
      setSavingOffer(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const { avgHourly, avgMonthly } = calculateAverages();

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Offers 💰</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Offer
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setOfferTypeFilter("internship")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            offerTypeFilter === "internship"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Internships
        </button>
        <button
          onClick={() => setOfferTypeFilter("full-time")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            offerTypeFilter === "full-time"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Full-Time
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Average Hourly Rate</p>
          <p className="text-3xl font-bold text-gray-900">
            ${avgHourly.toFixed(2)}<span className="text-lg text-gray-600">/hr</span>
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Average Monthly Rate</p>
          <p className="text-3xl font-bold text-gray-900">
            ${avgMonthly.toFixed(2)}<span className="text-lg text-gray-600">/mo</span>
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Total Offers</p>
          <p className="text-3xl font-bold text-gray-900">{filteredOffers.length}</p>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Company:</label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="all">All Companies</option>
              {getUniqueCompanies().map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Hourly Rate:</label>
            <select
              value={hourlyRateFilter}
              onChange={(e) => setHourlyRateFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="all">All Rates</option>
              {getUniqueHourlyRates().map((rate) => (
                <option key={rate} value={rate.toString()}>
                  ${rate.toFixed(2)}/hr
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Location:</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="all">All Locations</option>
              {getUniqueLocations().map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="created_at">Date Posted</option>
              <option value="hourly_rate">Hourly Rate</option>
              <option value="location">Location</option>
            </select>
          </div>
          
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            {sortOrder === "asc" ? "↑" : "↓"} {sortOrder === "asc" ? "Ascending" : "Descending"}
          </button>
        </div>
      </div>

      {/* Add Offer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add Offer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Company */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="Capital One"
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="Software Engineer Intern"
                />
              </div>

              {/* Offer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="internship"
                      checked={formData.offerType === "internship"}
                      onChange={(e) => setFormData({ ...formData, offerType: e.target.value })}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Internship</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="full-time"
                      checked={formData.offerType === "full-time"}
                      onChange={(e) => setFormData({ ...formData, offerType: e.target.value })}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Full-Time</span>
                  </label>
                </div>
              </div>

              {/* Hourly Rate */}
              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="hourlyRate"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="65.00"
                />
                <p className="text-xs text-gray-500 mt-1">Monthly rate will be auto-calculated (40 hrs/week × 4.33 weeks/month)</p>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="McLean, VA"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOffer}
                disabled={savingOffer || !formData.company || !formData.role || !formData.hourlyRate || !formData.location}
                className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingOffer ? "Adding..." : "Add Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading offers...</div>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No offers found. Be the first to add one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hourly Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                          <Image
                            src={offer.company_logo_url}
                            alt={offer.company}
                            width={40}
                            height={40}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const fallbackIcon = document.createElement('div');
                                fallbackIcon.className = 'fallback-icon w-full h-full flex items-center justify-center text-gray-400';
                                fallbackIcon.innerHTML = `
                                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd" />
                                  </svg>
                                `;
                                parent.appendChild(fallbackIcon);
                              }
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{offer.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{offer.role}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        ${offer.hourly_rate.toFixed(2)}/hr
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        ${offer.monthly_rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{offer.location}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{formatTimeAgo(offer.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
