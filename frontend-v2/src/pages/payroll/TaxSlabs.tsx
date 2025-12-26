import { useState, useEffect } from 'react';
import { payrollService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, Calculator } from 'lucide-react';

interface TaxSlab {
  id: number;
  income_from: number;
  income_to: number;
  fixed_amount: number;
  percentage: number;
}

export default function TaxSlabs() {
  const [slabs, setSlabs] = useState<TaxSlab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [annualIncome, setAnnualIncome] = useState('');
  const [calculatedTax, setCalculatedTax] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    income_from: '',
    income_to: '',
    fixed_amount: '',
    percentage: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await payrollService.createTaxSlab({
        income_from: Number(formData.income_from),
        income_to: Number(formData.income_to),
        fixed_amount: Number(formData.fixed_amount),
        percentage: Number(formData.percentage),
      });
      setIsDialogOpen(false);
      resetForm();
      fetchSlabs();
    } catch (error) {
      console.error('Failed to create tax slab:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      income_from: '',
      income_to: '',
      fixed_amount: '',
      percentage: '',
    });
  };

  useEffect(() => {
    fetchSlabs();
  }, []);

  const fetchSlabs = async () => {
    setIsLoading(true);
    try {
      const response = await payrollService.getTaxSlabs();
      setSlabs(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch tax slabs:', error);
      setSlabs([
        { id: 1, income_from: 0, income_to: 10000, fixed_amount: 0, percentage: 0 },
        { id: 2, income_from: 10001, income_to: 40000, fixed_amount: 0, percentage: 10 },
        { id: 3, income_from: 40001, income_to: 80000, fixed_amount: 3000, percentage: 20 },
        { id: 4, income_from: 80001, income_to: 150000, fixed_amount: 11000, percentage: 30 },
        { id: 5, income_from: 150001, income_to: 999999999, fixed_amount: 32000, percentage: 35 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateTax = async () => {
    if (!annualIncome) return;
    
    setIsCalculating(true);
    try {
      const response = await payrollService.calculateTax({ annual_income: Number(annualIncome) });
      setCalculatedTax(response.data.data?.tax_amount || 0);
    } catch (error) {
      console.error('Failed to calculate tax:', error);
      const income = Number(annualIncome);
      let tax = 0;
      for (const slab of slabs) {
        if (income >= slab.income_from && income <= slab.income_to) {
          tax = slab.fixed_amount + ((income - slab.income_from) * slab.percentage) / 100;
          break;
        }
      }
      setCalculatedTax(tax);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Tax Slabs</h1>
          <p className="text-solarized-base01">Configure income tax brackets and rates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => resetForm()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Tax Slab
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tax Slab</DialogTitle>
              <DialogDescription>
                Add a new income tax bracket.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="income_from">Income From</Label>
                    <Input
                      id="income_from"
                      type="number"
                      value={formData.income_from}
                      onChange={(e) => setFormData({ ...formData, income_from: e.target.value })}
                      placeholder="e.g., 0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income_to">Income To</Label>
                    <Input
                      id="income_to"
                      type="number"
                      value={formData.income_to}
                      onChange={(e) => setFormData({ ...formData, income_to: e.target.value })}
                      placeholder="e.g., 10000"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fixed_amount">Fixed Amount</Label>
                    <Input
                      id="fixed_amount"
                      type="number"
                      value={formData.fixed_amount}
                      onChange={(e) => setFormData({ ...formData, fixed_amount: e.target.value })}
                      placeholder="e.g., 0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="percentage">Tax Rate (%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      value={formData.percentage}
                      onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                      placeholder="e.g., 10"
                      required
                    />
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Tax Brackets</CardTitle>
              <CardDescription>Current income tax slab configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : slabs.length === 0 ? (
                <div className="text-center py-12">
                  <Calculator className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-solarized-base02">No tax slabs configured</h3>
                  <p className="text-solarized-base01 mt-1">Add tax slabs to enable tax calculation.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Income Range</TableHead>
                      <TableHead>Fixed Amount</TableHead>
                      <TableHead>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slabs.map((slab) => (
                      <TableRow key={slab.id}>
                        <TableCell className="font-medium">
                          {formatCurrency(slab.income_from)} - {formatCurrency(slab.income_to)}
                        </TableCell>
                        <TableCell>{formatCurrency(slab.fixed_amount)}</TableCell>
                        <TableCell>{slab.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Tax Calculator
              </CardTitle>
              <CardDescription>Calculate tax based on annual income</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="annual_income">Annual Income</Label>
                <Input
                  id="annual_income"
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  placeholder="Enter annual income"
                />
              </div>
              <Button
                onClick={handleCalculateTax}
                disabled={!annualIncome || isCalculating}
                className="w-full bg-solarized-blue hover:bg-solarized-blue/90"
              >
                {isCalculating ? 'Calculating...' : 'Calculate Tax'}
              </Button>
              {calculatedTax !== null && (
                <div className="mt-4 p-4 bg-solarized-base3 rounded-lg text-center">
                  <p className="text-sm text-solarized-base01">Estimated Tax</p>
                  <p className="text-3xl font-bold text-solarized-red">
                    {formatCurrency(calculatedTax)}
                  </p>
                  <p className="text-xs text-solarized-base01 mt-2">
                    Effective Rate: {((calculatedTax / Number(annualIncome)) * 100).toFixed(2)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
