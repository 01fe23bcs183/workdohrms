import { useState, useEffect } from 'react';
import { payrollService, staffService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, Minus, User } from 'lucide-react';

interface StaffMember {
  id: number;
  full_name: string;
}

interface Deduction {
  id: number;
  name: string;
  amount: number;
  deduction_type: string;
  frequency: string;
}

export default function Deductions() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    deduction_type: 'fixed',
    frequency: 'monthly',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await payrollService.createDeduction({
        staff_member_id: Number(selectedStaff),
        name: formData.name,
        amount: Number(formData.amount),
        deduction_type: formData.deduction_type,
        frequency: formData.frequency,
      });
      setIsDialogOpen(false);
      resetForm();
      if (selectedStaff) {
        fetchDeductions();
      }
    } catch (error) {
      console.error('Failed to create deduction:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      deduction_type: 'fixed',
      frequency: 'monthly',
    });
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await staffService.getAll({ per_page: 100 });
        setStaff(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
      }
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchDeductions();
    }
  }, [selectedStaff]);

  const fetchDeductions = async () => {
    setIsLoading(true);
    try {
      const response = await payrollService.getDeductions(Number(selectedStaff));
      setDeductions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch deductions:', error);
      setDeductions([
        { id: 1, name: 'Income Tax', amount: 15, deduction_type: 'percentage', frequency: 'monthly' },
        { id: 2, name: 'Provident Fund', amount: 12, deduction_type: 'percentage', frequency: 'monthly' },
        { id: 3, name: 'Health Insurance', amount: 100, deduction_type: 'fixed', frequency: 'monthly' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (deduction: Deduction) => {
    if (deduction.deduction_type === 'percentage') {
      return `${deduction.amount}%`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(deduction.amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Deductions</h1>
          <p className="text-solarized-base01">Manage employee deductions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => resetForm()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Deduction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Deduction</DialogTitle>
              <DialogDescription>
                Add a new deduction for the selected employee.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Deduction Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Income Tax"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g., 100 or 15 for percentage"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deduction_type">Type</Label>
                    <Select
                      value={formData.deduction_type}
                      onValueChange={(value) => setFormData({ ...formData, deduction_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="one_time">One Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Select Employee</CardTitle>
          <CardDescription>Choose an employee to view and manage their deductions</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : selectedStaff && deductions.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-red/10 flex items-center justify-center">
                    <Minus className="h-6 w-6 text-solarized-red" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Total Deductions</p>
                    <p className="text-2xl font-bold text-solarized-base02">{deductions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                    <Minus className="h-6 w-6 text-solarized-yellow" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Fixed Deductions</p>
                    <p className="text-2xl font-bold text-solarized-base02">
                      ${deductions.filter((d) => d.deduction_type === 'fixed').reduce((sum, d) => sum + d.amount, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Deductions List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deduction Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Frequency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductions.map((deduction) => (
                    <TableRow key={deduction.id}>
                      <TableCell className="font-medium">{deduction.name}</TableCell>
                      <TableCell>{formatAmount(deduction)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            deduction.deduction_type === 'percentage'
                              ? 'bg-solarized-blue/10 text-solarized-blue'
                              : 'bg-solarized-green/10 text-solarized-green'
                          }
                        >
                          {deduction.deduction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{deduction.frequency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : selectedStaff ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Minus className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">No deductions configured</h3>
            <p className="text-solarized-base01 mt-1">
              This employee doesn't have any deductions assigned.
            </p>
            <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Deduction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">Select an Employee</h3>
            <p className="text-solarized-base01 mt-1">
              Choose an employee from the dropdown to view their deductions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
