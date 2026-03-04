import { Users, Calendar, FileText, Activity } from "lucide-react";
import { StatsCard } from "../shared";
import { useFetch } from "../../hooks";
import { getDashboardStats } from "../../services/api";

export function AdminStats() {
  const { data: statsres, loading } = useFetch(getDashboardStats);
  const stats = statsres?.data;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard
        title="Total Patients"
        value={stats?.totalPatients}
        icon={Users}
        color="blue"
        loading={loading}
      />
      <StatsCard
        title="Active Employees"
        value={stats?.totalEmployees}
        icon={Activity}
        color="green"
        loading={loading}
      />
      <StatsCard
        title="Pending Applications"
        value={stats?.pendingApplications}
        icon={FileText}
        color="orange"
        loading={loading}
      />
      <StatsCard
        title="Today's Visits"
        value={stats?.todayVisits}
        icon={Calendar}
        color="purple"
        loading={loading}
      />
    </div>
  );
}
