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
            qrData = JSON.parse(decodedText) as QRData;
            if (
              !qrData.id ||
              !qrData.type ||
              qrData.type !== "gym-attendance"
            ) {
              throw new Error("Invalid QR code format");
            }
            setScanResult(qrData);
          } catch (err) {
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
        // Don't set error for permission errors as they're handled by the library
        if (error?.name !== "NotAllowedError") {
          setError("Error scanning QR code. Please try again.");
        }
      };

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">
          <QrCode className="h-5 w-5 inline mr-2" />
          QR Code Scanner
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!scanning && !scanResult && (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg mb-4">
            <QrCode className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500 text-center mb-4">
              Scan a member's QR code to record attendance
            </p>
            <Button onClick={startScanner}>Start Scanning</Button>
          </div>
        )}

        <div className={`mb-4 ${scanning ? "block" : "hidden"}`}>
          <div
            id={scannerContainerId.current}
            className="w-full h-[300px]"
          ></div>
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={stopScanner}>
              Cancel Scanning
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading member details...</span>
          </div>
        )}

        {memberDetails && (
          <div className="border rounded-lg p-4 mt-4">
            <h3 className="font-semibold text-lg mb-2">
              {memberDetails.first_name} {memberDetails.last_name}
            </h3>
            <p className="text-gray-600 mb-1">
              Membership: {memberDetails.membership_type}
            </p>
            <p className="text-gray-600 mb-1">Status: {memberDetails.status}</p>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={resetScanner} className="mr-2">
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
