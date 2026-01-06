import { useState, useEffect, useCallback } from 'react';
import { contractTypeService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import DataTable, { TableColumn } from 'react-data-table-component';
import { Plus, Edit, Trash2, FileText, MoreHorizontal, Eye } from 'lucide-react';

interface ContractType {
    id: number;
    title: string;
    description: string | null;
    default_duration_months: number;
    created_at: string;
    updated_at: string;
}

export default function ContractTypes() {
    const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [sortField, setSortField] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Dialog states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<ContractType | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        default_duration_months: 12,
    });

    // ================= FETCH CONTRACT TYPES =================
    const fetchContractTypes = useCallback(
        async (currentPage: number = 1) => {
            setIsLoading(true);
            try {
                const params: Record<string, unknown> = {
                    page: currentPage,
                    per_page: perPage,
                };

                if (sortField) {
                    params.order_by = sortField;
                    params.order = sortDirection;
                }

                const response = await contractTypeService.getAll(params);
                const { data, meta } = response.data;

                if (Array.isArray(data)) {
                    setContractTypes(data);
                    setTotalRows(meta?.total ?? 0);
                } else {
                    setContractTypes([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error('Failed to fetch contract types:', error);
                showAlert('error', 'Error', getErrorMessage(error, 'Failed to fetch contract types'));
                setContractTypes([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        },
        [perPage, sortField, sortDirection]
    );

    useEffect(() => {
        fetchContractTypes(page);
    }, [page, fetchContractTypes]);

    // ================= PAGINATION =================
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handlePerRowsChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    // ================= SORTING =================
    const handleSort = (column: any, sortDirection: 'asc' | 'desc') => {
        const fieldMap: Record<string, string> = {
            'Title': 'title',
        };

        const field = fieldMap[column.name] || column.name;
        setSortField(field);
        setSortDirection(sortDirection);
        setPage(1);
    };

    // ================= CRUD OPERATIONS =================
    const handleAddClick = () => {
        setFormData({
            title: '',
            description: '',
            default_duration_months: 12,
        });
        setIsAddOpen(true);
    };

    const handleViewClick = (type: ContractType) => {
        setSelectedType(type);
        setIsViewOpen(true);
    };

    const handleEditClick = (type: ContractType) => {
        setSelectedType(type);
        setFormData({
            title: type.title,
            description: type.description || '',
            default_duration_months: type.default_duration_months,
        });
        setIsEditOpen(true);
    };

    const handleCreate = async () => {
        try {
            await contractTypeService.create(formData);
            showAlert('success', 'Success', 'Contract type created successfully');
            setIsAddOpen(false);
            fetchContractTypes(page);
        } catch (error: any) {
            console.error('Failed to create contract type:', error);
            const message = error.response?.data?.message || 'Failed to create contract type';
            showAlert('error', 'Error', message);
        }
    };

    const handleUpdate = async () => {
        if (!selectedType) return;

        try {
            await contractTypeService.update(selectedType.id, formData);
            showAlert('success', 'Success', 'Contract type updated successfully');
            setIsEditOpen(false);
            fetchContractTypes(page);
        } catch (error: any) {
            console.error('Failed to update contract type:', error);
            const message = error.response?.data?.message || 'Failed to update contract type';
            showAlert('error', 'Error', message);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog(
            'Are you sure?',
            'You want to delete this contract type?'
        );

        if (!result.isConfirmed) return;

        try {
            await contractTypeService.delete(id);
            showAlert('success', 'Deleted!', 'Contract type deleted successfully', 2000);
            fetchContractTypes(page);
        } catch (error) {
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete contract type'));
        }
    };

    // ================= TABLE COLUMNS =================
    const columns: TableColumn<ContractType>[] = [
        {
            name: 'Title',
            selector: (row) => row.title,
            cell: (row) => <span className="font-medium">{row.title}</span>,
            sortable: true,
            minWidth: '200px',
        },
        {
            name: 'Description',
            selector: (row) => row.description || '-',
            cell: (row) => (
                <span className="text-sm text-muted-foreground">
                    {row.description || '-'}
                </span>
            ),
            minWidth: '300px',
        },
        {
            name: 'Default Duration (Months)',
            selector: (row) => row.default_duration_months,
            cell: (row) => <span>{row.default_duration_months}</span>,
            width: '200px',
        },
        {
            name: 'Actions',
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewClick(row)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(row)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDelete(row.id)}
                            className="text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            ignoreRowClick: true,
            width: '80px',
        },
    ];

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Contract Types</h1>
                    <p className="text-solarized-base01">
                        Manage different types of employment contracts
                    </p>
                </div>
                <Button className="bg-solarized-blue hover:bg-solarized-blue/90" onClick={handleAddClick}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contract Type
                </Button>
            </div>

            {/* TABLE */}
            <Card>
                <CardContent className="pt-6">
                    {!isLoading && contractTypes.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p>No contract types found</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={contractTypes}
                            progressPending={isLoading}
                            pagination
                            paginationServer
                            paginationTotalRows={totalRows}
                            paginationPerPage={perPage}
                            paginationDefaultPage={page}
                            onChangePage={handlePageChange}
                            onChangeRowsPerPage={handlePerRowsChange}
                            onSort={handleSort}
                            sortServer
                            highlightOnHover
                            responsive
                        />
                    )}
                </CardContent>
            </Card>

            {/* VIEW DIALOG */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Contract Type Details</DialogTitle>
                    </DialogHeader>

                    {selectedType && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-solarized-base01">Title</p>
                                <p className="font-medium text-lg">{selectedType.title}</p>
                            </div>

                            <div>
                                <p className="text-sm text-solarized-base01">Description</p>
                                <p className="text-sm">{selectedType.description || 'No description provided'}</p>
                            </div>

                            <div>
                                <p className="text-sm text-solarized-base01">Default Duration</p>
                                <p className="font-medium">{selectedType.default_duration_months} months</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <p className="text-xs text-solarized-base01">Created At</p>
                                    <p className="text-sm">
                                        {new Date(selectedType.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-solarized-base01">Updated At</p>
                                    <p className="text-sm">
                                        {new Date(selectedType.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ADD DIALOG */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Contract Type</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-solarized-base02">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                                placeholder="e.g., Permanent, Fixed-Term"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-solarized-base02">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                                rows={3}
                                placeholder="Enter description..."
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-solarized-base02">
                                Default Duration (Months)
                            </label>
                            <input
                                type="number"
                                value={formData.default_duration_months}
                                onChange={(e) => setFormData({ ...formData, default_duration_months: parseInt(e.target.value) || 0 })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                                min="1"
                                placeholder="e.g., 12"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-solarized-blue hover:bg-solarized-blue/90"
                            onClick={handleCreate}
                            disabled={!formData.title}
                        >
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* EDIT DIALOG */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Contract Type</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-solarized-base02">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-solarized-base02">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-solarized-base02">
                                Default Duration (Months)
                            </label>
                            <input
                                type="number"
                                value={formData.default_duration_months}
                                onChange={(e) => setFormData({ ...formData, default_duration_months: parseInt(e.target.value) || 0 })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                                min="1"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-solarized-blue hover:bg-solarized-blue/90"
                            onClick={handleUpdate}
                            disabled={!formData.title}
                        >
                            Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
