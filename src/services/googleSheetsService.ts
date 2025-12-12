/**
 * Google Sheets Service
 * Handles communication with Google Apps Script Web App
 */

// Types
export interface DropdownOption {
  value: string;
  label: string;
  alias?: string; // Optional alias for SKU generation
}

export interface DropdownData {
  productGroups: DropdownOption[];
  productCategories: DropdownOption[];
  colors: DropdownOption[];
  sizes: DropdownOption[];
  locations: DropdownOption[];
  fabrics: DropdownOption[];
  natures: DropdownOption[];
  vendorCodes: DropdownOption[];
}

export interface SKUSubmission {
  timestamp?: string;
  createdBy?: string;
  sku: string;
  productGroup: string;
  productCategory: string;
  color: string;
  size: string;
  style: string;
  location: string;
  fabric: string;
  nature: string;
  vendorCode: string;
  cost: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Get the Google Apps Script Web App URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzo_g5k7DYfCfPCpCTXavOrvgVpg2fj1bKKvNT1COgAHwIhjw8fCyWrgJiwErhsleswAA/exec";

/**
 * Fetch dropdown data from Google Sheets
 */
export async function fetchDropdownData(): Promise<DropdownData> {
  if (!SCRIPT_URL) {
    throw new Error('Google Script URL not configured');
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<any> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch dropdown data');
    }

    // Transform the data to ensure consistent format
    const transformData = (items: any[]): DropdownOption[] => {
      if (!Array.isArray(items)) return [];
      
      return items.map(item => {
        // Handle both string format and object format
        if (typeof item === 'string') {
          return {
            value: item,
            label: item
          };
        } else if (typeof item === 'object' && item !== null) {
          return {
            value: item.value || item.label || '',
            label: item.label || item.value || '',
            alias: item.alias
          };
        }
        return { value: '', label: '' };
      }).filter(item => item.value !== '');
    };

    return {
      productGroups: transformData(result.data['Product Group'] || result.data['Product Groups'] || []),
      productCategories: transformData(result.data['Product Category'] || result.data['Product Categories'] || []),
      colors: transformData(result.data['Color'] || result.data['Colors'] || []),
      sizes: transformData(result.data['Size'] || result.data['Sizes'] || []),
      locations: transformData(result.data['Location'] || result.data['Locations'] || []),
      fabrics: transformData(result.data['Fabric'] || result.data['Fabrics'] || []),
      natures: transformData(result.data['Nature'] || result.data['Natures'] || []),
      vendorCodes: transformData(result.data['Vendor Code'] || result.data['Vendor Codes'] || []),
    };
  } catch (error) {
    console.error('Error fetching dropdown data:', error);
    throw error;
  }
}

/**
 * Submit SKU data to Google Sheets using hidden iframe method
 */
export async function submitSKU(data: SKUSubmission, username: string): Promise<void> {
  if (!SCRIPT_URL) {
    throw new Error(
      'Google Script URL not configured'
    );
  }

  return new Promise((resolve, reject) => {
    try {
      // Create a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.name = 'hidden_iframe_' + Date.now();
      document.body.appendChild(iframe);

      // Create a form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = SCRIPT_URL;
      form.target = iframe.name;

      // Add form data as hidden inputs (including username)
      const formData = { ...data, username };
      Object.entries(formData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = (value || '').toString(); // Ensure string value
        form.appendChild(input);
      });

      // Append form to body and submit
      document.body.appendChild(form);
      
      // Handle iframe load event
      iframe.onload = () => {
        // Clean up
        setTimeout(() => {
          if (document.body.contains(form)) document.body.removeChild(form);
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
          resolve();
        }, 100);
      };

      // Handle errors
      iframe.onerror = () => {
        if (document.body.contains(form)) document.body.removeChild(form);
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
        reject(new Error('Failed to submit SKU'));
      };

      // Submit the form
      form.submit();

      // Timeout fallback
      setTimeout(() => {
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve(); // Assume success after timeout
      }, 5000);

    } catch (error) {
      console.error('Error submitting SKU:', error);
      reject(error);
    }
  });
}

/**
 * Fetch all SKU submissions from Google Sheets
 */
export async function fetchAllSubmissions(): Promise<SKUSubmission[]> {
  if (!SCRIPT_URL) {
    throw new Error('Google Script URL not configured');
  }

  try {
    const response = await fetch(`${SCRIPT_URL}?action=getSubmissions`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<SKUSubmission[]> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch submissions');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
}
