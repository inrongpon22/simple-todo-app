import React from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { EXERCISES } from '../data/exercises';

const STORAGE_KEY = 'workout-tracker-data';
const MAX_SUGGESTIONS = 8;
const OLD_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_NAMES = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
];
const CAL_HEADER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const WEEK_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

class WorkoutSet {
	id: string = '';
	weight: number = 0;
	reps: number = 0;
}

class Exercise {
	id: string = '';
	name: string = '';
	sets: WorkoutSet[] = [];
}

class DayWorkout {
	day: string = ''; // ISO date "YYYY-MM-DD"
	exercises: Exercise[] = [];
}

interface SetDraft {
	weight: string;
	reps: string;
}

interface EditingSet {
	exerciseId: string;
	setId: string;
	weight: string;
	reps: string;
}

interface WorkoutPageState {
	days: DayWorkout[];
	selectedDay: string;
	newExerciseName: string;
	showSuggestions: boolean;
	setDrafts: Record<string, SetDraft>;
	editingSet: EditingSet | null;
	calendarOpen: boolean;
	calendarYear: number;
	calendarMonth: number;
}

function toISODate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function getWeekDates(base: Date): string[] {
	const dow = base.getDay();
	const monday = new Date(base);
	monday.setHours(0, 0, 0, 0);
	monday.setDate(base.getDate() - (dow === 0 ? 6 : dow - 1));
	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		return toISODate(d);
	});
}

function dateNum(iso: string): number {
	return parseInt(iso.slice(8), 10);
}

// Migrate old day-name format to ISO dates for current week
function migrateData(data: DayWorkout[]): DayWorkout[] {
	if (!data.length || !OLD_DAY_NAMES.includes(data[0].day)) return data;
	const weekDates = getWeekDates(new Date());
	return data.map((d, i) => {
		const migrated = new DayWorkout();
		migrated.day = weekDates[i] ?? toISODate(new Date());
		migrated.exercises = d.exercises;
		return migrated;
	});
}

function loadFromStorage(): DayWorkout[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return migrateData(JSON.parse(raw) as DayWorkout[]);
	} catch (error) {
		console.log(error);
	}
	return [];
}

export class WorkoutPage extends React.Component<Record<string, never>, WorkoutPageState> {
	private _today = new Date();
	private _todayISO = toISODate(this._today);

	state: WorkoutPageState = {
		days: loadFromStorage(),
		selectedDay: this._todayISO,
		newExerciseName: '',
		showSuggestions: false,
		setDrafts: {},
		editingSet: null,
		calendarOpen: false,
		calendarYear: this._today.getFullYear(),
		calendarMonth: this._today.getMonth(),
	};

	private _saveToStorage(days: DayWorkout[]): void {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
	}

	private _getSelectedDay(): DayWorkout {
		return this.state.days.find((d) => d.day === this.state.selectedDay) ?? new DayWorkout();
	}

	private _hasWorkout(iso: string): boolean {
		return this.state.days.some((d) => d.day === iso && d.exercises.length > 0);
	}

	private _getSuggestions(): string[] {
		const query = this.state.newExerciseName.trim().toLowerCase();
		if (!query) return [];
		const used = new Set(this.state.days.flatMap((d) => d.exercises.map((ex) => ex.name)));
		const merged = [...new Set([...EXERCISES, ...used])].sort();
		return merged.filter((n) => n.toLowerCase().includes(query)).slice(0, MAX_SUGGESTIONS);
	}

	private _getCalendarCells(year: number, month: number): (string | null)[] {
		const firstDow = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const offset = firstDow === 0 ? 6 : firstDow - 1; // Mon-first
		const cells: (string | null)[] = Array(offset).fill(null);
		for (let d = 1; d <= daysInMonth; d++) {
			cells.push(toISODate(new Date(year, month, d)));
		}
		while (cells.length % 7 !== 0) cells.push(null);
		return cells;
	}

	// Create or update the DayWorkout entry for `date`
	private _upsertDay(
		days: DayWorkout[],
		date: string,
		updater: (exercises: Exercise[]) => Exercise[],
	): DayWorkout[] {
		if (days.some((d) => d.day === date)) {
			return days.map((d) => {
				if (d.day !== date) return d;
				const updated = new DayWorkout();
				updated.day = d.day;
				updated.exercises = updater(d.exercises);
				return updated;
			});
		}
		const newDay = new DayWorkout();
		newDay.day = date;
		newDay.exercises = updater([]);
		return [...days, newDay];
	}

	private _handleSelectDay = (iso: string): void => {
		this.setState({ selectedDay: iso, calendarOpen: false });
	};

	private _handleToggleCalendar = (): void => {
		this.setState((prev) => ({ calendarOpen: !prev.calendarOpen }));
	};

	private _handleCloseCalendar = (): void => {
		this.setState({ calendarOpen: false });
	};

	private _handleCalendarPrev = (): void => {
		this.setState((prev) => ({
			calendarMonth: prev.calendarMonth === 0 ? 11 : prev.calendarMonth - 1,
			calendarYear: prev.calendarMonth === 0 ? prev.calendarYear - 1 : prev.calendarYear,
		}));
	};

	private _handleCalendarNext = (): void => {
		this.setState((prev) => ({
			calendarMonth: prev.calendarMonth === 11 ? 0 : prev.calendarMonth + 1,
			calendarYear: prev.calendarMonth === 11 ? prev.calendarYear + 1 : prev.calendarYear,
		}));
	};

	private _handleExerciseNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
		this.setState({ newExerciseName: e.target.value, showSuggestions: true });
	};

	private _handleExerciseInputFocus = (): void => {
		this.setState({ showSuggestions: true });
	};

	private _handleExerciseInputBlur = (): void => {
		setTimeout(() => this.setState({ showSuggestions: false }), 150);
	};

	private _handleSelectSuggestion = (name: string): void => {
		this.setState({ newExerciseName: name, showSuggestions: false });
	};

	private _handleAddExercise = (e: FormEvent<HTMLFormElement>): void => {
		e.preventDefault();
		const name = this.state.newExerciseName.trim();
		if (!name) return;
		const exercise = new Exercise();
		exercise.id = `ex-${Date.now()}`;
		exercise.name = name;
		const days = this._upsertDay(this.state.days, this.state.selectedDay, (exs) => [
			...exs,
			exercise,
		]);
		this.setState({ days, newExerciseName: '', showSuggestions: false }, () =>
			this._saveToStorage(this.state.days),
		);
	};

	private _handleDeleteExercise = (exerciseId: string): void => {
		const days = this.state.days.map((d) => {
			if (d.day !== this.state.selectedDay) return d;
			const updated = new DayWorkout();
			updated.day = d.day;
			updated.exercises = d.exercises.filter((ex) => ex.id !== exerciseId);
			return updated;
		});
		this.setState({ days }, () => this._saveToStorage(this.state.days));
	};

	private _handleSetDraftChange = (
		exerciseId: string,
		field: keyof SetDraft,
		value: string,
	): void => {
		this.setState((prev) => ({
			setDrafts: {
				...prev.setDrafts,
				[exerciseId]: { ...prev.setDrafts[exerciseId], [field]: value },
			},
		}));
	};

	private _handleAddSet = (e: FormEvent<HTMLFormElement>, exerciseId: string): void => {
		e.preventDefault();
		const draft = this.state.setDrafts[exerciseId];
		if (!draft) return;
		const weight = parseFloat(draft.weight);
		const reps = parseInt(draft.reps, 10);
		if (isNaN(weight) || weight < 0 || isNaN(reps) || reps <= 0) return;

		const set = new WorkoutSet();
		set.id = `set-${Date.now()}`;
		set.weight = weight;
		set.reps = reps;

		const days = this._upsertDay(this.state.days, this.state.selectedDay, (exs) =>
			exs.map((ex) => {
				if (ex.id !== exerciseId) return ex;
				const updated = new Exercise();
				updated.id = ex.id;
				updated.name = ex.name;
				updated.sets = [...ex.sets, set];
				return updated;
			}),
		);
		this.setState(
			(prev) => ({
				days,
				setDrafts: { ...prev.setDrafts, [exerciseId]: { weight: '', reps: '' } },
			}),
			() => this._saveToStorage(this.state.days),
		);
	};

	private _handleStartEditSet = (exerciseId: string, set: WorkoutSet): void => {
		this.setState({
			editingSet: {
				exerciseId,
				setId: set.id,
				weight: String(set.weight),
				reps: String(set.reps),
			},
		});
	};

	private _handleEditSetFieldChange = (field: keyof SetDraft, value: string): void => {
		this.setState((prev) => {
			if (!prev.editingSet) return null;
			return { editingSet: { ...prev.editingSet, [field]: value } };
		});
	};

	private _handleSaveSet = (): void => {
		const { editingSet } = this.state;
		if (!editingSet) return;
		const weight = parseFloat(editingSet.weight);
		const reps = parseInt(editingSet.reps, 10);
		if (isNaN(weight) || weight < 0 || isNaN(reps) || reps <= 0) return;

		const days = this.state.days.map((d) => {
			if (d.day !== this.state.selectedDay) return d;
			const updatedDay = new DayWorkout();
			updatedDay.day = d.day;
			updatedDay.exercises = d.exercises.map((ex) => {
				if (ex.id !== editingSet.exerciseId) return ex;
				const updatedEx = new Exercise();
				updatedEx.id = ex.id;
				updatedEx.name = ex.name;
				updatedEx.sets = ex.sets.map((s) => {
					if (s.id !== editingSet.setId) return s;
					const updatedSet = new WorkoutSet();
					updatedSet.id = s.id;
					updatedSet.weight = weight;
					updatedSet.reps = reps;
					return updatedSet;
				});
				return updatedEx;
			});
			return updatedDay;
		});
		this.setState({ days, editingSet: null }, () => this._saveToStorage(this.state.days));
	};

	private _handleCancelEdit = (): void => {
		this.setState({ editingSet: null });
	};

	private _handleDeleteSet = (exerciseId: string, setId: string): void => {
		const days = this.state.days.map((d) => {
			if (d.day !== this.state.selectedDay) return d;
			const updatedDay = new DayWorkout();
			updatedDay.day = d.day;
			updatedDay.exercises = d.exercises.map((ex) => {
				if (ex.id !== exerciseId) return ex;
				const updatedEx = new Exercise();
				updatedEx.id = ex.id;
				updatedEx.name = ex.name;
				updatedEx.sets = ex.sets.filter((s) => s.id !== setId);
				return updatedEx;
			});
			return updatedDay;
		});
		this.setState({ days }, () => this._saveToStorage(this.state.days));
	};

	render(): React.ReactNode {
		const {
			selectedDay,
			newExerciseName,
			showSuggestions,
			setDrafts,
			editingSet,
			calendarOpen,
			calendarYear,
			calendarMonth,
		} = this.state;
		const todayISO = this._todayISO;
		const weekDates = getWeekDates(this._today);
		const dayWorkout = this._getSelectedDay();
		const suggestions = this._getSuggestions();
		const calendarCells = this._getCalendarCells(calendarYear, calendarMonth);
		const selectedDateLabel = new Date(`${selectedDay}T00:00:00`).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
		});

		return (
			<div className="relative">
				{/* Backdrop */}
				{calendarOpen && (
					<div
						className="fixed inset-0 z-20 bg-black/20"
						onClick={this._handleCloseCalendar}
					/>
				)}

				{/* Calendar aside */}
				<aside
					className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ${calendarOpen ? 'translate-x-0' : '-translate-x-full'
						}`}
				>
					<div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
						<span className="font-semibold text-slate-800">
							{MONTH_NAMES[calendarMonth]} {calendarYear}
						</span>
						<div className="flex gap-1">
							<button
								type="button"
								onClick={this._handleCalendarPrev}
								className="rounded px-2 py-1 text-lg leading-none text-slate-500 hover:bg-slate-100"
							>
								‹
							</button>
							<button
								type="button"
								onClick={this._handleCalendarNext}
								className="rounded px-2 py-1 text-lg leading-none text-slate-500 hover:bg-slate-100"
							>
								›
							</button>
						</div>
					</div>

					<div className="p-5">
						<div className="mb-2 grid grid-cols-7 text-center">
							{CAL_HEADER.map((h) => (
								<span key={h} className="text-xs font-medium text-slate-400">
									{h}
								</span>
							))}
						</div>

						<div className="grid grid-cols-7 gap-y-1">
							{calendarCells.map((iso, i) => {
								if (!iso) return <div key={`e-${i}`} />;
								const isToday = iso === todayISO;
								const isSelected = iso === selectedDay;
								const hasWorkout = this._hasWorkout(iso);
								return (
									<button
										key={iso}
										type="button"
										onClick={() => this._handleSelectDay(iso)}
										className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${isSelected
											? 'bg-slate-900 text-white'
											: isToday
												? 'font-semibold text-slate-900 ring-2 ring-slate-900 ring-offset-1 hover:bg-slate-100'
												: 'text-slate-600 hover:bg-slate-100'
											}`}
									>
										{dateNum(iso)}
										{hasWorkout && !isSelected && (
											<span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-slate-400" />
										)}
									</button>
								);
							})}
						</div>
					</div>
				</aside>

				<main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
					{/* Week row */}
					<div className="mb-6 flex flex-wrap items-stretch gap-2">
						<button
							type="button"
							onClick={this._handleToggleCalendar}
							title="Open calendar"
							className={`flex items-center justify-center rounded-lg border px-3 transition-colors ${calendarOpen
								? 'border-slate-900 bg-slate-900 text-white'
								: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
								}`}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
								<line x1="16" y1="2" x2="16" y2="6" />
								<line x1="8" y1="2" x2="8" y2="6" />
								<line x1="3" y1="10" x2="21" y2="10" />
							</svg>
						</button>

						{weekDates.map((iso, i) => {
							const isToday = iso === todayISO;
							const isSelected = iso === selectedDay;
							return (
								<button
									key={iso}
									type="button"
									onClick={() => this._handleSelectDay(iso)}
									className={`flex flex-col items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isSelected
										? 'bg-slate-900 text-white'
										: isToday
											? 'border-2 border-slate-900 bg-white text-slate-900'
											: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
										}`}
								>
									<span className="text-xs leading-tight opacity-70">{WEEK_ABBR[i]}</span>
									<span className="leading-tight">{dateNum(iso)}</span>
								</button>
							);
						})}
					</div>

					<div className="rounded-xl bg-white p-6 shadow-sm">
						<h1 className="text-2xl font-semibold">{selectedDateLabel}</h1>
						<p className="mt-1 text-sm text-slate-500">Track your exercises and sets</p>

						<form className="mt-6 flex gap-2" onSubmit={this._handleAddExercise}>
							<div className="relative flex-1">
								<input
									className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
									placeholder="Exercise name (e.g. Bench Press)"
									value={newExerciseName}
									onChange={this._handleExerciseNameChange}
									onFocus={this._handleExerciseInputFocus}
									onBlur={this._handleExerciseInputBlur}
									autoComplete="off"
								/>
								{showSuggestions && suggestions.length > 0 && (
									<ul className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
										{suggestions.map((name) => (
											<li
												key={name}
												onMouseDown={() => this._handleSelectSuggestion(name)}
												className="cursor-pointer px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
											>
												{name}
											</li>
										))}
									</ul>
								)}
							</div>
							<button
								type="submit"
								className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
							>
								Add Exercise
							</button>
						</form>

						<div className="mt-6 space-y-4">
							{dayWorkout.exercises.length === 0 && (
								<div className="rounded-md border border-dashed border-slate-300 px-3 py-8 text-center text-sm text-slate-500">
									No exercises logged for this day yet
								</div>
							)}

							{dayWorkout.exercises.map((exercise) => {
								const draft = setDrafts[exercise.id] ?? { weight: '', reps: '' };
								return (
									<div key={exercise.id} className="rounded-lg border border-slate-200 p-4">
										<div className="flex items-center justify-between">
											<h3 className="font-semibold text-slate-800">{exercise.name}</h3>
											<button
												type="button"
												onClick={() => this._handleDeleteExercise(exercise.id)}
												className="text-xs text-red-400 hover:text-red-600"
											>
												Remove
											</button>
										</div>

										{exercise.sets.length > 0 && (
											<table className="mt-3 w-full text-sm">
												<thead>
													<tr className="text-left text-xs text-slate-400">
														<th className="pb-1 font-medium w-14">Set</th>
														<th className="pb-1 font-medium w-28">Weight</th>
														<th className="pb-1 font-medium">Reps</th>
														<th className="pb-1 w-24" />
													</tr>
												</thead>
												<tbody>
													{exercise.sets.map((set, idx) => {
														const isEditing =
															editingSet?.setId === set.id &&
															editingSet?.exerciseId === exercise.id;

														if (isEditing && editingSet) {
															return (
																<tr key={set.id} className="border-t border-slate-100">
																	<td className="py-1.5 text-slate-500">Set {idx + 1}</td>
																	<td className="py-1.5">
																		<input
																			type="number"
																			min="0"
																			step="0.5"
																			value={editingSet.weight}
																			onChange={(e) =>
																				this._handleEditSetFieldChange('weight', e.target.value)
																			}
																			className="w-16 rounded border border-slate-300 px-2 py-0.5 text-sm outline-none focus:border-slate-500"
																		/>
																		<span className="ml-1 text-slate-500">kg</span>
																	</td>
																	<td className="py-1.5">
																		<input
																			type="number"
																			min="1"
																			value={editingSet.reps}
																			onChange={(e) =>
																				this._handleEditSetFieldChange('reps', e.target.value)
																			}
																			className="w-14 rounded border border-slate-300 px-2 py-0.5 text-sm outline-none focus:border-slate-500"
																		/>
																		<span className="ml-1 text-slate-500">reps</span>
																	</td>
																	<td className="py-1.5 text-right">
																		<button
																			type="button"
																			onClick={this._handleSaveSet}
																			className="mr-2 text-xs font-medium text-slate-900 hover:underline"
																		>
																			Save
																		</button>
																		<button
																			type="button"
																			onClick={this._handleCancelEdit}
																			className="text-xs text-slate-400 hover:text-slate-600"
																		>
																			Cancel
																		</button>
																	</td>
																</tr>
															);
														}

														return (
															<tr key={set.id} className="border-t border-slate-100">
																<td className="py-1.5 text-slate-500">Set {idx + 1}</td>
																<td className="py-1.5 font-medium">{set.weight} kg</td>
																<td className="py-1.5">{set.reps} reps</td>
																<td className="py-1.5 text-right">
																	<button
																		type="button"
																		onClick={() => this._handleStartEditSet(exercise.id, set)}
																		className="mr-2 text-xs text-slate-400 hover:text-slate-700"
																	>
																		Edit
																	</button>
																	<button
																		type="button"
																		onClick={() => this._handleDeleteSet(exercise.id, set.id)}
																		className="text-slate-300 hover:text-red-500 leading-none"
																	>
																		×
																	</button>
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										)}

										<form
											className="mt-3 flex items-center gap-2"
											onSubmit={(e) => this._handleAddSet(e, exercise.id)}
										>
											<input
												type="number"
												min="0"
												step="0.5"
												placeholder="kg"
												value={draft.weight}
												onChange={(e) =>
													this._handleSetDraftChange(exercise.id, 'weight', e.target.value)
												}
												className="w-20 rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-500"
											/>
											<input
												type="number"
												min="1"
												placeholder="reps"
												value={draft.reps}
												onChange={(e) =>
													this._handleSetDraftChange(exercise.id, 'reps', e.target.value)
												}
												className="w-20 rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-500"
											/>
											<button
												type="submit"
												className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
											>
												+ Set
											</button>
										</form>
									</div>
								);
							})}
						</div>
					</div>
				</main>
			</div>
		);
	}
}
