import { EmployeeTable } from '../../components/admin/EmployeeTable';
import { SectionHeader } from '../../components/shared';
export default function AdminEmployeesPage() {
  return (<div><SectionHeader title="Employees" subtitle="Manage all medical centre staff" /><EmployeeTable /></div>);
}