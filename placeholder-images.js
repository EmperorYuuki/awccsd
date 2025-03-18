/**
 * Improved Anime Character SVGs for QuillSync AI
 * This replaces the basic SVG placeholders with more detailed and appealing designs
 */

document.addEventListener('DOMContentLoaded', () => {
  // Create a container for the SVG placeholders
  const placeholderContainer = document.createElement('div');
  placeholderContainer.style.display = 'none';
  placeholderContainer.id = 'anime-guide-placeholders';
  document.body.appendChild(placeholderContainer);
  
  // Create SVG data URLs for each style
  const kawaiiSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" width="100" height="150">
    <defs>
      <radialGradient id="faceGradient" cx="50%" cy="40%" r="60%" fx="50%" fy="40%">
        <stop offset="0%" stop-color="#ffe6e0" />
        <stop offset="100%" stop-color="#ffcfc5" />
      </radialGradient>
      
      <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff8ce0" />
        <stop offset="80%" stop-color="#f06bbb" />
        <stop offset="100%" stop-color="#d948a1" />
      </linearGradient>
    </defs>
    
    <g>
      <!-- Body -->
      <ellipse class="body" cx="50" cy="130" rx="20" ry="15" fill="#ffb7ff" />
      
      <!-- Face -->
      <circle class="face" cx="50" cy="50" r="30" fill="url(#faceGradient)" />
      
      <!-- Hair -->
      <path class="hair" d="M20,60 Q20,20 50,20 Q80,20 80,60 Q80,70 50,80 Q20,70 20,60 Z" fill="url(#hairGradient)" />
      
      <!-- Hair bangs -->
      <path d="M30,40 Q35,30 45,35" fill="none" stroke="url(#hairGradient)" stroke-width="4" stroke-linecap="round" />
      <path d="M55,35 Q65,30 70,40" fill="none" stroke="url(#hairGradient)" stroke-width="4" stroke-linecap="round" />
      
      <!-- Eyes -->
      <g class="left-eye">
        <ellipse cx="40" cy="45" rx="7" ry="9" fill="white" />
        <circle cx="40" cy="45" r="5" fill="#4169e1" />
        <circle cx="40" cy="45" r="2" fill="black" />
        <circle cx="38" cy="43" r="2" fill="white" opacity="0.8" />
      </g>
      
      <g class="right-eye">
        <ellipse cx="60" cy="45" rx="7" ry="9" fill="white" />
        <circle cx="60" cy="45" r="5" fill="#4169e1" />
        <circle cx="60" cy="45" r="2" fill="black" />
        <circle cx="58" cy="43" r="2" fill="white" opacity="0.8" />
      </g>
      
      <!-- Eyebrows -->
      <path d="M33,38 Q40,35 47,38" fill="none" stroke="#d06080" stroke-width="1.5" />
      <path d="M53,38 Q60,35 67,38" fill="none" stroke="#d06080" stroke-width="1.5" />
      
      <!-- Mouth -->
      <path class="mouth" d="M40,60 Q50,65 60,60" fill="none" stroke="#d06080" stroke-width="1.5" />
      
      <!-- Blush -->
      <circle class="blush" cx="30" cy="55" r="5" fill="#ffb6c1" opacity="0.6" />
      <circle class="blush" cx="70" cy="55" r="5" fill="#ffb6c1" opacity="0.6" />
      
      <!-- Hair accessories -->
      <circle cx="75" cy="45" r="5" fill="#fff" stroke="#ffb7ff" stroke-width="2" />
    </g>
  </svg>
  `;

  const chibiSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" width="100" height="150">
    <defs>
      <radialGradient id="chibiFaceGradient" cx="50%" cy="40%" r="60%" fx="50%" fy="40%">
        <stop offset="0%" stop-color="#ffe6e0" />
        <stop offset="100%" stop-color="#ffcfc5" />
      </radialGradient>
      
      <linearGradient id="chibiHairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff8ce0" />
        <stop offset="80%" stop-color="#f06bbb" />
        <stop offset="100%" stop-color="#d948a1" />
      </linearGradient>
    </defs>
    
    <g>
      <!-- Body -->
      <ellipse class="body" cx="50" cy="130" rx="25" ry="15" fill="#ffb7ff" />
      
      <!-- Face -->
      <circle class="face" cx="50" cy="55" r="35" fill="url(#chibiFaceGradient)" />
      
      <!-- Hair -->
      <path class="hair" d="M15,70 Q15,20 50,15 Q85,20 85,70 Q85,80 50,90 Q15,80 15,70 Z" fill="url(#chibiHairGradient)" />
      
      <!-- Hair details -->
      <path d="M20,35 Q50,15 80,35" fill="none" stroke="url(#chibiHairGradient)" stroke-width="10" stroke-linecap="round" opacity="0.6" />
      
      <!-- Bangs -->
      <path d="M25,40 C35,30 45,45 35,55" fill="url(#chibiHairGradient)" />
      <path d="M75,40 C65,30 55,45 65,55" fill="url(#chibiHairGradient)" />
      
      <!-- Eyes -->
      <g class="left-eye">
        <ellipse cx="35" cy="50" rx="10" ry="12" fill="white" />
        <circle cx="35" cy="50" r="7" fill="#4169e1" />
        <circle cx="35" cy="50" r="3" fill="black" />
        <circle cx="32" cy="47" r="2" fill="white" opacity="0.8" />
      </g>
      
      <g class="right-eye">
        <ellipse cx="65" cy="50" rx="10" ry="12" fill="white" />
        <circle cx="65" cy="50" r="7" fill="#4169e1" />
        <circle cx="65" cy="50" r="3" fill="black" />
        <circle cx="62" cy="47" r="2" fill="white" opacity="0.8" />
      </g>
      
      <!-- Eyebrows -->
      <path d="M25,40 Q35,35 45,40" fill="none" stroke="#d06080" stroke-width="2" />
      <path d="M55,40 Q65,35 75,40" fill="none" stroke="#d06080" stroke-width="2" />
      
      <!-- Mouth -->
      <path class="mouth" d="M45,70 Q50,75 55,70" fill="none" stroke="#d06080" stroke-width="2" />
      
      <!-- Blush -->
      <circle class="blush" cx="25" cy="60" r="7" fill="#ffb6c1" opacity="0.6" />
      <circle class="blush" cx="75" cy="60" r="7" fill="#ffb6c1" opacity="0.6" />
      
      <!-- Star accessories -->
      <path d="M15,30 L17,25 L19,30 L24,30 L20,33 L22,38 L17,35 L12,38 L14,33 L10,30 Z" fill="#ffff88" />
      <path d="M85,30 L87,25 L89,30 L94,30 L90,33 L92,38 L87,35 L82,38 L84,33 L80,30 Z" fill="#ffff88" />
    </g>
  </svg>
  `;

  const classicSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" width="100" height="150">
    <defs>
      <radialGradient id="classicFaceGradient" cx="50%" cy="40%" r="60%" fx="50%" fy="40%">
        <stop offset="0%" stop-color="#ffe6e0" />
        <stop offset="100%" stop-color="#ffcfc5" />
      </radialGradient>
      
      <linearGradient id="classicHairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff8ce0" />
        <stop offset="80%" stop-color="#f06bbb" />
        <stop offset="100%" stop-color="#d948a1" />
      </linearGradient>
    </defs>
    
    <g>
      <!-- Body -->
      <path class="body" d="M30,100 Q50,90 70,100 L70,130 Q50,140 30,130 Z" fill="#ffb7ff" />
      
      <!-- Face -->
      <ellipse class="face" cx="50" cy="60" rx="25" ry="30" fill="url(#classicFaceGradient)" />
      
      <!-- Hair -->
      <path class="hair" d="M25,70 Q25,20 50,20 Q75,20 75,70 L25,70 Z" fill="url(#classicHairGradient)" />
      
      <!-- Side hair -->
      <path class="hair" d="M20,60 Q30,80 20,95 Z" fill="url(#classicHairGradient)" />
      <path class="hair" d="M80,60 Q70,80 80,95 Z" fill="url(#classicHairGradient)" />
      
      <!-- Hair details -->
      <path d="M30,30 Q50,15 70,30" fill="none" stroke="url(#classicHairGradient)" stroke-width="6" stroke-linecap="round" opacity="0.6" />
      
      <!-- Eyes -->
      <g class="left-eye">
        <ellipse cx="40" cy="55" rx="6" ry="9" fill="white" />
        <circle cx="40" cy="55" r="4" fill="#4169e1" />
        <circle cx="40" cy="55" r="2" fill="black" />
        <circle cx="38" cy="53" r="1.5" fill="white" opacity="0.8" />
      </g>
      
      <g class="right-eye">
        <ellipse cx="60" cy="55" rx="6" ry="9" fill="white" />
        <circle cx="60" cy="55" r="4" fill="#4169e1" />
        <circle cx="60" cy="55" r="2" fill="black" />
        <circle cx="58" cy="53" r="1.5" fill="white" opacity="0.8" />
      </g>
      
      <!-- Eyebrows -->
      <path d="M34,45 Q40,42 46,45" fill="none" stroke="#d06080" stroke-width="1.5" />
      <path d="M54,45 Q60,42 66,45" fill="none" stroke="#d06080" stroke-width="1.5" />
      
      <!-- Eyelashes -->
      <path d="M34,50 L32,48" stroke="#000" stroke-width="1" />
      <path d="M37,48 L36,45" stroke="#000" stroke-width="1" />
      <path d="M63,48 L64,45" stroke="#000" stroke-width="1" />
      <path d="M66,50 L68,48" stroke="#000" stroke-width="1" />
      
      <!-- Mouth -->
      <path class="mouth" d="M45,75 Q50,78 55,75" fill="none" stroke="#d06080" stroke-width="1.5" />
      
      <!-- Blush -->
      <circle class="blush" cx="30" cy="65" r="5" fill="#ffb6c1" opacity="0.4" />
      <circle class="blush" cx="70" cy="65" r="5" fill="#ffb6c1" opacity="0.4" />
      
      <!-- Hair accessory -->
      <rect x="40" y="25" width="20" height="7" rx="3" ry="3" fill="#fff" stroke="#ffb7ff" stroke-width="1" />
    </g>
  </svg>
  `;
  
  // Convert SVGs to data URLs and add as background images via CSS
  const svgToDataURL = (svg) => {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };
  
  // Create style element
  const style = document.createElement('style');
  style.textContent = `
    .anime-character[data-style="kawaii"] {
      background-image: url('${svgToDataURL(kawaiiSvg)}');
    }
    
    .anime-character[data-style="chibi"] {
      background-image: url('${svgToDataURL(chibiSvg)}');
    }
    
    .anime-character[data-style="classic"] {
      background-image: url('${svgToDataURL(classicSvg)}');
    }
    
    /* Hair color filters */
    .anime-character[data-hair-color="blue"] {
      filter: hue-rotate(240deg);
    }
    
    .anime-character[data-hair-color="purple"] {
      filter: hue-rotate(270deg);
    }
    
    .anime-character[data-hair-color="red"] {
      filter: hue-rotate(330deg);
    }
    
    .anime-character[data-hair-color="green"] {
      filter: hue-rotate(120deg);
    }
    
    .anime-character[data-hair-color="yellow"] {
      filter: hue-rotate(60deg) saturate(1.5);
    }
  `;
  
  document.head.appendChild(style);
});