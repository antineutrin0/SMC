import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Stethoscope,
  Ambulance,
  Pill,
  Backpack,
  Phone,
  Mail,
  MapPin,
  Clock,
  LogIn,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useFetch } from "../hooks";
import {
  getPublicRoster,
  getPublicEmployees,
  getServices,
  getMedicalCenterInfo,
} from "../services/api";
import { LoadingSpinner, EmptyState } from "../components/shared";

const ICON_MAP = { Stethoscope, Ambulance, Pill, Backpack };

const backgroundImages = [
  "https://i.ibb.co.com/m5Xd5D6m/43-6718b283784ec.jpg",
  "https://i.ibb.co.com/zH5jSmWP/43-6718b28378630.jpg",
  "https://i.ibb.co.com/TxwJTbCs/43-6718b2837832e.jpg"
];

export default function HomePage() {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(timer);
  }, []);

  const { data: rosterRes, loading: rosterLoading } = useFetch(getPublicRoster);
  const roster = rosterRes?.data ?? [];

  const { data: empRes, loading: empLoading } = useFetch(getPublicEmployees);
  const employees = empRes?.data ?? [];

  const { data: svcRes, loading: svcLoading } = useFetch(getServices);
  const services = svcRes?.data ?? [];

  const { data: infoRes, loading: infoLoading } =
    useFetch(getMedicalCenterInfo);
  const info = infoRes?.data ?? [];

  const designations = ["Doctor", "Nurse", "Administrator", "Driver"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://i.ibb.co.com/RT3Wn4W9/SUST-logo.png"
              alt="SUST-logo"
              className="w-8 h-8 shrink-0"
            />
            <div className="min-w-0">
              <p className="font-bold leading-tight text-sm sm:text-base">
                SUST Medical Centre
              </p>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Shahjalal University of Science &amp; Technology
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <Link to="/dashboard">
                <Button size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative h-56 sm:h-72 md:h-96 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: `url('${backgroundImages[currentImageIndex]}')`,
        }}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 text-white">
          <div className=" p-6 rounded-xl max-w-4xl">
            <h1 className="text-2xl sm:text-4xl font-bold mb-2">
              Quality Healthcare for SUST Community
            </h1>
            {!user && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                <Link to="/login">
                  <Button
                    variant="default"
                    className="bg-white text-blue-700 hover:bg-blue-50"
                  >
                    Login to Portal
                  </Button>
                </Link>
                <Link to="/apply">
                  <Button
                    variant="outline"
                    className="border-white text-white bg-transparent hover:bg-white/20"
                  >
                    Apply for Medical Card
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="services">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="roster">Duty Roster</TabsTrigger>
            <TabsTrigger value="staff">Medical Staff</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Services */}
          <TabsContent value="services">
            <h2 className="text-xl font-bold mb-4">Our Services</h2>
            {svcLoading ? (
              <LoadingSpinner className="py-12" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map((s) => {
                  const Icon = ICON_MAP[s.icon];
                  return (
                    <Card
                      key={s.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-2">
                        <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center mb-2">
                          {Icon && <Icon className="w-5 h-5 text-blue-600" />}
                        </div>
                        <CardTitle className="text-base">{s.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {s.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
                {!svcLoading && services.length === 0 && (
                  <div className="col-span-full">
                    <EmptyState title="No services listed" />
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Roster */}
          <TabsContent value="roster">
            <Card>
              <CardHeader>
                <CardTitle>Current Duty Roster</CardTitle>
              </CardHeader>
              <CardContent>
                {rosterLoading ? (
                  <LoadingSpinner className="py-8" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Designation</TableHead>
                          <TableHead>Duty Type</TableHead>
                          <TableHead>Shift</TableHead>
                          <TableHead>Period</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roster.map((item) => (
                          <TableRow key={item.roster_id}>
                            <TableCell className="font-medium">
                              {item.employee_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.designation}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.duty_type}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {item.shift_start} – {item.shift_end}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {new Date(item.start_date).toLocaleDateString()} –{" "}
                              {new Date(item.end_date).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {roster.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No active duty roster
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff */}
          <TabsContent value="staff">
            {empLoading ? (
              <LoadingSpinner className="py-12" />
            ) : (
              <div className="space-y-8">
                {designations.map((designation) => {
                  const staff = employees.filter(
                    (e) => e.designation === designation,
                  );
                  if (!staff.length) return null;
                  return (
                    <section key={designation}>
                      <h3 className="text-lg font-semibold mb-3">
                        {designation}s
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {staff.map((emp) => (
                          <Card key={emp.employee_id} className="text-center">
                            <CardContent className="pt-6 pb-4">
                              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                                <span className="text-xl font-semibold text-blue-600">
                                  {emp.fullname.charAt(0)}
                                </span>
                              </div>
                              <p className="font-medium text-sm">
                                {emp.fullname}
                              </p>
                              {emp.specialization && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {emp.specialization}
                                </p>
                              )}
                              {emp.contact_no && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {emp.contact_no}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact">
            {infoLoading ? (
              <LoadingSpinner className="py-12" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {info?.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-sm text-muted-foreground">
                            {info.phone}
                          </p>
                        </div>
                      </div>
                    )}
                    {info?.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">
                            {info.email}
                          </p>
                        </div>
                      </div>
                    )}
                    {info?.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Address</p>
                          <p className="text-sm text-muted-foreground">
                            {info.address}
                            <br />
                            {info.city}, {info.country}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Operating Hours</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {info?.operatingHours && (
                      <>
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Weekdays</p>
                            <p className="text-sm text-muted-foreground">
                              {info.operatingHours.weekdays}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Saturday</p>
                            <p className="text-sm text-muted-foreground">
                              {info.operatingHours.saturday}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Ambulance className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">
                              Emergency Services
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {info.operatingHours.emergency}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {!info && (
                      <p className="text-sm text-muted-foreground">
                        Hours information not available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
