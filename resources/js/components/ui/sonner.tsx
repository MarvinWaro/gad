import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="bottom-right"
            richColors
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    // Only refusals and failures stand out, in the destructive red.
                    '--error-bg': 'var(--destructive)',
                    '--error-text': 'var(--on-signature)',
                    '--error-border': 'var(--destructive)',
                    '--success-bg': 'var(--popover)',
                    '--success-text': 'var(--popover-foreground)',
                    '--success-border': 'var(--border)',
                    '--info-bg': 'var(--popover)',
                    '--info-text': 'var(--popover-foreground)',
                    '--info-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
