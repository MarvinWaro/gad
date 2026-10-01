import { router, usePage } from '@inertiajs/react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ProfileAvatarController from '@/actions/App/Http/Controllers/Settings/ProfileAvatarController';
import { ConfirmPopover } from '@/components/confirm-popover';
import type { ConfirmVisit } from '@/components/confirm-popover';
import InputError from '@/components/input-error';
import { PersonAvatar } from '@/components/person-avatar';
import { useProfilePhotoPicker } from '@/components/profile-photo-cropper';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

/**
 * Upload, crop, or remove the account's profile photo. It shows on the
 * person's posts and comments, always beside their school's name.
 */
export default function ProfilePhotoField() {
    const { auth } = usePage().props;
    const { pick, picker, error } = useProfilePhotoPicker();
    const [removing, setRemoving] = useState(false);

    function remove(visit: ConfirmVisit) {
        router.delete(ProfileAvatarController.destroy.url(), {
            preserveScroll: true,
            onStart: () => {
                setRemoving(true);
                visit.onStart();
            },
            onFinish: () => {
                setRemoving(false);
                visit.onFinish();
            },
        });
    }

    return (
        <div className="grid gap-2">
            <Label>Profile photo</Label>
            <div className="mt-1 flex items-center gap-4">
                <PersonAvatar
                    name={auth.user.name}
                    src={auth.user.avatar}
                    className="size-16"
                    fallbackClassName="text-lg"
                />
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={pick}
                        >
                            <ImagePlus />
                            {auth.user.avatar ? 'Change photo' : 'Upload photo'}
                        </Button>
                        {auth.user.avatar && (
                            <ConfirmPopover
                                title="Remove your profile photo?"
                                description="Your initials show in its place on your posts and comments until you upload another."
                                confirmLabel="Remove photo"
                                onConfirm={remove}
                            >
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={removing}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    {removing ? <Spinner /> : <Trash2 />}
                                    Remove
                                </Button>
                            </ConfirmPopover>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        JPG, PNG, or WebP. Shown on your posts and comments,
                        next to your school’s name.
                    </p>
                </div>
            </div>
            <InputError message={error} />
            {picker}
        </div>
    );
}
