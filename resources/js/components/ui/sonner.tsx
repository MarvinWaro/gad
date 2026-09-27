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
                    // Sonner sets its own system font stack; use the app's.
                    fontFamily: 'inherit',
                    '--border-radius': '10px',
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    // Green when something went through; red when it failed
                    // or something was deleted (see lib/toast).
                    '--success-bg': 'var(--toast-success-bg)',
                    '--success-text': 'var(--toast-success-text)',
                    '--success-border': 'var(--toast-success-border)',
                    '--error-bg': 'var(--toast-error-bg)',
                    '--error-text': 'var(--toast-error-text)',
                    '--error-border': 'var(--toast-error-border)',
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
