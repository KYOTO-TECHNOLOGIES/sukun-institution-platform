import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { baseURL } from '../../helpers/baseURL';
import KyotoLogo from '../../assets/Abaci Logo SVG.svg';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TokenStatusToken {
	id: number;
	token_number: number;
	token_display: string;
	status: string;
	created_at: string;
	uuid?: string;
}

interface TokenStatusUser {
	name: string;
	email?: string;
	phone?: string;
	uuid: string;
}

interface TokenStatusQueue {
	id: number;
	name: string;
	description?: string;
	status: string;
}

interface TokenStatusCurrentServing {
	token_number: number;
	token_display: string;
	user_name?: string;
}

interface TokenStatusPosition {
	tokens_ahead: number;
	estimated_wait_minutes: number;
	average_service_time_seconds: number;
}

interface TokenStatusServingHistory {
	serving_point: string;
	entered_at: string;
	completed_at: string | null;
	duration: string | null;
}

interface TokenStatusResponse {
	token: TokenStatusToken;
	user: TokenStatusUser;
	queue: TokenStatusQueue;
	current_serving: TokenStatusCurrentServing | null;
	position: TokenStatusPosition;
	serving_history: TokenStatusServingHistory[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
	waiting:   { color: '#d97706', bg: '#fef3c7', dot: '#f59e0b', label: 'Waiting' },
	registred: { color: '#4f46e5', bg: '#eef2ff', dot: '#6366f1', label: 'Registered' },
	serving:   { color: '#059669', bg: '#d1fae5', dot: '#10b981', label: 'Serving' },
	completed: { color: '#2563eb', bg: '#dbeafe', dot: '#3b82f6', label: 'Completed' },
	cancelled: { color: '#dc2626', bg: '#fee2e2', dot: '#ef4444', label: 'Cancelled' },
	postponed: { color: '#7c3aed', bg: '#ede9fe', dot: '#8b5cf6', label: 'Postponed' },
	no_show:   { color: '#dc2626', bg: '#fee2e2', dot: '#ef4444', label: 'No Show' },
	running:   { color: '#059669', bg: '#d1fae5', dot: '#10b981', label: 'Running' },
};

const getStatusConfig = (s: string) =>
	STATUS_CONFIG[s?.toLowerCase()] ?? { color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af', label: s };

const formatTime = (iso: string) => {
	try {
		return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
	} catch {
		return iso;
	}
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string; large?: boolean }> = ({ status, large }) => {
	const cfg = getStatusConfig(status);
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: large ? 7 : 5,
				padding: large ? '6px 16px' : '4px 12px',
				borderRadius: 999,
				background: cfg.bg,
				color: cfg.color,
				fontWeight: 600,
				fontSize: large ? '0.88rem' : '0.75rem',
				letterSpacing: '0.01em',
			}}>
			<span
				style={{
					width: large ? 8 : 6,
					height: large ? 8 : 6,
					borderRadius: '50%',
					background: cfg.dot,
					display: 'inline-block',
					flexShrink: 0,
				}}
			/>
			{cfg.label}
		</span>
	);
};

// ─── StatCard ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
	label: string;
	children: React.ReactNode;
	accent?: string;
	icon?: string;
}> = ({ label, children, accent = '#6366f1', icon }) => (
	<div
		style={{
			background: '#fff',
			borderRadius: 16,
			padding: '20px 22px',
			boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
			border: '1px solid #f0f0f5',
			display: 'flex',
			flexDirection: 'column',
			gap: 8,
		}}>
		<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
			{icon && <span style={{ fontSize: '1rem' }}>{icon}</span>}
			<span
				style={{
					fontSize: '0.68rem',
					fontWeight: 700,
					textTransform: 'uppercase',
					letterSpacing: '0.1em',
					color: '#9ca3af',
				}}>
				{label}
			</span>
		</div>
		<div style={{ color: accent }}>{children}</div>
	</div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────

const TokenStatusPage: React.FC = () => {
	const [params] = useSearchParams();
	const tokenUuid = params.get('token') ?? '';
	const queueId = params.get('queue') ?? '';

	const [data, setData] = useState<TokenStatusResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

	const fetchStatus = useCallback(async () => {
		if (!tokenUuid || !queueId) {
			setError('Missing token or queue information. Please use a valid link.');
			setLoading(false);
			return;
		}
		try {
			const res = await axios.get(`${baseURL}/api/tokens/status/`, {
				params: { token: tokenUuid, queue: queueId },
				headers: { 'Content-Type': 'application/json' },
				withCredentials: false,
			});
			setData(res.data as TokenStatusResponse);
			setError(null);
			setLastRefreshed(new Date());
		} catch (err: any) {
			const msg =
				err?.response?.data?.detail ||
				err?.response?.data?.error ||
				err?.message ||
				'Failed to load token status.';
			setError(String(msg));
		} finally {
			setLoading(false);
		}
	}, [tokenUuid, queueId]);

	useEffect(() => {
		void fetchStatus();
		const interval = setInterval(() => void fetchStatus(), 30000);
		return () => clearInterval(interval);
	}, [fetchStatus]);

	return (
		<div
			style={{
				width: '100%',
				minHeight: '100vh',
				background: 'linear-gradient(160deg, #f5f3ff 0%, #f0f9ff 50%, #f0fdf4 100%)',
				fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
				display: 'flex',
				flexDirection: 'column',
			}}>

			<style>{`
				@keyframes spin { to { transform: rotate(360deg) } }
				@keyframes pulse-ring {
					0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.35); }
					70% { box-shadow: 0 0 0 14px rgba(99, 102, 241, 0); }
					100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
				}
				@keyframes fadeUp {
					from { opacity: 0; transform: translateY(12px); }
					to   { opacity: 1; transform: translateY(0); }
				}
				.token-page-fade { animation: fadeUp 0.4s ease both; }
			`}</style>

			{/* ── Top Nav ── */}
			<header
				style={{
					background: 'rgba(255,255,255,0.85)',
					backdropFilter: 'blur(12px)',
					borderBottom: '1px solid rgba(99,102,241,0.1)',
					padding: '0 24px',
					height: 60,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					position: 'sticky',
					top: 0,
					zIndex: 100,
					boxShadow: '0 1px 12px rgba(0,0,0,0.05)',
				}}>
				<img src={KyotoLogo} alt='Kyoto' style={{ height: 30 }} />
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						fontSize: '0.75rem',
						color: '#9ca3af',
					}}>
					<span
						style={{
							width: 7,
							height: 7,
							borderRadius: '50%',
							background: '#10b981',
							display: 'inline-block',
							animation: 'pulse-ring 2s ease-in-out infinite',
						}}
					/>
					Live tracking
				</div>
			</header>

			{/* ── Page Body ── */}
			<main style={{ flex: 1, padding: '32px 16px 48px', width: '100%', boxSizing: 'border-box' }}>
				<div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>

					{/* Loading */}
					{loading && (
						<div style={{ textAlign: 'center', padding: '80px 0', color: '#6b7280' }}>
							<div
								style={{
									width: 48,
									height: 48,
									border: '3px solid #e5e7eb',
									borderTopColor: '#6366f1',
									borderRadius: '50%',
									animation: 'spin 0.8s linear infinite',
									margin: '0 auto 20px',
								}}
							/>
							<p style={{ fontSize: '1rem', margin: 0 }}>Fetching your token status…</p>
						</div>
					)}

					{/* Error */}
					{!loading && error && (
						<div
							className='token-page-fade'
							style={{
								background: '#fff',
								borderRadius: 20,
								padding: '40px 32px',
								textAlign: 'center',
								boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
								borderTop: '4px solid #ef4444',
							}}>
							<div
								style={{
									width: 56,
									height: 56,
									borderRadius: '50%',
									background: '#fee2e2',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									margin: '0 auto 16px',
									fontSize: '1.5rem',
								}}>
								⚠️
							</div>
							<p style={{ color: '#dc2626', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>
								{error}
							</p>
							<p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
								Please make sure you are using a valid token link.
							</p>
						</div>
					)}

					{/* Data */}
					{!loading && data && (
						<div className='token-page-fade' style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

							{/* ── Hero: Token Number ── */}
							<div
								style={{
									background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #a78bfa 100%)',
									borderRadius: 24,
									padding: '40px 32px 36px',
									color: '#fff',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									textAlign: 'center',
									boxShadow: '0 8px 40px rgba(99,102,241,0.35)',
									position: 'relative',
									overflow: 'hidden',
								}}>
								{/* decorative blobs */}
								<div
									style={{
										position: 'absolute',
										width: 200,
										height: 200,
										borderRadius: '50%',
										background: 'rgba(255,255,255,0.07)',
										top: -60,
										right: -40,
										pointerEvents: 'none',
									}}
								/>
								<div
									style={{
										position: 'absolute',
										width: 140,
										height: 140,
										borderRadius: '50%',
										background: 'rgba(255,255,255,0.05)',
										bottom: -50,
										left: -30,
										pointerEvents: 'none',
									}}
								/>

								<div
									style={{
										fontSize: '0.72rem',
										fontWeight: 700,
										textTransform: 'uppercase',
										letterSpacing: '0.14em',
										opacity: 0.75,
										marginBottom: 10,
									}}>
									Your Token Number
								</div>

								<div
									style={{
										fontSize: 'clamp(3.5rem, 12vw, 5.5rem)',
										fontWeight: 900,
										lineHeight: 1,
										letterSpacing: '-0.03em',
										marginBottom: 16,
										textShadow: '0 2px 12px rgba(0,0,0,0.15)',
									}}>
									{data.token.token_display}
								</div>

								<StatusBadge status={data.token.status} large />

								{data.user.name?.trim() && (
									<div
										style={{
											marginTop: 14,
											fontSize: '0.95rem',
											opacity: 0.85,
											fontWeight: 500,
											display: 'flex',
											alignItems: 'center',
											gap: 6,
										}}>
										<span style={{ fontSize: '1rem' }}>👤</span>
										{data.user.name.trim()}
									</div>
								)}
							</div>

							{/* ── Stats Row ── */}
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
									gap: 12,
								}}>
								{/* Queue */}
								<StatCard label='Queue' icon='🗂️' accent='#374151'>
									<div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: 6 }}>
										{data.queue.name}
									</div>
									<StatusBadge status={data.queue.status} />
								</StatCard>

								{/* Tokens Ahead */}
								<StatCard label='Tokens Ahead' icon='👥' accent='#6366f1'>
									<div
										style={{
											fontSize: '2.75rem',
											fontWeight: 900,
											color: '#6366f1',
											lineHeight: 1,
											marginBottom: 4,
										}}>
										{data.position.tokens_ahead}
									</div>
									<div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
										{data.position.tokens_ahead === 0
											? 'You are next!'
											: `token${data.position.tokens_ahead !== 1 ? 's' : ''} before you`}
									</div>
								</StatCard>

								{/* Wait Time */}
								<StatCard label='Est. Wait' icon='⏱️' accent='#0ea5e9'>
									{data.position.estimated_wait_minutes > 0 ? (
										<>
											<div
												style={{
													fontSize: '2.75rem',
													fontWeight: 900,
													color: '#0ea5e9',
													lineHeight: 1,
													marginBottom: 4,
												}}>
												{data.position.estimated_wait_minutes}
											</div>
											<div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>minutes remaining</div>
										</>
									) : (
										<div
											style={{
												fontSize: '1rem',
												fontWeight: 700,
												color: '#10b981',
											}}>
											Almost your turn
										</div>
									)}
								</StatCard>
							</div>

							{/* ── Currently Serving ── */}
							{data.current_serving && (
								<div
									style={{
										background: '#fff',
										borderRadius: 16,
										padding: '20px 22px',
										boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
										border: '1px solid #f0f0f5',
										borderLeft: '4px solid #10b981',
										display: 'flex',
										alignItems: 'center',
										gap: 16,
									}}>
									<div
										style={{
											width: 48,
											height: 48,
											borderRadius: 12,
											background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontWeight: 800,
											color: '#059669',
											fontSize: '0.95rem',
											flexShrink: 0,
											letterSpacing: '-0.02em',
										}}>
										{data.current_serving.token_display}
									</div>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div
											style={{
												fontSize: '0.68rem',
												fontWeight: 700,
												textTransform: 'uppercase',
												letterSpacing: '0.1em',
												color: '#9ca3af',
												marginBottom: 4,
											}}>
											Currently Serving
										</div>
										<div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
											{data.current_serving.token_display}
										</div>
										{data.current_serving.user_name && (
											<div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>
												{data.current_serving.user_name}
											</div>
										)}
									</div>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 6,
											fontSize: '0.75rem',
											color: '#059669',
											fontWeight: 600,
											background: '#d1fae5',
											padding: '4px 12px',
											borderRadius: 999,
											whiteSpace: 'nowrap',
										}}>
										<span
											style={{
												width: 6,
												height: 6,
												borderRadius: '50%',
												background: '#10b981',
												display: 'inline-block',
												animation: 'pulse-ring 1.5s ease-in-out infinite',
											}}
										/>
										In service
									</div>
								</div>
							)}

							{/* ── User Details ── */}
							{(data.user.email?.trim() || data.user.phone?.trim()) && (
								<div
									style={{
										background: '#fff',
										borderRadius: 16,
										padding: '20px 22px',
										boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
										border: '1px solid #f0f0f5',
									}}>
									<div
										style={{
											fontSize: '0.68rem',
											fontWeight: 700,
											textTransform: 'uppercase',
											letterSpacing: '0.1em',
											color: '#9ca3af',
											marginBottom: 14,
										}}>
										Your Details
									</div>
									<div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
										{data.user.email?.trim() && (
											<div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
												<div
													style={{
														width: 36,
														height: 36,
														borderRadius: 10,
														background: '#eef2ff',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '1rem',
													}}>
													✉️
												</div>
												<div>
													<div
														style={{
															fontSize: '0.68rem',
															fontWeight: 700,
															textTransform: 'uppercase',
															letterSpacing: '0.08em',
															color: '#9ca3af',
														}}>
														Email
													</div>
													<div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#111827' }}>
														{data.user.email.trim()}
													</div>
												</div>
											</div>
										)}
										{data.user.phone?.trim() && (
											<div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
												<div
													style={{
														width: 36,
														height: 36,
														borderRadius: 10,
														background: '#f0fdf4',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '1rem',
													}}>
													📞
												</div>
												<div>
													<div
														style={{
															fontSize: '0.68rem',
															fontWeight: 700,
															textTransform: 'uppercase',
															letterSpacing: '0.08em',
															color: '#9ca3af',
														}}>
														Phone
													</div>
													<div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#111827' }}>
														{data.user.phone.trim()}
													</div>
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* ── Serving History ── */}
							{data.serving_history?.length > 0 && (
								<div
									style={{
										background: '#fff',
										borderRadius: 16,
										padding: '20px 22px',
										boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
										border: '1px solid #f0f0f5',
									}}>
									<div
										style={{
											fontSize: '0.68rem',
											fontWeight: 700,
											textTransform: 'uppercase',
											letterSpacing: '0.1em',
											color: '#9ca3af',
											marginBottom: 16,
										}}>
										Serving History
									</div>
									<div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
										{data.serving_history.map((h, i) => (
											<div
												key={i}
												style={{
													display: 'flex',
													gap: 16,
													paddingBottom: i < data.serving_history.length - 1 ? 18 : 0,
													position: 'relative',
												}}>
												{/* Timeline line */}
												{i < data.serving_history.length - 1 && (
													<div
														style={{
															position: 'absolute',
															left: 15,
															top: 30,
															width: 2,
															bottom: 0,
															background: '#e5e7eb',
														}}
													/>
												)}
												{/* Dot */}
												<div
													style={{
														width: 32,
														height: 32,
														borderRadius: '50%',
														background: '#eef2ff',
														border: '2px solid #c7d2fe',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '0.75rem',
														color: '#6366f1',
														fontWeight: 700,
														flexShrink: 0,
														zIndex: 1,
													}}>
													{i + 1}
												</div>
												{/* Content */}
												<div style={{ flex: 1, paddingTop: 4 }}>
													<div
														style={{
															fontWeight: 700,
															fontSize: '0.9rem',
															color: '#111827',
															marginBottom: 5,
														}}>
														{h.serving_point}
													</div>
													<div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
														<span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
															🟢 In: {formatTime(h.entered_at)}
														</span>
														{h.completed_at && (
															<span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
																🔴 Out: {formatTime(h.completed_at)}
															</span>
														)}
														{h.duration && (
															<span
																style={{
																	fontSize: '0.78rem',
																	color: '#059669',
																	fontWeight: 600,
																	background: '#d1fae5',
																	padding: '1px 8px',
																	borderRadius: 999,
																}}>
																⏱ {h.duration}
															</span>
														)}
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* ── Refresh Bar ── */}
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 8,
									fontSize: '0.78rem',
									color: '#9ca3af',
									padding: '4px 0',
								}}>
								<span>
									Auto-refreshes every 30 s · Last updated:{' '}
									{lastRefreshed.toLocaleTimeString(undefined, { timeStyle: 'short' })}
								</span>
								<button
									type='button'
									onClick={() => { setLoading(true); void fetchStatus(); }}
									style={{
										background: 'none',
										border: '1px solid #c7d2fe',
										borderRadius: 999,
										color: '#6366f1',
										fontSize: '0.75rem',
										cursor: 'pointer',
										padding: '3px 12px',
										fontWeight: 600,
										transition: 'background 0.15s',
									}}>
									↻ Refresh now
								</button>
							</div>
						</div>
					)}
				</div>
			</main>

			{/* ── Footer ── */}
			<footer
				style={{
					borderTop: '1px solid rgba(99,102,241,0.1)',
					padding: '20px 16px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 10,
					background: 'rgba(255,255,255,0.6)',
				}}>
				<img src={KyotoLogo} alt='Kyoto' style={{ height: 20, opacity: 0.45 }} />
				<span style={{ fontSize: '0.72rem', color: '#c4c9d9', letterSpacing: '0.02em' }}>
					Powered by Kyoto Student Management
				</span>
			</footer>
		</div>
	);
};

export default TokenStatusPage;
