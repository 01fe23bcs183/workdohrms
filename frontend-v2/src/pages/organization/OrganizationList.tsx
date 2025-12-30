import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { organizationService } from '../../services/api';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Skeleton } from '../../components/ui/skeleton';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Building2,
} from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    email: string;
    phone: string;
    website: string;
    address: string;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function OrganizationList() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchOrganizations();
    }, [page, search]);

    const fetchOrganizations = async () => {
        setIsLoading(true);
        try {
            const response = await organizationService.getAll({ page, search });
            const payload = response.data.data;

            if (Array.isArray(payload)) {
                setOrganizations(payload);
                setMeta(null);
            } else if (payload && Array.isArray(payload.data)) {
                setOrganizations(payload.data);
                setMeta({
                    current_page: payload.current_page,
                    last_page: payload.last_page,
                    per_page: payload.per_page,
                    total: payload.total,
                });
            } else {
                setOrganizations([]);
                setMeta(null);
            }
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
            setOrganizations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this organization?')) return;
        try {
            await organizationService.delete(id);
            fetchOrganizations();
        } catch (error) {
            console.error('Failed to delete organization:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Organizations</h1>
                    <p className="text-solarized-base01">Manage your client organizations</p>
                </div>
                <Link to="/organizations/create">
                    <Button className="bg-solarized-blue hover:bg-solarized-blue/90">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Organization
                    </Button>
                </Link>
            </div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-solarized-base01" />
                            <Input
                                placeholder="Search organizations..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
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
                    ) : organizations.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-solarized-base02">No organizations found</h3>
                            <p className="text-solarized-base01 mt-1">Get started by adding your first organization.</p>
                            <Link to="/organizations/create">
                                <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Organization
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Website</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {organizations.map((org) => (
                                            <TableRow key={org.id}>
                                                <TableCell className="font-medium text-solarized-base02">
                                                    {org.name}
                                                </TableCell>
                                                <TableCell>{org.email || '-'}</TableCell>
                                                <TableCell>{org.phone || '-'}</TableCell>
                                                <TableCell>
                                                    {org.website ? (
                                                        <a
                                                            href={org.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-solarized-blue hover:underline"
                                                        >
                                                            {org.website}
                                                        </a>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link to={`/organizations/${org.id}/edit`}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(org.id)}
                                                                className="text-solarized-red"
                                                            >
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
