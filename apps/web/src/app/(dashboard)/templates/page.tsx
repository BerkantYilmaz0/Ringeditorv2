'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    Loader2,
    CheckCircle2,
    Play
} from 'lucide-react';
import { toast } from 'sonner';

import { getTemplates, deleteTemplate, createTemplate, Template } from '@/lib/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// V3 Alt Bileşenler
import TemplateSeferEditor from '../../../components/schedules/TemplateSeferEditor';
import PreviewTemplateDialog from '../../../components/schedules/PreviewTemplateDialog';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Yeni Şablon Formu
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateDesc, setNewTemplateDesc] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await getTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('Şablon çekme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleCreateTemplate = async () => {
        if (!newTemplateName) return;
        setIsSaving(true);
        try {
            await createTemplate({ name: newTemplateName, description: newTemplateDesc });
            setIsAddDialogOpen(false);
            setNewTemplateName('');
            setNewTemplateDesc('');
            fetchTemplates();
            toast.success('Şablon oluşturuldu');
        } catch (error) {
            toast.error('Hata', { description: 'Şablon oluşturulamadı' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        try {
            await deleteTemplate(id);
            toast.success('Şablon başarıyla silindi');
            fetchTemplates();
        } catch (error) {
            toast.error('Hata', { description: 'Şablon silinemedi' });
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">

            {/* Header (Görsel 2 Üst Kısım) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Şablon Yönetimi</h1>
                    <p className="text-slate-500 text-sm mt-1">Tekrarlayan sefer programlarınızı gruplayın ve merkezi olarak yönetin.</p>
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 shadow-lg h-11 px-6">
                            <Plus className="h-4 w-4 mr-2" /> Yeni Şablon Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Yeni Plan Şablonu</DialogTitle>
                            <DialogDescription>
                                Seferleri gruplayacağınız bir şablon başlığı oluşturun.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Şablon Adı</Label>
                                <Input
                                    id="name"
                                    placeholder="Örn: Hafta İçi Yoğun Program"
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desc">Açıklama</Label>
                                <Input
                                    id="desc"
                                    placeholder="Bu programın kapsamını belirtin..."
                                    value={newTemplateDesc}
                                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateTemplate} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Şablonu Oluştur
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Liste (Görsel 2) */}
            <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Şablon ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[80px] font-bold text-slate-500">ID</TableHead>
                                <TableHead className="font-bold text-slate-500">Şablon Adı</TableHead>
                                <TableHead className="font-bold text-slate-500">Açıklama</TableHead>
                                <TableHead className="text-right font-bold text-slate-500">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTemplates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        {loading ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                        ) : (
                                            <div className="text-slate-400 italic">Henüz bir şablon oluşturulmamış.</div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTemplates.map((t) => (
                                    <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="font-mono text-xs text-slate-500">{t.id}</TableCell>
                                        <TableCell className="font-bold text-slate-800">{t.name}</TableCell>
                                        <TableCell className="text-slate-500 text-sm">{t.description || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedTemplate(t);
                                                        setIsEditorOpen(true);
                                                    }}
                                                    className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Şablonu Takvime Uygula (Generate)"
                                                    onClick={() => {
                                                        setSelectedTemplate(t);
                                                        setIsPreviewOpen(true);
                                                    }}
                                                    className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-lg"
                                                >
                                                    <Play className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Şablonu Sil"
                                                    onClick={() => setDeleteConfirmId(t.id)}
                                                    className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Gruplandırılmış Sefer Düzenleyici (Görsel 1 Modalı) */}
            {selectedTemplate && (
                <TemplateSeferEditor
                    open={isEditorOpen}
                    onOpenChange={setIsEditorOpen}
                    template={selectedTemplate}
                    onUpdate={fetchTemplates}
                />
            )}

            {/* Şablon Uygulama / Check-Conflict Dialogu */}
            <PreviewTemplateDialog
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                template={selectedTemplate}
                onSuccess={() => {
                    // Kullanıcı işlem sonucunu Schedules ekranında görsün vs.
                    setIsPreviewOpen(false);
                }}
            />

            {/* Template Delete Confirm */}
            <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Şablonu Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu şablonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => {
                                if (deleteConfirmId !== null) handleDeleteTemplate(deleteConfirmId);
                                setDeleteConfirmId(null);
                            }}
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
