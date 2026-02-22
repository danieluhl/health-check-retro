import { useNavigate } from "@tanstack/react-router";
import { supabase } from "../utils/supabase";
import { Button } from "./ui/button";

export default function Header() {
	const navigate = useNavigate();
	return (
		<header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
			<Button
				className="text-xl"
				variant="ghost"
				onClick={() => navigate({ to: "/" })}
			>
				JamSauce
			</Button>
			<div className="ml-auto">
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={() => void supabase.auth.signOut()}
				>
					Sign out
				</Button>
			</div>
		</header>
	);
}
