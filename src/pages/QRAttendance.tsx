import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useNotifications } from "@/context/NotificationContext";
import QRCodeScanner from "@/components/QRCodeScanner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  LogOut,
  QrCode,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QRAttendance = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<"check-in" | "check-out">(
    "check-in"
  );
  const [lastScannedMember, setLastScannedMember] = useState<{
    id: string;
    name: string;
    timestamp: Date;
    success: boolean;
    message: string;
  } | null>(null);
  const [recentActivity, setRecentActivity] = useState<
    Array<{
      id: string;
      name: string;
      timestamp: Date;
      type: "check-in" | "check-out";
    }>
  >([]);

  // Handle successful QR code scan for check-in
  const handleCheckInSuccess = async (memberId: string, memberName: string) => {
    try {
      // Check if member already has an active check-in
      const { data: existingCheckIn, error: checkError } = await supabase
        .from("attendance")
        .select("id")
        .eq("member_id", memberId)
        .is("check_out_time", null)
        .order("check_in_time", { ascending: false })
        .limit(1);

      if (checkError) throw checkError;

      if (existingCheckIn && existingCheckIn.length > 0) {
        setLastScannedMember({
          id: memberId,
          name: memberName,
          timestamp: new Date(),
          success: false,
          message:
            "Member already has an active check-in. Please use check-out instead.",
        });

        addNotification({
          title: "Already Checked In",
          message: `${memberName} already has an active check-in. Please use check-out instead.`,
          type: "warning",
        });

        return;
      }

      // Create new attendance record with check_in_method if the column exists
      // We'll try to insert with check_in_method first, and if it fails, we'll try without it
      try {
        const { error } = await supabase.from("attendance").insert([
          {
            member_id: memberId,
            check_in_time: new Date().toISOString(),
            type: "gym", // Default to gym, can be changed if needed
            notes: "QR code check-in",
            check_in_method: "qr_code",
          },
        ]);

        if (error) {
          // If the error is about the check_in_method column not existing, try without it
          if (error.message.includes("check_in_method")) {
            const { error: fallbackError } = await supabase
              .from("attendance")
              .insert([
                {
                  member_id: memberId,
                  check_in_time: new Date().toISOString(),
                  type: "gym",
                  notes: "QR code check-in (scanned)",
                },
              ]);

            if (fallbackError) throw fallbackError;
          } else {
            throw error;
          }
        }
      } catch (insertError) {
        throw insertError;
      }

      // Error handling is done in the try-catch block above

      // Update UI
      setLastScannedMember({
        id: memberId,
        name: memberName,
        timestamp: new Date(),
        success: true,
        message: "Check-in successful!",
      });

      // Add to recent activity
      setRecentActivity((prev) => [
        {
          id: memberId,
          name: memberName,
          timestamp: new Date(),
          type: "check-in",
        },
        ...prev.slice(0, 9), // Keep only the 10 most recent activities
      ]);

      addNotification({
        title: "Check-in Successful",
        message: `${memberName} has been checked in successfully.`,
        type: "success",
      });
    } catch (error: any) {
      console.error("Error during check-in:", error);

      setLastScannedMember({
        id: memberId,
        name: memberName,
        timestamp: new Date(),
        success: false,
        message: error.message || "Failed to check in. Please try again.",
      });

      addNotification({
        title: "Check-in Failed",
        message: error.message || "Failed to check in. Please try again.",
        type: "error",
      });
    }
  };

  // Handle successful QR code scan for check-out
  const handleCheckOutSuccess = async (
    memberId: string,
    memberName: string
  ) => {
    try {
      // Find the active check-in for this member
      const { data: activeCheckIn, error: fetchError } = await supabase
        .from("attendance")
        .select("id")
        .eq("member_id", memberId)
        .is("check_out_time", null)
        .order("check_in_time", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (!activeCheckIn || activeCheckIn.length === 0) {
        setLastScannedMember({
          id: memberId,
          name: memberName,
          timestamp: new Date(),
          success: false,
          message:
            "No active check-in found for this member. Please check in first.",
        });

        addNotification({
          title: "No Active Check-in",
          message: `${memberName} has no active check-in. Please check in first.`,
          type: "warning",
        });

        return;
      }

      // Update the attendance record with check-out time
      const { error } = await supabase
        .from("attendance")
        .update({ check_out_time: new Date().toISOString() })
        .eq("id", activeCheckIn[0].id);

      if (error) throw error;

      // Update UI
      setLastScannedMember({
        id: memberId,
        name: memberName,
        timestamp: new Date(),
        success: true,
        message: "Check-out successful!",
      });

      // Add to recent activity
      setRecentActivity((prev) => [
        {
          id: memberId,
          name: memberName,
          timestamp: new Date(),
          type: "check-out",
        },
        ...prev.slice(0, 9), // Keep only the 10 most recent activities
      ]);

      addNotification({
        title: "Check-out Successful",
        message: `${memberName} has been checked out successfully.`,
        type: "success",
      });
    } catch (error: any) {
      console.error("Error during check-out:", error);

      setLastScannedMember({
        id: memberId,
        name: memberName,
        timestamp: new Date(),
        success: false,
        message: error.message || "Failed to check out. Please try again.",
      });

      addNotification({
        title: "Check-out Failed",
        message: error.message || "Failed to check out. Please try again.",
        type: "error",
      });
    }
  };

  // Handle QR code scan error
  const handleScanError = (errorMessage: string) => {
    addNotification({
      title: "Scan Error",
      message: errorMessage,
      type: "error",
    });
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 max-w-5xl">
      {/* Mobile-friendly header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/attendance")}
            className="mr-2"
            aria-label="Back to attendance"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">QR Attendance</h1>
        </div>
      </div>

      {/* Main content with responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Scanner section */}
        <div className="order-1">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "check-in" | "check-out")
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger
                value="check-in"
                className="flex items-center justify-center"
              >
                <UserCheck className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">Check-in</span>
              </TabsTrigger>
              <TabsTrigger
                value="check-out"
                className="flex items-center justify-center"
              >
                <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">Check-out</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="check-in">
              {activeTab === "check-in" && (
                <QRCodeScanner
                  key="check-in-scanner"
                  onSuccess={handleCheckInSuccess}
                  onError={handleScanError}
                />
              )}
            </TabsContent>

            <TabsContent value="check-out">
              {activeTab === "check-out" && (
                <QRCodeScanner
                  key="check-out-scanner"
                  onSuccess={handleCheckOutSuccess}
                  onError={handleScanError}
                />
              )}
            </TabsContent>
          </Tabs>

          {/* Last scanned member - shows on mobile and desktop */}
          {lastScannedMember && (
            <Card className="mt-4 sm:mt-6">
              <CardHeader className="pb-2 px-4 py-3 sm:px-6 sm:py-4">
                <CardTitle className="text-base sm:text-lg">
                  Last Scanned Member
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-3 sm:px-6">
                <div className="flex items-start">
                  {lastScannedMember.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{lastScannedMember.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {format(
                        lastScannedMember.timestamp,
                        "HH:mm:ss - dd/MM/yyyy"
                      )}
                    </p>
                    <p
                      className={`text-xs sm:text-sm ${
                        lastScannedMember.success
                          ? "text-green-600"
                          : "text-amber-600"
                      } mt-1`}
                    >
                      {lastScannedMember.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent activity section - shows below scanner on mobile, beside on desktop */}
        <div className="order-2">
          <Card>
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-base sm:text-lg">
                Recent Activity
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest check-ins and check-outs
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 py-3 sm:px-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-4 sm:py-6 text-gray-500">
                  <QrCode className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs sm:text-sm">
                    Scanned members will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={`${activity.id}-${index}`}
                      className="flex items-start border-b pb-3 last:border-0 last:pb-0"
                    >
                      {activity.type === "check-in" ? (
                        <UserCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      ) : (
                        <LogOut className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {activity.name}
                        </p>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-gray-400 mr-1" />
                          <p className="text-xs text-gray-500 truncate">
                            {format(
                              activity.timestamp,
                              "HH:mm:ss - dd/MM/yyyy"
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {activity.type === "check-in"
                            ? "Checked in"
                            : "Checked out"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QRAttendance;
