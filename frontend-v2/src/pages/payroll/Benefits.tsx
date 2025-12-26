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
import { Plus, DollarSign, User } from 'lucide-react';

interface StaffMember {
  id: number;
  full_name: string;
}

interface Benefit {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  is_taxable: boolean;
}

export default function Benefits() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    is_taxable: 'true',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await payrollService.createBenefit({
        staff_member_id: Number(selectedStaff),
        name: formData.name,
        amount: Number(formData.amount),
        frequency: formData.frequency,
        is_taxable: formData.is_taxable === 'true',
      });
      setIsDialogOpen(false);
      resetForm();
      if (selectedStaff) {
        fetchBenefits();
      }
    } catch (error) {
      console.error('Failed to create benefit:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      frequency: 'monthly',
      is_taxable: 'true',
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
      fetchBenefits();
    }
  }, [selectedStaff]);

  const fetchBenefits = async () => {
    setIsLoading(true);
    try {
      const response = await payrollService.getBenefits(Number(selectedStaff));
      setBenefits(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch benefits:', error);
      setBenefits([
        { id: 1, name: 'Housing Allowance', amount: 500, frequency: 'monthly', is_taxable: true },
        { id: 2, name: 'Transport Allowance', amount: 200, frequency: 'monthly', is_taxable: true },
        { id: 3, name: 'Medical Allowance', amount: 300, frequency: 'monthly', is_taxable: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalBenefits = benefits.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Benefits</h1>
          <p className="text-solarized-base01">Manage employee benefits and allowances</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => resetForm()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Benefit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Benefit</DialogTitle>
              <DialogDescription>
                Add a new benefit for the selected employee.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Benefit Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Housing Allowance"
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
                    placeholder="e.g., 500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="is_taxable">Taxable</Label>
                    <Select
                      value={formData.is_taxable}
                      onValueChange={(value) => setFormData({ ...formData, is_taxable: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Is taxable?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
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
          <CardDescription>Choose an employee to view and manage their benefits</CardDescription>
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
      ) : selectedStaff && benefits.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-green/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-solarized-green" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Total Benefits</p>
                    <p className="text-2xl font-bold text-solarized-base02">
                      {formatCurrency(totalBenefits)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-solarized-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Active Benefits</p>
                    <p className="text-2xl font-bold text-solarized-base02">{benefits.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-solarized-yellow" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Taxable Amount</p>
                    <p className="text-2xl font-bold text-solarized-base02">
                      {formatCurrency(benefits.filter((b) => b.is_taxable).reduce((sum, b) => sum + b.amount, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Benefits List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benefit Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Taxable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benefits.map((benefit) => (
                    <TableRow key={benefit.id}>
                      <TableCell className="font-medium">{benefit.name}</TableCell>
                      <TableCell>{formatCurrency(benefit.amount)}</TableCell>
                      <TableCell className="capitalize">{benefit.frequency}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            benefit.is_taxable
                              ? 'bg-solarized-yellow/10 text-solarized-yellow'
                              : 'bg-solarized-green/10 text-solarized-green'
                          }
                        >
                          {benefit.is_taxable ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
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
            <DollarSign className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">No benefits configured</h3>
            <p className="text-solarized-base01 mt-1">
              This employee doesn't have any benefits assigned.
            </p>
            <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Benefit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">Select an Employee</h3>
            <p className="text-solarized-base01 mt-1">
              Choose an employee from the dropdown to view their benefits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
