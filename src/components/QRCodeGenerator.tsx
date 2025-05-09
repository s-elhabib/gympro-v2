import React from "react";
import QRCode from "react-qr-code";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Download, Printer } from "lucide-react";

interface QRCodeGeneratorProps {
  memberId: string;
  memberName: string;
  size?: number;
  showControls?: boolean;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  memberId,
  memberName,
  size = 200,
  showControls = true,
}) => {
  // The QR code value will be a JSON string containing the member ID
  const qrValue = JSON.stringify({
    id: memberId,
    name: memberName,
    type: "gym-attendance",
  });

  // Function to download QR code as SVG
  const downloadQRCode = () => {
    const svg = document.getElementById("member-qrcode");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `${memberName.replace(/\s+/g, "_")}_qrcode.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  // Function to print QR code
  const printQRCode = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const svg = document.getElementById("member-qrcode");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${memberName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
            }
            h2 {
              margin-bottom: 20px;
            }
            .qr-code {
              margin-bottom: 20px;
            }
            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${memberName}</h2>
            <div class="qr-code">
              ${svgData}
            </div>
            <p>Scan this QR code for gym attendance</p>
            <button onclick="window.print(); window.close();">Print</button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <Card className="w-fit mx-auto">
      <CardContent className="pt-6 flex flex-col items-center">
        <div className="bg-white p-3 rounded-lg mb-4">
          <QRCode
            id="member-qrcode"
            value={qrValue}
            size={size}
            level="H"
            title={`QR Code for ${memberName}`}
          />
        </div>
        
        {showControls && (
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQRCode}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={printQRCode}
              className="flex items-center gap-1"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;
