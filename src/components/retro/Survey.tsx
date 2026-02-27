import { Frown, Meh, Smile } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const questions = [
	{
		id: "teamwork",
		label: "Teamwork",
		description: "We are jelled and have awesome collaboration",
	},
	{
		id: "mission",
		label: "Mission",
		description: "We know why we’re here and we’re excited about it",
	},
	{
		id: "process",
		label: "Process",
		description: "Our way of working suits us perfectly",
	},
	{
		id: "producing",
		label: "Producing",
		description: "We deliver great stuff quickly",
	},
	{
		id: "learning",
		label: "Learning",
		description: "We’re learning lots of interesting stuff",
	},
	{
		id: "fun",
		label: "Fun",
		description: "We have a great time together",
	},
];

const ratings = [
	{
		value: "sad",
		icon: Frown,
		color: "text-red-500",
		hoverColor: "hover:bg-red-50",
	},
	{
		value: "neutral",
		icon: Meh,
		color: "text-yellow-500",
		hoverColor: "hover:bg-yellow-50",
	},
	{
		value: "happy",
		icon: Smile,
		color: "text-green-500",
		hoverColor: "hover:bg-green-50",
	},
];

export function Survey() {
	const [answers, setAnswers] = useState<Record<string, string>>({});

	const handleRatingChange = (questionId: string, value: string) => {
		setAnswers((prev) => ({ ...prev, [questionId]: value }));
	};

	return (
		<div className="space-y-6 max-w-2xl mx-auto p-4">
			{questions.map((q) => (
				<Card key={q.id}>
					<CardHeader className="pb-2">
						<CardTitle className="text-lg font-bold">{q.label}</CardTitle>
						<p className="text-sm text-muted-foreground">{q.description}</p>
					</CardHeader>
					<CardContent>
						<div className="flex justify-around items-center pt-2">
							{ratings.map((r) => {
								const Icon = r.icon;
								const isSelected = answers[q.id] === r.value;
								return (
									<label
										key={r.value}
										className={cn(
											"flex flex-col items-center gap-2 cursor-pointer p-4 rounded-xl transition-all duration-200",
											r.hoverColor,
											isSelected
												? "bg-accent scale-110"
												: "opacity-60 grayscale hover:grayscale-0 hover:opacity-100",
										)}
									>
										<input
											type="radio"
											name={q.id}
											value={r.value}
											checked={isSelected}
											onChange={() => handleRatingChange(q.id, r.value)}
											className="sr-only"
										/>
										<Icon
											className={cn(
												"w-10 h-10",
												isSelected ? r.color : "text-muted-foreground",
											)}
										/>
									</label>
								);
							})}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
