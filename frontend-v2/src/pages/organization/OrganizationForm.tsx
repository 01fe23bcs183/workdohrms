import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { organizationService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

interface FieldErrors {
    name?: string;
    email?: string;
    [key: string]: string | undefined;
}

export default function OrganizationForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        website: '',
        address: '',
    });

    useEffect(() => {
        if (isEditing) {
            fetchOrganization(parseInt(id));
        }
    }, [id]);

    const fetchOrganization = async (orgId: number) => {
        setIsFetching(true);
        try {
            const response = await organizationService.getById(orgId);
            const data = response.data.data;
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                website: data.website || '',
                address: data.address || '',
            });
        } catch (error) {
            console.error('Failed to fetch organization:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load organization details',
            });
            navigate('/organizations');
        } finally {
            setIsFetching(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const errors: FieldErrors = {};

        if (!formData.name.trim()) {
            errors.name = 'Organization name is required';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please fix the errors in the form',
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            if (isEditing) {
                await organizationService.update(parseInt(id!), formData);
                toast({
                    title: 'Success',
                    description: 'Organization updated successfully',
                });
            } else {
                await organizationService.create(formData);
                toast({
                    title: 'Success',
                    description: 'Organization created successfully',
                });
            }
            navigate('/organizations');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
            const errorMessage = error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} organization`;

            if (error.response?.data?.errors) {
                const apiErrors: FieldErrors = {};
                const errors = error.response.data.errors;
                Object.keys(errors).forEach(key => {
                    apiErrors[key] = errors[key][0];
                });
                setFieldErrors(apiErrors);
            }

            setError(errorMessage);
            toast({
                variant: 'destructive',
                title: 'Operation Failed',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-solarized-blue" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/organizations')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">
                        {isEditing ? 'Edit Organization' : 'Add Organization'}
                    </h1>
                    <p className="text-solarized-base01">
                        {isEditing ? 'Update organization details' : 'Create a new organization record'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Card className="border-0 shadow-md">
                    <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                        <CardDescription>Basic information about the organization</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="name" className={fieldErrors.name ? 'text-red-500' : ''}>Organization Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                aria-invalid={!!fieldErrors.name}
                            />
                            {fieldErrors.name && (
                                <p className="text-sm text-red-500">{fieldErrors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className={fieldErrors.email ? 'text-red-500' : ''}>Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                aria-invalid={!!fieldErrors.email}
                            />
                            {fieldErrors.email && (
                                <p className="text-sm text-red-500">{fieldErrors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 mt-6">
                    <Button type="button" variant="outline" onClick={() => navigate('/organizations')}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-solarized-blue hover:bg-solarized-blue/90"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isEditing ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            isEditing ? 'Update Organization' : 'Create Organization'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
