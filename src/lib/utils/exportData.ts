import XLSX from '../xlsx-shim';
import { format } from 'date-fns';
import { supabase } from '../supabase';

// Define export types
export type ExportFormat = 'csv' | 'xlsx' | 'json';
export type ExportDataType = 'members' | 'payments' | 'attendance' | 'classes' | 'all';

interface ExportOptions {
  format: ExportFormat;
  dataType: ExportDataType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  fileName?: string;
}

/**
 * Convert data to CSV format
 */
export const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const headerRow = headers.join(',');

  // Create data rows
  const rows = data.map(item => {
    return headers.map(header => {
      // Handle values that might contain commas or quotes
      const value = item[header];
      if (value === null || value === undefined) return '';

      const stringValue = String(value);
      // If the value contains commas, quotes, or newlines, wrap it in quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        // Double up any quotes to escape them
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  // Combine header and rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Format data for export
 */
const formatDataForExport = (data: any[], dataType: ExportDataType): any[] => {
  if (!data || data.length === 0) return [];

  switch (dataType) {
    case 'members':
      return data.map(member => ({
        ID: member.id,
        FirstName: member.first_name,
        LastName: member.last_name,
        Email: member.email,
        Phone: member.phone,
        MembershipType: member.membership_type,
        StartDate: member.start_date ? format(new Date(member.start_date), 'yyyy-MM-dd') : '',
        Status: member.status,
        Notes: member.notes || '',
        CreatedAt: member.created_at ? format(new Date(member.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
      }));

    case 'payments':
      return data.map(payment => ({
        ID: payment.id,
        MemberID: payment.member_id,
        Amount: payment.amount,
        PaymentDate: payment.payment_date ? format(new Date(payment.payment_date), 'yyyy-MM-dd') : '',
        DueDate: payment.due_date ? format(new Date(payment.due_date), 'yyyy-MM-dd') : '',
        Status: payment.status,
        PaymentMethod: payment.payment_method,
        Notes: payment.notes || '',
        CreatedAt: payment.created_at ? format(new Date(payment.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
      }));

    case 'attendance':
      return data.map(record => ({
        ID: record.id,
        MemberID: record.member_id,
        CheckInTime: record.check_in_time ? format(new Date(record.check_in_time), 'yyyy-MM-dd HH:mm:ss') : '',
        CheckOutTime: record.check_out_time ? format(new Date(record.check_out_time), 'yyyy-MM-dd HH:mm:ss') : '',
        Type: record.type || 'regular',
        Notes: record.notes || '',
        CreatedAt: record.created_at ? format(new Date(record.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
      }));

    case 'classes':
      return data.map(cls => ({
        ID: cls.id,
        Name: cls.name,
        Description: cls.description,
        Instructor: cls.instructor,
        Capacity: cls.capacity,
        Duration: cls.duration,
        Day: cls.day,
        StartTime: cls.start_time,
        EndTime: cls.end_time,
        Location: cls.location,
        Category: cls.category,
        Difficulty: cls.difficulty,
        IsActive: cls.is_active ? 'Yes' : 'No',
        CreatedAt: cls.created_at ? format(new Date(cls.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
      }));

    default:
      return data;
  }
};

/**
 * Fetch data from Supabase based on data type
 */
const fetchData = async (dataType: ExportDataType, dateRange?: { start: Date; end: Date }): Promise<any[]> => {
  try {
    let query;

    switch (dataType) {
      case 'members':
        query = supabase.from('members').select('*');
        break;

      case 'payments':
        query = supabase.from('payments').select('*');
        if (dateRange) {
          query = query
            .gte('payment_date', dateRange.start.toISOString())
            .lte('payment_date', dateRange.end.toISOString());
        }
        break;

      case 'attendance':
        query = supabase.from('attendance').select('*');
        if (dateRange) {
          query = query
            .gte('check_in_time', dateRange.start.toISOString())
            .lte('check_in_time', dateRange.end.toISOString());
        }
        break;

      case 'classes':
        query = supabase.from('classes').select('*');
        break;

      case 'all':
        // For 'all', we'll fetch each type separately and combine them
        const members = await fetchData('members');
        const payments = await fetchData('payments', dateRange);
        const attendance = await fetchData('attendance', dateRange);
        const classes = await fetchData('classes');

        return {
          members: formatDataForExport(members, 'members'),
          payments: formatDataForExport(payments, 'payments'),
          attendance: formatDataForExport(attendance, 'attendance'),
          classes: formatDataForExport(classes, 'classes')
        };

      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(`Error fetching ${dataType} data:`, error);
    throw error;
  }
};

/**
 * Export data to a file
 */
export const exportData = async (options: ExportOptions): Promise<void> => {
  try {
    const { format, dataType, dateRange, fileName = `export_${dataType}_${new Date().getTime()}` } = options;

    // Fetch data
    const rawData = await fetchData(dataType, dateRange);

    // Format data for export
    let formattedData;
    if (dataType === 'all') {
      formattedData = rawData; // Already formatted in fetchData
    } else {
      formattedData = formatDataForExport(rawData, dataType);
    }

    // Export based on format
    switch (format) {
      case 'csv': {
        let csvContent;

        if (dataType === 'all') {
          // For 'all', create a separate CSV for each data type
          Object.entries(formattedData).forEach(([type, data]) => {
            const typeFileName = `${fileName}_${type}.csv`;
            const csvContent = convertToCSV(data as any[]);
            downloadFile(csvContent, typeFileName, 'text/csv;charset=utf-8;');
          });
          return;
        } else {
          csvContent = convertToCSV(formattedData);
        }

        downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8;');
        break;
      }

      case 'xlsx': {
        const workbook = XLSX.utils.book_new();

        if (dataType === 'all') {
          // For 'all', create a separate worksheet for each data type
          Object.entries(formattedData).forEach(([type, data]) => {
            const worksheet = XLSX.utils.json_to_sheet(data as any[]);
            XLSX.utils.book_append_sheet(workbook, worksheet, type);
          });
        } else {
          const worksheet = XLSX.utils.json_to_sheet(formattedData);
          XLSX.utils.book_append_sheet(workbook, worksheet, dataType);
        }

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        downloadFile(
          new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
          `${fileName}.xlsx`,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        break;
      }

      case 'json': {
        const jsonContent = JSON.stringify(formattedData, null, 2);
        downloadFile(jsonContent, `${fileName}.json`, 'application/json');
        break;
      }

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

/**
 * Helper function to download a file
 */
const downloadFile = (content: string | Blob, fileName: string, mimeType: string): void => {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
