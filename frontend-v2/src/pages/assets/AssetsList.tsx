import { useState, useEffect } from 'react';
import { assetService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, Search, Package, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface Asset {
  id: number;
  name: string;
  asset_code: string;
  asset_type?: { name: string };
  assigned_to?: { full_name: string };
  purchase_date: string;
  purchase_cost: number;
  status: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AssetsList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAssets();
  }, [page]);

    const fetchAssets = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = { page };
        if (search) params.search = search;
      
        const response = await assetService.getAll(params);
        // Handle paginated response: response.data.data is the paginator object
        // The actual array is in response.data.data.data for paginated responses
        const payload = response.data.data;
        if (Array.isArray(payload)) {
          // Non-paginated response (when paginate=false)
          setAssets(payload);
          setMeta(null);
        } else if (payload && Array.isArray(payload.data)) {
          // Paginated response - extract the array and meta from paginator
          setAssets(payload.data);
          setMeta({
            current_page: payload.current_page,
            last_page: payload.last_page,
            per_page: payload.per_page,
            total: payload.total,
          });
        } else {
          // Fallback to empty array if response is unexpected
          setAssets([]);
          setMeta(null);
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        setAssets([]);
      } finally {
        setIsLoading(false);
      }
    };

  const handleSearch = () => {
    setPage(1);
    fetchAssets();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      available: 'bg-solarized-green/10 text-solarized-green',
      assigned: 'bg-solarized-blue/10 text-solarized-blue',
      maintenance: 'bg-solarized-yellow/10 text-solarized-yellow',
      retired: 'bg-solarized-base01/10 text-solarized-base01',
      lost: 'bg-solarized-red/10 text-solarized-red',
    };
    return variants[status] || variants.available;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Assets</h1>
          <p className="text-solarized-base01">Manage company assets and equipment</p>
        </div>
        <Button className="bg-solarized-blue hover:bg-solarized-blue/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-solarized-blue" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Total Assets</p>
                <p className="text-xl font-bold text-solarized-base02">{meta?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-green/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-solarized-green" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Available</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {assets.filter((a) => a.status === 'available').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-cyan/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-solarized-cyan" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Assigned</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {assets.filter((a) => a.status === 'assigned').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-solarized-yellow" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Maintenance</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {assets.filter((a) => a.status === 'maintenance').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-solarized-base01" />
              <Input
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-solarized-blue hover:bg-solarized-blue/90">
              Search
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-solarized-base02">No assets found</h3>
              <p className="text-solarized-base01 mt-1">Add assets to track company equipment.</p>
              <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Purchase Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-mono text-sm">{asset.asset_code}</TableCell>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>{asset.asset_type?.name || '-'}</TableCell>
                        <TableCell>{asset.assigned_to?.full_name || '-'}</TableCell>
                        <TableCell>{formatCurrency(asset.purchase_cost)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(asset.status)}>
                            {asset.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-solarized-red">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-solarized-base01">
                    Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
                    {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === meta.last_page}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
