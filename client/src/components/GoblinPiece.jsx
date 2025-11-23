import React from 'react';

const GoblinPiece = ({ color, size }) => {
    // Scale the SVG based on size (1-4) with less dramatic scaling
    // Size 1 = 0.8, Size 2 = 0.9, Size 3 = 1.0, Size 4 = 1.1
    const scale = 0.7 + (size * 0.1);

    return (
        <svg
            viewBox="0 0 100 120"
            style={{
                width: '100%',
                height: '100%',
                transform: `scale(${scale})`,
            }}
        >
            {/* Feather/antenna on top - angled */}
            <ellipse
                cx="55"
                cy="8"
                rx="6"
                ry="14"
                fill={color}
                opacity="0.85"
                transform="rotate(25 55 8)"
            />


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
            <g clipPath="url(#leftEyeClip)">
                <circle cx="43" cy="53" r="4.5" fill="black" />
            </g>

            {/* Right eye - white circle with black pupil clipped */}
            <circle cx="58" cy="54" r="7" fill="white" />
            <g clipPath="url(#rightEyeClip)">
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
            />
            <path
                d="M 75 55 Q 80 58, 78 62"
                stroke={color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.7"
            />
        </svg>
    );
};

export default GoblinPiece;
