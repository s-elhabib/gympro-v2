import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, QrCode, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNotifications } from "@/context/NotificationContext";

interface QRCodeScannerProps {
  onSuccess?: (memberId: string, memberName: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

interface QRData {
  id: string;
  name: string;
  type: string;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onSuccess,
  onError,
  onClose,
}) => {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<QRData | null>(null);
  const [memberDetails, setMemberDetails] = useState<any | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Generate a unique ID for this scanner instance to avoid conflicts
  const scannerContainerId = useRef(
    `qr-reader-${Math.random().toString(36).substring(2, 11)}`
  );
  const { addNotification } = useNotifications();

  // Initialize scanner
  useEffect(() => {
    // Ensure the scanner container is in the DOM
    const scannerContainer = document.getElementById(
      scannerContainerId.current
    );
    if (!scannerContainer) {
      // Create the element if it doesn't exist
      const newContainer = document.createElement("div");
      newContainer.id = scannerContainerId.current;
      newContainer.className = "w-full h-[300px]";
      document.body.appendChild(newContainer);
    }

    // Clean up on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Error stopping scanner:", err));
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      setScanning(true);
      setError(null);
      setScanResult(null);
      setMemberDetails(null);

      // Check if the element exists in the DOM
      const scannerElement = document.getElementById(
        scannerContainerId.current
      );
      if (!scannerElement) {
        throw new Error(
          `HTML Element with id=${scannerContainerId.current} not found. Please try again.`
        );
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId.current);
      scannerRef.current = html5QrCode;

      const qrCodeSuccessCallback = async (decodedText: string) => {
        try {
          // Stop scanning after successful scan
          await html5QrCode.stop();
          setScanning(false);

          // Parse the QR code data
          let qrData: QRData;
          try {
            // Log the raw decoded text for debugging
            console.log("Raw QR code data:", decodedText);

            // Try to parse the JSON
            try {
              qrData = JSON.parse(decodedText) as QRData;
              console.log("Parsed QR data:", qrData);
            } catch (parseError) {
              console.error("JSON parse error:", parseError);

              // Try to handle non-JSON QR codes that might contain just the ID
              if (
                decodedText.match(
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                )
              ) {
                // This looks like a UUID, let's use it directly
                console.log("Detected UUID format, using as member ID");
                qrData = {
                  id: decodedText,
                  name: "Unknown", // We'll fetch the name from the database
                  type: "gym-attendance",
                };
              } else {
                throw new Error("Could not parse QR code data as JSON or UUID");
              }
            }

            // Validate the QR data
            if (!qrData.id) {
              throw new Error("QR code missing member ID");
            }

            setScanResult(qrData);
          } catch (err) {
            console.error("QR code validation error:", err);
            setError(
              "Invalid QR code format. Please scan a valid gym attendance QR code."
            );
            if (onError) onError("Invalid QR code format");
            return;
          }

          // Fetch member details
          setLoading(true);
          const { data: memberData, error: memberError } = await supabase
            .from("members")
            .select("*")
            .eq("id", qrData.id)
            .single();

          if (memberError || !memberData) {
            setError(
              "Member not found. Please try again or use manual check-in."
            );
            setLoading(false);
            if (onError) onError("Member not found");
            return;
          }

          setMemberDetails(memberData);
          setLoading(false);

          // Call success callback
          if (onSuccess) {
            onSuccess(
              qrData.id,
              `${memberData.first_name} ${memberData.last_name}`
            );
          }
        } catch (err: any) {
          console.error("Error processing QR code:", err);
          setError(err.message || "Failed to process QR code");
          setLoading(false);
          if (onError) onError(err.message || "Failed to process QR code");
        }
      };

      const qrCodeErrorCallback = (error: any) => {
        console.error("QR Code scanning error:", error);

        // Handle different types of errors
        if (error?.name === "NotAllowedError") {
          // Camera permission error - handled by the library
          return;
        } else if (error?.name === "NotFoundError") {
          setError(
            "Camera not found. Please make sure your device has a camera."
          );
        } else if (error?.name === "NotReadableError") {
          setError(
            "Camera not accessible. Please try again or use a different device."
          );
        } else {
          // Generic error
          console.log("Error details:", error);
          setError("Error scanning QR code. Please try again.");
        }
      };

      // Determine if we're on a mobile device
      const isMobile = window.innerWidth < 640; // sm breakpoint in Tailwind is 640px

      // Configure the scanner for better performance and reliability on mobile
      const config = {
        fps: 10, // Lower FPS for mobile to save battery
        qrbox: {
          width: isMobile ? 200 : 250,
          height: isMobile ? 200 : 250,
        },
        aspectRatio: 1.0,
        disableFlip: false, // Allow mirrored QR codes
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true, // Use the built-in detector if available
        },
        // Optimize for mobile devices
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      setError(err.message || "Failed to start scanner");
      setScanning(false);
      if (onError) onError(err.message || "Failed to start scanner");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const resetScanner = () => {
    stopScanner();
    setScanResult(null);
    setMemberDetails(null);
    setError(null);
  };

  const handleClose = () => {
    stopScanner();
    if (onClose) onClose();
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 py-3 sm:px-6 sm:py-4">
        <CardTitle className="text-base sm:text-lg font-bold">
          <QrCode className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
          QR Scanner
        </CardTitle>
       
      </CardHeader>
      <CardContent className="px-4 py-3 sm:px-6 sm:py-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded text-xs sm:text-sm mb-3 sm:mb-4">
            {error}
          </div>
        )}

        {!scanning && !scanResult && (
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-gray-300 rounded-lg mb-3 sm:mb-4">
            <QrCode className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-2" />
            <p className="text-gray-500 text-center text-sm sm:text-base mb-3 sm:mb-4">
              Scan a member's QR code
            </p>
            <Button
              onClick={startScanner}
              size="sm"
              className="sm:text-base sm:h-10"
            >
              Start Scanning
            </Button>
          </div>
        )}

        <div className={`mb-3 sm:mb-4 ${scanning ? "block" : "hidden"}`}>
          {/* Responsive scanner container - adjust height based on screen size */}
          <div
            id={scannerContainerId.current}
            className="w-full h-[250px] sm:h-[300px] rounded overflow-hidden"
            style={{
              maxWidth: "100%",
              aspectRatio: "1/1",
              margin: "0 auto",
            }}
          ></div>
          <div className="flex justify-center mt-3 sm:mt-4">
            <Button
              variant="outline"
              onClick={stopScanner}
              size="sm"
              className="sm:text-base"
            >
              Cancel
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center p-4 sm:p-6">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-sm sm:text-base">
              Loading member details...
            </span>
          </div>
        )}

        {memberDetails && (
          <div className="border rounded-lg p-3 sm:p-4 mt-3 sm:mt-4">
            <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">
              {memberDetails.first_name} {memberDetails.last_name}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-1">
              Membership: {memberDetails.membership_type}
            </p>
            <p className="text-gray-600 text-xs sm:text-sm mb-1">
              Status: {memberDetails.status}
            </p>
            <div className="flex justify-end mt-3 sm:mt-4">
              <Button
                variant="outline"
                onClick={resetScanner}
                size="sm"
                className="sm:text-base"
              >
                Scan Another
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeScanner;
