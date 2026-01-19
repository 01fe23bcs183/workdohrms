import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';

interface FieldErrors {
    [key: string]: string | undefined;
}

export default function OrganizationCreate() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        user_name: '',
        email: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = (): boolean => {
        const errors: FieldErrors = {};
        let isValid = true;

        if (!formData.name.trim()) {
            errors.name = 'Organization Name is required';
            isValid = false;
        }

        if (!formData.user_name.trim()) {
            errors.user_name = 'Admin Name is required';
            isValid = false;
        }

        if (!formData.email.trim()) {
            errors.email = 'Admin Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
            isValid = false;
        }

        setFieldErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        setFormError('');

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Backend expects 'org_name' for create
            const createPayload = {
                org_name: formData.name,
                address: formData.address,
                user_name: formData.user_name,
                email: formData.email,
                password: formData.password,
            };
            await organizationService.create(createPayload);
            showAlert('success', 'Success', 'Organization created successfully', 2000);
            navigate('/organizations');
        } catch (error) {
            console.error('Failed to save organization:', error);
            const errorMessage = getErrorMessage(error, 'Failed to save organization');
            setFormError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderError = (field: string) => {
        return fieldErrors[field] ? (
            <p className="text-sm text-red-500 mt-1">{fieldErrors[field]}</p>
        ) : null;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Create Organization</h1>
                    <p className="text-solarized-base01">Add a new client organization</p>
                </div>
            </div>

            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>Enter the details for the new organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    {formError && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{formError}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="name" className={fieldErrors.name ? 'text-red-500' : ''}>Organization Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value });
                                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                                    }}
                                    placeholder="Acme Corp"
                                    aria-invalid={!!fieldErrors.name}
                                />
                                {renderError('name')}
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="123 Main St, City, Country"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4">Admin Account</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="user_name" className={fieldErrors.user_name ? 'text-red-500' : ''}>Admin Name *</Label>
                                    <Input
                                        id="user_name"
                                        value={formData.user_name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, user_name: e.target.value });
                                            if (fieldErrors.user_name) setFieldErrors({ ...fieldErrors, user_name: undefined });
                                        }}
                                        placeholder="John Doe"
                                        aria-invalid={!!fieldErrors.user_name}
                                    />
                                    {renderError('user_name')}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className={fieldErrors.email ? 'text-red-500' : ''}>Admin Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => {
                                            setFormData({ ...formData, email: e.target.value });
                                            if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                                        }}
                                        placeholder="admin@example.com"
                                        aria-invalid={!!fieldErrors.email}
                                    />
                                    {renderError('email')}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Default: password123"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Organization'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
