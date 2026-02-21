import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase";

export const Route = createFileRoute("/login")({
	component: Login,
});

type AuthMessage = { type: "error" | "success"; text: string } | null;

function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState<AuthMessage>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const canSubmit = email.trim().length > 0 && password.length > 0;

	const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSubmit) return;
		setIsSubmitting(true);
		setMessage(null);

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			setMessage({ type: "error", text: error.message });
			setIsSubmitting(false);
			return;
		}

		setMessage({ type: "success", text: "Signed in successfully." });
		setIsSubmitting(false);
	};

	const handleSignUp = async () => {
		if (!canSubmit) return;
		setIsSubmitting(true);
		setMessage(null);

		const { error } = await supabase.auth.signUp({
			email,
			password,
		});

		if (error) {
			setMessage({ type: "error", text: error.message });
			setIsSubmitting(false);
			return;
		}

		setMessage({
			type: "success",
			text: "Account created. Check your email if confirmation is required.",
		});
		setIsSubmitting(false);
	};

	return (
		<div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-200">
			<div className="pointer-events-none absolute -top-24 right-10 h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
			<div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
				<Card className="w-full max-w-md border-white/40 bg-white/80 shadow-xl backdrop-blur">
					<CardHeader className="space-y-2">
						<CardTitle>Welcome back</CardTitle>
						<CardDescription>
							Sign in with your email to access retrospectives.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="space-y-5" onSubmit={handleSignIn}>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="you@company.com"
									autoComplete="email"
									required
									value={email}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
										setEmail(event.target.value)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									placeholder="Enter your password"
									autoComplete="current-password"
									required
									value={password}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
										setPassword(event.target.value)
									}
								/>
							</div>
							{message ? (
								<div
									className={`rounded-md border px-3 py-2 text-sm ${
										message.type === "error"
											? "border-red-200 bg-red-50 text-red-700"
											: "border-emerald-200 bg-emerald-50 text-emerald-700"
									}`}
								>
									{message.text}
								</div>
							) : null}
							<Button
								type="submit"
								className="w-full"
								disabled={!canSubmit || isSubmitting}
							>
								{isSubmitting ? "Signing in..." : "Sign in"}
							</Button>
						</form>
					</CardContent>
					<CardFooter className="flex flex-col gap-3">
						<Button
							type="button"
							variant="secondary"
							className="w-full"
							onClick={handleSignUp}
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? "Working..." : "Create account"}
						</Button>
						<p className="text-center text-xs text-muted-foreground">
							By continuing you agree to the team retro guidelines.
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
