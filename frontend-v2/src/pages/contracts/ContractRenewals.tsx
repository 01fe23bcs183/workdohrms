import { useState, useEffect, useCallback } from 'react';
import { contractService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
import { RefreshCw, FileText, Eye, MoreHorizontal, Plus } from 'lucide-react';

interface Contract {
    id: number;
    reference_number: string;
    start_date: string;
    end_date: string | null;
    salary: string;
    status: string;
    staff_member?: {
        full_name: string;
    };
    contract_type?: {
        title: string;
    };
}

interface RenewalFormData {
    contract_id: string;
    new_end_date: string;
    new_salary: string;
    notes: string;
}

export default function ContractRenewals() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [sortField, setSortField] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Dialog states
    const [isRenewOpen, setIsRenewOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [renewalData, setRenewalData] = useState<RenewalFormData>({
        contract_id: '',
        new_end_date: '',
        new_salary: '',
        notes: '',
    });

    // ================= FETCH CONTRACTS =================
    const fetchExpiredContracts = useCallback(
        async (currentPage: number = 1) => {
            setIsLoading(true);
            try {
                const params: Record<string, unknown> = {
                    page: currentPage,
                    per_page: perPage,
                    status: 'expired',  // Fetch expired contracts that need renewal
                };

                if (sortField) {
                    params.order_by = sortField;
                    params.order = sortDirection;
                }

                const response = await contractService.getAll(params);
                const { data, meta } = response.data;

                if (Array.isArray(data)) {
                    setContracts(data);
                    setTotalRows(meta?.total ?? 0);
                } else {
                    setContracts([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error('Failed to fetch contracts:', error);
                showAlert('error', 'Error', getErrorMessage(error, 'Failed to fetch contracts'));
                setContracts([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        },
        [perPage, sortField, sortDirection]
    );

    useEffect(() => {
        fetchExpiredContracts(page);
    }, [page, fetchExpiredContracts]);

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
            'Employee': 'staff_member.full_name',
            'End Date': 'end_date',
        };

        const field = fieldMap[column.name] || column.name;
        setSortField(field);
        setSortDirection(sortDirection);
        setPage(1);
    };

    // ================= ACTIONS =================
    const handleViewDetails = (contract: Contract) => {
        setSelectedContract(contract);
        setIsDetailsOpen(true);
    };

    const handleRenewClick = (contract: Contract) => {
        setSelectedContract(contract);
        setRenewalData({
            contract_id: contract.id.toString(),
            new_end_date: '',
            new_salary: contract.salary,
            notes: '',
        });
        setIsRenewOpen(true);
    };

    const handleRenew = async () => {
        if (!selectedContract) return;

        try {
            await contractService.renewContract(selectedContract.id, {
                new_end_date: renewalData.new_end_date,
                new_salary: renewalData.new_salary,
                notes: renewalData.notes,
            });

            showAlert('success', 'Success', 'Contract renewed successfully');
            setIsRenewOpen(false);
            setSelectedContract(null);
            fetchExpiredContracts(page);
        } catch (error: any) {
            console.error('Failed to renew contract:', error);
            const message = error.response?.data?.message || 'Failed to renew contract';
            showAlert('error', 'Error', message);
        }
    };

    // ================= HELPERS =================
    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            active: 'bg-green-100 text-green-800',
            expired: 'bg-red-100 text-red-800',
            terminated: 'bg-gray-100 text-gray-800',
        };
        return variants[status] || variants.draft;
    };

    const formatCurrency = (amount: string) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(Number(amount || 0));

    const formatDate = (date: string | null) =>
        date ? new Date(date).toLocaleDateString() : 'Indefinite';

    const isExpiringSoon = (endDate: string | null) => {
        if (!endDate) return false;
        const end = new Date(endDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
    };

    // ================= TABLE COLUMNS =================
    const columns: TableColumn<Contract>[] = [
        {
            name: 'Employee',
            selector: (row) => row.staff_member?.full_name || 'Unknown',
            cell: (row) => (
                <span className="font-medium">
                    {row.staff_member?.full_name || 'Unknown'}
                </span>
            ),
            sortable: true,
            minWidth: '200px',
        },
        {
            name: 'Contract Type',
            selector: (row) => row.contract_type?.title || '-',
            cell: (row) => (
                <span className="text-sm">{row.contract_type?.title || '-'}</span>
            ),
            minWidth: '180px',
        },
        {
            name: 'End Date',
            selector: (row) => row.end_date || '',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <span>{formatDate(row.end_date)}</span>
                    {isExpiringSoon(row.end_date) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Expiring Soon
                        </span>
                    )}
                </div>
            ),
            sortable: true,
            minWidth: '220px',
        },
        {
            name: 'Salary',
            selector: (row) => row.salary,
            cell: (row) => <span>{formatCurrency(row.salary)}</span>,
            minWidth: '150px',
        },
        {
            name: 'Status',
            cell: (row) => (
                <Badge className={getStatusBadge(row.status)}>
                    {row.status}
                </Badge>
            ),
            width: '120px',
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
                        <DropdownMenuItem onClick={() => handleViewDetails(row)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleRenewClick(row)}
                            className="text-green-600"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" /> Renew Contract
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
                    <h1 className="text-2xl font-bold text-solarized-base02">Contract Renewals</h1>
                    <p className="text-solarized-base01">
                        Renew expired contracts to extend employment
                    </p>
                </div>

               
            </div>

            {/* TABLE */}
            <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                    {!isLoading && contracts.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto h-12 w-12 text-solarized-base01 mb-4" />
                            <h3 className="text-lg font-medium">No expired contracts found</h3>
                            <p className="text-sm text-solarized-base01 mt-2">
                                All contracts are currently active or terminated
                            </p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={contracts}
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

            {/* VIEW DETAILS DIALOG */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Contract Details</DialogTitle>
                    </DialogHeader>

                    {selectedContract && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-solarized-base01">Employee</p>
                                    <p className="font-medium">{selectedContract.staff_member?.full_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-solarized-base01">Contract Type</p>
                                    <p>{selectedContract.contract_type?.title || '-'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-solarized-base01">Start Date</p>
                                    <p>{formatDate(selectedContract.start_date)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-solarized-base01">End Date</p>
                                    <p>{formatDate(selectedContract.end_date)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-solarized-base01">Salary</p>
                                    <p className="font-medium">{formatCurrency(selectedContract.salary)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-solarized-base01">Status</p>
                                    <Badge className={getStatusBadge(selectedContract.status)}>
                                        {selectedContract.status}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-solarized-base01">Reference Number</p>
                                <p className="font-mono text-sm">{selectedContract.reference_number}</p>
                            </div>

                            {isExpiringSoon(selectedContract.end_date) && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p className="text-sm text-yellow-800 font-medium">
                                        ⚠️ This contract is expiring soon!
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                            Close
                        </Button>
                        {selectedContract && (
                            <Button
                                className="bg-solarized-green hover:bg-solarized-green/90"
                                onClick={() => {
                                    setIsDetailsOpen(false);
                                    handleRenewClick(selectedContract);
                                }}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Renew Contract
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* RENEW DIALOG */}
            <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Renew Contract</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {!selectedContract ? (
                            <div>
                                <label className="text-sm font-medium text-solarized-base02">
                                    Select Contract *
                                </label>
                                <select
                                    value={renewalData.contract_id}
                                    onChange={(e) => {
                                        const contractId = e.target.value;
                                        const contract = contracts.find(c => c.id.toString() === contractId);
                                        if (contract) {
                                            setSelectedContract(contract);
                                            setRenewalData({
                                                contract_id: contractId,
                                                new_end_date: '',
                                                new_salary: contract.salary,
                                                notes: '',
                                            });
                                        }
                                    }}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                                    required
                                >
                                    <option value="">-- Select a contract --</option>
                                    {contracts.map((contract) => (
                                        <option key={contract.id} value={contract.id}>
                                            {contract.staff_member?.full_name} - {contract.contract_type?.title || 'N/A'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm text-blue-800">
                                        <strong>Employee:</strong> {selectedContract.staff_member?.full_name}
                                    </p>
                                    <p className="text-sm text-blue-800 mt-1">
                                        <strong>Current End Date:</strong> {formatDate(selectedContract.end_date)}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-solarized-base02">
                                        New End Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={renewalData.new_end_date}
                                        onChange={(e) => setRenewalData({ ...renewalData, new_end_date: e.target.value })}
                                        min={selectedContract.end_date || ''}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-solarized-base02">
                                        New Salary
                                    </label>
                                    <input
                                        type="number"
                                        value={renewalData.new_salary}
                                        onChange={(e) => setRenewalData({ ...renewalData, new_salary: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                                        placeholder="Enter new salary (optional)"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-solarized-base02">
                                        Notes
                                    </label>
                                    <textarea
                                        value={renewalData.notes}
                                        onChange={(e) => setRenewalData({ ...renewalData, notes: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                                        rows={3}
                                        placeholder="Add any notes about the renewal..."
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => {
                            setIsRenewOpen(false);
                            setSelectedContract(null);
                        }}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-solarized-green hover:bg-solarized-green/90"
                            onClick={handleRenew}
                            disabled={!selectedContract || !renewalData.new_end_date}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Renew Contract
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
