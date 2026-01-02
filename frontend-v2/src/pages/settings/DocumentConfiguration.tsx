import { useState, useEffect } from 'react';
import { documentLocationService, documentConfigService } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { HardDrive, Cloud, Database, Settings as SettingsIcon, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';


interface DocumentLocation {
    id: number;
    location_type: number;
    org_id?: number;
    company_id?: number;
    organization?: { name: string };
    company?: { company_name: string };
    config?: any; // To store storage specific config
}

type StorageType = 'local' | 'wasabi' | 'aws';

const STORAGE_CARDS = [
    { type: 'local' as StorageType, id: 1, title: 'Local Storage', description: 'Store documents on local server', icon: HardDrive, color: 'bg-solarized-blue', iconColor: 'text-solarized-blue' },
    { type: 'wasabi' as StorageType, id: 2, title: 'Wasabi Cloud', description: 'Store documents on Wasabi cloud storage', icon: Cloud, color: 'bg-solarized-green', iconColor: 'text-solarized-green' },
    { type: 'aws' as StorageType, id: 3, title: 'AWS S3', description: 'Store documents on Amazon S3', icon: Database, color: 'bg-solarized-yellow', iconColor: 'text-solarized-yellow' },
];

export default function DocumentConfiguration() {
    const { user } = useAuth();
    const [locations, setLocations] = useState<DocumentLocation[]>([]);
    const [loadingTypes, setLoadingTypes] = useState<Set<StorageType>>(new Set());

    // Modal & Form State
    const [showDetailed, setShowDetailed] = useState(false);
    const [selectedType, setSelectedType] = useState<StorageType | null>(null);
    const [currentStorage, setCurrentStorage] = useState<{ type: StorageType; id: number; title: string } | null>(null);
    const [formData, setFormData] = useState<any>({
        root_path: '',
        bucket: '',
        region: '',
        access_key: '',
        secret_key: '',
        endpoint: '',
        is_active: true,
    });

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const response = await documentLocationService.getAll({});
            const payload = response.data.data;
            let rawLocations: DocumentLocation[] = Array.isArray(payload) ? payload : (payload?.data || []);

            // For each location, fetch its specific config (optional for quick-configured ones)
            const locationsWithConfigs = await Promise.all(
                rawLocations.map(async (loc) => {
                    try {
                        // const configResponse = await documentConfigService.getConfig(loc.id);
                        return { ...loc, config: null };
                    } catch (err) {
                        return loc;
                    }
                })
            );

            setLocations(locationsWithConfigs);
        } catch (error) {
            console.error('Failed to fetch locations:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch storage locations' });
        } finally {
            // setIsLoading(false); // Removed unused state
        }
    };

    const handleConfigureStorage = async (locationType: number, type: StorageType) => {
        if (loadingTypes.has(type)) return;
        if (!user?.org_id || !user?.company_id) {
            toast({ variant: 'destructive', title: 'Error', description: 'User organization or company not found.' });
            return;
        }

        setLoadingTypes(prev => new Set(prev).add(type));
        try {
            await documentLocationService.create({
                location_type: locationType,
                org_id: Number(user.org_id),
                company_id: Number(user.company_id),
            });

            toast({ title: 'Success', description: `${type.charAt(0).toUpperCase()}${type.slice(1)} storage configured successfully` });
            fetchLocations();
        } catch (error) {
            console.error('Failed to configure:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to configure storage' });
        } finally {
            setLoadingTypes(prev => {
                const next = new Set(prev);
                next.delete(type);
                return next;
            });
        }
    };

    const handleSelectType = (storage: { type: StorageType; id: number; title: string }) => {
        setCurrentStorage(storage);
        setSelectedType(storage.type);
        setFormData({
            root_path: '',
            bucket: '',
            region: '',
            access_key: '',
            secret_key: '',
            endpoint: '',
            is_active: true,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentStorage || loadingTypes.has(currentStorage.type)) return;
        if (!user?.org_id || !user?.company_id || !currentStorage) return;

        setLoadingTypes(prev => new Set(prev).add(currentStorage.type));
        try {
            let locationId: number;

            // 1. Create Location
            const locResponse = await documentLocationService.create({
                location_type: currentStorage.id,
                org_id: user.org_id,
                company_id: user.company_id,
            });
            locationId = locResponse.data.data.id;

            // 2. Create specific config
            const configData = { ...formData, location_id: locationId };
            if (currentStorage.type === 'local') await documentConfigService.createLocal(configData);
            else if (currentStorage.type === 'wasabi') await documentConfigService.createWasabi(configData);
            else if (currentStorage.type === 'aws') await documentConfigService.createAws(configData);

            toast({ title: 'Success', description: 'Detailed configuration saved successfully' });
            setSelectedType(null);
            setCurrentStorage(null);
            fetchLocations();
        } catch (error) {
            console.error('Failed to save config:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save detailed configuration' });
        } finally {
            if (currentStorage) {
                setLoadingTypes(prev => {
                    const next = new Set(prev);
                    next.delete(currentStorage.type);
                    return next;
                });
            }
        }
    };

    const getConfiguredLocations = (locationType: number) => {
        return locations.filter(loc => loc.location_type === locationType);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <SettingsIcon className="h-8 w-8 text-solarized-blue" />
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Document Configuration</h1>
                    <p className="text-solarized-base01">Manage storage locations and credentials</p>
                </div>
            </div>

            {/* Top Summary Grid - Direct Configuration */}
            <div className="grid gap-6 md:grid-cols-3">
                {STORAGE_CARDS.map((card) => {
                    const Icon = card.icon;
                    const configuredLocations = getConfiguredLocations(card.id);

                    return (
                        <Card
                            key={card.type}
                            className="border-0 shadow-md hover:shadow-lg transition-shadow"
                        >
                            <CardHeader>
                                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-4`}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{card.title}</CardTitle>
                                    {configuredLocations.length > 0 && (
                                        <Badge className="bg-solarized-green/10 text-solarized-green">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            {configuredLocations.length} Configured
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription>{card.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    size="sm"
                                    className="bg-solarized-blue hover:bg-solarized-blue/90 w-full"
                                    onClick={() => handleConfigureStorage(card.id, card.type)}
                                    disabled={loadingTypes.has(card.type)}
                                >
                                    {loadingTypes.has(card.type) ? 'Configuring...' : 'Configure'}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Bottom Section - Detailed Configuration */}
            <div className="pt-4">
                <Card className="border-0 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                        <div>
                            <CardTitle className="text-lg">Detailed Configuration</CardTitle>
                            <CardDescription>Setup advanced credentials for cloud and local storage</CardDescription>
                        </div>
                        {!showDetailed && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-solarized-blue text-solarized-blue hover:bg-solarized-blue hover:text-white"
                                onClick={() => setShowDetailed(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Start Detailed Setup
                            </Button>
                        )}
                    </CardHeader>
                    {showDetailed && (
                        <CardContent className="space-y-6">
                            <div className="flex flex-wrap gap-4 justify-center p-2 bg-solarized-base3/20 rounded-xl">
                                {STORAGE_CARDS.map((storage) => (
                                    <Button
                                        key={`btn-${storage.type}`}
                                        variant={selectedType === storage.type ? "default" : "outline"}
                                        className={selectedType === storage.type ? "bg-solarized-blue hover:bg-solarized-blue/90" : "border-solarized-blue/20 hover:border-solarized-blue"}
                                        onClick={() => handleSelectType(storage)}
                                    >
                                        <storage.icon className="mr-2 h-4 w-4" />
                                        {storage.title}
                                    </Button>
                                ))}
                            </div>

                            {selectedType && (
                                <div className="p-6 border border-solarized-base3 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                        {selectedType === 'local' ? <HardDrive className="h-5 w-5 text-solarized-blue" /> : selectedType === 'wasabi' ? <Cloud className="h-5 w-5 text-solarized-green" /> : <Database className="h-5 w-5 text-solarized-yellow" />}
                                        Configure {currentStorage?.title}
                                    </h3>

                                    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                                        {selectedType === 'local' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="root_path">Root Path</Label>
                                                <Input
                                                    id="root_path"
                                                    placeholder="/var/www/storage/app/public"
                                                    value={formData.root_path}
                                                    onChange={(e) => setFormData({ ...formData, root_path: e.target.value })}
                                                    required
                                                />
                                                <p className="text-xs text-solarized-base01">The absolute file path on your server where documents will be stored.</p>
                                            </div>
                                        )}

                                        {(selectedType === 'wasabi' || selectedType === 'aws') && (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="bucket">Bucket Name</Label>
                                                        <Input
                                                            id="bucket"
                                                            value={formData.bucket}
                                                            onChange={(e) => setFormData({ ...formData, bucket: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="region">Region</Label>
                                                        <Input
                                                            id="region"
                                                            value={formData.region}
                                                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="access_key">Access Key</Label>
                                                    <Input
                                                        id="access_key"
                                                        value={formData.access_key}
                                                        onChange={(e) => setFormData({ ...formData, access_key: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="secret_key">Secret Key</Label>
                                                    <Input
                                                        id="secret_key"
                                                        type="password"
                                                        value={formData.secret_key}
                                                        onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {selectedType === 'wasabi' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="endpoint">Endpoint URL</Label>
                                                <Input
                                                    id="endpoint"
                                                    placeholder="https://s3.wasabisys.com"
                                                    value={formData.endpoint}
                                                    onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between p-4 bg-solarized-base3/10 rounded-lg">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="is_active">Active Status</Label>
                                                <p className="text-xs text-solarized-base01">Set this configuration as active immediately</p>
                                            </div>
                                            <Switch
                                                id="is_active"
                                                checked={formData.is_active}
                                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t border-solarized-base3/30">
                                            <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90 flex-1" disabled={currentStorage ? loadingTypes.has(currentStorage.type) : false}>
                                                {loadingTypes.has(selectedType) ? 'Saving...' : 'Save Configuration'}
                                            </Button>
                                            <Button type="button" variant="ghost" onClick={() => { setSelectedType(null); setCurrentStorage(null); }}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            </div>

        </div>
    );
}
