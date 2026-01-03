import { useState, useEffect } from 'react';
import { assetService, staffService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import {
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';

interface Asset {
    id: number;
    name: string;
    asset_code: string;
    status: string;
    assigned_to?: number; // ID only
    assigned_employee?: {
        id: number;
        full_name: string;
    };
    assigned_date?: string;
}

interface Staff {
    id: number;
    full_name: string;
    email: string;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function AssetAssignmentList() {
    const [assignments, setAssignments] = useState<Asset[]>([]);
    const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        asset_id: '',
        staff_member_id: '',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAssignments();
    }, [page, search]);

    // Fetch available assets and staff when dialog opens
    useEffect(() => {
        if (isDialogOpen) {
            fetchAvailableAssets();
            fetchStaff();
        }
    }, [isDialogOpen]);

    const fetchAssignments = async () => {
        setIsLoading(true);
        try {
            // Fetch assets with status='assigned'
            const response = await assetService.getAll({
                status: 'assigned',
                page,
                search
            });
            const payload = response.data.data;

            if (Array.isArray(payload)) {
                setAssignments(payload);
                setMeta(null);
            } else if (payload && Array.isArray(payload.data)) {
                setAssignments(payload.data);
                setMeta({
                    current_page: payload.current_page,
                    last_page: payload.last_page,
                    per_page: payload.per_page,
                    total: payload.total,
                });
            } else {
                setAssignments([]);
                setMeta(null);
            }
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
            setAssignments([]);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch assignments',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAvailableAssets = async () => {
        try {
            const response = await assetService.getAvailable();
            // Assuming response structure is similar to others, but available might be direct array or data key
            const data = response.data.data || response.data;
            setAvailableAssets(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch available assets:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch available assets',
            });
        }
    };

    const fetchStaff = async () => {
        try {
            // Try to fetch all staff without pagination if possible, or a large page
            const response = await staffService.getAll({ per_page: 100 });
            const payload = response.data.data;
            if (payload && Array.isArray(payload.data)) {
                setStaffList(payload.data);
            } else if (Array.isArray(payload)) {
                setStaffList(payload);
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            asset_id: '',
            staff_member_id: '',
            notes: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.asset_id || !formData.staff_member_id) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please select both an asset and a staff member',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await assetService.assignAsset(Number(formData.asset_id), {
                staff_member_id: Number(formData.staff_member_id),
                notes: formData.notes
            });

            toast({
                title: 'Success',
                description: 'Asset assigned successfully',
            });

            setIsDialogOpen(false);
            resetForm();
            fetchAssignments();
        } catch (error) {
            console.error('Failed to assign asset:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to assign asset',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Asset Assignments</h1>
                    <p className="text-solarized-base01">Manage asset allocation to staff</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-solarized-blue hover:bg-solarized-blue/90"
                            onClick={() => {
                                resetForm();
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Assignment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Assign Asset</DialogTitle>
                            <DialogDescription>
                                Select an available asset and assign it to a staff member.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="asset">Asset *</Label>
                                    <Select
                                        value={formData.asset_id}
                                        onValueChange={(value) => setFormData({ ...formData, asset_id: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select asset" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableAssets.length === 0 ? (
                                                <SelectItem value="none" disabled>No available assets</SelectItem>
                                            ) : (
                                                availableAssets.map((asset) => (
                                                    <SelectItem key={asset.id} value={String(asset.id)}>
                                                        {asset.name} ({asset.asset_code})
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="staff">Staff Member *</Label>
                                    <Select
                                        value={formData.staff_member_id}
                                        onValueChange={(value) => setFormData({ ...formData, staff_member_id: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select staff member" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {staffList.map((staff) => (
                                                <SelectItem key={staff.id} value={String(staff.id)}>
                                                    {staff.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Additional comments..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90" disabled={isSubmitting}>
                                    {isSubmitting ? 'Assigning...' : 'Assign'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-solarized-base01" />
                            <Input
                                placeholder="Search assignments..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="text-center py-12">
                            <ClipboardList className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-solarized-base02">No active assignments</h3>
                            <p className="text-solarized-base01 mt-1">Assignments will appear here once assets are assigned to staff.</p>
                            <Button
                                className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90"
                                onClick={() => {
                                    resetForm();
                                    setIsDialogOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                New Assignment
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Asset</TableHead>
                                            {/* <TableHead>Code</TableHead> */}
                                            <TableHead>Assigned Staff</TableHead>
                                            <TableHead>Assigned Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assignments.map((asset) => (
                                            <TableRow key={asset.id}>
                                                <TableCell className="font-medium text-solarized-base02">
                                                    {asset.name}
                                                </TableCell>
                                                {/* <TableCell className="font-mono text-xs">{asset.asset_code}</TableCell> */}
                                                <TableCell>{asset.assigned_employee?.full_name || 'Unknown'}</TableCell>
                                                <TableCell>
                                                    {asset.assigned_date
                                                        ? new Date(asset.assigned_date).toLocaleDateString()
                                                        : '-'
                                                    }
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
                                        {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} results
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
                                        <span className="text-sm text-solarized-base01">
                                            Page {meta.current_page} of {meta.last_page}
                                        </span>
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