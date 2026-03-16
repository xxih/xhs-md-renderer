import React from 'react';
import type {CSSProperties} from 'react';
import {
	BODY_BLOCK_GAP,
	BODY_INSET_X,
	CARD_PADDING_X,
	CARD_PADDING_Y,
	FOOTER_FONT_SIZE,
	FOOTER_PADDING,
	HANDLE_FONT_SIZE,
	HEADER_GAP,
	HEADER_INSET_X,
	HEADER_PADDING_Y,
	NAME_FONT_SIZE,
	SUBHEADING_LINE_HEIGHT,
	TITLE_FONT_SIZE,
	TITLE_LINE_HEIGHT,
	bodyContentWidth,
	contentPx,
	notePx
} from './layout.js';
import {
	DEFAULT_IMAGE_HEIGHT,
	MAX_IMAGE_HEIGHT,
	MIN_IMAGE_HEIGHT,
	getImageDisplayHeight
} from './image.js';
import type {PageBlock, PageModel, RenderConfig} from './models.js';

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
		const imageHeight = getImageDisplayHeight({
			image: block,
			contentWidth: bodyContentWidth(config),
			minHeight: notePx(config, MIN_IMAGE_HEIGHT),
			maxHeight: notePx(config, MAX_IMAGE_HEIGHT),
			fallbackHeight: notePx(config, DEFAULT_IMAGE_HEIGHT)
		});
		const imageSrc = block.src || block.url;

		if (block.status === 'pending') {
			return (
				<div
					key={index}
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: notePx(config, 10),
						borderRadius: notePx(config, 16),
						padding: notePx(config, 14),
						border: `1px dashed ${config.theme.border}`,
						background: config.theme.codeBackground
					}}
				>
					<div
						style={{
							height: imageHeight,
							borderRadius: notePx(config, 12),
							background: `linear-gradient(135deg, ${config.theme.accentSoft}, ${config.theme.cardBackground})`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: config.theme.accent,
							fontFamily: config.fontFamily,
							fontWeight: 700,
							fontSize: contentPx(config, 16),
							textAlign: 'center',
							padding: notePx(config, 20)
						}}
					>
						图片加载中
					</div>
				</div>
			);
		}

		if (!imageSrc || block.status === 'failed') {
			return (
				<div
					key={index}
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: notePx(config, 10),
						borderRadius: notePx(config, 16),
						padding: notePx(config, 14),
						border: `1px dashed ${config.theme.border}`,
						background: config.theme.codeBackground
					}}
				>
					<div
						style={{
							height: imageHeight,
							borderRadius: notePx(config, 12),
							background: `linear-gradient(135deg, ${config.theme.accentSoft}, ${config.theme.cardBackground})`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: config.theme.accent,
							fontFamily: config.fontFamily,
							fontWeight: 700,
							fontSize: contentPx(config, 16),
							textAlign: 'center',
							padding: notePx(config, 20)
						}}
					>
						图片暂时无法渲染
					</div>
					<p
						style={{
							...textStyle,
							fontSize: contentPx(config, 13),
							color: config.theme.textMuted
						}}
					>
						{block.errorMessage || block.alt || block.url}
					</p>
				</div>
			);
		}

		return (
			<div
				key={index}
				style={{
					display: 'flex',
					flexDirection: 'column',
					borderRadius: notePx(config, 16),
					padding: notePx(config, 12),
					border: `1px solid ${config.theme.border}`,
					background: '#ffffff'
				}}
			>
				<img
					src={imageSrc}
					alt={block.alt || 'Image'}
					width={bodyContentWidth(config)}
					height={imageHeight}
					style={{
						borderRadius: notePx(config, 12),
						width: '100%',
						height: imageHeight,
						objectFit: 'contain',
						objectPosition: 'center',
						background: '#ffffff'
					}}
				/>
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
				letterSpacing: '-0.02em',
				lineHeight: SUBHEADING_LINE_HEIGHT
			}}
		>
			{block.text}
		</h3>
	);
}

function renderAvatar(config: RenderConfig): React.ReactNode {
	const {profile} = config;

	if (!profile.showAvatar) {
		return null;
	}

	const avatarSize = notePx(config, 42);

	return (
		<div
			style={{
				position: 'relative',
				width: avatarSize,
				height: avatarSize,
				flexShrink: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center'
			}}
		>
			<div
				style={{
					width: avatarSize,
					height: avatarSize,
					borderRadius: 999,
					overflow: 'hidden',
					background: profile.avatarSrc
						? '#d6e4ff'
						: `linear-gradient(135deg, ${config.theme.accentSoft}, ${config.theme.cardBackground})`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: config.theme.accent,
					fontFamily: config.fontFamily,
					fontSize: notePx(config, 14),
					fontWeight: 800
				}}
			>
				{profile.avatarSrc ? (
					<img
						src={profile.avatarSrc}
						alt={profile.name || 'avatar'}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover'
						}}
					/>
				) : (
					(profile.name.slice(0, 1) || '图').toUpperCase()
				)}
			</div>
			{profile.showVerifiedBadge ? (
				<div
					style={{
						position: 'absolute',
						right: notePx(config, -2),
						bottom: notePx(config, -2),
						width: notePx(config, 16),
						height: notePx(config, 16),
						borderRadius: 999,
						background: '#0a84ff',
						border: `${notePx(config, 2)}px solid ${config.theme.cardBackground}`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: '#ffffff',
						fontSize: notePx(config, 10),
						fontWeight: 800,
						boxSizing: 'border-box'
					}}
				>
					✓
				</div>
			) : null}
		</div>
	);
}

export function XhsPageCard(props: {
	page: PageModel;
	config: RenderConfig;
}): React.ReactElement {
	const {config, page} = props;
	const showHeader =
		config.profile.showAvatar ||
		config.profile.showName ||
		config.profile.showHandle ||
		config.profile.showDate;

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
					padding: `${notePx(config, CARD_PADDING_Y)}px ${notePx(config, CARD_PADDING_X)}px`,
					flexDirection: 'column',
					gap: notePx(config, 10),
					borderRadius: notePx(config, 8),
					background: config.theme.cardBackground,
					boxSizing: 'border-box'
				}}
			>
				{showHeader ? (
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							gap: notePx(config, HEADER_GAP),
							paddingBottom: notePx(config, HEADER_PADDING_Y),
							paddingLeft: notePx(config, HEADER_INSET_X),
							paddingRight: notePx(config, HEADER_INSET_X),
							paddingTop: notePx(config, HEADER_PADDING_Y)
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: notePx(config, 12)
							}}
						>
							{renderAvatar(config)}
							{config.profile.showName || config.profile.showHandle ? (
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: notePx(config, 1)
									}}
								>
									{config.profile.showName ? (
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												color: config.theme.textStrong,
												fontFamily: config.fontFamily,
												fontSize: notePx(config, NAME_FONT_SIZE),
												fontWeight: 700
											}}
										>
											{config.profile.name}
										</div>
									) : null}
									{config.profile.showHandle ? (
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												color: config.theme.textMuted,
												fontFamily: config.fontFamily,
												fontSize: notePx(config, HANDLE_FONT_SIZE)
											}}
										>
											{config.profile.handle}
										</div>
									) : null}
								</div>
							) : null}
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
										fontSize: notePx(config, FOOTER_FONT_SIZE)
									}}
								>
									{config.profile.dateText}
								</div>
							) : null}
						</div>
					</div>
				) : null}

				<div
					style={{
						display: 'flex',
						flex: 1,
						minHeight: 0,
						flexDirection: 'column',
						gap: notePx(config, BODY_BLOCK_GAP),
						paddingBottom: config.layout.bodyBottomPadding,
						paddingLeft: notePx(config, BODY_INSET_X),
						paddingRight: notePx(config, BODY_INSET_X)
					}}
				>
					<h1
						style={{
							margin: 0,
							color: config.theme.textStrong,
							fontFamily: config.fontFamily,
							fontSize: contentPx(config, TITLE_FONT_SIZE),
							lineHeight: TITLE_LINE_HEIGHT,
							letterSpacing: '-0.01em'
						}}
					>
						{page.title}
					</h1>

					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: notePx(config, BODY_BLOCK_GAP),
							flex: 1
						}}
					>
						{page.blocks.map((block, index) => renderBlock(block, index, config))}
					</div>
				</div>

				{config.profile.showFooter ? (
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							gap: notePx(config, 14),
							padding: notePx(config, FOOTER_PADDING),
							borderTop: `1px solid ${config.theme.border}`,
							color: config.theme.textMuted,
							fontFamily: config.fontFamily,
							fontSize: notePx(config, FOOTER_FONT_SIZE),
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
