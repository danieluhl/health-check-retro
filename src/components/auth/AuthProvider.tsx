import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "../../utils/supabase";

type AuthContextValue = {
	session: Session | null;
	isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		void supabase.auth
			.getSession()
			.then((response: { data: { session: Session | null } }) => {
				const { data } = response;
				if (!isMounted) return;
				setSession(data.session ?? null);
				setIsLoading(false);
			});

		const { data: authListener } = supabase.auth.onAuthStateChange(
			(_event: AuthChangeEvent, nextSession: Session | null) => {
				if (!isMounted) return;
				setSession(nextSession);
				setIsLoading(false);
			},
		);

		return () => {
			isMounted = false;
			authListener.subscription.unsubscribe();
		};
	}, []);

	const value = useMemo(
		() => ({
			session,
			isLoading,
		}),
		[session, isLoading],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
