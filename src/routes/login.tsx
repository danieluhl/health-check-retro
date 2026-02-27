import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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
	const [newPassword, setNewPassword] = useState("");
	const [message, setMessage] = useState<AuthMessage>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isRecoveryMode, setIsRecoveryMode] = useState(false);

	useEffect(() => {
		if (window.location.hash.includes("type=recovery")) {
			setIsRecoveryMode(true);
			setMessage({
				type: "success",
				text: "Set a new password to finish resetting your account.",
			});
		}
	}, []);

	const canSubmit = email.trim().length > 0 && password.length > 0;
	const canReset = email.trim().length > 0;
	const canUpdatePassword = newPassword.trim().length > 0;

	const handleSignIn = async (event: React.SubmitEvent<HTMLFormElement>) => {
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

	const handleResetPassword = async () => {
		if (!canReset) {
			setMessage({ type: "error", text: "Enter your email to reset." });
			return;
		}
		setIsSubmitting(true);
		setMessage(null);

		const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
			redirectTo: `${window.location.origin}/login`,
		});

		if (error) {
			setMessage({ type: "error", text: error.message });
			setIsSubmitting(false);
			return;
		}

		setMessage({
			type: "success",
			text: "Check your email for a password reset link.",
		});
		setIsSubmitting(false);
	};

	const handleUpdatePassword = async (
		event: React.SubmitEvent<HTMLFormElement>,
	) => {
		event.preventDefault();
		if (!canUpdatePassword) return;
		setIsSubmitting(true);
		setMessage(null);

		const { error } = await supabase.auth.updateUser({
			password: newPassword,
		});

		if (error) {
			setMessage({ type: "error", text: error.message });
			setIsSubmitting(false);
			return;
		}

		setMessage({
			type: "success",
			text: "Password updated. You can sign in now.",
		});
		setNewPassword("");
		setIsRecoveryMode(false);
		setIsSubmitting(false);
		window.history.replaceState({}, document.title, window.location.pathname);
	};

	return (
		<div className="relative min-h-screen overflow-hidden bg-background">
			<div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
				<Card className="w-full max-w-md border-white/40 bg-card shadow-xl backdrop-blur">
					<CardHeader className="space-y-2">
						<CardTitle>
							{isRecoveryMode ? "Reset your password" : "Welcome back"}
						</CardTitle>
						<CardDescription>
							{isRecoveryMode
								? "Choose a new password to regain access."
								: "Sign in with your email to access retrospectives."}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isRecoveryMode ? (
							<form className="space-y-5" onSubmit={handleUpdatePassword}>
								<div className="space-y-2">
									<Label htmlFor="new-password">New password</Label>
									<Input
										id="new-password"
										type="password"
										placeholder="Choose a new password"
										autoComplete="new-password"
										required
										value={newPassword}
										onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
											setNewPassword(event.target.value)
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
									disabled={!canUpdatePassword || isSubmitting}
								>
									{isSubmitting ? "Updating..." : "Update password"}
								</Button>
								<Button
									type="button"
									variant="ghost"
									className="w-full"
									onClick={() => {
										setIsRecoveryMode(false);
										setMessage(null);
									}}
									disabled={isSubmitting}
								>
									Back to sign in
								</Button>
							</form>
						) : (
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
									<div className="flex justify-end">
										<Button
											type="button"
											variant="link"
											size="sm"
											className="px-0"
											onClick={handleResetPassword}
											disabled={!canReset || isSubmitting}
										>
											Forgot password?
										</Button>
									</div>
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
						)}
					</CardContent>
					<CardFooter className="flex flex-col gap-3">
						<Button
							type="button"
							variant="background"
							className="w-full"
							onClick={handleSignUp}
							disabled={!canSubmit || isSubmitting || isRecoveryMode}
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
