import type { ReactNode } from 'react';
import {
    ArrowUpRight,
    CircleAlert,
    FileClock,
    Image,
    LoaderCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { MediaReference } from '@/data/phlgadis-demo';
import { cn } from '@/lib/utils';

export function SectionHeading({
    label,
    title,
    description,
    children,
}: {
    label: string;
    title: string;
    description?: string;
    children?: ReactNode;
}) {
    return (
        <div className="section-heading">
            <div>
                <p className="section-label">
                    <span />
                    {label}
                </p>
                <h2>{title}</h2>
                {description && (
                    <p className="section-description">{description}</p>
                )}
            </div>
            {children}
        </div>
    );
}
export function PreviewDialog({
    title,
    description,
    children,
    content,
}: {
    title: string;
    description: string;
    children: ReactNode;
    content?: ReactNode;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="public-theme preview-dialog">
                <DialogHeader>
                    <span className="preview-label">PHLGADIS preview</span>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {content ?? (
                    <div className="availability-note">
                        <FileClock aria-hidden="true" />
                        <p>
                            This feature is not connected yet. No information is
                            collected or submitted in this preview.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
export function AvailabilityButton({
    title,
    children,
    className,
}: {
    title: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <PreviewDialog
            title={title}
            description="This area will be available when verified content and services are connected."
        >
            <Button variant="ghost" className={className}>
                {children}
                <ArrowUpRight aria-hidden="true" />
            </Button>
        </PreviewDialog>
    );
}
export function DataState({
    state,
    onRetry,
}: {
    state: 'empty' | 'loading' | 'error';
    onRetry?: () => void;
}) {
    const Icon =
        state === 'error'
            ? CircleAlert
            : state === 'loading'
              ? LoaderCircle
              : FileClock;
    return (
        <div
            className="data-state"
            role={state === 'error' ? 'alert' : 'status'}
        >
            <Icon
                aria-hidden="true"
                className={
                    state === 'loading'
                        ? 'animate-spin motion-reduce:animate-none'
                        : ''
                }
            />
            <h3>
                {state === 'loading'
                    ? 'Loading statistics'
                    : state === 'error'
                      ? 'Statistics could not be loaded'
                      : 'No data available'}
            </h3>
            <p>
                {state === 'empty'
                    ? 'Choose another academic year or check back when data is available.'
                    : state === 'error'
                      ? 'Try loading this data again.'
                      : 'The selected dataset is being prepared.'}
            </p>
            {state === 'error' && onRetry && (
                <Button variant="outline" onClick={onRetry}>
                    Try again
                </Button>
            )}
        </div>
    );
}

// Code-native placeholder artwork. Supply src and alt to replace an illustration.
export function MediaPanel({
    media,
    className,
    label = 'Image placeholder',
}: {
    media: MediaReference;
    className?: string;
    label?: string;
}) {
    return (
        <div className={cn('media-panel', `media-${media.variant}`, className)}>
            {media.src ? (
                <img src={media.src} alt={media.alt} loading="lazy" />
            ) : (
                <>
                    <svg
                        viewBox="0 0 800 440"
                        preserveAspectRatio="xMidYMid slice"
                        role="img"
                        aria-label={media.alt}
                    >
                        {media.variant === 'campus' ? (
                            <>
                                <rect width="800" height="440" fill="#e5e8e1" />
                                <circle
                                    cx="670"
                                    cy="95"
                                    r="53"
                                    fill="#f8b382"
                                />
                                <path
                                    d="M0 330 800 266V440H0Z"
                                    fill="#c3cebf"
                                />
                                <path
                                    d="M110 177 424 95 703 153 399 247Z"
                                    fill="#faf9f3"
                                />
                                <path
                                    d="M110 177 399 247V356L110 282Z"
                                    fill="#bbb3a6"
                                />
                                <path
                                    d="M399 247 703 153V292L399 386Z"
                                    fill="#f4f1e9"
                                />
                                <path
                                    d="M143 208 365 262V304L143 250Z"
                                    fill="#535e54"
                                />
                                <path
                                    d="M433 252 666 180V254L433 326Z"
                                    fill="#818f7c"
                                />
                                <path
                                    d="M470 240V314M520 224V297M570 208V282M620 193V267"
                                    stroke="#f4f1e9"
                                    strokeWidth="9"
                                />
                                <path
                                    d="M90 313 394 388 740 284"
                                    fill="none"
                                    stroke="#f8f7f1"
                                    strokeWidth="13"
                                />
                                <path
                                    d="M0 409 346 326"
                                    stroke="#d9dece"
                                    strokeWidth="32"
                                />
                                <path
                                    d="M69 307V187M752 324V206"
                                    stroke="#777e66"
                                    strokeWidth="9"
                                />
                                <ellipse
                                    cx="69"
                                    cy="193"
                                    rx="49"
                                    ry="73"
                                    fill="#929f7e"
                                />
                                <ellipse
                                    cx="752"
                                    cy="205"
                                    rx="41"
                                    ry="66"
                                    fill="#9da986"
                                />
                            </>
                        ) : media.variant === 'community' ? (
                            <>
                                <rect width="800" height="440" fill="#e5dded" />
                                <circle
                                    cx="410"
                                    cy="210"
                                    r="160"
                                    fill="#d3c4df"
                                />
                                <path
                                    d="M130 440V300a105 105 0 0 1 210 0v140"
                                    fill="#83738e"
                                />
                                <circle
                                    cx="235"
                                    cy="188"
                                    r="65"
                                    fill="#b7a3c6"
                                />
                                <path
                                    d="M315 440V265a105 105 0 0 1 210 0v175"
                                    fill="#f4efe8"
                                />
                                <circle
                                    cx="420"
                                    cy="150"
                                    r="65"
                                    fill="#bf987e"
                                />
                                <path
                                    d="M510 440V308a95 95 0 0 1 190 0v132"
                                    fill="#a5ae97"
                                />
                                <circle
                                    cx="605"
                                    cy="210"
                                    r="60"
                                    fill="#e4c6ac"
                                />
                            </>
                        ) : (
                            <>
                                <rect width="800" height="440" fill="#eddfcb" />
                                <circle
                                    cx="615"
                                    cy="102"
                                    r="62"
                                    fill="#edc18e"
                                />
                                <path
                                    d="m110 173 286 56 290-78v192l-290 75-286-52Z"
                                    fill="#b49472"
                                />
                                <path
                                    d="m133 128 263 59 266-68v198l-266 71-263-57Z"
                                    fill="#fcf7e9"
                                />
                                <path
                                    d="M396 187v201"
                                    stroke="#c8b692"
                                    strokeWidth="5"
                                />
                                <path
                                    d="m166 187 190 43m-190 4 190 43m-190 4 150 34m-150 14 190 43m80-168 180-45m-180 89 180-45m-180 90 130-33"
                                    stroke="#d2c7ac"
                                    strokeWidth="10"
                                />
                            </>
                        )}
                    </svg>
                    <span className="media-placeholder-label">
                        <Image size={12} aria-hidden="true" />
                        {label}
                    </span>
                </>
            )}
        </div>
    );
}
