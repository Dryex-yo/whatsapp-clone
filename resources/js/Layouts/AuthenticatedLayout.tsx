import { PropsWithChildren, ReactNode } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    return (
        <div className="fixed inset-0 w-screen h-screen bg-[#0b141a] overflow-hidden">
            <main className="w-full h-full">
                {children}
            </main>
        </div>
    );
}
