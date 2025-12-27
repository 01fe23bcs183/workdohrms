import { useEffect, useState } from 'react';
import { payrollApi, staffApi } from '../../api';
import { SalarySlip, StaffMember } from '../../types';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { DollarSign, Eye, Plus, Loader2, FileText, Check } from 'lucide-react';

export default function SalarySlips() {
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [staffFilter, setStaffFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateForm, setGenerateForm] = useState({ staff_member_id: '', month: '', year: new Date().getFullYear().toString() });
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  const fetchSalarySlips = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (monthFilter) params.month = parseInt(monthFilter);
      if (yearFilter) params.year = parseInt(yearFilter);
      if (staffFilter) params.staff_member_id = parseInt(staffFilter);
      if (statusFilter) params.status = statusFilter;

      const response = await payrollApi.getSalarySlips(params);
      if (response.success) {
        setSalarySlips(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch salary slips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await staffApi.getDropdown();
        if (response.success) setStaffMembers(response.data);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
      }
    };
    fetchStaff();
    fetchSalarySlips();
  }, []);

  useEffect(() => {
    fetchSalarySlips();
  }, [monthFilter, yearFilter, staffFilter, statusFilter]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await payrollApi.generateSalarySlip({
        staff_member_id: parseInt(generateForm.staff_member_id),
        month: parseInt(generateForm.month),
        year: parseInt(generateForm.year),
      });
      if (response.success) {
        setIsGenerateOpen(false);
        setGenerateForm({ staff_member_id: '', month: '', year: new Date().getFullYear().toString() });
        fetchSalarySlips();
      }
    } catch (error) {
      console.error('Failed to generate salary slip:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      await payrollApi.markPaid(id);
      fetchSalarySlips();
    } catch (error) {
      console.error('Failed to mark as paid:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      generated: 'outline',
      paid: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Salary Slips
          </h1>
          <p className="text-slate-400">Manage employee payroll</p>
        </div>
        <Button onClick={() => setIsGenerateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Slip
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="">All Months</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="">All Employees</SelectItem>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id.toString()}>{staff.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : salarySlips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FileText className="h-12 w-12 mb-4" />
              <p>No salary slips found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">Employee</TableHead>
                  <TableHead className="text-slate-300">Period</TableHead>
                  <TableHead className="text-slate-300">Gross</TableHead>
                  <TableHead className="text-slate-300">Deductions</TableHead>
                  <TableHead className="text-slate-300">Net Pay</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salarySlips.map((slip) => (
                  <TableRow key={slip.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="font-medium text-white">{slip.staff_member?.full_name || '-'}</TableCell>
                    <TableCell className="text-slate-300">{months.find(m => m.value === slip.month.toString())?.label} {slip.year}</TableCell>
                    <TableCell className="text-slate-300">{formatCurrency(slip.gross_salary)}</TableCell>
                    <TableCell className="text-slate-300">{formatCurrency(slip.total_deductions)}</TableCell>
                    <TableCell className="text-white font-medium">{formatCurrency(slip.net_salary)}</TableCell>
                    <TableCell>{getStatusBadge(slip.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedSlip(slip)} className="text-slate-400 hover:text-white">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {slip.status !== 'paid' && (
                          <Button variant="ghost" size="icon" onClick={() => handleMarkPaid(slip.id)} className="text-green-400 hover:text-green-300">
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Generate Salary Slip</DialogTitle>
            <DialogDescription className="text-slate-400">Generate a new salary slip for an employee</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Employee *</Label>
              <Select value={generateForm.staff_member_id} onValueChange={(v) => setGenerateForm({ ...generateForm, staff_member_id: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>{staff.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Month *</Label>
                <Select value={generateForm.month} onValueChange={(v) => setGenerateForm({ ...generateForm, month: v })}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Year *</Label>
                <Select value={generateForm.year} onValueChange={(v) => setGenerateForm({ ...generateForm, year: v })}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</Button>
            <Button onClick={handleGenerate} disabled={isGenerating || !generateForm.staff_member_id || !generateForm.month}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSlip} onOpenChange={() => setSelectedSlip(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Salary Slip Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedSlip?.staff_member?.full_name} - {months.find(m => m.value === selectedSlip?.month.toString())?.label} {selectedSlip?.year}
            </DialogDescription>
          </DialogHeader>
          {selectedSlip && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <p className="text-sm text-slate-400">Basic Salary</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(selectedSlip.basic_salary)}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <p className="text-sm text-slate-400">Gross Salary</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(selectedSlip.gross_salary)}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <p className="text-sm text-slate-400">Total Deductions</p>
                  <p className="text-xl font-bold text-red-400">{formatCurrency(selectedSlip.total_deductions)}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/20">
                  <p className="text-sm text-slate-400">Net Salary</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(selectedSlip.net_salary)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50">
                <span className="text-slate-300">Status</span>
                {getStatusBadge(selectedSlip.status)}
              </div>
              {selectedSlip.paid_at && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50">
                  <span className="text-slate-300">Paid On</span>
                  <span className="text-white">{new Date(selectedSlip.paid_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSlip(null)} className="border-slate-600 text-slate-300 hover:bg-slate-700">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
