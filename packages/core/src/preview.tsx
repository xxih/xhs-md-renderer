import React from 'react';
import type {CSSProperties} from 'react';
import type {PageBlock, PageModel, RenderConfig} from './models.js';

function noteScale(config: RenderConfig): number {
	return config.width / 450;
}

function notePx(config: RenderConfig, value: number): number {
	return Math.round(value * noteScale(config));
}

function contentPx(config: RenderConfig, value: number): number {
	return Math.round(value * noteScale(config) * (config.fontSize / 16));
}

function blockTextStyle(config: RenderConfig): CSSProperties {
	return {
		color: config.theme.textBody,
		fontFamily: config.fontFamily,
		fontSize: contentPx(config, 16),
		lineHeight: 1.8,
		margin: 0
	};
}

function renderBlock(
	block: PageBlock,
	index: number,
	config: RenderConfig
): React.ReactNode {
	const textStyle = blockTextStyle(config);

	if (block.type === 'paragraph') {
		return (
			<p key={index} style={{...textStyle}}>
				{block.text}
			</p>
		);
	}

	if (block.type === 'quote') {
		return (
			<div
				key={index}
				style={{
					...textStyle,
					borderLeft: `${notePx(config, 3)}px solid ${config.theme.accent}`,
					paddingLeft: notePx(config, 18),
					color: config.theme.textStrong
				}}
			>
				{block.text}
			</div>
		);
	}

	if (block.type === 'code') {
		return (
			<div
				key={index}
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: notePx(config, 14),
					background: config.theme.codeBackground,
					borderRadius: notePx(config, 12),
					padding: `${notePx(config, 16)}px ${notePx(config, 19)}px`,
					border: `1px solid ${config.theme.border}`
				}}
			>
				<div style={{display: 'flex', gap: notePx(config, 10)}}>
					<span
						style={{
							width: notePx(config, 10),
							height: notePx(config, 10),
							borderRadius: 99,
							background: '#ff8e72'
						}}
					/>
					<span
						style={{
							width: notePx(config, 10),
							height: notePx(config, 10),
							borderRadius: 99,
							background: '#f6c85b'
						}}
					/>
					<span
						style={{
							width: notePx(config, 10),
							height: notePx(config, 10),
							borderRadius: 99,
							background: '#7dd39c'
						}}
					/>
				</div>
				<pre
					style={{
						margin: 0,
						whiteSpace: 'pre-wrap',
						color: config.theme.textStrong,
						fontSize: contentPx(config, 14),
						lineHeight: 1.6,
						fontFamily: '"SFMono-Regular", ui-monospace, monospace'
					}}
				>
					{block.text}
				</pre>
			</div>
		);
	}

	if (block.type === 'list') {
		return (
			<div
				key={index}
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: notePx(config, 10)
				}}
			>
				{block.items.map((item, itemIndex) => (
					<div
						key={`${index}-${itemIndex}`}
						style={{
							display: 'flex',
							gap: notePx(config, 10),
							alignItems: 'flex-start'
						}}
					>
						<div
							style={{
								minWidth: block.ordered
									? contentPx(config, 16)
									: notePx(config, 12),
								height: contentPx(config, 16),
								marginTop: notePx(config, 2),
								color: config.theme.accent,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontFamily: config.fontFamily,
								fontSize: contentPx(config, 15),
								fontWeight: 700
							}}
						>
							{block.ordered ? `${itemIndex + 1}.` : '•'}
						</div>
						<p style={{...textStyle, flex: 1}}>{item}</p>
					</div>
				))}
			</div>
		);
	}

	if (block.type === 'image') {
		return (
			<div
				key={index}
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: notePx(config, 12),
					borderRadius: notePx(config, 12),
					padding: notePx(config, 16),
					border: `1px dashed ${config.theme.border}`,
					background: config.theme.codeBackground
				}}
			>
				<div
					style={{
						height: notePx(config, 140),
						borderRadius: notePx(config, 12),
						background: `linear-gradient(135deg, ${config.theme.accentSoft}, ${config.theme.cardBackground})`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: config.theme.accent,
						fontFamily: config.fontFamily,
						fontWeight: 700,
						fontSize: contentPx(config, 18)
					}}
				>
					Image Placeholder
				</div>
				<p
					style={{
						...textStyle,
						fontSize: contentPx(config, 14),
						color: config.theme.textMuted
					}}
				>
					{block.alt || block.url}
				</p>
			</div>
		);
	}

	if (block.type === 'divider') {
		return (
			<div
				key={index}
				style={{
					height: 1,
					background: config.theme.border,
					opacity: 0.9
				}}
			/>
		);
	}

	return (
		<h3
			key={index}
			style={{
				margin: 0,
				color: config.theme.textStrong,
				fontFamily: config.fontFamily,
				fontSize: contentPx(config, 20),
				fontWeight: 700,
				letterSpacing: '-0.02em'
			}}
		>
			{block.text}
		</h3>
	);
}

export function XhsPageCard(props: {
	page: PageModel;
	config: RenderConfig;
}): React.ReactElement {
	const {config, page} = props;

	return (
		<div
			style={{
				width: config.width,
				height: config.height,
				display: 'flex',
				background: config.theme.background,
				boxSizing: 'border-box',
				position: 'relative'
			}}
		>
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					padding: `${notePx(config, 32)}px ${notePx(config, 20)}px`,
					flexDirection: 'column',
					gap: notePx(config, 10),
					borderRadius: notePx(config, 8),
					background: config.theme.cardBackground,
					boxSizing: 'border-box'
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						gap: notePx(config, 16),
						paddingBottom: notePx(config, 10),
						paddingLeft: notePx(config, 12),
						paddingRight: notePx(config, 12),
						paddingTop: notePx(config, 10)
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: notePx(config, 12)
						}}
					>
						<div
							style={{
								width: notePx(config, 42),
								height: notePx(config, 42),
								borderRadius: 999,
								background: config.theme.accentSoft,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: config.theme.accent,
								fontFamily: config.fontFamily,
								fontSize: notePx(config, 14),
								fontWeight: 800
							}}
						>
							{config.profile.name.slice(0, 1).toUpperCase()}
						</div>
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: notePx(config, 1)
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									color: config.theme.textStrong,
									fontFamily: config.fontFamily,
									fontSize: notePx(config, 16),
									fontWeight: 700
								}}
							>
								{config.profile.name}
							</div>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									color: config.theme.textMuted,
									fontFamily: config.fontFamily,
									fontSize: notePx(config, 14)
								}}
							>
								{config.profile.handle}
							</div>
						</div>
					</div>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-end',
							gap: notePx(config, 6)
						}}
					>
						{config.profile.showDate ? (
							<div
								style={{
									color: config.theme.textMuted,
									fontFamily: config.fontFamily,
									fontSize: notePx(config, 13)
								}}
							>
								{config.profile.dateText}
							</div>
						) : null}
					</div>
				</div>

				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: 0,
						marginLeft: notePx(config, 13),
						marginRight: notePx(config, 13)
					}}
				>
					<h1
						style={{
							margin: 0,
							color: config.theme.textStrong,
							fontFamily: config.fontFamily,
							fontSize: contentPx(config, 24),
							lineHeight: 1.5,
							letterSpacing: '-0.01em'
						}}
					>
						{page.title}
					</h1>
				</div>

				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: notePx(config, 18),
						flex: 1,
						marginLeft: notePx(config, 13),
						marginRight: notePx(config, 13)
					}}
				>
					{page.blocks.map((block, index) => renderBlock(block, index, config))}
				</div>

				{config.profile.showFooter ? (
					<div
						style={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							gap: notePx(config, 14),
							padding: notePx(config, 16),
							borderTop: `1px solid ${config.theme.border}`,
							color: config.theme.textMuted,
							fontFamily: config.fontFamily,
							fontSize: notePx(config, 13),
							background: config.theme.cardBackground
						}}
					>
						<span>{config.profile.footerLeft}</span>
						<span style={{opacity: 0.72}}>•</span>
						<span>{config.profile.footerRight}</span>
					</div>
				) : null}
			</div>
		</div>
	);
}
