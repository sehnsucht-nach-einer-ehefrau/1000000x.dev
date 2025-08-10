"use client";

import LandingPage from "@/components/landing-page";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function HomePage() {
	const router = useRouter();
	const { status } = useSession();

	// Redirect authenticated users from the client-side
	useEffect(() => {
		if (status === "authenticated") {
			router.replace("/dashboard");
		}
	}, [status, router]);

	const handleQuerySubmit = useCallback(
		(query: string) => {
			const encodedQuery = encodeURIComponent(query);
			if (status === "authenticated") {
				router.push(`/dashboard?query=${encodedQuery}`);
			} else {
				// This is the crucial part: encode the callbackUrl's query parameter
				const callbackUrl = `/dashboard?query=${encodedQuery}`;
				const encodedCallbackUrl = encodeURIComponent(callbackUrl);
				router.push(`/auth/signin?callbackUrl=${encodedCallbackUrl}`);
			}
		},
		[router, status]
	);

	// Don't render the landing page if we know the user is logged in and about to be redirected.
	if (status === 'authenticated') {
		return <div className="min-h-screen bg-black" />; // Or a loading spinner
	}

	return <LandingPage onSubmit={handleQuerySubmit} />;
}
