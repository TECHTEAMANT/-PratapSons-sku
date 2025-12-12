import { useState, useEffect } from 'react';
import { fetchAllSubmissions, type SKUSubmission } from '@/services/googleSheetsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Search, AlertCircle, Calendar, User as UserIcon, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function SKUHistory() {
  const [submissions, setSubmissions] = useState<SKUSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<SKUSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    sku: '',
    productGroup: '',
    productCategory: '',
    color: '',
    size: '',
    style: '',
    location: '',
    fabric: '',
    nature: '',
    vendorCode: '',
    cost: '',
    createdBy: ''
  });

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    // Filter submissions based on search query AND column filters
    let result = submissions;

    // 1. Global Search
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (sub) =>
          (sub.sku?.toLowerCase() || '').includes(query) ||
          (sub.productGroup?.toLowerCase() || '').includes(query) ||
          (sub.productCategory?.toLowerCase() || '').includes(query) ||
          (sub.color?.toLowerCase() || '').includes(query)
      );
    }

    // 2. Column Filters
    result = result.filter(sub => {
      // Helper to safely check inclusion
      const check = (val: any, filter: string) => {
        if (!filter) return true;
        return String(val || '').toLowerCase().includes(filter.toLowerCase());
      };

      return (
        check(sub.sku, filters.sku) &&
        check(sub.productGroup, filters.productGroup) &&
        check(sub.productCategory, filters.productCategory) &&
        check(sub.color, filters.color) &&
        check(sub.size, filters.size) &&
        check(sub.style, filters.style) &&
        check(sub.location, filters.location) &&
        check(sub.fabric, filters.fabric) &&
        check(sub.nature, filters.nature) &&
        check(sub.vendorCode, filters.vendorCode) &&
        check(sub.cost, filters.cost) &&
        check(sub.createdBy, filters.createdBy)
      );
    });

    setFilteredSubmissions(result);
  }, [searchQuery, submissions, filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const loadSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllSubmissions();
      setSubmissions(data);
      setFilteredSubmissions(data);
      toast.success('SKU history loaded successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load SKU history';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">SKU History</h1>
          <p className="text-gray-600 mt-1">View all created SKUs</p>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search SKUs, product group, category, color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Refresh Button */}
            <Button
              onClick={loadSubmissions}
              disabled={isLoading}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredSubmissions.length} of {submissions.length} SKUs
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={loadSubmissions} className="ml-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-4 text-gray-600">Loading SKU history...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSubmissions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">
              {searchQuery ? 'No SKUs match your search' : 'No SKUs created yet'}
            </p>
          </div>
        )}

        {/* Desktop Table View */}
        {!isLoading && filteredSubmissions.length > 0 && (
          <>
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                        SKU Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Group
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Color
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Style Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fabric
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nature
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                    </tr>
                    {/* Filter Row */}
                    <tr>
                      <th className="px-2 py-2">
                        <Input 
                          placeholder="Filter SKU..." 
                          className="h-8 text-xs" 
                          value={filters.sku}
                          onChange={(e) => handleFilterChange('sku', e.target.value)}
                        />
                      </th>
                      <th className="px-2 py-2">
                        <Input 
                          placeholder="Filter Group..." 
                          className="h-8 text-xs" 
                          value={filters.productGroup}
                          onChange={(e) => handleFilterChange('productGroup', e.target.value)}
                        />
                      </th>
                      <th className="px-2 py-2">
                        <Input 
                          placeholder="Filter Category..." 
                          className="h-8 text-xs" 
                          value={filters.productCategory}
                          onChange={(e) => handleFilterChange('productCategory', e.target.value)}
                        />
                      </th>
                      <th className="px-2 py-2">
                        <Input 
                          placeholder="Filter Color..." 
                          className="h-8 text-xs" 
                          value={filters.color}
                          onChange={(e) => handleFilterChange('color', e.target.value)}
                        />
                      </th>
                      <th className="px-2 py-2">
                        <Input 
                          placeholder="Filter Size..." 
                          className="h-8 text-xs" 
                          value={filters.size}
                          onChange={(e) => handleFilterChange('size', e.target.value)}
                        />
                      </th>
                      <th className="px-2 py-2">
                        <Input 
                          placeholder="Filter Style..." 
                          className="h-8 text-xs" 
                          value={filters.style}
                          onChange={(e) => handleFilterChange('style', e.target.value)}
                        />
                      </th>
                      <th className="px-2 py-2">
                        <Input 
                          placeholder="Filter Loc..." 
                          className="h-8 text-xs" 
                          value={filters.location}
                          onChange={(e) => handleFilterChange('location', e.target.value)}
                        />
                      </th>
                      <th className="px-2 py-2">
                        <Input 
                          placeholder="Filter Fabric..." 
                          className="h-8 text-xs" 
                          value={filters.fabric}
                          onChange={(e) => handleFilterChange('fabric', e.target.value)}
                        />
                      </th>
                      <th className="px-2 py-2">
                        <Input 
                          placeholder="Filter Nature..." 
                          className="h-8 text-xs" 
                          value={filters.nature}
                          onChange={(e) => handleFilterChange('nature', e.target.value)}
                        />
                      </th>
                      <th className="px-2 py-2">
                        <Input 
                          placeholder="Filter Vendor..." 
                          className="h-8 text-xs" 
                          value={filters.vendorCode}
                          onChange={(e) => handleFilterChange('vendorCode', e.target.value)}
                        />
                      </th>
                      <th className="px-2 py-2">
                        <Input 
                          placeholder="Filter Cost..." 
                          className="h-8 text-xs" 
                          value={filters.cost}
                          onChange={(e) => handleFilterChange('cost', e.target.value)}
                        />
                      </th>
                      <th className="px-2 py-2">
                        {/* No filter for date yet, keeps it simple */}
                      </th>
                      <th className="px-2 py-2">
                        <Input 
                          placeholder="Filter User..." 
                          className="h-8 text-xs" 
                          value={filters.createdBy}
                          onChange={(e) => handleFilterChange('createdBy', e.target.value)}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubmissions.map((submission, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {/* Added whitespace-nowrap to SKU Code cell */}
                        <td className="px-4 py-3 text-sm font-mono text-blue-600 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="flex-1">{submission.sku}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(submission.sku);
                                toast.success('SKU copied to clipboard!');
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Copy SKU"
                            >
                              <Copy className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {submission.productGroup}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {submission.productCategory}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                          {submission.color}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                          {submission.size}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                          {submission.style}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {submission.location}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {submission.fabric}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {submission.nature}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {submission.vendorCode}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {submission.cost}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(submission.timestamp || '')}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                            {submission.createdBy || 'Unknown'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4">
              {filteredSubmissions.map((submission, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  {/* SKU with Copy Button */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-200">
                    <div className="font-mono text-blue-600 font-medium break-all flex-1">
                      {submission.sku}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(submission.sku);
                        toast.success('SKU copied to clipboard!');
                      }}
                      className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                      title="Copy SKU"
                    >
                      <Copy className="w-5 h-5 text-gray-500 hover:text-blue-600" />
                    </button>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-3 mb-3 text-sm text-gray-600 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(submission.timestamp || '')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span>{submission.createdBy || 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Details Grid - All Fields */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs">Product Group</span>
                      <div className="font-medium text-gray-900">{submission.productGroup}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Category</span>
                      <div className="font-medium text-gray-900">{submission.productCategory}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Color</span>
                      <div className="font-medium text-gray-900">{submission.color}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Size</span>
                      <div className="font-medium text-gray-900">{submission.size}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Style Number</span>
                      <div className="font-medium text-gray-900">{submission.style}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Location</span>
                      <div className="font-medium text-gray-900">{submission.location}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Fabric</span>
                      <div className="font-medium text-gray-900">{submission.fabric}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Nature</span>
                      <div className="font-medium text-gray-900">{submission.nature}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Vendor Code</span>
                      <div className="font-medium text-gray-900">{submission.vendorCode}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Cost</span>
                      <div className="font-medium text-gray-900">{submission.cost}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
