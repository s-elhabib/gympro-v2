/**
 * This is a shim file to properly import the xlsx library in Vite
 * It resolves the "xlsx was a simple specifier, but was not remapped" error
 */

// Use dynamic import to avoid the Vite error
const XLSX = await import('../../node_modules/xlsx/xlsx.mjs');

// Export the default object
export default XLSX;
