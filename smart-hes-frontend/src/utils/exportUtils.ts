import { format } from 'date-fns';

/**
 * Export data to CSV file
 */
export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV content
  const csvRows = [];

  // Add header row
  csvRows.push(csvHeaders.join(','));

  // Add data rows
  for (const row of data) {
    const values = csvHeaders.map(header => {
      const value = row[header];

      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }

      // Escape quotes and wrap in quotes if contains comma or quote
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });
    csvRows.push(values.join(','));
  }

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export table to CSV (from HTML table element)
 */
export const exportTableToCSV = (tableId: string, filename: string) => {
  const table = document.getElementById(tableId) as HTMLTableElement;
  if (!table) {
    alert('Table not found');
    return;
  }

  const rows = Array.from(table.querySelectorAll('tr'));
  const csvRows = [];

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('th, td'));
    const values = cells.map(cell => {
      const text = cell.textContent || '';
      // Escape and quote if necessary
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data to Excel (XLSX format)
 * Note: Requires xlsx library (npm install xlsx)
 */
export const exportToExcel = async (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  try {
    // Dynamically import xlsx to avoid bundling if not used
    const XLSX = await import('xlsx');

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`);
  } catch (error) {
    console.error('Excel export error:', error);
    // Fallback to CSV if xlsx is not available
    exportToCSV(data, filename);
  }
};

/**
 * Export to PDF using jsPDF
 * Note: Requires jspdf and jspdf-autotable (npm install jspdf jspdf-autotable)
 */
export const exportToPDF = async (
  title: string,
  data: any[],
  columns: { header: string; dataKey: string }[],
  filename: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
) => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF(orientation);

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 20);

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 28);

    // Add table
    (doc as any).autoTable({
      startY: 35,
      columns,
      body: data,
      headStyles: {
        fillColor: [0, 58, 93], // NH blue color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 35 },
    });

    doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    alert('PDF export failed. Please install required libraries or try CSV export.');
  }
};

/**
 * Print current page
 */
export const printPage = () => {
  window.print();
};

/**
 * Print specific element
 */
export const printElement = (elementId: string, title?: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('Element not found');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title || 'Print'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #003A5D;
            color: white;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          h1 {
            color: #003A5D;
          }
          .print-date {
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        ${title ? `<h1>${title}</h1>` : ''}
        <p class="print-date">Generated: ${format(new Date(), 'PPpp')}</p>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

/**
 * Download JSON data
 */
export const downloadJSON = (data: any, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.json`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = (text: string) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => alert('Copied to clipboard!'))
      .catch(() => alert('Failed to copy'));
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Failed to copy');
    }
    document.body.removeChild(textarea);
  }
};

export default {
  exportToCSV,
  exportTableToCSV,
  exportToExcel,
  exportToPDF,
  printPage,
  printElement,
  downloadJSON,
  copyToClipboard,
};
