import { useMemo, useState, useEffect } from "react";
import {
  Search,
  Filter,
  MapPin,
  Star,
  Heart,
  ArrowRight,
  Clock,
  Users,
  Phone,
  X,
  Home,
  Utensils,
  HeartPulse,
  Briefcase,
  BookOpen,
  Scale,
  Brain as BrainIcon,
  CheckCircle,
} from "lucide-react";
import { requestsApi } from "../../api/requests";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { usePublicServices } from "../../hooks/useServices";

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  rating: number;
  availability: "Available" | "Waitlist" | "Limited" | "Unavailable";
  openHours: string;
  eligibility: string;
  phone: string;
  boroughArea: string;
  organization: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  housing: Home,
  food: Utensils,
  healthcare: HeartPulse,
  employment: Briefcase,
  education: BookOpen,
  legal: Scale,
  mental_health: BrainIcon,
};

function ServiceIconBanner({ category }: { category: string }) {
  const Icon = categoryIcons[category] ?? Home;
  return (
    <div
      className="h-[80px] flex items-center justify-center rounded-t-2xl"
      style={{ background: "#F0FDFA" }}
    >
      <Icon
        style={{ width: 40, height: 40, color: "#0D9488" }}
        strokeWidth={1.5}
      />
    </div>
  );
}

function AvailabilityBadge({ status }: { status: Service["availability"] }) {
  const styles: Record<Service["availability"], string> = {
    Available: "bg-[#F0FDF4] text-[#16A34A]",
    Limited: "bg-[#FFFBEB] text-[#B45309]",
    Waitlist: "bg-[#FFFBEB] text-[#B45309]",
    Unavailable: "bg-[#F9FAFB] text-[#6B7280]",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

interface ApplyModalProps {
  service: Service;
  onClose: () => void;
}

function ApplyModal({ service, onClose }: ApplyModalProps) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    borough: "",
    reason: "",
    notes: "",
    contactMethod: "email",
  });

  const [boroughs, setBoroughs] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("boroughs")
      .select("name")
      .order("name")
      .then(({ data }) => {
        setBoroughs((data || []).map((b: any) => b.name));
      });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await requestsApi.create({
        category: service.category as any,
        borough: form.borough,
        description: form.reason,
        serviceId: service.id,
      });
      setSubmitted(true);
    } catch {
      alert("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Application Submitted!
            </h3>
            <p className="text-gray-500 text-[14px] mb-6">
              Your application for <strong>{service.name}</strong> has been
              submitted. You'll receive updates via {form.contactMethod}.
            </p>
            <button
              onClick={onClose}
              className="w-full h-11 bg-teal-600 text-white rounded-xl font-semibold text-[14px] hover:bg-teal-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-[18px] font-bold text-gray-900">
                  Apply for Service
                </h2>
                <p className="text-[13px] text-teal-600 font-medium mt-0.5">
                  {service.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name"
                    className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="(555) 000-0000"
                    className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Borough
                </label>
                <select
                  required
                  value={form.borough}
                  onChange={(e) =>
                    setForm({ ...form, borough: e.target.value })
                  }
                  className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all bg-white"
                >
                  <option value="">Select your borough</option>
                  {boroughs.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Why do you need this service?
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Briefly describe your situation and why you're applying..."
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 border border-gray-200 text-gray-700 rounded-xl font-medium text-[14px] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 bg-teal-600 text-white rounded-xl font-semibold text-[14px] hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(13,148,136,0.25)] disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function ServicesView() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBorough, setSelectedBorough] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [applyTarget, setApplyTarget] = useState<Service | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>(
    [{ id: "all", label: "All" }],
  );
  const [boroughs, setBoroughs] = useState<string[]>([]);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const publicServicesQuery = usePublicServices({
    category: selectedCategory,
    borough: selectedBorough,
    search: debouncedSearch,
  });

  const services: Service[] = useMemo(() => {
    const rows = publicServicesQuery.data ?? [];
    return rows.map((r) => {
      const availability: Service["availability"] = r.is_available
        ? "Available"
        : "Unavailable";
      return {
        id: r.id,
        name: r.name,
        organization: r.organization?.name ?? "Organization",
        category: r.category,
        description: r.description ?? "",
        location: r.organization?.borough ?? "",
        rating: 4.6, // best-effort default until ratings are implemented
        availability,
        openHours: r.hours ?? "",
        eligibility: r.eligibility ?? "",
        phone: r.organization?.phone ?? "",
        boroughArea: r.organization?.borough ?? "",
      };
    });
  }, [publicServicesQuery.data]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("service_categories")
      .select("slug, label")
      .order("label")
      .then(({ data }) => {
        const mapped = (data || []).map((c: any) => ({
          id: c.slug,
          label: c.label,
        }));
        setCategories([{ id: "all", label: "All" }, ...mapped]);
      });
    supabase
      .from("boroughs")
      .select("name")
      .order("name")
      .then(({ data }) => {
        setBoroughs((data || []).map((b: any) => b.name));
      });
  }, [user]);

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      service.organization
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase()) ||
      service.description.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesSearch;
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-[12px] text-gray-400 mb-1">
          Client Portal / Find Services
        </p>
        <h1 className="text-[24px] font-bold tracking-tight text-gray-900">
          Find Services
        </h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Discover services available in your community
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 md:p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-gray-400" />
            <input
              type="text"
              placeholder="Search services, organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-[10px] text-[14px] text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 h-11 border border-gray-200 rounded-[10px] text-[14px] font-medium text-gray-600 hover:bg-gray-50 hover:border-teal-600 hover:text-teal-600 transition-all flex-shrink-0"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          {showFilters && (
            <select
              value={selectedBorough}
              onChange={(e) => setSelectedBorough(e.target.value)}
              className="h-11 border border-gray-200 rounded-[10px] px-3 text-[14px]"
            >
              <option value="all">All Boroughs</option>
              {boroughs.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-all flex-shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-teal-600 hover:text-teal-600 hover:bg-teal-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {publicServicesQuery.isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : publicServicesQuery.isError ? (
        <div className="py-14 text-center text-red-600">
          Failed to load services.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] text-gray-400 font-medium">
              {filteredServices.length} service
              {filteredServices.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredServices.map((service) => {
                const isFav = favorites.has(service.id);
                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all duration-200 hover:shadow-[0_8px_20px_rgba(13,148,136,0.10)] hover:border-teal-200 hover:-translate-y-0.5"
                  >
                    <ServiceIconBanner category={service.category} />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-[15px] font-bold text-gray-900 leading-snug flex-1 pr-2">
                          {service.name}
                        </h3>
                        <button
                          onClick={() => toggleFavorite(service.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-red-50 flex-shrink-0"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-gray-300"}`}
                          />
                        </button>
                      </div>
                      <p className="text-[13px] font-medium text-teal-600 mb-2.5 hover:underline cursor-pointer">
                        {service.organization}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <AvailabilityBadge status={service.availability} />
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-[12px] font-medium text-gray-600">
                            {service.rating}
                          </span>
                        </div>
                      </div>
                      <p className="text-[13px] text-gray-500 leading-relaxed mb-3 line-clamp-2 flex-1">
                        {service.description}
                      </p>
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2 text-[12px] text-gray-500">
                          <MapPin className="w-[13px] h-[13px] text-gray-400 flex-shrink-0" />
                          <span>{service.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-gray-500">
                          <Clock className="w-[13px] h-[13px] text-gray-400 flex-shrink-0" />
                          <span>{service.openHours}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-gray-500">
                          <Users className="w-[13px] h-[13px] text-gray-400 flex-shrink-0" />
                          <span className="truncate">
                            {service.eligibility}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2.5 mt-auto">
                        <button
                          onClick={() => setApplyTarget(service)}
                          className="flex-1 h-11 bg-teal-600 text-white rounded-[10px] font-semibold text-[13px] hover:bg-teal-700 transition-colors flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(13,148,136,0.20)]"
                        >
                          Request Now
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyPhone(service.phone)}
                          className="w-11 h-11 rounded-[10px] border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:border-teal-600 hover:text-teal-600 transition-all flex-shrink-0"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-[17px] font-semibold text-gray-900 mb-1">
                No services found
              </h3>
              <p className="text-gray-400 text-[14px]">
                Try adjusting your search or category filter.
              </p>
            </div>
          )}
        </>
      )}

      {applyTarget && (
        <ApplyModal
          service={applyTarget}
          onClose={() => setApplyTarget(null)}
        />
      )}

      {copyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-400" />
          Phone number copied!
        </div>
      )}
    </div>
  );
}
