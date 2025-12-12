import { useState, useEffect, useMemo } from 'react';
import { fetchAllSubmissions, type SKUSubmission } from '@/services/googleSheetsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertCircle, IndianRupee, Package, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';

export default function Dashboard() {
  const [submissions, setSubmissions] = useState<SKUSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cost Range Filter State
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (resetFilters = false) => {
    setIsLoading(true);
    setError(null);
    
    if (resetFilters) {
      setMinCost('');
      setMaxCost('');
    }

    try {
      const data = await fetchAllSubmissions();
      setSubmissions(data);
      if (resetFilters) {
        toast.success("Data refreshed and filters cleared");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Data based on Cost Range
  const filteredData = useMemo(() => {
    return submissions.filter(item => {
      const cost = parseFloat(item.cost);
      if (isNaN(cost)) return false;
      
      const min = minCost ? parseFloat(minCost) : -Infinity;
      const max = maxCost ? parseFloat(maxCost) : Infinity;
      
      return cost >= min && cost <= max;
    });
  }, [submissions, minCost, maxCost]);

  // Aggregate Data for Charts
  const stats = useMemo(() => {
    const totalSKUs = filteredData.length;
    const totalValue = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);
    const avgCost = totalSKUs > 0 ? totalValue / totalSKUs : 0;

    // Group Counts
    const groupCount = filteredData.reduce((acc, curr) => {
      acc[curr.productGroup] = (acc[curr.productGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Category Counts
    const categoryCount = filteredData.reduce((acc, curr) => {
      acc[curr.productCategory] = (acc[curr.productCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

     // Color Counts
     const colorCount = filteredData.reduce((acc, curr) => {
      acc[curr.color] = (acc[curr.color] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Fabric Counts
    const fabricCount = filteredData.reduce((acc, curr) => {
      acc[curr.fabric] = (acc[curr.fabric] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSKUs,
      totalValue,
      avgCost,
      groupChartData: Object.entries(groupCount).map(([name, value]) => ({ name, value })),
      categoryChartData: Object.entries(categoryCount).map(([name, value]) => ({ name, value })),
      colorChartData: Object.entries(colorCount).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10), // Top 10
      fabricChartData: Object.entries(fabricCount).map(([name, value]) => ({ name, value })),
    };
  }, [filteredData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={() => loadData()} className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-500">Overview of your inventory and SKU metrics</p>
            </div>
            <Button onClick={() => loadData(true)} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
            </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Filter by Cost Range</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-40">
                    <label className="text-xs text-gray-500 mb-1 block">Min Cost</label>
                    <Input 
                        type="number" 
                        placeholder="0" 
                        value={minCost} 
                        onChange={(e) => setMinCost(e.target.value)} 
                    />
                </div>
                <div className="w-full sm:w-40">
                    <label className="text-xs text-gray-500 mb-1 block">Max Cost</label>
                    <Input 
                        type="number" 
                        placeholder="Any" 
                        value={maxCost} 
                        onChange={(e) => setMaxCost(e.target.value)} 
                    />
                </div>
                <div className="text-sm text-gray-500 pb-2">
                    Showing {filteredData.length} records in range
                </div>
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSKUs}</div>
              <p className="text-xs text-muted-foreground">In selected range</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Sum of costs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.avgCost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Per SKU</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          
          {/* Product Group Chart (Bar) */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>SKUs by Product Group</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.groupChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Product Category Chart (Pie) */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {stats.categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
             {/* Color Chart */}
             <Card>
                <CardHeader>
                <CardTitle>Top Colors</CardTitle>
                </CardHeader>
                <CardContent>
                 <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.colorChartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} name="Count" />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
                </CardContent>
            </Card>

            {/* Fabric Chart */}
            <Card>
                <CardHeader>
                <CardTitle>Fabric Usage</CardTitle>
                </CardHeader>
                <CardContent>
                 <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.fabricChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} name="Count" />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
