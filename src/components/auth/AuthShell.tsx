import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import Header from "../Header";
import { useAuth } from "./AuthProvider";

const publicRoutes = new Set(["/login"]);

export default function AuthShell({ children }: { children: React.ReactNode }) {
	const { session, isLoading } = useAuth();
	const router = useRouter();
	const pathname = router.state.location.pathname;

	useEffect(() => {
		if (isLoading) return;
		if (!session && !publicRoutes.has(pathname)) {
			void router.navigate({ to: "/login", replace: true });
			return;
		}
		if (session && pathname === "/login") {
			void router.navigate({ to: "/", replace: true });
		}
	}, [isLoading, pathname, router, session]);

	if (isLoading) {
		return (
			<div className="min-h-screen grid place-items-center bg-background text-sm text-muted-foreground">
				Checking session...
			</div>
		);
	}

	if (!session && !publicRoutes.has(pathname)) {
		return null;
	}

	return (
		<>
			{session ? <Header /> : null}
			{children}
		</>
	);
}
