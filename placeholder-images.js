/**
 * Placeholder Images for Anime Guide
 * This temporary script creates SVG placeholders for the anime guide character images
 * until proper images can be created
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
      <style>
        .hair { fill: #ff69b4; }
        .face { fill: #ffe0bd; }
        .eye { fill: #4169e1; }
        .mouth { fill: none; stroke: #d06080; stroke-width: 1.5; }
        .blush { fill: #ffb6c1; opacity: 0.6; }
        .body { fill: #ffb7ff; }
      </style>
      <g>
        <!-- Body -->
        <ellipse class="body" cx="50" cy="130" rx="20" ry="15"/>
        
        <!-- Face -->
        <circle class="face" cx="50" cy="50" r="30"/>
        
        <!-- Hair -->
        <path class="hair" d="M20,60 Q20,20 50,20 Q80,20 80,60 Q80,70 50,80 Q20,70 20,60 Z"/>
        
        <!-- Eyes -->
        <circle class="eye" cx="40" cy="45" r="5"/>
        <circle class="eye" cx="60" cy="45" r="5"/>
        
        <!-- Mouth -->
        <path class="mouth" d="M40,60 Q50,65 60,60"/>
        
        <!-- Blush -->
        <circle class="blush" cx="30" cy="55" r="5"/>
        <circle class="blush" cx="70" cy="55" r="5"/>
      </g>
    </svg>
    `;
  
    const chibiSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" width="100" height="150">
      <style>
        .hair { fill: #ff69b4; }
        .face { fill: #ffe0bd; }
        .eye { fill: #4169e1; }
        .mouth { fill: none; stroke: #d06080; stroke-width: 1.5; }
        .blush { fill: #ffb6c1; opacity: 0.6; }
        .body { fill: #ffb7ff; }
      </style>
      <g>
        <!-- Body -->
        <ellipse class="body" cx="50" cy="130" rx="25" ry="15"/>
        
        <!-- Face -->
        <circle class="face" cx="50" cy="55" r="35"/>
        
        <!-- Hair -->
        <path class="hair" d="M15,70 Q15,20 50,15 Q85,20 85,70 Q85,80 50,90 Q15,80 15,70 Z"/>
        
        <!-- Eyes -->
        <ellipse class="eye" cx="35" cy="50" rx="8" ry="10"/>
        <ellipse class="eye" cx="65" cy="50" rx="8" ry="10"/>
        
        <!-- Mouth -->
        <path class="mouth" d="M45,70 Q50,75 55,70"/>
        
        <!-- Blush -->
        <circle class="blush" cx="25" cy="60" r="7"/>
        <circle class="blush" cx="75" cy="60" r="7"/>
      </g>
    </svg>
    `;
  
    const classicSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" width="100" height="150">
      <style>
        .hair { fill: #ff69b4; }
        .face { fill: #ffe0bd; }
        .eye { fill: #4169e1; }
        .mouth { fill: none; stroke: #d06080; stroke-width: 1.5; }
        .blush { fill: #ffb6c1; opacity: 0.4; }
        .body { fill: #ffb7ff; }
      </style>
      <g>
        <!-- Body -->
        <path class="body" d="M30,100 Q50,90 70,100 L70,130 Q50,140 30,130 Z"/>
        
        <!-- Face -->
        <ellipse class="face" cx="50" cy="60" rx="25" ry="30"/>
        
        <!-- Hair -->
        <path class="hair" d="M25,70 Q25,20 50,20 Q75,20 75,70 L25,70 Z"/>
        <path class="hair" d="M20,60 Q30,80 20,95 Z"/>
        <path class="hair" d="M80,60 Q70,80 80,95 Z"/>
        
        <!-- Eyes -->
        <ellipse class="eye" cx="40" cy="55" rx="5" ry="8"/>
        <ellipse class="eye" cx="60" cy="55" rx="5" ry="8"/>
        
        <!-- Mouth -->
        <path class="mouth" d="M45,75 Q50,78 55,75"/>
        
        <!-- Blush -->
        <circle class="blush" cx="30" cy="65" r="5"/>
        <circle class="blush" cx="70" cy="65" r="5"/>
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
    `;
    
    document.head.appendChild(style);
  });