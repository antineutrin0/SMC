import { MedicineList } from '../../components/doctor/MedicineList';
import { SectionHeader } from '../../components/shared';
export default function DoctorMedicinesPage() {
  return (<div><SectionHeader title="Available Medicines" subtitle="Current pharmacy inventory" /><MedicineList /></div>);
}