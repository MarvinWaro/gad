import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    title = '',
    description = '',
    partners = false,
    children,
}: {
    title?: string;
    description?: string;
    partners?: boolean;
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutTemplate
            title={title}
            description={description}
            partners={partners}
        >
            {children}
        </AuthLayoutTemplate>
    );
}
