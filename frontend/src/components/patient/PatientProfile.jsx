import { useCallback } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import {
  User,
  Phone,
  Droplets,
  Ruler,
  Weight,
  CalendarDays,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch } from "../../hooks";
import { getPatientProfile } from "../../services/api";
import { LoadingSpinner, getStatusVariant } from "../shared";

// ── Dummy avatar placeholder (letter avatar) ──────────────────
function AvatarPlaceholder({ name }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-4xl font-bold select-none">
      {initials}
    </div>
  );
}

// ── Single info field ─────────────────────────────────────────
function InfoField({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 p-1.5 rounded-md bg-muted shrink-0">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide block">
          {label}
        </Label>
        <p className="font-medium text-sm mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────
export function PatientProfile() {
  const { user } = useAuth();
  const { data, loading } = useFetch(
    useCallback(() => getPatientProfile(user?.CardID), [user?.CardID]),
    [user?.CardID],
  );
  const profile = data?.data;

  if (loading) return <LoadingSpinner className="py-16" />;

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Profile not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">

          {/* ── Left: Photo ──────────────────────────────────── */}
        <div className="sm:w-64 md:w-72 lg:w-80 h-52 shrink-0 relative overflow-hidden bg-muted flex">
          {profile.photo_url ? (
        <img
          src={profile.photo_url}
          alt={profile.fullname}
          className="w-full h-full object-cover object-center"
          onError={(e) => {
          e.currentTarget.style.display = "none";
          e.currentTarget.nextSibling.style.display = "flex";
          }}
        />
        ) : null}

        <div
          className="absolute inset-0 flex"
          style={{ display: profile.photo_url ? "none" : "flex" }}
        >
         <AvatarPlaceholder name={profile.fullname} />
        </div>
        </div>

          {/* ── Right: Info ───────────────────────────────────── */}
          <div className="flex-1 p-5 sm:p-6">
            {/* Name + Status */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold leading-tight">
                  {profile.fullname}
                </h2>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">
                  {profile.CardID}
                </p>
              </div>
              <Badge variant={getStatusVariant(profile.Status)} className="shrink-0 mt-0.5">
                {profile.Status}
              </Badge>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField
                icon={Droplets}
                label="Blood Group"
                value={profile.BloodGroup}
              />
              <InfoField
                icon={Phone}
                label="Contact"
                value={profile.contact_number}
              />
              <InfoField
                icon={Ruler}
                label="Height"
                value={profile.Height_cm ? `${profile.Height_cm} cm` : null}
              />
              <InfoField
                icon={Weight}
                label="Weight"
                value={profile.Weight_kg ? `${profile.Weight_kg} kg` : null}
              />
              <InfoField
                icon={CalendarDays}
                label="Issue Date"
                value={
                  profile.IssueDate
                    ? new Date(profile.IssueDate).toLocaleDateString()
                    : null
                }
              />
              <InfoField
                icon={CreditCard}
                label="Card Type"
                value={profile.type}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}