import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch } from "../../hooks";
import { getPatientProfile } from "../../services/api";
import { LoadingSpinner, getStatusVariant } from "../shared";

function InfoField({ label, value }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <p className="mt-0.5 font-medium">{value || "—"}</p>
    </div>
  );
}

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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {profile.fullname?.charAt(0) || "?"}
          </div>
          <div>
            <CardTitle>{profile.fullname}</CardTitle>
            <p className="text-sm text-muted-foreground font-mono">
              {profile.CardID}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant={getStatusVariant(profile.Status)}>
              {profile.Status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <InfoField label="Blood Group" value={profile.BloodGroup} />
          <InfoField label="Contact" value={profile.contact_number} />
          <InfoField
            label="Height"
            value={profile.Height_cm ? `${profile.Height_cm} cm` : null}
          />
          <InfoField
            label="Weight"
            value={profile.Weight_kg ? `${profile.Weight_kg} kg` : null}
          />
          <InfoField
            label="Issue Date"
            value={
              profile.IssueDate
                ? new Date(profile.IssueDate).toLocaleDateString()
                : null
            }
          />
          <InfoField label="Type" value={profile.type} />
        </div>
      </CardContent>
    </Card>
  );
}
