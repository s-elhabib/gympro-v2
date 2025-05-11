import React, { useState, useRef } from "react";
import { useNotifications } from "../context/NotificationContext";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CheckCircle, Download, UploadCloud } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import * as XLSX from "xlsx";

interface MemberData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membershipType: string;
  startDate?: string;
  status?: string;
  notes?: string;
}

const ImportMembersForm = () => {
  const { addNotification } = useNotifications();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<MemberData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check if file is an Excel file or CSV
    if (
      !selectedFile.name.endsWith(".xlsx") &&
      !selectedFile.name.endsWith(".xls") &&
      !selectedFile.name.endsWith(".csv")
    ) {
      addNotification({
        title: "Type de fichier invalide",
        message: "Veuillez télécharger un fichier Excel (.xlsx, .xls) ou CSV",
        type: "error",
      });
      return;
    }

    setFile(selectedFile);

    // Parse the file based on its type
    if (selectedFile.name.endsWith(".csv")) {
      // Parse CSV
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvData = event.target?.result as string;
          const parsedData = parseCSV(csvData);
          console.log("Parsed CSV data:", parsedData);
          setPreviewData(parsedData);
          setShowPreview(true);
        } catch (error) {
          console.error("Error parsing CSV:", error);
          addNotification({
            title: "Erreur",
            message: "Impossible de lire le fichier CSV",
            type: "error",
          });
        }
      };
      reader.readAsText(selectedFile);
    } else {
      // Parse Excel using xlsx library
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Transform the data to match our expected format
          const transformedData = transformExcelData(jsonData);
          console.log("Parsed Excel data:", transformedData);
          setPreviewData(transformedData);
          setShowPreview(true);
        } catch (error) {
          console.error("Error parsing Excel:", error);
          addNotification({
            title: "Erreur",
            message: "Impossible de lire le fichier Excel",
            type: "error",
          });
        }
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  // Helper function to transform Excel data
  const transformExcelData = (data: any[]): MemberData[] => {
    return data.map((row) => {
      // Handle different possible column names
      const firstName =
        row.firstName ||
        row.prénom ||
        row.prenom ||
        row.first_name ||
        row["First Name"] ||
        "";
      const lastName =
        row.lastName || row.nom || row.last_name || row["Last Name"] || "";
      const email = row.email || row.courriel || row.Email || "";
      const phone =
        row.phone || row.téléphone || row.telephone || row.Phone || "";

      // Get the raw membership type value
      const rawMembershipType =
        row.membershipType ||
        row.typeAbonnement ||
        row.membership_type ||
        row["Membership Type"] ||
        "";

      // Use the membership type as is, or map to standard types
      let membershipType = "monthly"; // Default value
      if (rawMembershipType) {
        const lowerCaseType = rawMembershipType.toLowerCase();
        if (
          lowerCaseType === "mensuel" ||
          lowerCaseType === "monthly" ||
          lowerCaseType === "basic"
        ) {
          membershipType = "monthly";
        } else if (
          lowerCaseType === "trimestriel" ||
          lowerCaseType === "quarterly" ||
          lowerCaseType === "premium"
        ) {
          membershipType = "quarterly";
        } else if (
          lowerCaseType === "annuel" ||
          lowerCaseType === "annual" ||
          lowerCaseType === "platinum"
        ) {
          membershipType = "annual";
        } else if (lowerCaseType === "day_pass" || lowerCaseType === "journalier") {
          membershipType = "day_pass";
        } else {
          // Use the raw value if it doesn't match any known type
          membershipType = rawMembershipType;
        }
      }

      const startDate =
        row.startDate ||
        row.dateDebut ||
        row.start_date ||
        row["Start Date"] ||
        new Date().toISOString().split("T")[0];

      // Map status to valid values
      let status = "active"; // Default value
      const rawStatus = row.status || row.statut || row.Status || "";
      if (rawStatus) {
        const lowerCaseStatus = rawStatus.toLowerCase();
        if (lowerCaseStatus === "inactive" || lowerCaseStatus === "inactif") {
          status = "inactive";
        } else if (
          lowerCaseStatus === "suspended" ||
          lowerCaseStatus === "suspendu"
        ) {
          status = "suspended";
        }
      }

      const notes = row.notes || row.Notes || "";

      return {
        firstName,
        lastName,
        email,
        phone,
        membershipType,
        startDate,
        status,
        notes,
      };
    });
  };

  // Helper function to parse CSV
  const parseCSV = (csvText: string): MemberData[] => {
    const lines = csvText.split("\n");
    if (lines.length <= 1) {
      throw new Error("CSV file is empty or has only headers");
    }

    const result: MemberData[] = [];
    const headers = lines[0].split(",").map((header) => header.trim());

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines

      const obj: Record<string, string> = {};
      const currentLine = lines[i].split(",");

      for (let j = 0; j < headers.length; j++) {
        // Handle quoted values with commas
        let value = currentLine[j]?.trim() || "";

        // If value starts with a quote but doesn't end with one, it may contain commas
        if (value.startsWith('"') && !value.endsWith('"')) {
          let k = j + 1;
          // Keep adding parts until we find the closing quote
          while (k < currentLine.length) {
            value += "," + currentLine[k];
            if (currentLine[k].endsWith('"')) break;
            k++;
          }
          j = k; // Skip the parts we've already processed
        }

        // Remove quotes if they exist
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }

        obj[headers[j]] = value;
      }

      // Get the raw values
      const firstName =
        obj.firstName ||
        obj.prénom ||
        obj.prenom ||
        obj.first_name ||
        obj["First Name"] ||
        "";
      const lastName =
        obj.lastName || obj.nom || obj.last_name || obj["Last Name"] || "";
      const email = obj.email || obj.courriel || obj.Email || "";
      const phone =
        obj.phone || obj.téléphone || obj.telephone || obj.Phone || "";

      // Get the raw membership type value
      const rawMembershipType =
        obj.membershipType ||
        obj.typeAbonnement ||
        obj.membership_type ||
        obj["Membership Type"] ||
        "";

      // Use the membership type as is, or map to standard types
      let membershipType = "monthly"; // Default value
      if (rawMembershipType) {
        const lowerCaseType = rawMembershipType.toLowerCase();
        if (
          lowerCaseType === "mensuel" ||
          lowerCaseType === "monthly" ||
          lowerCaseType === "basic"
        ) {
          membershipType = "monthly";
        } else if (
          lowerCaseType === "trimestriel" ||
          lowerCaseType === "quarterly" ||
          lowerCaseType === "premium"
        ) {
          membershipType = "quarterly";
        } else if (
          lowerCaseType === "annuel" ||
          lowerCaseType === "annual" ||
          lowerCaseType === "platinum"
        ) {
          membershipType = "annual";
        } else if (lowerCaseType === "day_pass" || lowerCaseType === "journalier") {
          membershipType = "day_pass";
        } else {
          // Use the raw value if it doesn't match any known type
          membershipType = rawMembershipType;
        }
      }

      const startDate =
        obj.startDate ||
        obj.dateDebut ||
        obj.start_date ||
        obj["Start Date"] ||
        new Date().toISOString().split("T")[0];

      // Map status to valid values
      let status = "active"; // Default value
      const rawStatus = obj.status || obj.statut || obj.Status || "";
      if (rawStatus) {
        const lowerCaseStatus = rawStatus.toLowerCase();
        if (lowerCaseStatus === "inactive" || lowerCaseStatus === "inactif") {
          status = "inactive";
        } else if (
          lowerCaseStatus === "suspended" ||
          lowerCaseStatus === "suspendu"
        ) {
          status = "suspended";
        }
      }

      const notes = obj.notes || obj.Notes || "";

      // Transform to our expected format
      const transformedRow = {
        firstName,
        lastName,
        email,
        phone,
        membershipType,
        startDate,
        status,
        notes,
      };

      result.push(transformedRow);
    }

    return result;
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) return;

    setIsUploading(true);

    try {
      // Validate the data before uploading
      const invalidEntries = previewData.filter((member) => {
        const requiredFields = [
          "firstName",
          "lastName",
          "email",
          "membershipType",
        ];
        return requiredFields.some(
          (field) => !member[field as keyof MemberData]
        );
      });

      if (invalidEntries.length > 0) {
        throw new Error(
          `${invalidEntries.length} membres ont des champs obligatoires manquants`
        );
      }

      // Process members in batches to avoid overloading the database
      const batchSize = 20;
      const batches = [];

      // Split data into batches
      for (let i = 0; i < previewData.length; i += batchSize) {
        batches.push(previewData.slice(i, i + batchSize));
      }

      // Upload batches to Supabase
      let uploadedCount = 0;

      for (const batch of batches) {
        // Format the data according to your database schema
        const formattedBatch = batch.map((member) => ({
          first_name: member.firstName,
          last_name: member.lastName,
          email: member.email,
          phone: member.phone || "",
          membership_type: member.membershipType,
          start_date:
            member.startDate || new Date().toISOString().split("T")[0],
          status: member.status || "active",
          notes: member.notes || "",
        }));

        // Upload to Supabase
        const { error } = await supabase
          .from("members")
          .upsert(formattedBatch, {
            onConflict: "email", // Assuming email is unique
            ignoreDuplicates: false,
          });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        uploadedCount += batch.length;
      }

      addNotification({
        title: "Succès",
        message: `${uploadedCount} membres importés avec succès`,
        type: "success",
      });

      // Reset form
      setFile(null);
      setPreviewData([]);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading members:", error);
      addNotification({
        title: "Erreur",
        message:
          error instanceof Error
            ? error.message
            : "Échec de l'importation des membres",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a template CSV file for member imports
    const headers = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "membershipType",
      "startDate",
      "status",
      "notes",
    ];
    const exampleRow = [
      "John",
      "Doe",
      "john.doe@example.com",
      "0612345678",
      "monthly",
      "2023-01-15",
      "active",
      "Notes optionnelles",
    ];

    // Create CSV content
    const templateContent = [headers.join(","), exampleRow.join(",")].join(
      "\n"
    );

    // Create a blob and download it
    const blob = new Blob([templateContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modele_import_membres.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addNotification({
      title: "Modèle Téléchargé",
      message: "Le modèle d'importation des membres a été téléchargé",
      type: "success",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Importer des Membres</h3>
          <p className="text-sm text-gray-500">
            Téléchargez un fichier Excel ou CSV pour importer plusieurs membres
            à la fois
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger le Modèle
        </Button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <Label htmlFor="file-upload" className="cursor-pointer block">
          <div className="space-y-2">
            <UploadCloud className="h-10 w-10 text-blue-500 mx-auto" />
            <p className="text-sm font-medium">
              {file ? file.name : "Cliquez pour télécharger ou glissez-déposez"}
            </p>
            <p className="text-xs text-gray-500">
              Fichiers Excel ou CSV (max 5MB)
            </p>
          </div>
        </Label>
      </div>

      {showPreview && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Aperçu des Données</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAlertOpen(true)}
            >
              Annuler
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Prénom
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Nom
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Téléphone
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Abonnement
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.slice(0, 5).map((member, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {member.firstName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {member.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {member.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {member.membershipType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {previewData.length > 5 && (
              <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                Et {previewData.length - 5} autres membres...
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importation...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Importer {previewData.length} Membres
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler l'importation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler ? Les données téléchargées seront
              perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, continuer</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setFile(null);
                setPreviewData([]);
                setShowPreview(false);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              Oui, annuler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImportMembersForm;
