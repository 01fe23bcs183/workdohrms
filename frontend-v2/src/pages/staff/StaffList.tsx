import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { staffService } from '../../services/api';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import DataTable, { TableColumn } from 'react-data-table-component';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
} from 'lucide-react';

interface StaffMember {
  id: number;
  full_name: string;
  personal_email: string;
  work_email: string;
  phone_number: string;
  job_title: { title: string } | null;
  division: { title: string } | null;
  office_location: { title: string } | null;
  employment_status: string;
  hire_date: string;
}

// interface PaginationMeta {
//   current_page: number;
//   per_page: number;
//   total: number;
//   total_pages: number;
//   from: number;
//   to: number;
//   has_more_pages: boolean;
// }

export default function StaffList() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const fetchStaff = useCallback(async (currentPage: number = 1) => {
    setIsLoading(true);
    try {
      const response = await staffService.getAll({ page: currentPage, per_page: perPage, search });
      // API response structure: { success, data: [...], message, meta: {...} }
      const { data: staffData, meta: paginationMeta } = response.data;

      if (Array.isArray(staffData)) {
        setStaff(staffData);
        if (paginationMeta) {
          setTotalRows(paginationMeta.total);
        }
      } else {
        setStaff([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      setStaff([]);
      setTotalRows(0);
    } finally {
      setIsLoading(false);
    }
  }, [perPage, search]);

  useEffect(() => {
    fetchStaff(page);
  }, [page, search, fetchStaff]);

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // This will trigger useEffect to call fetchStaff
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await staffService.delete(id);
      fetchStaff(page);
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-solarized-green/10 text-solarized-green',
      inactive: 'bg-solarized-base01/10 text-solarized-base01',
      terminated: 'bg-solarized-red/10 text-solarized-red',
      on_leave: 'bg-solarized-yellow/10 text-solarized-yellow',
      resigned: 'bg-solarized-orange/10 text-solarized-orange',
    };
    return variants[status] || variants.inactive;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // DataTable columns
  const columns: TableColumn<StaffMember>[] = [
    {
      name: 'Employee',
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <Avatar>
            <AvatarFallback className="bg-solarized-blue/10 text-solarized-blue">
              {getInitials(row.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-solarized-base02">{row.full_name}</p>
            <p className="text-sm text-solarized-base01">
              {row.work_email || row.personal_email || '-'}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      minWidth: '250px',
    },
    {
      name: 'Job Title',
      selector: (row) => row.job_title?.title || '-',
      sortable: true,
    },
    {
      name: 'Department',
      selector: (row) => row.division?.title || '-',
      sortable: true,
    },
    {
      name: 'Location',
      selector: (row) => row.office_location?.title || '-',
      sortable: true,
    },
    {
      name: 'Status',
      cell: (row) => (
        <Badge className={getStatusBadge(row.employment_status)}>
          {row.employment_status?.replace('_', ' ') || 'Unknown'}
        </Badge>
      ),
      sortable: true,
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
            <DropdownMenuItem asChild>
              <Link to={`/staff/${row.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/staff/${row.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.id)}
              className="text-solarized-red"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      ignoreRowClick: true,
      width: '80px',
    },
  ];

  // Custom styles for DataTable
  const customStyles = {
    headRow: {
      style: {
        background: 'linear-gradient(to right, #e0eafc, #cfdef3)',
        fontWeight: 'bold',
        fontSize: '14px',
        borderRadius: '8px 8px 0 0',
      },
    },
    rows: {
      style: {
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        '&:hover': {
          backgroundColor: '#e6f0ff',
        },
      },
    },
    headCells: {
      style: {
        color: '#333',
        fontWeight: '600',
      },
    },
    cells: {
      style: {
        paddingTop: '12px',
        paddingBottom: '12px',
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Staff Members</h1>
          <p className="text-solarized-base01">Manage your organization's employees</p>
        </div>
        <Link to="/staff/create">
          <Button className="bg-solarized-blue hover:bg-solarized-blue/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-solarized-base01" />
              <Input
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {!isLoading && staff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-solarized-base02">No staff members found</h3>
              <p className="text-solarized-base01 mt-1">Get started by adding your first employee.</p>
              <Link to="/staff/create">
                <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
              </Link>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={staff}
              customStyles={customStyles}
              progressPending={isLoading}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationPerPage={perPage}
              paginationDefaultPage={page}
              onChangePage={handlePageChange}
              highlightOnHover
              pointerOnHover
              responsive
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
