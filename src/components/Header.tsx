import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeftIcon } from "lucide-react";
import { supabase } from "../utils/supabase";
import { RetroTimer } from "./retro/RetroTimer";
import { Button } from "./ui/button";

export default function Header() {
	const location = useLocation();
	const isRoot = location.pathname === "/";
	const retroIdMatch = location.pathname.match(/^\/retro\/([^/]+)/);
	const retroId = retroIdMatch?.[1] ?? null;
	const navigate = useNavigate();
	const router = useRouter();
	return (
		<header className="p-4 flex items-center bg-accent text-white shadow-lg justify-between">
			<div>
				{!isRoot && (
					<Button
						className="text-xl"
						size="icon"
						variant="secondary"
						onClick={() => router.history.back()}
					>
						<ChevronLeftIcon />
					</Button>
				)}
				<Button
					className="text-xl"
					variant="ghost"
					onClick={() => navigate({ to: "/" })}
				>
					JamSauce
				</Button>
			</div>
			<div className="flex">
				{retroId ? <RetroTimer retroId={retroId} /> : null}
			</div>
			<Button
				type="button"
				variant="secondary"
				size="sm"
				onClick={() => void supabase.auth.signOut()}
			>
				Sign out
			</Button>
		</header>
	);
}
