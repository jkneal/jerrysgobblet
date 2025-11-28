import React, { useMemo } from 'react';

const GoblinPiece = ({ color, size, isWinning = false }) => {
    // Scale the SVG based on size (1-4) with less dramatic scaling
    // Size 1 = 0.8, Size 2 = 0.9, Size 3 = 1.0, Size 4 = 1.1
    const scale = 0.7 + (size * 0.1);

    // Random delay between 0-15 seconds to stagger animations
    const animationDelay = useMemo(() => Math.random() * 15, []);

    // Color mapping for trinkets - provides good contrast with piece colors
    const TRINKET_COLOR_MAP = {
        '#ffd700': '#8b6914', // Gold -> Dark Gold
        '#c0c0c0': '#505050', // Silver -> Dark Gray
        '#e91e63': '#8b1538', // Ruby -> Dark Ruby
        '#2196f3': '#0d47a1', // Sapphire -> Dark Blue
        '#4caf50': '#1b5e20', // Emerald -> Dark Green
        '#9c27b0': '#4a148c', // Amethyst -> Dark Purple
        '#ff9800': '#e65100', // Amber -> Dark Orange
        '#00bcd4': '#006064', // Turquoise -> Dark Cyan
        '#ff4081': '#880e4f', // Rose -> Dark Pink
        '#3f51b5': '#1a237e', // Indigo -> Dark Indigo
        '#cddc39': '#827717', // Lime -> Dark Lime
        '#00e5ff': '#006064', // Cyan -> Dark Cyan
        '#795548': '#3e2723', // Bronze -> Dark Brown
        '#607d8b': '#263238', // Slate -> Dark Slate
        '#dc143c': '#8b0000', // Crimson -> Dark Red
    };

    // Get trinket color and darker stroke color
    const beadColor = TRINKET_COLOR_MAP[color] || '#000000';

    // Make stroke even darker for better definition
    const getStrokeColor = (trinketColor) => {
        const hex = trinketColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const darkerR = Math.floor(r * 0.5);
        const darkerG = Math.floor(g * 0.5);
        const darkerB = Math.floor(b * 0.5);

        return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
    };

    const strokeColor = getStrokeColor(beadColor);

    // Bead positions based on size
    const beadConfigs = {
        1: [{ x: 50, y: 33 }],
        2: [{ x: 37, y: 32 }, { x: 63, y: 32 }],
        3: [{ x: 32, y: 32 }, { x: 50, y: 33 }, { x: 68, y: 32 }],
        4: [{ x: 30, y: 31 }, { x: 43, y: 33 }, { x: 57, y: 33 }, { x: 70, y: 31 }]
    };

    const beads = beadConfigs[size] || beadConfigs[1];

    return (
        <svg
            viewBox="0 0 100 120"
            style={{
                width: '100%',
                height: '100%',
                transform: `scale(${scale})`,
                overflow: 'visible'
            }}
        >
            {/* Main body - rounded top, square bottom */}
            <path
                d="M 25 45
                   Q 25 20, 50 20
                   Q 75 20, 75 45
                   L 75 90
                   L 25 90
                   Z"
                fill={color}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth="1"
                style={{
                    animation: `goblin-subtle-wobble 5s ease-in-out infinite`,
                    animationDelay: `${animationDelay}s`,
                    transformOrigin: 'center'
                }}
            />

            {/* Subtle highlight for 3D effect on body */}
            <ellipse
                cx="48"
                cy="32"
                rx="18"
                ry="22"
                fill="rgba(255,255,255,0.3)"
            />

            {/* Black face area - curved blob shape */}
            <path
                d="M 35 50 
                   Q 32 55, 32 62
                   Q 32 72, 38 78
                   Q 44 82, 50 82
                   Q 56 82, 62 78
                   Q 68 72, 68 62
                   Q 68 55, 65 50
                   Q 62 45, 50 45
                   Q 38 45, 35 50 Z"
                fill="#1a1a1a"
            />

            {/* Defs for clipping pupils */}
            <defs>
                <clipPath id="leftEyeClip">
                    <circle cx="42" cy="54" r="7" />
                </clipPath>
                <clipPath id="rightEyeClip">
                    <circle cx="58" cy="54" r="7" />
                </clipPath>
            </defs>

            {/* Left eye - white circle with black pupil clipped */}
            <circle cx="42" cy="54" r="7" fill="white" />
            <g
                clipPath="url(#leftEyeClip)"
                style={{
                    animation: `goblin-eye-look 6s ease-in-out infinite`,
                    animationDelay: `${animationDelay}s`
                }}
            >
                <circle cx="43" cy="53" r="4.5" fill="black" />
            </g>

            {/* Right eye - white circle with black pupil clipped */}
            <circle cx="58" cy="54" r="7" fill="white" />
            <g
                clipPath="url(#rightEyeClip)"
                style={{
                    animation: `goblin-eye-look 6s ease-in-out infinite`,
                    animationDelay: `${animationDelay}s`
                }}
            >
                <circle cx="59" cy="53" r="4.5" fill="black" />
            </g>

            {/* Big smile with teeth */}
            <path
                d="M 40 66 Q 50 74 60 66"
                stroke="white"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
            />

            {/* Single big tooth */}
            <rect x="48" y="68" width="4" height="6" fill="white" rx="0.5" />

            {/* Small arms on sides */}
            <path
                d="M 25 55 Q 20 58, 22 62"
                stroke={color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.7"
                style={{
                    animation: `goblin-arm-wave 4s ease-in-out infinite`,
                    animationDelay: `${animationDelay}s`,
                    transformOrigin: '25px 55px'
                }}
            />
            <path
                d="M 75 55 Q 80 58, 78 62"
                stroke={color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.7"
                style={{
                    animation: `goblin-arm-wave 4s ease-in-out infinite`,
                    animationDelay: `${animationDelay + 0.2}s`,
                    transformOrigin: '75px 55px'
                }}
            />

            {/* Headband with beads - drawn last so it appears on top */}
            <g>
                {/* Headband strap */}
                <path
                    d="M 25,31 Q50,36 75,31"
                    stroke="rgba(0,0,0,0.4)"
                    strokeWidth="3"
                    fill="none"
                />

                {/* Beads/trinkets */}
                {beads.map((bead, index) => (
                    <polygon
                        key={index}
                        points={`${bead.x - 3},${bead.y - 1} ${bead.x + 3},${bead.y - 1} ${bead.x + 3.5},${bead.y + 3} ${bead.x - 3.5},${bead.y + 3}`}
                        fill={beadColor}
                        stroke={strokeColor}
                        strokeWidth="0.5"
                        className={isWinning ? 'winning-trinket' : ''}
                    />
                ))}
            </g>

            {/* Feather/antenna on top - angled */}
            <g
                style={{
                    animation: `goblin-feather-wiggle 3s ease-in-out infinite`,
                    animationDelay: `${animationDelay}s`,
                    transformOrigin: '52px 20px'
                }}
            >
                <ellipse
                    cx="52"
                    cy="12"
                    rx="4"
                    ry="10"
                    fill={color}
                    opacity="1"
                    transform="rotate(20 52 12)"
                />
            </g>
        </svg>
    );
};

export default GoblinPiece;
