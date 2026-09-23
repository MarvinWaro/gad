import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ExternalLink,
    ImageIcon,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CarouselSlide = {
    id: number;
    title: string;
    description: string | null;
    image_url: string;
    link: string | null;
    is_active: boolean;
    sort_order: number;
    created_by: string | null;
    updated_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedSlides = {
    data: CarouselSlide[];
    current_page: number;
    from: number | null;
    last_page: number;
    links: PaginationLink[];
    per_page: number;
    to: number | null;
    total: number;
};

type Permissions = {
    create: boolean;
    update: boolean;
    delete: boolean;
};

type SlideForm = {
    title: string;
    description: string;
    image: File | null;
    link: string;
    is_active: boolean;
    sort_order: number;
    _method?: 'put';
};

export default function CarouselIndex({
    slides,
    filters,
    permissions,
}: {
    slides: PaginatedSlides;
    filters: { search: string };
    permissions: Permissions;
}) {
    const [search, setSearch] = useState(filters.search);

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get(
            '/admin/carousels',
            search.trim() ? { search: search.trim() } : {},
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Carousel management" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <p className="text-sm font-medium text-primary">
                            Page content
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                            Carousel
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Manage the ordered slides displayed in the public
                            homepage hero.
                        </p>
                    </div>
                    {permissions.create && <SlideDialog mode="create" />}
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="gap-4 border-b py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Homepage slides</CardTitle>
                            <CardDescription className="mt-1">
                                {slides.total}{' '}
                                {slides.total === 1 ? 'slide' : 'slides'} total
                            </CardDescription>
                        </div>
                        <form
                            className="flex w-full gap-2 sm:w-auto"
                            onSubmit={submitSearch}
                            role="search"
                        >
                            <Label
                                htmlFor="carousel-search"
                                className="sr-only"
                            >
                                Search slides
                            </Label>
                            <Input
                                id="carousel-search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search slides"
                                className="sm:w-64"
                            />
                            <Button type="submit" variant="outline" size="icon">
                                <Search />
                                <span className="sr-only">Search</span>
                            </Button>
                        </form>
                    </CardHeader>
                    <CardContent className="p-0">
                        {slides.data.length === 0 ? (
                            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                                <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                                    <ImageIcon className="size-5 text-muted-foreground" />
                                </span>
                                <h2 className="mt-4 font-medium">
                                    {filters.search
                                        ? 'No matching slides'
                                        : 'No carousel slides yet'}
                                </h2>
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    {filters.search
                                        ? 'Try a different search term.'
                                        : 'The public homepage will continue using its static fallback until an active slide is added.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] text-left text-sm">
                                    <caption className="sr-only">
                                        Carousel slides ordered for the public
                                        homepage
                                    </caption>
                                    <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">
                                                Slide
                                            </th>
                                            <th className="px-5 py-3 font-medium">
                                                Destination
                                            </th>
                                            <th className="px-5 py-3 font-medium">
                                                Order
                                            </th>
                                            <th className="px-5 py-3 font-medium">
                                                Status
                                            </th>
                                            <th className="px-5 py-3 font-medium">
                                                Updated
                                            </th>
                                            {(permissions.update ||
                                                permissions.delete) && (
                                                <th className="px-5 py-3 text-right font-medium">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {slides.data.map((slide) => (
                                            <tr key={slide.id}>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={
                                                                slide.image_url
                                                            }
                                                            alt=""
                                                            className="h-14 w-24 rounded-md border object-cover"
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="font-medium">
                                                                {slide.title}
                                                            </p>
                                                            <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                                                                {slide.description ??
                                                                    'No description'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="max-w-64 px-5 py-4">
                                                    {slide.link ? (
                                                        <a
                                                            href={slide.link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline"
                                                        >
                                                            <span className="truncate">
                                                                {slide.link}
                                                            </span>
                                                            <ExternalLink className="size-3 shrink-0" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            No link
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 tabular-nums">
                                                    {slide.sort_order}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge
                                                        variant={
                                                            slide.is_active
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                        className={
                                                            slide.is_active
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                                                : undefined
                                                        }
                                                    >
                                                        {slide.is_active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-muted-foreground">
                                                    {formatDate(
                                                        slide.updated_at,
                                                    )}
                                                </td>
                                                {(permissions.update ||
                                                    permissions.delete) && (
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-1">
                                                            {permissions.update && (
                                                                <SlideDialog
                                                                    mode="edit"
                                                                    slide={
                                                                        slide
                                                                    }
                                                                />
                                                            )}
                                                            {permissions.delete && (
                                                                <DeleteSlideDialog
                                                                    slide={
                                                                        slide
                                                                    }
                                                                />
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {slides.last_page > 1 && (
                            <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground">
                                    Showing {slides.from}–{slides.to} of{' '}
                                    {slides.total}
                                </p>
                                <nav
                                    className="flex flex-wrap gap-1"
                                    aria-label="Carousel pagination"
                                >
                                    {slides.links.map((link, index) => (
                                        <Button
                                            key={`${link.label}-${index}`}
                                            asChild
                                            size="sm"
                                            variant={
                                                link.active
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            disabled={!link.url}
                                        >
                                            <Link
                                                href={link.url ?? '#'}
                                                preserveScroll
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        </Button>
                                    ))}
                                </nav>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function SlideDialog({
    mode,
    slide,
}: {
    mode: 'create' | 'edit';
    slide?: CarouselSlide;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<SlideForm>({
        title: slide?.title ?? '',
        description: slide?.description ?? '',
        image: null,
        link: slide?.link ?? '',
        is_active: slide?.is_active ?? true,
        sort_order: slide?.sort_order ?? 0,
        ...(mode === 'edit' ? { _method: 'put' as const } : {}),
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post(
            mode === 'create'
                ? '/admin/carousels'
                : `/admin/carousels/${slide?.id}`,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    form.reset();
                },
            },
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (nextOpen) form.clearErrors();
            }}
        >
            <DialogTrigger asChild>
                {mode === 'create' ? (
                    <Button>
                        <Plus />
                        Add slide
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon">
                        <Pencil />
                        <span className="sr-only">Edit {slide?.title}</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create'
                            ? 'Add carousel slide'
                            : 'Edit slide'}
                    </DialogTitle>
                    <DialogDescription>
                        Active slides appear on the public homepage in ascending
                        order.
                    </DialogDescription>
                </DialogHeader>
                <form className="grid gap-5" onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor={`${mode}-${slide?.id ?? 'new'}-title`}>
                            Title
                        </Label>
                        <Input
                            id={`${mode}-${slide?.id ?? 'new'}-title`}
                            value={form.data.title}
                            onChange={(event) =>
                                form.setData('title', event.target.value)
                            }
                            maxLength={120}
                            required
                        />
                        <InputError message={form.errors.title} />
                    </div>
                    <div className="grid gap-2">
                        <Label
                            htmlFor={`${mode}-${slide?.id ?? 'new'}-description`}
                        >
                            Description (optional)
                        </Label>
                        <textarea
                            id={`${mode}-${slide?.id ?? 'new'}-description`}
                            value={form.data.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                            rows={3}
                            maxLength={240}
                            className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                        <p className="text-xs text-muted-foreground">
                            When provided, visitors can open it from the Read
                            more action on the homepage.
                        </p>
                        <InputError message={form.errors.description} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${mode}-${slide?.id ?? 'new'}-image`}>
                            Image{' '}
                            {mode === 'edit' && '(leave blank to keep current)'}
                        </Label>
                        <Input
                            id={`${mode}-${slide?.id ?? 'new'}-image`}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            required={mode === 'create'}
                            onChange={(event) =>
                                form.setData(
                                    'image',
                                    event.target.files?.[0] ?? null,
                                )
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            JPG, PNG, or WebP up to 5 MB. Minimum 1000 × 400 px.
                        </p>
                        <InputError message={form.errors.image} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${mode}-${slide?.id ?? 'new'}-link`}>
                            Destination link (optional)
                        </Label>
                        <Input
                            id={`${mode}-${slide?.id ?? 'new'}-link`}
                            type="url"
                            value={form.data.link}
                            onChange={(event) =>
                                form.setData('link', event.target.value)
                            }
                            placeholder="https://example.gov.ph"
                        />
                        <InputError message={form.errors.link} />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label
                                htmlFor={`${mode}-${slide?.id ?? 'new'}-order`}
                            >
                                Display order
                            </Label>
                            <Input
                                id={`${mode}-${slide?.id ?? 'new'}-order`}
                                type="number"
                                min={0}
                                max={9999}
                                value={form.data.sort_order}
                                onChange={(event) =>
                                    form.setData(
                                        'sort_order',
                                        Number(event.target.value),
                                    )
                                }
                                required
                            />
                            <InputError message={form.errors.sort_order} />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor={`${mode}-${slide?.id ?? 'new'}-status`}
                            >
                                Status
                            </Label>
                            <select
                                id={`${mode}-${slide?.id ?? 'new'}-status`}
                                value={form.data.is_active ? '1' : '0'}
                                onChange={(event) =>
                                    form.setData(
                                        'is_active',
                                        event.target.value === '1',
                                    )
                                }
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                            <InputError message={form.errors.is_active} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? 'Saving…'
                                : mode === 'create'
                                  ? 'Create slide'
                                  : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteSlideDialog({ slide }: { slide: CarouselSlide }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 />
                    <span className="sr-only">Delete {slide.title}</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete carousel slide?</DialogTitle>
                    <DialogDescription>
                        “{slide.title}” and its uploaded image will be
                        permanently removed.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() =>
                            router.delete(`/admin/carousels/${slide.id}`, {
                                preserveScroll: true,
                                onSuccess: () => setOpen(false),
                            })
                        }
                    >
                        Delete slide
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function formatDate(value: string | null): string {
    if (!value) return '—';

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

CarouselIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Carousel', href: '/admin/carousels' },
    ],
};
