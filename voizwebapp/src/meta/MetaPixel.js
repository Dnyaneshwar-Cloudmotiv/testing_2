import React, { useEffect } from 'react';

export default function MetaPixel() {
  useEffect(() => {
    // Meta Pixel initialization function
    const initMetaPixel = () => {
      // Check if fbq is already defined to prevent multiple initializations
      if (window.fbq) return;

      // Define the fbq function as in the standard Meta Pixel implementation
      window.fbq = function() {
        window.fbq.callMethod 
          ? window.fbq.callMethod.apply(window.fbq, arguments)
          : window.fbq.queue.push(arguments);
      };

      // Initialize the queue if not already set
      if (!window._fbq) window._fbq = window.fbq;
      window.fbq.push = window.fbq;
      window.fbq.loaded = true;
      window.fbq.version = '2.0';
      window.fbq.queue = [];

      // Load the Meta Pixel script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);

      // Initialize pixel with your ID and track PageView
      window.fbq('init', '842430078012542');
      window.fbq('track', 'PageView');
    };

    // Run initialization
    initMetaPixel();

    // Cleanup function to remove script if component unmounts
    return () => {
      const existingScript = document.querySelector('script[src="https://connect.facebook.net/en_US/fbevents.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <noscript>
      <img 
        height="1" 
        width="1" 
        style={{ display: 'none' }}
        src="https://www.facebook.com/tr?id=842430078012542&ev=PageView&noscript=1"
        alt="Meta Pixel"
      />
    </noscript>
  );
}