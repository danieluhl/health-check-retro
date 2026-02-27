import { CheckCircle2, Plus, RotateCcw, ThumbsUp, Trash2 } from "lucide-react";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DiscussionItem = {
	id: string;
	description: string;
	votes: number;
	status: "to-discuss" | "done";
};

export function Discussion() {
	const [items, setItems] = useState<DiscussionItem[]>([]);

	const handleAddCard = () => {
		const newItem: DiscussionItem = {
			id: crypto.randomUUID(),
			description: "New discussion topic...",
			votes: 0,
			status: "to-discuss",
		};
		setItems((prev) => [...prev, newItem]);
	};

	const updateItem = (id: string, updates: Partial<DiscussionItem>) => {
		setItems((prev) =>
			prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
		);
	};

	const deleteItem = (id: string) => {
		setItems((prev) => prev.filter((item) => item.id !== id));
	};

	const toDiscussItems = items
		.filter((item) => item.status === "to-discuss")
		.sort((a, b) => b.votes - a.votes);
	const doneItems = items
		.filter((item) => item.status === "done")
		.sort((a, b) => b.votes - a.votes);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-bold">To Discuss</h2>
					<Button variant="outline" size="icon" onClick={handleAddCard}>
						<Plus className="h-4 w-4" />
						<span className="sr-only">Add Card</span>
					</Button>
				</div>
				<div className="flex flex-col gap-3">
					{toDiscussItems.map((item) => (
						<DiscussionCardItem
							key={item.id}
							item={item}
							onUpdate={(updates) => updateItem(item.id, updates)}
							onDelete={() => deleteItem(item.id)}
						/>
					))}
					{toDiscussItems.length === 0 && (
						<div className="text-sm text-muted-foreground italic p-4 text-center border border-dashed rounded-lg">
							No items to discuss. Add one!
						</div>
					)}
				</div>
			</div>

			<div className="flex flex-col gap-4">
				<h2 className="text-xl font-bold">Done</h2>
				<div className="flex flex-col gap-3">
					{doneItems.map((item) => (
						<DiscussionCardItem
							key={item.id}
							item={item}
							onUpdate={(updates) => updateItem(item.id, updates)}
							onDelete={() => deleteItem(item.id)}
						/>
					))}
					{doneItems.length === 0 && (
						<div className="text-sm text-muted-foreground italic p-4 text-center border border-dashed rounded-lg">
							No items finished yet.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function DiscussionCardItem({
	item,
	onUpdate,
	onDelete,
}: {
	item: DiscussionItem;
	onUpdate: (updates: Partial<DiscussionItem>) => void;
	onDelete: () => void;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(item.description);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isEditing]);

	const handleSave = () => {
		setIsEditing(false);
		if (editValue.trim() !== "") {
			onUpdate({ description: editValue });
		} else {
			setEditValue(item.description); // revert if empty
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			setIsEditing(false);
			setEditValue(item.description);
		}
	};

	return (
		<Card
			className={cn("transition-all", item.status === "done" && "opacity-75")}
		>
			<div className="p-4 flex flex-col gap-3">
				{isEditing ? (
					<Input
						ref={inputRef}
						value={editValue}
						onChange={(e) => setEditValue(e.target.value)}
						onBlur={handleSave}
						onKeyDown={handleKeyDown}
						className="text-base"
					/>
				) : (
					<button
						type="button"
						className={cn(
							"text-base cursor-text min-h-[1.5rem] w-full text-left bg-transparent border-none p-0",
							item.status === "done" && "line-through text-muted-foreground",
						)}
						onClick={() => setIsEditing(true)}
					>
						{item.description}
					</button>
				)}

				<div className="flex items-center justify-between mt-2">
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							className="h-8 gap-1"
							onClick={() => onUpdate({ votes: item.votes + 1 })}
						>
							<ThumbsUp className="h-4 w-4" />
							<span>{item.votes}</span>
						</Button>
					</div>

					<div className="flex items-center gap-2">
						{item.status === "to-discuss" ? (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
								onClick={() => onUpdate({ status: "done" })}
								title="Mark as Done"
							>
								<CheckCircle2 className="h-4 w-4" />
								<span className="sr-only">Mark Done</span>
							</Button>
						) : (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
								onClick={() => onUpdate({ status: "to-discuss" })}
								title="Mark to Discuss"
							>
								<RotateCcw className="h-4 w-4" />
								<span className="sr-only">Mark To Discuss</span>
							</Button>
						)}

						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
							onClick={onDelete}
							title="Delete"
						>
							<Trash2 className="h-4 w-4" />
							<span className="sr-only">Delete</span>
						</Button>
					</div>
				</div>
			</div>
		</Card>
	);
}
