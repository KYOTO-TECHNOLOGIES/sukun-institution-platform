import React from 'react';

const CHART_HEIGHT = 570;
const BAR_GROUPS = 12;
const GRID_LINES = 6;

/**
 * Skeleton for the Energy & Gas Usage grouped bar chart (dual Y-axis, categorical X).
 * Matches chart layout: left/right axis labels, grid, ~12 bar groups with 2 bars each, legend.
 */
const ChartSkeleton: React.FC = () => {
	return (
		<div
			className="chart-skeleton"
			style={{
				height: CHART_HEIGHT,
				width: '100%',
				position: 'relative',
				background: 'var(--bs-body-bg, #fff)',
				borderRadius: 8,
			}}
			aria-hidden
		>
			{/* Left Y-axis label */}
			<div
				className="chart-skeleton__y-label chart-skeleton--shimmer"
				style={{
					position: 'absolute',
					left: 8,
					top: 24,
					width: 72,
					height: 14,
					borderRadius: 4,
				}}
			/>
			{/* Right Y-axis label */}
			<div
				className="chart-skeleton__y-label chart-skeleton--shimmer"
				style={{
					position: 'absolute',
					right: 8,
					top: 24,
					width: 72,
					height: 14,
					borderRadius: 4,
				}}
			/>
			{/* Chart area: grid + bars */}
			<div
				style={{
					position: 'absolute',
					left: 48,
					right: 48,
					top: 48,
					bottom: 56,
				}}
			>
				{/* Horizontal grid lines */}
				{Array.from({ length: GRID_LINES }).map((_, i) => (
					<div
						key={i}
						className="chart-skeleton__grid"
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: `${(i / (GRID_LINES - 1)) * 100}%`,
							height: 1,
							background: 'var(--bs-border-color, #dee2e6)',
							opacity: 0.6,
						}}
					/>
				))}
				{/* Bar groups: 12 groups, 2 bars per group */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						display: 'flex',
						alignItems: 'flex-end',
						justifyContent: 'space-evenly',
						gap: 2,
						paddingBottom: 0,
					}}
				>
					{Array.from({ length: BAR_GROUPS }).map((_, groupIndex) => (
						<div
							key={groupIndex}
							style={{
								flex: 1,
								display: 'flex',
								alignItems: 'flex-end',
								justifyContent: 'center',
								gap: 4,
								maxWidth: 40,
							}}
						>
							{/* First bar (e.g. P-D-MMBTU) - varying height */}
							<div
								className="chart-skeleton__bar chart-skeleton--shimmer"
								style={{
									width: 14,
									height: `${30 + (groupIndex % 5) * 12 + Math.sin(groupIndex) * 8}%`,
									minHeight: 24,
									borderRadius: '5px 5px 0 0',
								}}
							/>
							{/* Second bar (e.g. P-D-MMSCF) */}
							<div
								className="chart-skeleton__bar chart-skeleton--shimmer"
								style={{
									width: 14,
									height: `${18 + (groupIndex % 3) * 10}%`,
									minHeight: 16,
									borderRadius: '5px 5px 0 0',
									animationDelay: '0.15s',
								}}
							/>
						</div>
					))}
				</div>
			</div>
			{/* Legend at bottom-left */}
			<div
				style={{
					position: 'absolute',
					left: 48,
					bottom: 16,
					display: 'flex',
					alignItems: 'center',
					gap: 16,
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
					<div
						className="chart-skeleton--shimmer"
						style={{
							width: 14,
							height: 14,
							borderRadius: 3,
						}}
					/>
					<div
						className="chart-skeleton--shimmer"
						style={{
							width: 64,
							height: 10,
							borderRadius: 3,
						}}
					/>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
					<div
						className="chart-skeleton--shimmer"
						style={{
							width: 14,
							height: 14,
							borderRadius: 3,
							animationDelay: '0.2s',
						}}
					/>
					<div
						className="chart-skeleton--shimmer"
						style={{
							width: 56,
							height: 10,
							borderRadius: 3,
							animationDelay: '0.2s',
						}}
					/>
				</div>
			</div>
			<style>{`
				.chart-skeleton--shimmer {
					background: linear-gradient(
						90deg,
						var(--bs-gray-200, #e9ecef) 0%,
						var(--bs-gray-300, #dee2e6) 50%,
						var(--bs-gray-200, #e9ecef) 100%
					);
					background-size: 200% 100%;
					animation: chart-skeleton-shimmer 1.2s ease-in-out infinite;
				}
				@keyframes chart-skeleton-shimmer {
					0% { background-position: 200% 0; }
					100% { background-position: -200% 0; }
				}
			`}</style>
		</div>
	);
};

export default ChartSkeleton;
