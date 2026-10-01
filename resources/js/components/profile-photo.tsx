import { ImageUp, UserRound } from 'lucide-react';
import { useRef, useState } from 'react';
import { PersonAvatar } from '@/components/person-avatar';
import { PhotoLightboxContent } from '@/components/photo-lightbox';
import { useProfilePhotoPicker } from '@/components/profile-photo-cropper';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const interactive =
    'block shrink-0 rounded-full outline-none hover:brightness-95 focus-visible:ring-[3px] focus-visible:ring-ring motion-safe:transition';

type ProfilePhotoProps = {
    name: string;
    src?: string | null;
    /** Size and placement. */
    className?: string;
    fallbackClassName?: string;
};

/**
 * The large photo on a profile. On your own profile (`editable`) it opens a
 * menu, as on Facebook: see the photo whole, or choose and crop a new one
 * right there. On anyone else's it opens the photo, and is plain without one.
 */
export function ProfilePhoto({
    editable = false,
    ...props
}: ProfilePhotoProps & { editable?: boolean }) {
    return editable ? (
        <OwnProfilePhoto {...props} />
    ) : (
        <ViewableProfilePhoto {...props} />
    );
}

function ViewableProfilePhoto({
    name,
    src,
    className,
    fallbackClassName,
}: ProfilePhotoProps) {
    const avatar = (
        <ProfileAvatar
            name={name}
            src={src}
            fallbackClassName={fallbackClassName}
        />
    );

    if (!src) {
        return <div className={cn('shrink-0', className)}>{avatar}</div>;
    }

    return (
        <Dialog>
            <DialogTrigger className={cn(interactive, className)}>
                {avatar}
                <span className="sr-only">View {name}’s profile photo</span>
            </DialogTrigger>
            <PhotoViewer name={name} src={src} />
        </Dialog>
    );
}

function OwnProfilePhoto({
    name,
    src,
    className,
    fallbackClassName,
}: ProfilePhotoProps) {
    const { pick, picker } = useProfilePhotoPicker();
    const [viewing, setViewing] = useState(false);
    // "See profile picture" opens the viewer once the menu has closed, so the
    // viewer takes focus instead of the photo button.
    const seeChosen = useRef(false);
    const trigger = useRef<HTMLButtonElement>(null);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    ref={trigger}
                    className={cn(interactive, className)}
                >
                    <ProfileAvatar
                        name={name}
                        src={src}
                        fallbackClassName={fallbackClassName}
                    />
                    <span className="sr-only">Profile picture options</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    className="w-56"
                    onCloseAutoFocus={(event) => {
                        if (seeChosen.current) {
                            event.preventDefault();
                            seeChosen.current = false;
                            setViewing(true);
                        }
                    }}
                >
                    {src && (
                        <DropdownMenuItem
                            onSelect={() => {
                                seeChosen.current = true;
                            }}
                        >
                            <UserRound />
                            See profile picture
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={pick}>
                        <ImageUp />
                        Choose profile picture
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            {src && (
                <Dialog open={viewing} onOpenChange={setViewing}>
                    <PhotoViewer
                        name={name}
                        src={src}
                        // Back to the photo button, as if it had opened it.
                        onCloseAutoFocus={(event) => {
                            event.preventDefault();
                            trigger.current?.focus();
                        }}
                    />
                </Dialog>
            )}
            {picker}
        </>
    );
}

function ProfileAvatar({
    name,
    src,
    fallbackClassName,
}: Omit<ProfilePhotoProps, 'className'>) {
    return (
        <PersonAvatar
            name={name}
            src={src}
            className="size-full border-4 border-card shadow-sm"
            fallbackClassName={fallbackClassName}
        />
    );
}

function PhotoViewer({
    name,
    src,
    onCloseAutoFocus,
}: {
    name: string;
    src: string;
    onCloseAutoFocus?: (event: Event) => void;
}) {
    const label = `${name}’s profile photo`;

    return (
        <PhotoLightboxContent
            title={label}
            description="Press Escape to close."
            onCloseAutoFocus={onCloseAutoFocus}
        >
            <img
                src={src}
                alt={label}
                className="mx-auto max-h-[82vh] w-auto rounded-[10px] object-contain"
            />
        </PhotoLightboxContent>
    );
}
