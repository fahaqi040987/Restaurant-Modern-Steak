/**
 * CSV Utility Functions for Export/Import
 */

/**
 * Convert array of objects to CSV string
 * @param data Array of objects to convert
 * @param columns Optional column configuration
 * @returns CSV string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function jsonToCSV<T extends Record<string, any>>(
  data: T[],
  columns?: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) return '';

  // If no columns specified, use all keys from first object
  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

  // Create header row
  const headers = cols.map(col => col.label).join(',');

  // Create data rows
  const rows = data.map(item => {
    return cols.map(col => {
      const value = item[col.key];
      
      // Handle different data types
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      
      // Escape quotes and wrap in quotes if contains comma or quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Download CSV file
 * @param csvString CSV content
 * @param filename File name without extension
 */
export function downloadCSV(csvString: string, filename: string): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV file to array of objects
 * @param file CSV file
 * @param headers Optional header mapping
 * @returns Promise<array of objects>
 */
export function parseCSV<T extends Record<string, unknown>>(
  file: File,
  headers?: string[]
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV file must have at least a header row and one data row'));
          return;
        }
        
        // Parse header row
        const headerRow = lines[0];
        const csvHeaders = headers || parseCSVLine(headerRow);
        
        // Parse data rows
        const data = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          const obj: Record<string, string> = {};
          
          csvHeaders.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          
          return obj as T;
        });
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Parse a single CSV line (handles quoted values)
 * @param line CSV line
 * @returns Array of values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
}

/**
 * Validate CSV data against required fields
 * @param data Array of objects
 * @param requiredFields Required field names
 * @returns Validation result with errors
 */
export function validateCSVData<T extends Record<string, unknown>>(
  data: T[],
  requiredFields: (keyof T)[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (data.length === 0) {
    errors.push('CSV file is empty');
    return { valid: false, errors };
  }
  
  // Check required fields in header
  const firstRow = data[0];
  const missingFields = requiredFields.filter(field => !(field in firstRow));
  
  if (missingFields.length > 0) {
    errors.push(`Missing required columns: ${missingFields.join(', ')}`);
  }
  
  // Check for empty required fields in data rows
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        errors.push(`Row ${index + 2}: Missing required field "${String(field)}"`);
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
