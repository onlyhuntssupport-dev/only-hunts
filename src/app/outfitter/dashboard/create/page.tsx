
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';
import HuntCreator from '@/components/dashboard/HuntCreator';

export default async function CreateHuntPage() {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) redirect('/login?redirect=/outfitter/dashboard/create');

    let uid: string;
    let outfitterName: string;
    try {
        const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
        if (decodedToken.role !== 'OUTFITTER') {
            redirect('/unauthorized');
        }
        uid = decodedToken.uid;
        outfitterName = decodedToken.name || 'Unnamed Outfitter';
    } catch (error) {
        redirect('/login?redirect=/outfitter/dashboard/create');
    }

    return (
        <div className="container mx-auto max-w-4xl py-8">
             <div className="mb-8">
                <h1 className="text-3xl font-bold font-headline">Create a New Hunt</h1>
                <p className="text-muted-foreground mt-2">
                    Fill out the form below to add a new package to your outfitter profile.
                </p>
            </div>
            <HuntCreator outfitterId={uid} outfitterName={outfitterName} />
        </div>
    );
}
