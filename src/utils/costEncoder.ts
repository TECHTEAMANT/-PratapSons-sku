/**
 * Cost Encoder - CRAZY WOMAN Cipher
 * Encodes cost values into SKU format
 * 
 * Mapping:
 * 0 = C
 * 1 = R
 * 2 = A
 * 3 = Z
 * 4 = Y
 * 5 = W
 * 6 = O
 * 7 = M
 * 8 = A (note: same as 2)
 * 9 = N
 */

const CRAZY_WOMAN_MAP: Record<string, string> = {
  '0': 'C',
  '1': 'R',
  '2': 'A',
  '3': 'Z',
  '4': 'Y',
  '5': 'W',
  '6': 'O',
  '7': 'M',
  '8': 'A',
  '9': 'N',
};

/**
 * Encode cost value using CRAZY WOMAN cipher
 * @param cost - The cost value (can be decimal)
 * @returns Encoded 3 or 4-letter code
 * 
 * Logic:
 * - If value < 1000: encode to 3 digits (e.g., 500 → WCC)
 * - If value >= 1000: encode to 4 digits (e.g., 1500 → RWCC)
 * - Leading zeros are removed (0500 becomes 500)
 * 
 * Examples:
 * - 100 → "RCC" (3 digits)
 * - 500 → "WCC" (3 digits)
 * - 0500 → "WCC" (leading zero removed, 3 digits)
 * - 1500 → "RWCC" (4 digits)
 * - 9999 → "NNNN" (4 digits)
 */
export function encodeCost(cost: string | number): string {
  // Convert to number and round to nearest whole number
  const numericCost = typeof cost === 'string' ? parseFloat(cost) : cost;
  
  if (isNaN(numericCost)) {
    return '---'; // Default for invalid input
  }
  
  const roundedCost = Math.round(numericCost);
  
  // Convert to string to get digits
  const costString = roundedCost.toString();
  
  // Convert each digit to corresponding letter
  let encoded = '';
  for (const digit of costString) {
    encoded += CRAZY_WOMAN_MAP[digit] || '';
  }
  
  return encoded;
}

/**
 * Decode CRAZY WOMAN cipher back to cost
 * @param encoded - The 4-letter encoded cost
 * @returns The decoded numeric cost
 * 
 * Examples:
 * - "CRCC" → 100
 * - "RAWC" → 1250
 */
export function decodeCost(encoded: string): number {
  const reverseMap: Record<string, string> = {
    'C': '0',
    'R': '1',
    'A': '2', // Note: Could be 2 or 8, we'll use 2
    'Z': '3',
    'Y': '4',
    'W': '5',
    'O': '6',
    'M': '7',
    'N': '9',
  };
  
  let decoded = '';
  for (const char of encoded.toUpperCase()) {
    decoded += reverseMap[char] || '0';
  }
  
  return parseInt(decoded, 10);
}
