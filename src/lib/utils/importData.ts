import * as XLSX from 'xlsx';
import { supabase } from '../supabase';
import { parseISO, isValid as isValidDate } from 'date-fns';

// Define import types
export type ImportDataType = 'members' | 'payments' | 'attendance' | 'classes';
export type ImportFormat = 'csv' | 'xlsx' | 'json';
export type ImportMode = 'merge' | 'replace';

interface ImportOptions {
  file: File;
  dataType: ImportDataType;
  mode: ImportMode;
  onProgress?: (progress: number) => void;
  onComplete?: (result: ImportResult) => void;
  onError?: (error: Error) => void;
}

export interface ImportResult {
  success: boolean;
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errors: string[];
  data?: any[];
}

/**
 * Parse CSV data
 */
const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(header => header.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const obj: Record<string, string> = {};
    const currentLine = lines[i].split(',');

    for (let j = 0; j < headers.length; j++) {
      // Handle quoted values with commas
      let value = currentLine[j]?.trim() || '';

      // If value starts with a quote but doesn't end with one, it may contain commas
      if (value.startsWith('"') && !value.endsWith('"')) {
        let k = j + 1;
        // Keep adding parts until we find the closing quote
        while (k < currentLine.length) {
          value += ',' + currentLine[k];
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

    result.push(obj);
  }

  return result;
};

/**
 * Parse file based on format
 */
const parseFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const result = event.target?.result;

        if (!result) {
          reject(new Error('Failed to read file'));
          return;
        }

        // Determine file type
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const csvData = result as string;
          const parsedData = parseCSV(csvData);
          resolve(parsedData);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Parse Excel
          const data = new Uint8Array(result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } else if (file.name.endsWith('.json')) {
          // Parse JSON
          const jsonData = JSON.parse(result as string);
          resolve(Array.isArray(jsonData) ? jsonData : [jsonData]);
        } else {
          reject(new Error('Unsupported file format'));
        }
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    // Read the file based on its type
    if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

/**
 * Validate and transform data for import
 */
const validateAndTransformData = (data: any[], dataType: ImportDataType): { valid: any[], invalid: any[], errors: string[] } => {
  const valid: any[] = [];
  const invalid: any[] = [];
  const errors: string[] = [];

  // Define required fields for each data type
  const requiredFields: Record<ImportDataType, string[]> = {
    members: ['FirstName', 'LastName', 'Email', 'MembershipType'],
    payments: ['MemberID', 'Amount', 'PaymentDate', 'Status'],
    attendance: ['MemberID', 'CheckInTime'],
    classes: ['Name', 'Instructor', 'Capacity', 'Day', 'StartTime', 'EndTime']
  };

  // Normalize field names (handle different cases and formats)
  const normalizeFieldName = (field: string): string => {
    // Remove spaces, underscores, and convert to lowercase
    return field.replace(/[ _]/g, '').toLowerCase();
  };

  // Create a mapping of normalized field names to actual field names
  const fieldMapping: Record<string, string> = {};
  if (data.length > 0) {
    const firstItem = data[0];
    Object.keys(firstItem).forEach(field => {
      fieldMapping[normalizeFieldName(field)] = field;
    });
  }

  // Get the actual field name from the normalized name
  const getActualFieldName = (normalizedName: string): string | undefined => {
    return fieldMapping[normalizeFieldName(normalizedName)];
  };

  // Check if all required fields are present
  const missingRequiredFields = requiredFields[dataType].filter(field =>
    !getActualFieldName(field)
  );

  if (missingRequiredFields.length > 0) {
    errors.push(`Missing required fields: ${missingRequiredFields.join(', ')}`);
    return { valid: [], invalid: data, errors };
  }

  // Process each record
  data.forEach((record, index) => {
    try {
      const transformedRecord: Record<string, any> = {};
      let isValid = true;
      let recordErrors: string[] = [];

      // Transform based on data type
      switch (dataType) {
        case 'members': {
          // Get field names
          const firstNameField = getActualFieldName('FirstName')!;
          const lastNameField = getActualFieldName('LastName')!;
          const emailField = getActualFieldName('Email')!;
          const membershipTypeField = getActualFieldName('MembershipType')!;
          const phoneField = getActualFieldName('Phone');
          const startDateField = getActualFieldName('StartDate');
          const statusField = getActualFieldName('Status');
          const notesField = getActualFieldName('Notes');

          // Validate required fields
          if (!record[firstNameField] || !record[lastNameField] || !record[emailField] || !record[membershipTypeField]) {
            isValid = false;
            recordErrors.push(`Row ${index + 1}: Missing required fields`);
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (record[emailField] && !emailRegex.test(record[emailField])) {
            isValid = false;
            recordErrors.push(`Row ${index + 1}: Invalid email format`);
          }

          // Validate date format if present
          if (startDateField && record[startDateField]) {
            try {
              const date = parseISO(record[startDateField]);
              if (!isValidDate(date)) {
                isValid = false;
                recordErrors.push(`Row ${index + 1}: Invalid start date format (should be YYYY-MM-DD). Found: "${record[startDateField]}"`);
              }
            } catch (error) {
              isValid = false;
              recordErrors.push(`Row ${index + 1}: Invalid start date format (should be YYYY-MM-DD). Found: "${record[startDateField]}"`);
            }
          }

          // Transform to database format
          transformedRecord.first_name = record[firstNameField];
          transformedRecord.last_name = record[lastNameField];
          transformedRecord.email = record[emailField];
          transformedRecord.membership_type = record[membershipTypeField];
          if (phoneField) transformedRecord.phone = record[phoneField];
          if (startDateField) transformedRecord.start_date = record[startDateField];
          if (statusField) transformedRecord.status = record[statusField] || 'active';
          if (notesField) transformedRecord.notes = record[notesField];
          break;
        }

        case 'payments': {
          // Get field names
          const memberIdField = getActualFieldName('MemberID')!;
          const amountField = getActualFieldName('Amount')!;
          const paymentDateField = getActualFieldName('PaymentDate')!;
          const statusField = getActualFieldName('Status')!;
          const dueDateField = getActualFieldName('DueDate');
          const paymentMethodField = getActualFieldName('PaymentMethod');
          const notesField = getActualFieldName('Notes');

          // Validate required fields
          if (!record[memberIdField] || !record[amountField] || !record[paymentDateField] || !record[statusField]) {
            isValid = false;
            recordErrors.push(`Row ${index + 1}: Missing required fields`);
          }

          // Validate amount is a number
          const amount = parseFloat(record[amountField]);
          if (isNaN(amount)) {
            isValid = false;
            recordErrors.push(`Row ${index + 1}: Amount must be a number`);
          }

          // Validate date formats
          if (record[paymentDateField]) {
            try {
              const date = parseISO(record[paymentDateField]);
              if (!isValidDate(date)) {
                isValid = false;
                recordErrors.push(`Row ${index + 1}: Invalid payment date format (should be YYYY-MM-DD). Found: "${record[paymentDateField]}"`);
              }
            } catch (error) {
              isValid = false;
              recordErrors.push(`Row ${index + 1}: Invalid payment date format (should be YYYY-MM-DD). Found: "${record[paymentDateField]}"`);
            }
          }

          if (dueDateField && record[dueDateField]) {
            try {
              const date = parseISO(record[dueDateField]);
              if (!isValidDate(date)) {
                isValid = false;
                recordErrors.push(`Row ${index + 1}: Invalid due date format (should be YYYY-MM-DD). Found: "${record[dueDateField]}"`);
              }
            } catch (error) {
              isValid = false;
              recordErrors.push(`Row ${index + 1}: Invalid due date format (should be YYYY-MM-DD). Found: "${record[dueDateField]}"`);
            }
          }

          // Transform to database format
          transformedRecord.member_id = record[memberIdField];
          transformedRecord.amount = amount;
          transformedRecord.payment_date = record[paymentDateField];
          transformedRecord.status = record[statusField];
          if (dueDateField) transformedRecord.due_date = record[dueDateField];
          if (paymentMethodField) transformedRecord.payment_method = record[paymentMethodField] || 'cash';
          if (notesField) transformedRecord.notes = record[notesField];
          break;
        }

        case 'attendance': {
          // Get field names
          const memberIdField = getActualFieldName('MemberID')!;
          const checkInTimeField = getActualFieldName('CheckInTime')!;
          const checkOutTimeField = getActualFieldName('CheckOutTime');
          const typeField = getActualFieldName('Type');
          const notesField = getActualFieldName('Notes');

          // Validate required fields
          if (!record[memberIdField] || !record[checkInTimeField]) {
            isValid = false;
            recordErrors.push(`Row ${index + 1}: Missing required fields`);
          }

          // Validate date formats
          if (record[checkInTimeField]) {
            try {
              const date = parseISO(record[checkInTimeField]);
              if (!isValidDate(date)) {
                isValid = false;
                recordErrors.push(`Row ${index + 1}: Invalid check-in time format (should be YYYY-MM-DDThh:mm:ss, ex: 2023-03-15T08:30:00). Found: "${record[checkInTimeField]}"`);
              }
            } catch (error) {
              isValid = false;
              recordErrors.push(`Row ${index + 1}: Invalid check-in time format (should be YYYY-MM-DDThh:mm:ss, ex: 2023-03-15T08:30:00). Found: "${record[checkInTimeField]}"`);
            }
          }

          if (checkOutTimeField && record[checkOutTimeField]) {
            try {
              const date = parseISO(record[checkOutTimeField]);
              if (!isValidDate(date)) {
                isValid = false;
                recordErrors.push(`Row ${index + 1}: Invalid check-out time format (should be YYYY-MM-DDThh:mm:ss, ex: 2023-03-15T10:15:00). Found: "${record[checkOutTimeField]}"`);
              }
            } catch (error) {
              isValid = false;
              recordErrors.push(`Row ${index + 1}: Invalid check-out time format (should be YYYY-MM-DDThh:mm:ss, ex: 2023-03-15T10:15:00). Found: "${record[checkOutTimeField]}"`);
            }
          }

          // Transform to database format
          transformedRecord.member_id = record[memberIdField];
          transformedRecord.check_in_time = record[checkInTimeField];
          if (checkOutTimeField) transformedRecord.check_out_time = record[checkOutTimeField];
          if (typeField) transformedRecord.type = record[typeField] || 'regular';
          if (notesField) transformedRecord.notes = record[notesField];
          break;
        }

        case 'classes': {
          // Get field names
          const nameField = getActualFieldName('Name')!;
          const instructorField = getActualFieldName('Instructor')!;
          const capacityField = getActualFieldName('Capacity')!;
          const dayField = getActualFieldName('Day')!;
          const startTimeField = getActualFieldName('StartTime')!;
          const endTimeField = getActualFieldName('EndTime')!;
          const descriptionField = getActualFieldName('Description');
          const durationField = getActualFieldName('Duration');
          const locationField = getActualFieldName('Location');
          const categoryField = getActualFieldName('Category');
          const difficultyField = getActualFieldName('Difficulty');
          const isActiveField = getActualFieldName('IsActive');

          // Validate required fields
          if (!record[nameField] || !record[instructorField] || !record[capacityField] ||
              !record[dayField] || !record[startTimeField] || !record[endTimeField]) {
            isValid = false;
            recordErrors.push(`Row ${index + 1}: Missing required fields`);
          }

          // Validate capacity is a number
          const capacity = parseInt(record[capacityField]);
          if (isNaN(capacity) || capacity <= 0) {
            isValid = false;
            recordErrors.push(`Row ${index + 1}: Capacity must be a positive number`);
          }

          // Validate day of week
          const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          if (!validDays.includes(record[dayField].toLowerCase())) {
            isValid = false;
            recordErrors.push(`Row ${index + 1}: Invalid day of week`);
          }

          // Transform to database format
          transformedRecord.name = record[nameField];
          transformedRecord.instructor = record[instructorField];
          transformedRecord.capacity = capacity;
          transformedRecord.day = record[dayField].toLowerCase();
          transformedRecord.start_time = record[startTimeField];
          transformedRecord.end_time = record[endTimeField];
          if (descriptionField) transformedRecord.description = record[descriptionField] || '';
          if (durationField) transformedRecord.duration = parseInt(record[durationField]) || 60;
          if (locationField) transformedRecord.location = record[locationField] || 'Main Studio';
          if (categoryField) transformedRecord.category = record[categoryField] || 'strength';
          if (difficultyField) transformedRecord.difficulty = record[difficultyField] || 'all_levels';
          if (isActiveField) {
            const isActiveValue = record[isActiveField];
            transformedRecord.is_active =
              isActiveValue === 'Yes' || isActiveValue === 'yes' || isActiveValue === 'true' || isActiveValue === 'TRUE' || isActiveValue === '1';
          } else {
            transformedRecord.is_active = true;
          }
          break;
        }
      }

      if (isValid) {
        valid.push(transformedRecord);
      } else {
        invalid.push(record);
        errors.push(...recordErrors);
      }
    } catch (error) {
      invalid.push(record);
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return { valid, invalid, errors };
};

/**
 * Import data to Supabase
 */
const importToSupabase = async (
  data: any[],
  dataType: ImportDataType,
  mode: ImportMode,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; importedCount: number; errors: string[] }> => {
  const errors: string[] = [];
  let importedCount = 0;

  try {
    // Determine table name
    const tableName = dataType;

    // If mode is 'replace', delete existing data first
    if (mode === 'replace') {
      const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        errors.push(`Failed to clear existing data: ${error.message}`);
        return { success: false, importedCount: 0, errors };
      }
    }

    // Process in batches to avoid hitting API limits
    const batchSize = 50;
    const batches = [];

    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    // Import each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      // Update progress
      if (onProgress) {
        onProgress((i / batches.length) * 100);
      }

      // Insert or upsert based on mode
      let result;
      if (mode === 'merge') {
        // For merge mode, use upsert to update existing records
        result = await supabase.from(tableName).upsert(batch, {
          onConflict: dataType === 'members' ? 'email' : 'id',
          ignoreDuplicates: false
        });
      } else {
        // For replace mode, we've already deleted existing data, so just insert
        result = await supabase.from(tableName).insert(batch);
      }

      if (result.error) {
        errors.push(`Batch ${i + 1} error: ${result.error.message}`);
      } else {
        importedCount += batch.length;
      }
    }

    // Final progress update
    if (onProgress) {
      onProgress(100);
    }

    return {
      success: errors.length === 0,
      importedCount,
      errors
    };
  } catch (error) {
    errors.push(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      importedCount,
      errors
    };
  }
};

/**
 * Main import function
 */
export const importData = async (options: ImportOptions): Promise<ImportResult> => {
  const { file, dataType, mode, onProgress, onComplete, onError } = options;

  try {
    // Parse the file
    const parsedData = await parseFile(file);

    // Validate and transform data
    const { valid, invalid, errors: validationErrors } = validateAndTransformData(parsedData, dataType);

    // Import valid data to Supabase
    const { success, importedCount, errors: importErrors } = await importToSupabase(
      valid,
      dataType,
      mode,
      onProgress
    );

    // Combine all errors
    const allErrors = [...validationErrors, ...importErrors];

    // Create result
    const result: ImportResult = {
      success: success && allErrors.length === 0,
      totalRecords: parsedData.length,
      importedRecords: importedCount,
      skippedRecords: parsedData.length - importedCount,
      errors: allErrors,
      data: valid
    };

    // Call onComplete callback if provided
    if (onComplete) {
      onComplete(result);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Call onError callback if provided
    if (onError) {
      onError(error instanceof Error ? error : new Error(errorMessage));
    }

    return {
      success: false,
      totalRecords: 0,
      importedRecords: 0,
      skippedRecords: 0,
      errors: [errorMessage]
    };
  }
};
