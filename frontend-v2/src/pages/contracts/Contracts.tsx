import { useState, useEffect } from 'react';
import { contractService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Plus,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

/* =========================
   TYPES (MATCH API)
========================= */
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
    id: number;
    title: string;
  };
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/* =========================
   COMPONENT
========================= */
export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editSalary, setEditSalary] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // Add Contract Form
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [contractTypes, setContractTypes] = useState<any[]>([]);
  const [newContract, setNewContract] = useState({
    staff_member_id: '',
    contract_type_id: '',
    start_date: '',
    end_date: '',
    salary: '',
    duration_months: 12,
    terms: '',
  });


  useEffect(() => {
    fetchContracts();
  }, [page]);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const response = await contractService.getAll({ page });

      // Direct array from response.data.data
      const contractsData = response.data.data;
      const metaData = response.data.meta;

      // Check if we have valid array data
      if (contractsData && Array.isArray(contractsData)) {
        setContracts(contractsData);

        // Set meta from the meta object
        if (metaData) {
          setMeta({
            current_page: metaData.current_page,
            last_page: metaData.total_pages, // Note: API uses 'total_pages'
            per_page: metaData.per_page,
            total: metaData.total,
          });
        }
      } else {
        setContracts([]);
        setMeta(null);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      setContracts([]);
      showAlert('error', 'Error', 'Failed to fetch contracts');
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     HELPERS
  ========================= */
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: 'bg-solarized-base01/10 text-solarized-base01',
      active: 'bg-solarized-green/10 text-solarized-green',
      expired: 'bg-solarized-red/10 text-solarized-red',
      terminated: 'bg-solarized-base01/10 text-solarized-base01',
    };
    return variants[status] || variants.draft;
  };
  const handleView = (contract: Contract) => {
    setSelectedContract(contract);
    setIsViewOpen(true);
  };

  const handleEdit = (c: Contract) => {
    setSelectedContract(c);
    setEditSalary(c.salary);
    setEditStatus(c.status);
    // Format dates to YYYY-MM-DD for input[type="date"]
    setEditStartDate(c.start_date ? c.start_date.split('T')[0] : '');
    setEditEndDate(c.end_date ? c.end_date.split('T')[0] : '');
    setIsEditOpen(true);
  };

  const fetchDropdownData = async () => {
    try {
      // Fetch staff members
      const staffResponse = await fetch('http://127.0.0.1:8000/api/staff-members', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json',
        },
      });
      const staffData = await staffResponse.json();
      setStaffMembers(staffData.data || []);

      // Fetch contract types
      const typesResponse = await fetch('http://127.0.0.1:8000/api/contract-types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json',
        },
      });
      const typesData = await typesResponse.json();
      setContractTypes(typesData.data || []);
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  };

  const handleAddClick = () => {
    fetchDropdownData();
    setNewContract({
      staff_member_id: '',
      contract_type_id: '',
      start_date: '',
      end_date: '',
      salary: '',
      duration_months: 12,
      terms: '',
    });
    setIsAddOpen(true);
  };

  const handleCreateContract = async () => {
    try {
      // Prepare the data matching backend expectations
      const contractData = {
        staff_member_id: parseInt(newContract.staff_member_id),
        contract_type_id: newContract.contract_type_id ? parseInt(newContract.contract_type_id) : null,
        start_date: newContract.start_date,
        end_date: newContract.end_date,
        salary: newContract.salary ? parseFloat(newContract.salary) : null,
        terms: newContract.terms || null,
      };

      await contractService.createContract(contractData);
      showAlert('success', 'Success', 'Contract created successfully');
      setIsAddOpen(false);
      fetchContracts();
    } catch (error: any) {
      console.error('Failed to create contract:', error);
      const message = error.response?.data?.message || 'Failed to create contract';
      showAlert('error', 'Error', message);
    }
  };


  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(amount || 0));

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString() : 'Indefinite';

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Contracts</h1>
          <p className="text-solarized-base01">
            Manage employee contracts and agreements
          </p>
        </div>
        <Button className="bg-solarized-blue hover:bg-solarized-blue/90" onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contract
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <FileText className="h-5 w-5 text-solarized-blue" />
              <div>
                <p className="text-sm">Total Contracts</p>
                <p className="text-xl font-bold">{meta?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <FileText className="h-5 w-5 text-solarized-green" />
              <div>
                <p className="text-sm">Active</p>
                <p className="text-xl font-bold">
                  {contracts.filter((c) => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-solarized-yellow" />
              <div>
                <p className="text-sm">Expiring Soon</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <FileText className="h-5 w-5 text-solarized-red" />
              <div>
                <p className="text-sm">Terminated</p>
                <p className="text-xl font-bold">
                  {contracts.filter((c) => c.status === 'terminated').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-solarized-base01" />
              <h3 className="text-lg font-medium">No contracts found</h3>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Contract Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {getInitials(contract.staff_member?.full_name || 'NA')}
                            </AvatarFallback>
                          </Avatar>
                          {contract.staff_member?.full_name || 'Unknown'}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium">
                        {contract.contract_type?.title || '-'}
                      </TableCell>

                      <TableCell>{formatDate(contract.start_date)}</TableCell>
                      <TableCell>{formatDate(contract.end_date)}</TableCell>
                      <TableCell>{formatCurrency(contract.salary)}</TableCell>

                      <TableCell>
                        <Badge className={getStatusBadge(contract.status)}>
                          {contract.status}
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
                            <DropdownMenuItem onClick={() => handleView(contract)}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleEdit(contract)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta && meta.last_page > 1 && (
                <div className="flex justify-between mt-6">
                  <span>
                    Page {meta.current_page} of {meta.last_page}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={page === meta.last_page}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {/* VIEW CONTRACT MODAL */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Employee</p>
                  <p className="font-medium">
                    {selectedContract.staff_member?.full_name || '-'}
                  </p>
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
                  <p>{formatCurrency(selectedContract.salary)}</p>
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
                <p className="font-mono">{selectedContract.reference_number}</p>
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
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-solarized-base01 mb-1">
                  Contract Reference
                </p>
                <p className="font-mono font-medium">
                  {selectedContract.reference_number}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-solarized-base02">
                  Employee
                </label>
                <p className="mt-1 text-sm">
                  {selectedContract.staff_member?.full_name || 'N/A'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-solarized-base02">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-solarized-base02">
                  End Date
                </label>
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-solarized-base02">
                  Salary
                </label>
                <input
                  type="number"
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                  placeholder="Enter salary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-solarized-base02">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={async () => {
                if (!selectedContract) return;

                try {
                  await contractService.update(selectedContract.id, {
                    start_date: editStartDate,
                    end_date: editEndDate,
                    salary: editSalary,
                    status: editStatus,
                  });

                  showAlert('success', 'Success', 'Contract updated successfully');
                  setIsEditOpen(false);
                  fetchContracts();
                } catch (error) {
                  console.error('Failed to update contract:', error);
                  showAlert('error', 'Error', 'Failed to update contract');
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD CONTRACT DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Contract</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-solarized-base02">
                Employee *
              </label>
              <select
                value={newContract.staff_member_id}
                onChange={(e) => setNewContract({ ...newContract, staff_member_id: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                required
              >
                <option value="">Select Employee</option>
                {staffMembers.map((staff: any) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name} ({staff.staff_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-solarized-base02">
                Contract Type
              </label>
              <select
                value={newContract.contract_type_id}
                onChange={(e) => setNewContract({ ...newContract, contract_type_id: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
              >
                <option value="">Select Contract Type</option>
                {contractTypes.map((type: any) => (
                  <option key={type.id} value={type.id}>
                    {type.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date + End Date - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-solarized-base02">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={newContract.start_date}
                  onChange={(e) => setNewContract({ ...newContract, start_date: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-solarized-base02">
                  End Date *
                </label>
                <input
                  type="date"
                  value={newContract.end_date}
                  onChange={(e) => setNewContract({ ...newContract, end_date: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                  required
                />
              </div>
            </div>

            {/* Salary + Duration - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-solarized-base02">
                  Salary
                </label>
                <input
                  type="number"
                  value={newContract.salary}
                  onChange={(e) => setNewContract({ ...newContract, salary: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-solarized-base02">
                  Duration (Months)
                </label>
                <input
                  type="number"
                  value={newContract.duration_months}
                  onChange={(e) => setNewContract({ ...newContract, duration_months: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                  placeholder="e.g., 12"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-solarized-base02">
                Terms & Conditions
              </label>
              <textarea
                value={newContract.terms}
                onChange={(e) => setNewContract({ ...newContract, terms: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solarized-blue"
                rows={3}
                placeholder="Enter contract terms..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={handleCreateContract}
              // disabled={!newContract.staff_member_id || !newContract.start_date || !newContract.end_date}
            >
              Create Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div >
  );
}
