import { useState, useEffect } from "react";
import { Send, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { fetchDropdownData, submitSKU, type DropdownOption } from "@/services/googleSheetsService";
import { encodeCost } from "@/utils/costEncoder";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCurrentUser } from "@/services/authService";
import SKUSuccessModal from "@/components/SKUSuccessModal";
import { Combobox } from "@/components/ui/combobox";

interface FormData {
  productGroup: string;
  productCategory: string;
  color: string;
  size: string;
  style: string;
  location: string; // Changed back to string for single-select
  fabric: string;
  nature: string;
  vendorCode: string;
  cost: string;
}

// Sequential style number counter (stored in localStorage)
const getNextStyleNumber = () => {
  const lastStyle = localStorage.getItem('lastStyleNumber');
  let nextNumber = lastStyle ? parseInt(lastStyle) + 1 : 100;
  
  // Force start at 100 if local storage has lower numbers from previous testing
  if (nextNumber < 100) nextNumber = 100;
  
  localStorage.setItem('lastStyleNumber', nextNumber.toString());
  return nextNumber.toString().padStart(3, '0'); // Pad to 3 digits
};

export const SKUGeneratorForm = () => {
  const [formData, setFormData] = useState<FormData>({
    productGroup: "",
    productCategory: "",
    color: "",
    size: "",
    style: getNextStyleNumber(),
    location: "", // Initialize as empty string
    fabric: "",
    nature: "",
    vendorCode: "",
    cost: "",
  });

  // Dropdown data from Google Sheets
  const [dropdownData, setDropdownData] = useState<{
    productGroups: DropdownOption[];
    productCategories: DropdownOption[];
    colors: DropdownOption[];
    sizes: DropdownOption[];
    locations: DropdownOption[];
    fabrics: DropdownOption[];
    natures: DropdownOption[];
    vendorCodes: DropdownOption[];
  }>({
    productGroups: [],
    productCategories: [],
    colors: [],
    sizes: [],
    locations: [],
    fabrics: [],
    natures: [],
    vendorCodes: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedSKU, setGeneratedSKU] = useState("");
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const getErrorClass = (field: keyof FormData) => {
    return hasTriedSubmit && !formData[field] ? "border-red-500 ring-1 ring-red-500" : "";
  };

  // Fetch dropdown data on component mount
  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDropdownData();
      setDropdownData(data);
      toast.success("Dropdown data loaded from Google Sheets!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load dropdown data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Hardcoded aliases for immediate support while sheet is being updated
  const HARDCODED_ALIASES: Record<string, Record<string, string>> = {
    productGroups: {
      "kurtaset": "KT",
      "kurta set": "KT",
      "kurta": "KU",
    },
    natures: {
      "printed": "PR",
      "solid": "SL",
      "embroidery": "EM",
    },
    colors: {
      "black": "BK",
      "white": "WH", 
      "red": "RD",
      "blue": "BL",
      "green": "GR",
      "yellow": "YL",
      "pink": "PK",
    }
  };

  // Helper function to get alias from dropdown data or hardcoded defaults
  const getAlias = (field: keyof typeof dropdownData, value: string): string => {
    if (!value) return "";
    
    // 1. Try to find in dropdown data (checking both Value and Label)
    const options = dropdownData[field];
    const normalizedValue = value.trim().toLowerCase();
    
    // Check if we have data
    if (!options || options.length === 0) return value;

    const option = options.find(opt => 
      (opt.value || '').trim().toLowerCase() === normalizedValue || 
      (opt.label || '').trim().toLowerCase() === normalizedValue
    );
    
    if (option?.alias) {
      return option.alias;
    }

    // 2. Try hardcoded aliases
    if (field in HARDCODED_ALIASES) {
      if (HARDCODED_ALIASES[field][normalizedValue]) {
        return HARDCODED_ALIASES[field][normalizedValue];
      }
    }
    
    // 3. Fallback: Return original value
    return value; 
  };

  const generateSKU = () => {
    const encodedCost = formData.cost ? encodeCost(formData.cost) : "----";
    
    // Get aliases for fields that need them
    const productCategoryAlias = getAlias('productCategories', formData.productCategory);
    const productGroupAlias = getAlias('productGroups', formData.productGroup);
    const colorAlias = getAlias('colors', formData.color);
    const fabricAlias = getAlias('fabrics', formData.fabric);
    const natureAlias = getAlias('natures', formData.nature);
    const locationAlias = getAlias('locations', formData.location);
    
    // Combine Product Category Alias + Product Group Alias for first part
    const firstPart = (productCategoryAlias && productGroupAlias) 
      ? `${productCategoryAlias}${productGroupAlias}` 
      : (formData.productGroup || "---");
    
    const parts = [
      firstPart, // Product Category Alias + Product Group Alias
      colorAlias || formData.color || "---", // Color Alias
      formData.size || "--",
      formData.style || "---",
      locationAlias || formData.location || "---",
      locationAlias || formData.location || "---",
      fabricAlias || formData.fabric || "---", // Fabric Alias
      natureAlias || formData.nature || "---",
      getAlias('vendorCodes', formData.vendorCode) || formData.vendorCode || "------",
      encodedCost, // Cost encoded using CRAZY WOMAN cipher
    ];
    return parts.join("-");
  };

  const isFormComplete = () => {
    return (
      formData.productGroup &&
      formData.productCategory &&
      formData.color &&
      formData.size &&
      formData.style &&
      formData.location &&
      formData.fabric &&
      formData.nature &&
      formData.vendorCode &&
      formData.cost
    );
  };



  const handleSubmit = async () => {
    setHasTriedSubmit(true);
    if (!isFormComplete()) {
      // Toast message removed as per user request (validation highlighting is sufficient)
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast.error("Please login first");
      return;
    }

    setIsSubmitting(true);
    try {
      const sku = generateSKU();
      await submitSKU({
        sku,
        productGroup: formData.productGroup,
        productCategory: formData.productCategory,
        color: formData.color,
        size: formData.size,
        style: formData.style,
        location: formData.location,
        fabric: formData.fabric,
        nature: formData.nature,
        vendorCode: formData.vendorCode,
        cost: formData.cost,
      }, currentUser.username);
      
      // Show success modal with generated SKU
      setGeneratedSKU(sku);
      setShowSuccessModal(true);
      
      // Reset form after successful submission
      setFormData({
        productGroup: "",
        productCategory: "",
        color: "",
        size: "",
        style: getNextStyleNumber(),
        location: "",
        fabric: "",
        nature: "",
        vendorCode: "",
        cost: "",
      });
      setHasTriedSubmit(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit SKU";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getMissingFields = () => {
    const missing: string[] = [];
    if (!formData.productGroup) missing.push("Product Group");
    if (!formData.productCategory) missing.push("Product Category");
    if (!formData.color) missing.push("Color");
    if (!formData.size) missing.push("Size");
    if (!formData.style) missing.push("Style Number");
    if (!formData.location) missing.push("Location");
    if (!formData.fabric) missing.push("Fabric");
    if (!formData.nature) missing.push("Nature");
    if (!formData.vendorCode) missing.push("Vendor Code");
    if (!formData.cost) missing.push("Cost");
    return missing;
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            SKU Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create unique product identifiers for your inventory
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDropdownData}
                className="ml-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Product Group */}
          <div className="space-y-2">
            <Label htmlFor="productGroup" className={hasTriedSubmit && !formData.productGroup ? "text-red-500" : ""}>Product Group *</Label>
            <Combobox
              options={dropdownData.productGroups}
              value={formData.productGroup}
              onValueChange={(v) => updateField("productGroup", v)}
              disabled={isLoading}
              placeholder="Select group"
              error={hasTriedSubmit && !formData.productGroup}
            />
          </div>

          {/* Product Category */}
          <div className="space-y-2">
            <Label htmlFor="productCategory" className={hasTriedSubmit && !formData.productCategory ? "text-red-500" : ""}>Product Category *</Label>
            <Combobox
              options={dropdownData.productCategories}
              value={formData.productCategory}
              onValueChange={(v) => updateField("productCategory", v)}
              disabled={isLoading}
              placeholder="Select category"
              error={hasTriedSubmit && !formData.productCategory}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color" className={hasTriedSubmit && !formData.color ? "text-red-500" : ""}>Color *</Label>
            <Combobox
              options={dropdownData.colors}
              value={formData.color}
              onValueChange={(v) => updateField("color", v)}
              disabled={isLoading}
              placeholder="Select color"
              error={hasTriedSubmit && !formData.color}
            />
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label htmlFor="size" className={hasTriedSubmit && !formData.size ? "text-red-500" : ""}>Size *</Label>
            <Combobox
              options={dropdownData.sizes}
              value={formData.size}
              onValueChange={(v) => updateField("size", v)}
              disabled={isLoading}
              placeholder="Select size"
              error={hasTriedSubmit && !formData.size}
            />
          </div>

          {/* Style */}
          <div className="space-y-2">
            <Label htmlFor="style" className={hasTriedSubmit && !formData.style ? "text-red-500" : ""}>Style Number *</Label>
            <Input
              id="style"
              type="text"
              value={formData.style}
              onChange={(e) => updateField("style", e.target.value)}
              placeholder="e.g., 001"
              maxLength={5}
              className={getErrorClass("style")}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className={hasTriedSubmit && !formData.location ? "text-red-500" : ""}>Location *</Label>
            <Combobox
              options={dropdownData.locations}
              value={formData.location}
              onValueChange={(v) => updateField("location", v)}
              disabled={isLoading}
              placeholder="Select location"
              error={hasTriedSubmit && !formData.location}
            />
          </div>

          {/* Fabric */}
          <div className="space-y-2">
            <Label htmlFor="fabric" className={hasTriedSubmit && !formData.fabric ? "text-red-500" : ""}>Fabric *</Label>
            <Combobox
              options={dropdownData.fabrics}
              value={formData.fabric}
              onValueChange={(v) => updateField("fabric", v)}
              disabled={isLoading}
              placeholder="Select fabric"
              error={hasTriedSubmit && !formData.fabric}
            />
          </div>

          {/* Nature */}
          <div className="space-y-2">
            <Label htmlFor="nature" className={hasTriedSubmit && !formData.nature ? "text-red-500" : ""}>Nature *</Label>
            <Combobox
              options={dropdownData.natures}
              value={formData.nature}
              onValueChange={(v) => updateField("nature", v)}
              disabled={isLoading}
              placeholder="Select nature"
              error={hasTriedSubmit && !formData.nature}
            />
          </div>

          {/* Vendor Code */}
          <div className="space-y-2">
            <Label htmlFor="vendorCode" className={hasTriedSubmit && !formData.vendorCode ? "text-red-500" : ""}>Vendor Code *</Label>
            <Combobox
              options={dropdownData.vendorCodes}
              value={formData.vendorCode}
              onValueChange={(v) => updateField("vendorCode", v)}
              disabled={isLoading}
              placeholder="Select vendor"
              error={hasTriedSubmit && !formData.vendorCode}
            />
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <Label htmlFor="cost" className={hasTriedSubmit && !formData.cost ? "text-red-500" : ""}>Cost *</Label>
            <Input
              id="cost"
              type="number"
              value={formData.cost}
              onChange={(e) => updateField("cost", e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={getErrorClass("cost")}
            />
            {formData.cost && (
              <p className="text-xs text-muted-foreground">
                Encoded: {encodeCost(formData.cost)}
              </p>
            )}
          </div>
        </div>

        {/* SKU Preview Section */}
        <div className="mt-8 p-5 bg-muted rounded-xl">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Generated SKU
          </p>
          <p className="text-lg md:text-xl font-mono font-semibold text-foreground break-all">
            {generateSKU()}
          </p>
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <Button 
            onClick={handleSubmit} 
            className="w-full gap-2"
            size="lg"
            disabled={isLoading || isSubmitting}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Generate & Submit SKU"}
          </Button>
          {!isFormComplete() && hasTriedSubmit && (
            <p className="text-sm text-red-500 mt-2 text-center animate-pulse">
              Please fill highlighted fields: {getMissingFields().join(", ")}
            </p>
          )}
        </div>
      </div>
      
      {/* Success Modal */}
      <SKUSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        sku={generatedSKU}
      />
    </div>
  );
};
